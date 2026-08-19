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
  const [currentSign, setCurrentSign] = useState<SignPrediction | null>(null);
  const [signSentence, setSignSentence] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'transcript' | 'info'>('transcript');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [showConnectionToast, setShowConnectionToast] = useState(false);
  const [showSignGuide, setShowSignGuide] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);

  // ---- Refs ----
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const signBufferRef = useRef(new SignBuffer(12, 0.55));
  const lastSignRef = useRef<string>('');
  const lastSignTimeRef = useRef<number>(0);
  const prevRemoteMessagesLenRef = useRef(0);

  // ---- Hooks ----
  const { lastResult, isLoading: isMediaPipeLoading } = useMediaPipe(
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

          setSignSentence((prev) => {
            const next = [...prev, smoothed.sign];
            // Keep last 10 signs
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
    if (signSentence.length === 0) return;
    const text = signSentence.join(' ');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
    setSignSentence([]);
    signBufferRef.current.clear();
  }, [signSentence]);

  // ---- Copy room ID ----
  const copyRoomId = useCallback(() => {
    navigator.clipboard.writeText(config.roomId);
  }, [config.roomId]);

  // ---- Determine subtitle text ----
  // DHH users see speech-to-text from the remote hearing user
  // In connected mode, show remote speech messages
  // In demo mode, fall back to local interimTranscript
  const subtitleText = useMemo(() => {
    if (config.userMode === 'hearing') {
      // Hearing user: show incoming sign translations from DHH peer
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

    // DHH user: show incoming speech from hearing peer
    if (remoteMessages.length > 0) {
      const lastSpeechMsg = [...remoteMessages]
        .reverse()
        .find((m) => m.type === 'speech');
      if (lastSpeechMsg && Date.now() - lastSpeechMsg.timestamp < 8000) {
        return lastSpeechMsg.text;
      }
    }

    // Fallback: own interim transcript (demo mode)
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
    <div className="call-room">
      {/* ---- Connection Toast ---- */}
      {showConnectionToast && remotePeerInfo && (
        <div className="connection-toast">
          <span className="connection-toast__icon">🔗</span>
          <span>
            <strong>{remotePeerInfo.userName}</strong> joined as{' '}
            {remotePeerInfo.userMode === 'deaf' ? '🤟 DHH' : '🔊 Hearing'}
          </span>
        </div>
      )}

      {/* ---- Header ---- */}
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
        </div>

        <div className="call-room__status">
          <span
            className={`call-room__status-dot ${statusDotClass}`}
          />
          <span>{statusText}</span>
          <span className="call-room__timer">{formatTime(callDuration)}</span>
        </div>
      </header>

      {/* ---- Content ---- */}
      <div className="call-room__content">
        {/* Video Grid */}
        <div className="video-grid">
          {/* Local Video */}
          <div className="video-container video-container--local">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Landmark overlay canvas */}
            {isHandDetection && (
              <canvas
                ref={landmarkCanvasRef}
                className="landmark-canvas"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}

            {/* Label */}
            <div className="video-container__label">
              <span className="video-container__label-dot" />
              <span>{config.userName} (You · {config.userMode === 'deaf' ? 'DHH' : 'Hearing'})</span>
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
                    Confidence: {Math.round(currentSign.confidence * 100)}%
                  </div>
                  <div className="sign-panel__confidence-bar">
                    <div
                      className="sign-panel__confidence-fill"
                      style={{ width: `${currentSign.confidence * 100}%` }}
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

          {/* Remote Video */}
          <div className="video-container video-container--remote">
            {remoteStream && connectionStatus === 'connected' ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{ transform: 'scaleX(-1)' }}
                />
                {/* Remote peer label */}
                {remotePeerInfo && (
                  <div className="video-container__label">
                    <span className="video-container__label-dot" />
                    <span>
                      {remotePeerInfo.userName} ({remotePeerInfo.userMode === 'deaf' ? 'DHH' : 'Hearing'})
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="video-container__placeholder">
                <div className="video-container__placeholder-avatar">👤</div>
                <span className="video-container__placeholder-text">
                  {connectionStatus === 'connecting'
                    ? 'Connecting to peer...'
                    : connectionStatus === 'disconnected'
                    ? 'Peer disconnected'
                    : 'Waiting for peer to join...'}
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-tertiary)',
                    marginTop: '0.25rem',
                  }}
                >
                  Share the room code: <strong style={{ color: 'var(--text-accent)' }}>{config.roomId}</strong>
                </span>
              </div>
            )}

            {/* Subtitle overlay (shown on remote video) */}
            {subtitleText && (
              <div className="subtitle-overlay">
                <div className="subtitle-overlay__text">{subtitleText}</div>
              </div>
            )}
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
                    Pipeline Status
                  </h3>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 2 }}>
                    <div>
                      🖐️ Hand Detection:{' '}
                      <span style={{ color: isHandDetection ? 'var(--success)' : 'var(--text-tertiary)' }}>
                        {isHandDetection ? (isMediaPipeLoading ? 'Loading...' : 'Active') : 'Off'}
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
                    <div>
                      🤖 Sign Classifier:{' '}
                      <span style={{ color: 'var(--text-accent)' }}>Rule-based (v0.1)</span>
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

      {/* ---- Controls Bar ---- */}
      <footer className="controls-bar">
        <div className="controls-bar__group">
          <button
            id="toggle-mic"
            className={`btn btn--icon ${!isMicOn ? 'btn--toggled-off' : 'btn--secondary'}`}
            onClick={toggleMic}
            title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
            aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicOn ? '🎤' : '🔇'}
          </button>

          <button
            id="toggle-cam"
            className={`btn btn--icon ${!isCamOn ? 'btn--toggled-off' : 'btn--secondary'}`}
            onClick={toggleCam}
            title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
            aria-label={isCamOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCamOn ? '📹' : '📷'}
          </button>
        </div>

        <div className="controls-bar__divider" />

        <div className="controls-bar__group">
          <button
            id="toggle-hand-detection"
            className={`btn btn--icon-sm ${isHandDetection ? 'btn--success' : 'btn--secondary'}`}
            onClick={() => setIsHandDetection((v) => !v)}
            title={isHandDetection ? 'Disable hand detection' : 'Enable hand detection'}
            aria-label={isHandDetection ? 'Disable hand detection' : 'Enable hand detection'}
          >
            🖐️
          </button>

          {config.userMode === 'deaf' && signSentence.length > 0 && (
            <button
              id="speak-sentence"
              className="btn btn--secondary btn--icon-sm"
              onClick={speakSentence}
              title="Speak detected sentence via TTS"
              aria-label="Speak detected sentence via text-to-speech"
            >
              🔊
            </button>
          )}

          <button
            id="toggle-sign-guide"
            className={`btn btn--icon-sm ${showSignGuide ? 'btn--success' : 'btn--secondary'}`}
            onClick={() => setShowSignGuide((v) => !v)}
            title="Sign language reference guide"
            aria-label="Toggle sign language guide"
          >
            📖
          </button>

          <button
            id="toggle-debugger"
            className={`btn btn--icon-sm ${showDebugger ? 'btn--success' : 'btn--secondary'}`}
            onClick={() => setShowDebugger((v) => !v)}
            title="Landmark coordinate debugger"
            aria-label="Toggle landmark debugger"
          >
            🔬
          </button>
        </div>

        <div className="controls-bar__divider" />

        <button
          id="leave-call"
          className="btn btn--danger btn--icon"
          onClick={onLeave}
          title="Leave call"
          aria-label="Leave call"
        >
          📞
        </button>
      </footer>
    </div>
  );
}
