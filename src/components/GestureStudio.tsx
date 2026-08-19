/**
 * GestureStudio — Interactive Sign Language Gesture Recognition Lab
 * 
 * Features:
 * - Live MediaPipe dual-hand keypoint & velocity tracking
 * - Dynamic gesture recognition (static poses, motion waves, 2-handed signs)
 * - Custom Gesture Recorder: Snapshot hand landmarks, save to LocalStorage, & detect in real time
 * - Real-time Text-to-Speech synthesis
 * - Audio feedback cues & customizable ML thresholds
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaPipe } from '../hooks/useMediaPipe';
import {
  classifySign,
  classifyTwoHandSign,
  classifyCustomGesture,
  SignBuffer,
  getFingerStates,
  getAllFingerCurls,
  SIGN_CATALOG,
} from '../ml/signClassifier';
import type { SignPrediction, CustomGestureTemplate } from '../ml/signClassifier';

interface GestureStudioProps {
  onBack: () => void;
  onNavigate: (view: 'landing' | 'call' | 'learn' | 'practice' | 'studio') => void;
}

const STORAGE_KEY = 'signbridge_custom_gestures';

export default function GestureStudio({ onBack, onNavigate }: GestureStudioProps) {
  // ---- State ----
  const [prediction, setPrediction] = useState<SignPrediction | null>(null);
  const [customTemplates, setCustomTemplates] = useState<CustomGestureTemplate[]>([]);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [newGestureName, setNewGestureName] = useState('');
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [minConfidence, setMinConfidence] = useState(0.55);
  const [bufferSize, setBufferSize] = useState(8);
  const [lastSpokenSign, setLastSpokenSign] = useState('');
  const [recognizedHistory, setRecognizedHistory] = useState<string[]>([]);
  const [motionStats, setMotionStats] = useState({ speed: 0, direction: 'still' });

  // ---- Refs ----
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signBufferRef = useRef(new SignBuffer(bufferSize, minConfidence));
  const lastSpokenTimeRef = useRef(0);

  // ---- MediaPipe Hook ----
  const { lastResult, isLoading } = useMediaPipe(videoRef, canvasRef, true);

  // ---- Load Custom Gestures from Storage ----
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCustomTemplates(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading custom gestures:', e);
    }
  }, []);

  // ---- Initialize Camera ----
  useEffect(() => {
    let stream: MediaStream | null = null;
    const initCam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access error in GestureStudio:', err);
      }
    };
    initCam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ---- Update buffer settings ----
  useEffect(() => {
    signBufferRef.current = new SignBuffer(bufferSize, minConfidence);
  }, [bufferSize, minConfidence]);

  // ---- Process Frames & Gesture Recognition ----
  useEffect(() => {
    if (!lastResult || !lastResult.landmarks || lastResult.landmarks.length === 0) {
      setPrediction(null);
      setMotionStats({ speed: 0, direction: 'still' });
      return;
    }

    let currentPred: SignPrediction | null = null;

    // Check 2-hand gesture first if 2 hands present
    if (lastResult.landmarks.length >= 2) {
      const twoHandPred = classifyTwoHandSign(lastResult.landmarks[0], lastResult.landmarks[1]);
      if (twoHandPred) {
        currentPred = twoHandPred;
      }
    }

    // Single hand classification
    if (!currentPred && lastResult.landmarks.length > 0) {
      const primaryHand = lastResult.landmarks[0];
      const tracker = lastResult.motionTrackers?.[0];

      // Check custom user-recorded templates first
      const customPred = classifyCustomGesture(primaryHand, customTemplates);
      if (customPred) {
        currentPred = customPred;
      } else {
        currentPred = classifySign(primaryHand, tracker);
      }

      if (tracker) {
        const m = tracker.getMotion();
        setMotionStats({ speed: m.speed, direction: m.direction });
      }
    }

    if (currentPred) {
      signBufferRef.current.push(currentPred);
      const smoothed = signBufferRef.current.getMostFrequent();

      if (smoothed) {
        setPrediction(smoothed);

        // Append to history log if new
        const now = Date.now();
        if (
          smoothed.confidence >= minConfidence &&
          (smoothed.sign !== lastSpokenSign || now - lastSpokenTimeRef.current > 3000)
        ) {
          if (smoothed.sign !== lastSpokenSign) {
            setLastSpokenSign(smoothed.sign);
            lastSpokenTimeRef.current = now;

            setRecognizedHistory((prev) => [smoothed.sign, ...prev.slice(0, 14)]);

            // Text-to-Speech Synthesis
            if (isTtsEnabled && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel(); // cancel previous
              const cleanText = smoothed.sign.replace(/^ASL-/, 'Letter ');
              const utterance = new SpeechSynthesisUtterance(cleanText);
              utterance.rate = 1.0;
              window.speechSynthesis.speak(utterance);
            }
          }
        }
      }
    }
  }, [lastResult, customTemplates, isTtsEnabled, minConfidence, lastSpokenSign]);

  // ---- Save Custom Gesture ----
  const handleSaveCustomGesture = () => {
    if (!newGestureName.trim() || !lastResult || !lastResult.landmarks.length) return;

    const primaryHand = lastResult.landmarks[0];
    const newTemplate: CustomGestureTemplate = {
      id: `custom_${Date.now()}`,
      name: newGestureName.trim().toUpperCase(),
      landmarks: primaryHand,
      fingerStates: getFingerStates(primaryHand),
      createdAt: Date.now(),
    };

    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setNewGestureName('');
    setIsRecordingModalOpen(false);
  };

  // ---- Delete Custom Gesture ----
  const handleDeleteCustomGesture = (id: string) => {
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const currentLandmarks = lastResult?.landmarks?.[0];
  const fingerStates = currentLandmarks ? getFingerStates(currentLandmarks) : null;
  const fingerCurls = currentLandmarks ? getAllFingerCurls(currentLandmarks) : null;

  return (
    <div className="gesture-studio">
      {/* Header */}
      <header className="gesture-studio__header">
        <div className="gesture-studio__header-left">
          <button className="practice-page__back" onClick={onBack} id="studio-back">
            ← Back
          </button>
          <span className="gesture-studio__title">⚡ AI Gesture Recognition Studio</span>
        </div>

        <div className="gesture-studio__header-right">
          <button
            className={`btn ${isTtsEnabled ? 'btn--success' : 'btn--secondary'}`}
            onClick={() => setIsTtsEnabled((v) => !v)}
            id="toggle-tts-btn"
          >
            {isTtsEnabled ? '🔊 Voice Feedback ON' : '🔇 Voice Feedback OFF'}
          </button>
          <button className="btn btn--secondary" onClick={() => onNavigate('practice')} id="studio-practice">
            🎯 Practice Studio
          </button>
        </div>
      </header>

      {/* Content Body */}
      <div className="gesture-studio__content">
        {/* Left: Live Video & Skeleton Feed */}
        <div className="gesture-studio__main">
          <div className="gesture-studio__video-wrap">
            <video ref={videoRef} autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} className="landmark-canvas" style={{ transform: 'scaleX(-1)' }} />

            {/* Gesture Recognition Badge */}
            {prediction && (
              <div className="gesture-badge-overlay">
                <span className="gesture-badge-overlay__type">
                  {prediction.isTwoHanded ? '🙌 Two-Handed' : prediction.isCustom ? '⭐ Custom Gesture' : '🖐️ Recognized Sign'}
                </span>
                <span className="gesture-badge-overlay__sign">{prediction.sign}</span>
                <div className="gesture-badge-overlay__conf-bar">
                  <div
                    className="gesture-badge-overlay__fill"
                    style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                  />
                </div>
                <span className="gesture-badge-overlay__pct">{Math.round(prediction.confidence * 100)}% Confidence</span>
              </div>
            )}

            {isLoading && <div className="practice-loading">⏳ Initializing MediaPipe Machine Learning...</div>}
          </div>

          {/* Action Bar */}
          <div className="gesture-studio__actions">
            <button
              className="btn btn--primary"
              disabled={!currentLandmarks}
              onClick={() => setIsRecordingModalOpen(true)}
              id="record-custom-gesture-btn"
            >
              📷 Record Custom Gesture
            </button>

            <div className="gesture-motion-pill">
              <span>💨 Speed: {(motionStats.speed * 100).toFixed(1)}</span>
              <span>🧭 Motion: {motionStats.direction.toUpperCase()}</span>
            </div>
          </div>

          {/* Finger & Curl Live Meter */}
          {currentLandmarks && fingerStates && fingerCurls && (
            <div className="gesture-meter-panel glass-card">
              <h4>📊 Real-time Hand Geometry Features</h4>
              <div className="gesture-meter-grid">
                {Object.keys(fingerStates).map((finger) => {
                  const key = finger as keyof typeof fingerStates;
                  const ext = fingerStates[key];
                  const curl = fingerCurls[key];
                  return (
                    <div key={finger} className="gesture-meter-item">
                      <span className="gesture-meter-label">{finger.toUpperCase()}</span>
                      <span className={`gesture-meter-badge ${ext ? 'gesture-meter-badge--ext' : 'gesture-meter-badge--curled'}`}>
                        {ext ? 'EXTENDED' : 'CURLED'}
                      </span>
                      <div className="gesture-meter-bar">
                        <div className="gesture-meter-fill" style={{ width: `${Math.round(curl * 100)}%` }} />
                      </div>
                      <span className="gesture-meter-val">Curl: {(curl * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Settings & Custom Gestures */}
        <aside className="gesture-studio__sidebar">
          {/* Recent History Stream */}
          <div className="gesture-card glass-card">
            <h3>📜 Live Recognition History</h3>
            {recognizedHistory.length === 0 ? (
              <p className="gesture-card__empty">Show signs to camera to see history here...</p>
            ) : (
              <div className="gesture-history-list">
                {recognizedHistory.map((s, idx) => (
                  <span key={idx} className="gesture-history-chip">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Custom Recorded Gestures */}
          <div className="gesture-card glass-card">
            <div className="gesture-card__header-flex">
              <h3>⭐ Saved Custom Gestures</h3>
              <span className="gesture-card__count">{customTemplates.length} saved</span>
            </div>
            {customTemplates.length === 0 ? (
              <p className="gesture-card__empty">No custom gestures recorded yet. Click "Record Custom Gesture" to create one!</p>
            ) : (
              <div className="gesture-custom-list">
                {customTemplates.map((t) => (
                  <div key={t.id} className="gesture-custom-item">
                    <div>
                      <strong>{t.name}</strong>
                      <div className="gesture-custom-meta">
                        Created {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      className="gesture-custom-del"
                      onClick={() => handleDeleteCustomGesture(t.id)}
                      title="Delete gesture"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ML Controls & Tuning */}
          <div className="gesture-card glass-card">
            <h3>⚙️ Classification Tuning</h3>
            <div className="gesture-setting">
              <label>Min Confidence Threshold: {Math.round(minConfidence * 100)}%</label>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.05"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              />
            </div>
            <div className="gesture-setting">
              <label>Smoothing Window Frames: {bufferSize}</label>
              <input
                type="range"
                min="3"
                max="20"
                step="1"
                value={bufferSize}
                onChange={(e) => setBufferSize(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Record Custom Gesture Modal */}
      {isRecordingModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card">
            <h3>📷 Record Custom Hand Gesture</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Position your hand in your desired pose in front of the camera, then type a name to save your template.
            </p>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. SECRET_HANDSHAKE or OK_PLUS"
              value={newGestureName}
              onChange={(e) => setNewGestureName(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn--secondary" onClick={() => setIsRecordingModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn--primary" onClick={handleSaveCustomGesture} disabled={!newGestureName.trim()}>
                Save Gesture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
