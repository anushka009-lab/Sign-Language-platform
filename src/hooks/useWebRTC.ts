/**
 * useWebRTC — WebRTC peer-to-peer connection hook
 *
 * Manages the full lifecycle:
 *   1. Socket.IO connection to the signaling server
 *   2. RTCPeerConnection with STUN/TURN servers
 *   3. SDP offer/answer negotiation
 *   4. ICE candidate trickling
 *   5. Local → remote media track exchange
 *   6. RTCDataChannel for sign / speech text relay
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { UserMode } from '../App';

// ---- Types ----

export interface PeerInfo {
  socketId: string;
  userName: string;
  userMode: UserMode;
}

export interface RemoteTextMessage {
  from: string;
  text: string;
  type: 'sign' | 'speech';
  timestamp: number;
}

export type ConnectionStatus = 'connecting' | 'waiting' | 'connected' | 'disconnected';

interface UseWebRTCOptions {
  roomId: string;
  userName: string;
  userMode: UserMode;
  localStream: MediaStream | null;
  enabled: boolean;
}

interface UseWebRTCReturn {
  remoteStream: MediaStream | null;
  connectionStatus: ConnectionStatus;
  remotePeerInfo: PeerInfo | null;
  sendTextMessage: (text: string, type: 'sign' | 'speech') => void;
  remoteMessages: RemoteTextMessage[];
}

// ---- Constants ----

const SIGNALING_URL = 'http://localhost:3001';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

// ---- Hook ----

export function useWebRTC({
  roomId,
  userName,
  userMode,
  localStream,
  enabled,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [remotePeerInfo, setRemotePeerInfo] = useState<PeerInfo | null>(null);
  const [remoteMessages, setRemoteMessages] = useState<RemoteTextMessage[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  const makingOfferRef = useRef(false);
  const isSettingRemoteRef = useRef(false);

  // ---- Send text via DataChannel (with socket fallback) ----
  const sendTextMessage = useCallback(
    (text: string, type: 'sign' | 'speech') => {
      const payload = JSON.stringify({ text, type, timestamp: Date.now() });

      // Try DataChannel first
      const dc = dataChannelRef.current;
      if (dc && dc.readyState === 'open') {
        dc.send(payload);
        return;
      }

      // Fallback: relay via signaling server
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('text-message', { roomId, text, type });
      }
    },
    [roomId],
  );

  // ---- Setup DataChannel handlers ----
  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    dataChannelRef.current = channel;

    channel.onopen = () => {
      console.log('[WebRTC] DataChannel open');
    };

    channel.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { text: string; type: 'sign' | 'speech'; timestamp: number };
        setRemoteMessages((prev) => [
          ...prev,
          {
            from: 'remote',
            text: msg.text,
            type: msg.type,
            timestamp: msg.timestamp,
          },
        ]);
      } catch {
        // ignore malformed messages
      }
    };

    channel.onclose = () => {
      console.log('[WebRTC] DataChannel closed');
    };
  }, []);

  // ---- Create peer connection ----
  const createPeerConnection = useCallback(
    (socket: Socket, remoteSocketId: string) => {
      // Close any existing connection
      if (pcRef.current) {
        pcRef.current.close();
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      // Add local tracks
      if (localStream) {
        for (const track of localStream.getTracks()) {
          pc.addTrack(track, localStream);
        }
      }

      // Create DataChannel (offerer creates, answerer receives via ondatachannel)
      const dc = pc.createDataChannel('signbridge-data', { ordered: true });
      setupDataChannel(dc);

      // Handle incoming DataChannel from the remote peer
      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };

      // ICE candidate handling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            to: remoteSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState);
        switch (pc.connectionState) {
          case 'connected':
            setConnectionStatus('connected');
            break;
          case 'disconnected':
          case 'failed':
            setConnectionStatus('disconnected');
            break;
          case 'connecting':
            setConnectionStatus('connecting');
            break;
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE state:', pc.iceConnectionState);
      };

      // Receive remote tracks
      pc.ontrack = (event) => {
        console.log('[WebRTC] Remote track received:', event.track.kind);
        const rs = remoteStreamRef.current;
        // Avoid duplicates
        const existingTrack = rs.getTracks().find((t) => t.id === event.track.id);
        if (!existingTrack) {
          rs.addTrack(event.track);
        }
        // Force React state update with a new MediaStream wrapping the same tracks
        setRemoteStream(new MediaStream(rs.getTracks()));
      };

      return pc;
    },
    [localStream, setupDataChannel],
  );

  // ---- Main effect: socket connection + signaling ----
  useEffect(() => {
    if (!enabled || !roomId) return;

    const socket = io(SIGNALING_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    let currentRemoteSocketId: string | null = null;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setConnectionStatus('waiting');

      // Join the room
      socket.emit('join-room', { roomId, userName, userMode });
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setConnectionStatus('disconnected');
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnectionStatus('disconnected');
    });

    // ---- A new user joined — we create an offer ----
    socket.on('user-joined', async ({ socketId, userName: remoteName, userMode: remoteMode }: any) => {
      console.log(`[Room] ${remoteName} joined`);
      currentRemoteSocketId = socketId;
      setRemotePeerInfo({ socketId, userName: remoteName, userMode: remoteMode });

      const pc = createPeerConnection(socket, socketId);

      try {
        makingOfferRef.current = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { to: socketId, offer: pc.localDescription });
      } catch (err) {
        console.error('[WebRTC] Error creating offer:', err);
      } finally {
        makingOfferRef.current = false;
      }
    });

    // ---- Existing members already in the room ----
    socket.on('room-members', async ({ members }: any) => {
      if (members.length > 0) {
        // Connect to the first existing member (1:1 call)
        const peer = members[0];
        currentRemoteSocketId = peer.socketId;
        setRemotePeerInfo({
          socketId: peer.socketId,
          userName: peer.userName,
          userMode: peer.userMode,
        });

        // We wait for the existing member to send us an offer
        // (they will receive user-joined and initiate)
      }
    });

    // ---- Receive an SDP offer ----
    socket.on('offer', async ({ from, offer }: any) => {
      console.log('[Signal] Received offer from', from);
      currentRemoteSocketId = from;

      const pc = createPeerConnection(socket, from);

      try {
        isSettingRemoteRef.current = true;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        isSettingRemoteRef.current = false;

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer: pc.localDescription });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
        isSettingRemoteRef.current = false;
      }
    });

    // ---- Receive an SDP answer ----
    socket.on('answer', async ({ from, answer }: any) => {
      console.log('[Signal] Received answer from', from);
      const pc = pcRef.current;
      if (!pc) return;

      try {
        isSettingRemoteRef.current = true;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        isSettingRemoteRef.current = false;
      } catch (err) {
        console.error('[WebRTC] Error setting remote answer:', err);
        isSettingRemoteRef.current = false;
      }
    });

    // ---- Receive ICE candidates ----
    socket.on('ice-candidate', async ({ from, candidate }: any) => {
      const pc = pcRef.current;
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        // Ignore ICE candidate errors during early negotiation
        if (!isSettingRemoteRef.current) {
          console.warn('[WebRTC] ICE candidate error:', err);
        }
      }
    });

    // ---- Remote user left ----
    socket.on('user-left', ({ socketId, userName: remoteName }: any) => {
      console.log(`[Room] ${remoteName} left`);
      if (socketId === currentRemoteSocketId) {
        currentRemoteSocketId = null;
        setRemotePeerInfo(null);
        setRemoteStream(null);
        setConnectionStatus('waiting');
        remoteStreamRef.current = new MediaStream();

        // Clean up peer connection
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        if (dataChannelRef.current) {
          dataChannelRef.current.close();
          dataChannelRef.current = null;
        }
      }
    });

    // ---- Receive text messages via socket (DataChannel fallback) ----
    socket.on('text-message', ({ from, text, type, timestamp }: any) => {
      setRemoteMessages((prev) => [
        ...prev,
        { from, text, type, timestamp },
      ]);
    });

    // ---- Cleanup ----
    return () => {
      console.log('[WebRTC] Cleaning up');
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      socket.disconnect();
      socketRef.current = null;
      remoteStreamRef.current = new MediaStream();
    };
  }, [enabled, roomId, userName, userMode, createPeerConnection]);

  return {
    remoteStream,
    connectionStatus,
    remotePeerInfo,
    sendTextMessage,
    remoteMessages,
  };
}
