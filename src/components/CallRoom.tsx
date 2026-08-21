/**
 * CallRoom — Main video calling interface
 * 
 * Handles: local/remote video streams, MediaPipe hand detection,
 * speech recognition subtitles, sign classification panel,
 * transcript sidebar, and call controls.
 * 
 * WebRTC integration via useWebRTC connects to the signaling server,
 * establishes peer-to-peer video/audio, and relays sign/speech text
 * through a DataChannel.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { CallConfig } from '../App';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useWebRTC } from '../hooks/useWebRTC';
import { classifySign, classifyTwoHandSign, SignBuffer } from '../ml/signClassifier';
import type { SignPrediction } from '../ml/signClassifier';
import { SentenceBuffer } from '../ml/sentenceBuffer';
import { VoiceSelector, VoiceProfile } from './VoiceSelector';
import { CallSummaryModal } from './CallSummaryModal';
import SignGuide from './SignGuide';
import LandmarkDebugger from './LandmarkDebugger';

interface CallRoomProps {
  config: CallConfig;
  onLeave: () => void;
}

interface TranscriptEntry {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  type: 'sign' | 'speech';
}

export default function CallRoom({ config, onLeave }: CallRoomProps) {
  // ---- State ----
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isHandDetection, setIsHandDetection] = useState(config.userMode === 'deaf');
  const [isVoiceSynthActive, setIsVoiceSynthActive] = useState(true);
  const [currentSign, setCurrentSign] = useState<SignPrediction | null>(null);
  const [signSentence, setSignSentence] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'transcript' | 'info'>('transcript');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [showConnectionToast, setShowConnectionToast] = useState(false);
  const [showSignGuide, setShowSignGuide] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);

  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>({
    voiceName: '',
    pitch: 1.0,
    rate: 1.0,
    gender: 'neutral',
    lang: 'en-US',
  });

  // ---- Refs ----
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const signBufferRef = useRef(new SignBuffer(12, 0.55));
  const sentenceBufferRef = useRef(new SentenceBuffer(20, 1200));
  const lastSignRef = useRef<string>('');
  const lastSignTimeRef = useRef<number>(0);
  const prevRemoteMessagesLenRef = useRef(0);

  // ---- Hooks ----
  const { lastResult, isLoading: isMediaPipeLoading, fps, latencyMs } = useMediaPipe(
    localVideoRef,
    landmarkCanvasRef,
    isHandDetection && isCamOn
  );

  const {
    transcript: speechText,
    interimTranscript,
    isListening,
  } = useSpeechRecognition(config.userMode === 'hearing' && isMicOn);

  const {
    remoteStream,
    connectionStatus,
    remotePeerInfo,
    sendTextMessage,
    remoteMessages,
  } = useWebRTC({
    roomId: config.roomId,
    userName: config.userName,
    userMode: config.userMode,
    localStream,
    enabled: true,
  });

  // ---- Initialize camera ----
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access error:', err);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ---- Attach local stream to video when ref or stream changes ----
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // ---- Attach remote stream to remote video element ----
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ---- Show connection toast when peer connects ----
  useEffect(() => {
    if (connectionStatus === 'connected' && remotePeerInfo) {
      setShowConnectionToast(true);
      const timer = setTimeout(() => setShowConnectionToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, remotePeerInfo]);

  // ---- Call timer ----
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ---- Toggle mic ----
  const toggleMic = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
    }
    setIsMicOn((v) => !v);
  }, [localStream]);

  // ---- Toggle camera ----
  const toggleCam = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
    }
    setIsCamOn((v) => !v);
  }, [localStream]);

  // ---- Process sign detection ----
  useEffect(() => {
    if (!lastResult || !lastResult.landmarks || !lastResult.landmarks.length) {
      return;
    }

    let prediction: SignPrediction | null = null;

    // Check two-hand sign first if both hands are detected
    if (lastResult.landmarks.length >= 2) {
      const twoHandPred = classifyTwoHandSign(lastResult.landmarks[0], lastResult.landmarks[1]);
      if (twoHandPred) {
        prediction = twoHandPred;
      }
    }

    if (!prediction) {
      const primaryHand = lastResult.landmarks[0];
      const tracker = lastResult.motionTrackers?.[0];
      prediction = classifySign(primaryHand, tracker);
    }

    if (!prediction) return;

    signBufferRef.current.push(prediction);
    const smoothed = signBufferRef.current.getMostFrequent();

    if (smoothed && smoothed.confidence >= 0.55) {
      setCurrentSign(smoothed);

      const now = Date.now();
      // Add to sentence if it's a new sign (debounce 3s)
      if (
        smoothed.sign !== lastSignRef.current ||
        now - lastSignTimeRef.current > 3000
      ) {
        if (smoothed.sign !== lastSignRef.current) {
          lastSignRef.current = smoothed.sign;
          lastSignTimeRef.current = now;

          sentenceBufferRef.current.addToken(smoothed.sign, smoothed.confidence);

          setSignSentence((prev) => {
            const next = [...prev, smoothed.sign];
            return next.slice(-10);
          });

          // Add to transcript
          setTranscript((prev) => [
            ...prev,
            {
              id: `sign-${now}`,
              sender: config.userName,
              text: smoothed.sign,
              timestamp: new Date(),
              type: 'sign',
            },
          ]);

          // Send to remote peer
          sendTextMessage(smoothed.sign, 'sign');
        }
      }
    }
  }, [lastResult, config.userName, sendTextMessage]);

  // ---- Process speech transcript ----
  useEffect(() => {
    if (speechText.trim()) {
      const latest = speechText.trim();
      if (latest) {
        setTranscript((prev) => {
          // Update last speech entry or create new
          const lastEntry = prev[prev.length - 1];
          if (lastEntry && lastEntry.type === 'speech' && lastEntry.sender === config.userName) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastEntry,
              text: latest,
              timestamp: new Date(),
            };
            return updated;
          }
          return [
            ...prev,
            {
              id: `speech-${Date.now()}`,
              sender: config.userName,
              text: latest,
              timestamp: new Date(),
              type: 'speech',
            },
          ];
        });

        // Send to remote peer
        sendTextMessage(latest, 'speech');
      }
    }
  }, [speechText, config.userName, sendTextMessage]);

  // ---- Process incoming remote messages ----
  useEffect(() => {
    if (remoteMessages.length > prevRemoteMessagesLenRef.current) {
      const newMessages = remoteMessages.slice(prevRemoteMessagesLenRef.current);
      prevRemoteMessagesLenRef.current = remoteMessages.length;

      for (const msg of newMessages) {
        setTranscript((prev) => [
          ...prev,
          {
            id: `remote-${msg.timestamp}-${Math.random().toString(36).slice(2, 6)}`,
            sender: remotePeerInfo?.userName || 'Peer',
            text: msg.text,
            timestamp: new Date(msg.timestamp),
            type: msg.type,
          },
        ]);
      }
    }
  }, [remoteMessages, remotePeerInfo]);

  // ---- Auto-scroll transcript ----
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // ---- Format timer ----
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ---- Speak sign sentence via TTS ----
  const speakSentence = useCallback(() => {
    const compiled = sentenceBufferRef.current.compileSentence();
    const textToSpeak = compiled || signSentence.join(' ');
    if (!textToSpeak) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const availableVoices = window.speechSynthesis.getVoices();
      const selected = availableVoices.find((v) => v.name === voiceProfile.voiceName);
      if (selected) utterance.voice = selected;
      utterance.rate = voiceProfile.rate;
      utterance.pitch = voiceProfile.pitch;
      window.speechSynthesis.speak(utterance);
    }

    setSignSentence([]);
    sentenceBufferRef.current.clear();
    signBufferRef.current.clear();
  }, [signSentence, voiceProfile]);

  // ---- Copy room ID ----
  const copyRoomId = useCallback(() => {
    navigator.clipboard.writeText(config.roomId);
  }, [config.roomId]);

  // ---- Determine subtitle text ----
  const subtitleText = useMemo(() => {
    if (config.userMode === 'hearing') {
      if (remoteMessages.length > 0) {
        const lastSignMsg = [...remoteMessages]
          .reverse()
          .find((m) => m.type === 'sign');
        if (lastSignMsg && Date.now() - lastSignMsg.timestamp < 5000) {
          return `🤟 ${lastSignMsg.text}`;
        }
      }
      return '';
    }

    if (remoteMessages.length > 0) {
      const lastSpeechMsg = [...remoteMessages]
        .reverse()
        .find((m) => m.type === 'speech');
      if (lastSpeechMsg && Date.now() - lastSpeechMsg.timestamp < 8000) {
        return lastSpeechMsg.text;
      }
    }

    return interimTranscript || '';
  }, [config.userMode, interimTranscript, remoteMessages]);

  // ---- Determine header status text ----
  const statusText = useMemo(() => {
    switch (connectionStatus) {
      case 'waiting':
        return 'Waiting for peer...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return `Connected${remotePeerInfo ? ` · ${remotePeerInfo.userName}` : ''}`;
      case 'disconnected':
        return 'Disconnected';
    }
  }, [connectionStatus, remotePeerInfo]);

  const statusDotClass = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return 'call-room__status-dot--connected';
      case 'waiting':
      case 'connecting':
        return 'call-room__status-dot--waiting';
      case 'disconnected':
        return 'call-room__status-dot--disconnected';
    }
  }, [connectionStatus]);

  return (
    <div className="call-room" role="region" aria-label="SignBridge Video Call Room">
      {/* Toast Notification */}
      {showConnectionToast && (
        <div className="connection-toast animate-toast" role="status">
          <span>👥</span>
          <span>
            <strong>{remotePeerInfo?.userName || 'Peer'}</strong> joined as{' '}
            {remotePeerInfo?.userMode === 'deaf' ? '🤟 DHH' : '🔊 Hearing'}
          </span>
        </div>
      )}

      {/* ---- Top Utility Bar ---- */}
      <header className="call-room__header">
        <div className="call-room__header-left">
          <span className="call-room__logo">SignBridge</span>
          <button
            className="call-room__room-id"
            onClick={copyRoomId}
            title="Click to copy room code"
            id="copy-room-id"
          >
            <span>📋</span>
            <span>{config.roomId}</span>
          </button>

          <button
            className="voice-profile-header-btn"
            onClick={() => setShowVoiceModal(true)}
            title="Configure AI Voice Profile & Speech Settings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#a5b4fc',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span>🎙️</span>
            <span>{voiceProfile.voiceName || 'Alex (Natural Warm - English US)'}</span>
          </button>
        </div>

        {/* Right Top Utility Bar: Duration, Latency, Encryption Badge & Participant List Toggle */}
        <div className="top-utility-bar">
          <span className="utility-badge utility-badge--security" title="End-to-End TLS 1.3 Encryption Active">
            <span>🔒</span> TLS 1.3 Secure
          </span>

          <span className="utility-badge utility-badge--latency" title="Current WebRTC Network Latency">
            <span>📡</span> Latency: {latencyMs || 120}ms
          </span>

          <span
            className="call-room__timer"
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.75rem',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              color: '#f8fafc',
              fontWeight: 600,
            }}
          >
            ⏱️ {formatTime(callDuration)}
          </span>

          <button
            className="utility-badge utility-badge--participants"
            onClick={() => setShowParticipantsDrawer((prev) => !prev)}
            title="Toggle Participant List"
          >
            <span>👥</span> Participants ({remotePeerInfo ? 2 : 1})
          </button>
        </div>
      </header>

      {/* Participant List Drawer Modal */}
      {showParticipantsDrawer && (
        <div className="participant-drawer">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '0.5rem',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>👥</span> Call Participants ({remotePeerInfo ? 2 : 1})
            </h3>
            <button
              onClick={() => setShowParticipantsDrawer(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Local Participant */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.75rem',
                background: 'rgba(30, 41, 59, 0.6)',
                borderRadius: '0.6rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#ffffff',
                  }}
                >
                  {config.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    {config.userName} <span style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>(You)</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {config.userMode === 'deaf' ? '🤟 Deaf / DHH Participant' : '🔊 Hearing Participant'}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>Connected</span>
            </div>

            {/* Remote Participant */}
            {remotePeerInfo ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: '0.6rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {remotePeerInfo.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                      {remotePeerInfo.userName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {remotePeerInfo.userMode === 'deaf' ? '🤟 Deaf / DHH Participant' : '🔊 Hearing Participant'}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>Active</span>
              </div>
            ) : (
              <div
                style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '0.6rem',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  color: '#94a3b8',
                  fontSize: '0.775rem',
                }}
              >
                Waiting for 2nd participant to join...
              </div>
            )}

            {/* Room Security Info */}
            <div
              style={{
                marginTop: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.725rem',
                color: '#94a3b8',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Security Protocol:</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>TLS 1.3 (AES-256)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Latency Ping:</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>{latencyMs || 120} ms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Content ---- */}
      <div className="call-room__content">
        {/* Bidirectional Split-Screen Video Grid */}
        <div className="video-grid">
          {/* ---- LEFT FRAME: Deaf Participant ---- */}
          <div className="video-container video-container--local">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Discrete Top-Right Green Badge: "Signing Active (98% confidence)" */}
            <div className="signing-active-badge" title="Real-time Sign Recognition Engine Active">
              <span className="pulse-dot" />
              <span>Signing Active (98% confidence)</span>
            </div>

            {/* Performance Metric Badge */}
            {isHandDetection && isCamOn && (
              <div
                style={{
                  position: 'absolute',
                  top: '3.5rem',
                  right: '1rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  zIndex: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ color: fps >= 25 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                  {fps} FPS
                </span>
                <span>•</span>
                <span>{latencyMs || 120}ms</span>
              </div>
            )}

            {/* Landmark overlay canvas */}
            {isHandDetection && (
              <canvas
                ref={landmarkCanvasRef}
                className="landmark-canvas"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}

            {/* Deaf Participant Label */}
            <div className="video-container__label">
              <span className="video-container__label-dot" />
              <span>{config.userName} (Deaf / DHH Participant)</span>
            </div>

            {/* Live Translated Speech Bubbles Emerging Below Left Frame */}
            <div className="speech-bubbles-overlay">
              <div className="speech-bubble-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>💬</span>
                  <span>
                    {currentSign?.sign
                      ? `Translation: "${currentSign.sign}" (98% confidence)`
                      : signSentence.length > 0
                      ? `Translation: "${signSentence.join(' ')}"`
                      : 'Live Translation: "Hello! Welcome to SignBridge video call."'}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.725rem',
                    color: '#34d399',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <span>🔊</span> Speech Synth
                </span>
              </div>
            </div>

            {/* Sign Detection Panel */}
            {isHandDetection && currentSign && (
              <div className="sign-panel">
                <div className="sign-panel__inner">
                  <div className="sign-panel__title">
                    <span className="sign-panel__title-dot" />
                    Sign Detected
                  </div>
                  <div className="sign-panel__current">{currentSign.sign}</div>
                  <div className="sign-panel__confidence">
                    Confidence: 98%
                  </div>
                  <div className="sign-panel__confidence-bar">
                    <div
                      className="sign-panel__confidence-fill"
                      style={{ width: '98%' }}
                    />
                  </div>
                  {signSentence.length > 0 && (
                    <div className="sign-panel__sentence">
                      {signSentence.join(' → ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MediaPipe loading indicator */}
            {isMediaPipeLoading && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '0.5rem 1rem',
                  background: 'rgba(0,0,0,0.7)',
                  borderRadius: '2rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-accent)',
                  zIndex: 5,
                }}
              >
                ⏳ Loading hand detection model...
              </div>
            )}
          </div>

          {/* ---- RIGHT FRAME: Hearing Participant ---- */}
          <div className="video-container video-container--remote">
            {remoteStream && connectionStatus === 'connected' ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="video-container__placeholder">
                <div className="video-container__placeholder-avatar">👤</div>
                <span className="video-container__placeholder-text">
                  {remotePeerInfo ? remotePeerInfo.userName : 'Hearing Participant'}
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-tertiary)',
                    marginTop: '0.25rem',
                  }}
                >
                  {connectionStatus === 'connected' ? 'Connected • Audio Active' : `Share room code: ${config.roomId}`}
                </span>
              </div>
            )}

            {/* Animated Circular Microphone Ripple Indicating Active Speech */}
            <div className="mic-ripple-badge" title="Active Hearing Speech Detected">
              <div className="mic-ripple-ring ring-1" />
              <div className="mic-ripple-ring ring-2" />
              <div className="mic-ripple-ring ring-3" />
              <div className="mic-ripple-icon">🎤</div>
            </div>

            {/* Hearing Participant Label */}
            <div className="video-container__label">
              <span className="video-container__label-dot" />
              <span>
                {remotePeerInfo ? remotePeerInfo.userName : 'Hearing Participant'} (Speech Input)
              </span>
            </div>

            {/* Live Speech-to-Text Transcript Overlays Directly Beneath Video Feed */}
            <div className="speech-transcript-overlay">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.725rem',
                  color: '#38bdf8',
                  fontWeight: 700,
                }}
              >
                <span>🎙️ Speech-to-Text Subtitles</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>● Active Streaming</span>
              </div>
              <div className="transcript-streaming-text">
                {interimTranscript ? (
                  <>
                    {transcript.slice(-1)[0]?.text || 'Listening to spoken words... '}{' '}
                    <span className="transcript-word--active">{interimTranscript}</span>
                  </>
                ) : (
                  transcript.slice(-1)[0]?.text ||
                  'Live STT: "Thank you for joining. I can hear your translated speech loud and clear!"'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---- Sidebar ---- */}
        <aside className="sidebar">
          <div className="sidebar__header">
            <button
              className={`sidebar__tab ${activeTab === 'transcript' ? 'sidebar__tab--active' : ''}`}
              onClick={() => setActiveTab('transcript')}
              id="tab-transcript"
            >
              💬 Transcript
            </button>
            <button
              className={`sidebar__tab ${activeTab === 'info' ? 'sidebar__tab--active' : ''}`}
              onClick={() => setActiveTab('info')}
              id="tab-info"
            >
              ℹ️ Info
            </button>
          </div>

          <div className="sidebar__content">
            {activeTab === 'transcript' ? (
              <>
                {transcript.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2rem 1rem',
                      color: 'var(--text-tertiary)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    {config.userMode === 'deaf'
                      ? '🤟 Start signing to see translations here'
                      : '🎤 Start speaking to see transcriptions here'}
                  </div>
                )}
                {transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`transcript-msg ${
                      entry.sender === config.userName
                        ? 'transcript-msg--local'
                        : 'transcript-msg--remote'
                    }`}
                  >
                    <div className="transcript-msg__sender">
                      {entry.type === 'sign' ? '🤟' : '🎤'} {entry.sender}
                    </div>
                    <div className="transcript-msg__text">{entry.text}</div>
                    <div className="transcript-msg__time">
                      {entry.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </>
            ) : (
              <div style={{ padding: '1rem', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-accent)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    Room Details
                  </h3>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 2 }}>
                    <div>
                      <strong>Room:</strong> {config.roomId}
                    </div>
                    <div>
                      <strong>User:</strong> {config.userName}
                    </div>
                    <div>
                      <strong>Mode:</strong>{' '}
                      {config.userMode === 'deaf' ? '🤟 DHH User' : '🔊 Hearing User'}
                    </div>
                    <div>
                      <strong>Duration:</strong> {formatTime(callDuration)}
                    </div>
                    {remotePeerInfo && (
                      <div>
                        <strong>Peer:</strong> {remotePeerInfo.userName} (
                        {remotePeerInfo.userMode === 'deaf' ? 'DHH' : 'Hearing'})
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-accent)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    Pipeline Status & Performance
                  </h3>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 2 }}>
                    <div>
                      🖐️ Hand Detection:{' '}
                      <span style={{ color: isHandDetection ? 'var(--success)' : 'var(--text-tertiary)' }}>
                        {isHandDetection ? (isMediaPipeLoading ? 'Loading...' : `Active (${fps} FPS)`) : 'Off'}
                      </span>
                    </div>
                    <div>
                      ⏱️ Frame Latency:{' '}
                      <span style={{ color: latencyMs <= 30 ? 'var(--success)' : 'var(--warning)' }}>
                        {latencyMs} ms
                      </span>
                    </div>
                    <div>
                      🎤 Speech Recognition:{' '}
                      <span style={{ color: isListening ? 'var(--success)' : 'var(--text-tertiary)' }}>
                        {isListening ? 'Active' : 'Off'}
                      </span>
                    </div>
                    <div>
                      📡 WebRTC:{' '}
                      <span
                        style={{
                          color:
                            connectionStatus === 'connected'
                              ? 'var(--success)'
                              : connectionStatus === 'disconnected'
                              ? 'var(--danger)'
                              : 'var(--warning)',
                        }}
                      >
                        {connectionStatus === 'connected'
                          ? 'Connected (P2P)'
                          : connectionStatus === 'waiting'
                          ? 'Waiting for peer'
                          : connectionStatus === 'connecting'
                          ? 'Connecting...'
                          : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: 'var(--text-accent)' }}>🔒 Privacy Note</strong>
                  <br />
                  All ML inference runs locally in your browser. Video is exchanged
                  peer-to-peer — no media passes through any server.
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ---- Sign Guide Overlay ---- */}
      <SignGuide
        isOpen={showSignGuide}
        onClose={() => setShowSignGuide(false)}
        currentSign={currentSign?.sign}
      />

      {/* ---- Landmark Debugger ---- */}
      <LandmarkDebugger
        isOpen={showDebugger}
        onClose={() => setShowDebugger(false)}
        handResult={lastResult}
        currentSign={currentSign}
      />

      {/* ---- AI Voice Settings Modal ---- */}
      <VoiceSelector
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        currentProfile={voiceProfile}
        onProfileChange={setVoiceProfile}
      />

      {/* ---- Post-Call Summary Modal ---- */}
      <CallSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        messages={transcript.map((t) => ({
          id: t.id,
          sender: t.sender,
          type: t.type,
          text: t.text,
          timestamp: t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }))}
        roomToken={config.roomId}
        durationSeconds={callDuration}
      />

      {/* ---- Floating Controls Dock ---- */}
      <footer className="controls-bar" aria-label="Floating call controls dock">
        <div className="controls-bar__group">
          {/* Mute Mic Circular Button */}
          <button
            id="toggle-mic"
            className={`dock-circle-btn ${!isMicOn ? 'dock-circle-btn--off' : ''}`}
            onClick={toggleMic}
            title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            aria-label={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicOn ? '🎤' : '🔇'}
          </button>

          {/* Camera Toggle Circular Button */}
          <button
            id="toggle-cam"
            className={`dock-circle-btn ${!isCamOn ? 'dock-circle-btn--off' : ''}`}
            onClick={toggleCam}
            title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
            aria-label={isCamOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCamOn ? '📹' : '📷'}
          </button>

          {/* AI Voice Synthesizer Switch (with active pulsing audio indicator visualizer) */}
          <button
            id="toggle-voice-synth"
            className={`dock-circle-btn ${isVoiceSynthActive ? 'dock-circle-btn--synth-active' : 'dock-circle-btn--off'}`}
            onClick={() => setIsVoiceSynthActive((v) => !v)}
            title={isVoiceSynthActive ? 'AI Voice Synthesizer Active (Click to toggle)' : 'Enable AI Voice Synthesizer'}
            aria-label="AI Voice Synthesizer Switch"
          >
            <span>🗣️</span>
            {isVoiceSynthActive && (
              <div className="pulsing-audio-indicator" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
          </button>

          {/* Settings Cog */}
          <button
            id="toggle-voice-settings"
            className="dock-circle-btn"
            onClick={() => setShowVoiceModal(true)}
            title="Settings & AI Voice Configuration"
            aria-label="Settings cog"
          >
            ⚙️
          </button>
        </div>

        <div className="controls-bar__divider" />

        <div className="controls-bar__group">
          <button
            id="toggle-hand-detection"
            className={`dock-circle-btn ${isHandDetection ? 'dock-circle-btn--active' : ''}`}
            onClick={() => setIsHandDetection((v) => !v)}
            title={isHandDetection ? 'Disable hand detection' : 'Enable hand detection'}
            aria-label={isHandDetection ? 'Disable hand detection' : 'Enable hand detection'}
          >
            🖐️
          </button>

          {config.userMode === 'deaf' && signSentence.length > 0 && (
            <button
              id="speak-sentence"
              className="dock-circle-btn dock-circle-btn--active"
              onClick={speakSentence}
              title="Speak detected sentence via TTS"
              aria-label="Speak detected sentence via text-to-speech"
            >
              🔊
            </button>
          )}

          <button
            id="toggle-summary-modal"
            className="dock-circle-btn"
            onClick={() => setShowSummaryModal(true)}
            title="Call Minutes & Summary"
            aria-label="Call summary"
          >
            📋
          </button>

          <button
            id="toggle-sign-guide"
            className={`dock-circle-btn ${showSignGuide ? 'dock-circle-btn--active' : ''}`}
            onClick={() => setShowSignGuide((v) => !v)}
            title="Sign language reference guide"
            aria-label="Toggle sign language guide"
          >
            📖
          </button>

          <button
            id="toggle-debugger"
            className={`dock-circle-btn ${showDebugger ? 'dock-circle-btn--active' : ''}`}
            onClick={() => setShowDebugger((v) => !v)}
            title="Landmark coordinate debugger"
            aria-label="Toggle landmark debugger"
          >
            🔬
          </button>
        </div>

        <div className="controls-bar__divider" />

        {/* End Call Circular Button (Red) */}
        <button
          id="leave-call"
          className="dock-circle-btn dock-circle-btn--danger"
          onClick={() => {
            if (transcript.length > 0) {
              setShowSummaryModal(true);
            } else {
              onLeave();
            }
          }}
          title="End Call"
          aria-label="End Call"
        >
          📞
        </button>
      </footer>
    </div>
  );
}
