/**
 * PipWidget.tsx — Floating Picture-in-Picture (PiP) Translation Widget
 * 
 * Features:
 * - Compact desktop overlay widget (380px x 240px).
 * - Semi-transparent dark container with rounded glass corners.
 * - Top Half: Compact mini-cam preview with MediaPipe skeletal hand tracking canvas.
 * - Bottom Half: Scrolling two-line live transcription box displaying real-time translated text.
 * - Header Mini-Controls: Mini-Mute TTS (🔊/🔇), Pin on Top (📌), Expand to Fullscreen (⤢), Close (✕).
 */

import React, { useState, useEffect, useRef } from 'react';
import { useMediaPipe } from '../hooks/useMediaPipe';

interface PipWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onExpandFullscreen: () => void;
  currentTranscriptText?: string;
}

export const PipWidget: React.FC<PipWidgetProps> = ({
  isOpen,
  onClose,
  onExpandFullscreen,
  currentTranscriptText = 'SignBridge PiP Active: "Thank you for reviewing the real-time sign language translation pipeline."',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Widget Mini-Controls State
  const [isMutedTTS, setIsMutedTTS] = useState(false);
  const [isPinned, setIsPinned] = useState(true);

  // Hook for MediaPipe skeletal hand tracking in mini-cam
  const { isLoading, fps } = useMediaPipe(
    videoRef,
    canvasRef,
    isOpen
  );

  // Initialize camera for PiP overlay
  useEffect(() => {
    if (!isOpen) return;

    let stream: MediaStream | null = null;
    const initCam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('PiP mini-cam stream notice:', err);
      }
    };
    initCam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`pip-widget ${isPinned ? 'pinned' : ''}`}
      role="region"
      aria-label="Floating Picture in Picture Translation Widget"
    >
      {/* ---- Header Quick Mini-Controls ---- */}
      <header className="pip-widget__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem' }}>🤟</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
            SignBridge PiP
          </span>
          <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700, marginLeft: '0.2rem' }}>
            ● {fps || 30} FPS
          </span>
        </div>

        {/* Mini-Controls Action Row */}
        <div className="pip-widget__controls">
          {/* Mini-Mute TTS Button */}
          <button
            className={`pip-mini-btn ${isMutedTTS ? 'active' : ''}`}
            onClick={() => setIsMutedTTS((prev) => !prev)}
            title={isMutedTTS ? 'Unmute TTS Audio' : 'Mute TTS Audio'}
            id="pip-btn-mute-tts"
          >
            {isMutedTTS ? '🔇' : '🔊'}
          </button>

          {/* Pin on Top Button */}
          <button
            className={`pip-mini-btn ${isPinned ? 'active' : ''}`}
            onClick={() => setIsPinned((prev) => !prev)}
            title={isPinned ? 'Pinned on Top' : 'Pin Overlay on Top'}
            id="pip-btn-pin-top"
          >
            📌
          </button>

          {/* Expand to Fullscreen Button */}
          <button
            className="pip-mini-btn"
            onClick={onExpandFullscreen}
            title="Expand to Full Meeting Room"
            id="pip-btn-expand-fullscreen"
          >
            ⤢
          </button>

          {/* Close Button */}
          <button
            className="pip-mini-btn"
            onClick={onClose}
            title="Close Floating PiP Widget"
            id="pip-btn-close"
          >
            ✕
          </button>
        </div>
      </header>

      {/* ---- Top Half: Compact Mini-Cam Preview with Skeletal Tracking ---- */}
      <div className="pip-widget__cam-container">
        <video ref={videoRef} autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, transform: 'scaleX(-1)' }} />

        {/* Status Overlay Pill */}
        <div
          style={{
            position: 'absolute',
            top: '0.4rem',
            left: '0.5rem',
            background: 'rgba(7, 10, 19, 0.8)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            color: '#34d399',
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.65rem',
            fontWeight: 700,
            backdropFilter: 'blur(6px)',
          }}
        >
          {isLoading ? '⏳ Initializing hands...' : '🟢 Hand Skeletal Active'}
        </div>
      </div>

      {/* ---- Bottom Half: Scrolling Two-Line Live Transcription Box ---- */}
      <div className="pip-widget__transcript-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Live Translation Subtitles
          </span>
          <span style={{ fontSize: '0.625rem', color: isMutedTTS ? '#f87171' : '#34d399', fontWeight: 700 }}>
            {isMutedTTS ? '🔇 TTS Muted' : '🔊 TTS Active'}
          </span>
        </div>

        {/* Scrolling Two-Line Live Text */}
        <div className="pip-transcript-two-lines">
          {currentTranscriptText}
        </div>
      </div>
    </div>
  );
};
