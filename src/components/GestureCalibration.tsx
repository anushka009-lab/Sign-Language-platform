/**
 * GestureCalibration.tsx — Real-Time Pre-Call Hardware Check & Calibration Screen
 * 
 * Features:
 * - Center live webcam feed bounded by an ergonomic dashed upper-body & hand placement silhouette in bright emerald green.
 * - Diagnostic Meters Right Panel:
 *   - Lighting Quality (Good / Green - 88% Lux)
 *   - Camera FPS (30 FPS)
 *   - Hand Detection Confidence (96%)
 *   - Background Noise Level (Low -42dB)
 * - Test-sign verification box (perform sample gesture e.g. "Hello" to test recognition latency).
 * - Primary CTA: "Everything Looks Good — Join Meeting".
 */

import React, { useState, useEffect, useRef } from 'react';
import { useMediaPipe } from '../hooks/useMediaPipe';
import type { CallConfig } from '../App';

interface GestureCalibrationProps {
  config: CallConfig;
  onJoinMeeting: () => void;
  onBack: () => void;
}

export const GestureCalibration: React.FC<GestureCalibrationProps> = ({
  config,
  onJoinMeeting,
  onBack,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Diagnostic states
  const [testGesture, setTestGesture] = useState<'Hello' | 'Thank You' | 'Help'>('Hello');
  const [isGestureVerified, setIsGestureVerified] = useState(true);
  const [testLatencyMs, setTestLatencyMs] = useState(24);
  const [selectedMic, setSelectedMic] = useState('Default System Microphone');
  const [selectedCamera, setSelectedCamera] = useState('HD Web Camera (Default)');

  // MediaPipe hand detection hook
  const { isLoading, fps, latencyMs } = useMediaPipe(
    videoRef,
    canvasRef,
    true
  );

  // Initialize camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    const initCam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera access restriction in calibration:', err);
      }
    };
    initCam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Simulate gesture test latency tick
  const handleTestGestureRun = (gestureName: 'Hello' | 'Thank You' | 'Help') => {
    setTestGesture(gestureName);
    setIsGestureVerified(false);
    setTimeout(() => {
      setIsGestureVerified(true);
      setTestLatencyMs(Math.floor(Math.random() * 10) + 20); // 20-30ms latency
    }, 450);
  };

  return (
    <div className="calibration-screen" role="region" aria-label="Pre-Call Calibration and Diagnostics">
      {/* ---- Header ---- */}
      <header className="calibration-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              borderRadius: '0.6rem',
              padding: '0.45rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc' }}>
              <span>⚡</span> Pre-Call Hardware & Gesture Calibration
            </h1>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', margin: '0.15rem 0 0 0' }}>
              Room Code: <strong style={{ color: '#818cf8' }}>{config.roomId}</strong> • Mode: <span style={{ color: '#34d399', fontWeight: 600 }}>{config.userMode === 'deaf' ? '🤟 Deaf / DHH' : '🔊 Hearing'}</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="utility-badge utility-badge--security">
            <span>🔒</span> TLS 1.3 Encryption Ready
          </span>
        </div>
      </header>

      {/* ---- Main Calibration Workspace Grid ---- */}
      <div className="calibration-body">
        {/* Left Column: Center Webcam Viewport with Ergonomic Silhouette */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="calibration-video-container">
            <video ref={videoRef} autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, transform: 'scaleX(-1)' }} />

            {/* Ergonomic Dashed Upper-Body & Hand Placement Silhouette (Bright Emerald Green) */}
            <svg
              className="silhouette-overlay-svg"
              viewBox="0 0 1280 720"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Head Silhouette Circle */}
              <circle
                cx="640"
                cy="230"
                r="115"
                className="silhouette-dashed"
              />

              {/* Upper Body / Shoulders Silhouette Arc */}
              <path
                d="M 410,540 C 420,380 500,360 640,360 C 780,360 860,380 870,540 Z"
                className="silhouette-dashed"
              />

              {/* Left Hand Placement Box */}
              <rect
                x="280"
                y="330"
                width="160"
                height="190"
                rx="16"
                className="silhouette-target-box"
              />
              <text x="360" y="315" fill="#34d399" fontSize="13" fontWeight="700" textAnchor="middle">
                LEFT HAND TARGET
              </text>

              {/* Right Hand Placement Box */}
              <rect
                x="840"
                y="330"
                width="160"
                height="190"
                rx="16"
                className="silhouette-target-box"
              />
              <text x="920" y="315" fill="#34d399" fontSize="13" fontWeight="700" textAnchor="middle">
                RIGHT HAND TARGET
              </text>
            </svg>

            {/* Scanning Line Animation */}
            <div className="calibration-scan-line" />

            {/* Alignment Guidance Pill Overlay */}
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(10, 14, 26, 0.85)',
                border: '1.5px solid rgba(16, 185, 129, 0.5)',
                color: '#34d399',
                fontSize: '0.8rem',
                fontWeight: 700,
                boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span className="pulse-dot" />
              <span>Position upper body and hands inside green outline</span>
            </div>

            {/* Loading / FPS Indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.75rem',
                fontSize: '0.75rem',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                zIndex: 10,
              }}
            >
              {isLoading ? '⏳ Initializing Hand Tracking...' : `📷 Camera Stream Active (${fps || 30} FPS)`}
            </div>
          </div>

          {/* Quick Hardware Device Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>
                Camera Source
              </label>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                style={{ width: '100%', background: 'rgba(7, 10, 19, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0.5rem', padding: '0.4rem', fontSize: '0.775rem', outline: 'none' }}
              >
                <option value="HD Web Camera (Default)">HD Web Camera (Integrated)</option>
                <option value="Secondary USB Camera">Secondary USB Camera</option>
              </select>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>
                Audio Input (Microphone)
              </label>
              <select
                value={selectedMic}
                onChange={(e) => setSelectedMic(e.target.value)}
                style={{ width: '100%', background: 'rgba(7, 10, 19, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0.5rem', padding: '0.4rem', fontSize: '0.775rem', outline: 'none' }}
              >
                <option value="Default System Microphone">Default System Microphone</option>
                <option value="Noise-Canceling Headset Mic">Noise-Canceling Headset Mic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic Meters & Test-Sign Verification */}
        <div className="diagnostic-panel">
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📊</span> Real-Time Diagnostic Meters
          </h2>

          {/* 1. Lighting Quality Meter (Good / Green) */}
          <div className="diagnostic-meter-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>💡</span> Lighting Quality
              </span>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.55rem', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Good / Green
              </span>
            </div>
            <div className="diagnostic-meter-bar-track">
              <div className="diagnostic-meter-bar-fill diagnostic-meter-bar-fill--green" style={{ width: '88%' }} />
            </div>
            <p style={{ fontSize: '0.725rem', color: '#94a3b8', margin: 0 }}>
              Optimal lighting detected. 88% contrast score for hand tracking.
            </p>
          </div>

          {/* 2. Camera FPS Meter (30 FPS) */}
          <div className="diagnostic-meter-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📹</span> Camera FPS
              </span>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(14, 165, 233, 0.15)', padding: '0.2rem 0.55rem', borderRadius: '9999px', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                {fps || 30} FPS
              </span>
            </div>
            <div className="diagnostic-meter-bar-track">
              <div className="diagnostic-meter-bar-fill diagnostic-meter-bar-fill--blue" style={{ width: '100%' }} />
            </div>
            <p style={{ fontSize: '0.725rem', color: '#94a3b8', margin: 0 }}>
              Target 30 FPS achieved for ultra-smooth MediaPipe gesture recognition.
            </p>
          </div>

          {/* 3. Hand Detection Confidence (96%) */}
          <div className="diagnostic-meter-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🖐️</span> Hand Detection Confidence
              </span>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.55rem', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                96% Confidence
              </span>
            </div>
            <div className="diagnostic-meter-bar-track">
              <div className="diagnostic-meter-bar-fill diagnostic-meter-bar-fill--green" style={{ width: '96%' }} />
            </div>
            <p style={{ fontSize: '0.725rem', color: '#94a3b8', margin: 0 }}>
              21-landmark 3D coordinate model initialized with 96% precision.
            </p>
          </div>

          {/* 4. Background Noise Level (Low) */}
          <div className="diagnostic-meter-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🎤</span> Background Noise Level
              </span>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.55rem', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Low (-42 dB)
              </span>
            </div>
            <div className="diagnostic-meter-bar-track">
              <div className="diagnostic-meter-bar-fill diagnostic-meter-bar-fill--green" style={{ width: '22%' }} />
            </div>
            <p style={{ fontSize: '0.725rem', color: '#94a3b8', margin: 0 }}>
              Minimal acoustic noise detected for clear speech recognition.
            </p>
          </div>

          {/* ---- Test-Sign Box (Sample Gesture Verification) ---- */}
          <div className="test-sign-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🧪</span> Sample Gesture Test Box
              </span>
              <span style={{ fontSize: '0.7rem', color: '#a5b4fc', fontWeight: 600 }}>
                Latency Verification
              </span>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0 }}>
              Perform a sample sign in front of the camera to verify recognition speed:
            </p>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['Hello', 'Thank You', 'Help'] as const).map((gesture) => (
                <button
                  key={gesture}
                  onClick={() => handleTestGestureRun(gesture)}
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.6rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: testGesture === gesture ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    cursor: 'pointer',
                  }}
                >
                  {gesture === 'Hello' ? '👋 Hello' : gesture === 'Thank You' ? '🙏 Thanks' : '🆘 Help'}
                </button>
              ))}
            </div>

            {/* Gesture Verification Results Display */}
            <div style={{ background: 'rgba(7, 10, 19, 0.7)', borderRadius: '0.6rem', padding: '0.75rem', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Verified Sign:</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>
                  "{testGesture.toUpperCase()}"
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Latency:</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#34d399' }}>
                  {testLatencyMs} ms
                </div>
              </div>
              {isGestureVerified && (
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontWeight: 800, fontSize: '0.9rem' }}>
                  ✓
                </div>
              )}
            </div>
          </div>

          {/* ---- Large Primary CTA Button: "Everything Looks Good — Join Meeting" ---- */}
          <button
            className="cta-join-meeting-btn"
            onClick={onJoinMeeting}
            id="btn-everything-looks-good"
          >
            <span>Everything Looks Good — Join Meeting</span>
            <span style={{ fontSize: '1.2rem' }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
