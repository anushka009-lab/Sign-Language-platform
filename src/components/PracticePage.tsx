/**
 * PracticePage — Interactive AI-guided sign language practice
 *
 * Uses MediaPipe and signClassifier to provide real-time feedback
 * on target signs, tracking accuracy, streaks, and offering guidance.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { classifySign, SignBuffer, SIGN_CATALOG, getSignInfo } from '../ml/signClassifier';
import type { SignInfo, SignPrediction } from '../ml/signClassifier';

interface PracticePageProps {
  onBack: () => void;
  onLearn: () => void;
}

export default function PracticePage({ onBack, onLearn }: PracticePageProps) {
  // ---- Practice State ----
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [targetSign, setTargetSign] = useState<SignInfo>(SIGN_CATALOG[0]);
  const [currentPrediction, setCurrentPrediction] = useState<SignPrediction | null>(null);
  const [isMatch, setIsMatch] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [isSuccessToast, setIsSuccessToast] = useState<boolean>(false);

  // ---- Refs ----
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signBufferRef = useRef(new SignBuffer(8, 0.55));
  const successHandledRef = useRef<boolean>(false);

  // ---- MediaPipe Hook ----
  const { lastResult, isLoading: isMediaPipeLoading } = useMediaPipe(videoRef, canvasRef, true);

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
        console.error('Camera access error in Practice:', err);
      }
    };
    initCam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ---- Filter signs for picker ----
  const filteredCatalog = SIGN_CATALOG.filter(
    (s) => selectedCategory === 'all' || s.category === selectedCategory,
  );

  // ---- Select next target sign ----
  const pickNextSign = useCallback(() => {
    const available = filteredCatalog.filter((s) => s.name !== targetSign.name);
    const next = available.length
      ? available[Math.floor(Math.random() * available.length)]
      : targetSign;
    setTargetSign(next);
    setIsMatch(false);
    successHandledRef.current = false;
    signBufferRef.current.clear();
  }, [filteredCatalog, targetSign]);

  // ---- Select specific target sign ----
  const selectSign = (sign: SignInfo) => {
    setTargetSign(sign);
    setIsMatch(false);
    successHandledRef.current = false;
    signBufferRef.current.clear();
  };

  // ---- Process Hand Landmark Frames ----
  useEffect(() => {
    if (!lastResult || !lastResult.landmarks.length) {
      setCurrentPrediction(null);
      setIsMatch(false);
      return;
    }

    const primaryHand = lastResult.landmarks[0];
    const rawPred = classifySign(primaryHand);
    signBufferRef.current.push(rawPred);
    const smoothed = signBufferRef.current.getMostFrequent();

    if (smoothed) {
      setCurrentPrediction(smoothed);
      const isTargetMatch =
        smoothed.sign.toUpperCase() === targetSign.name.toUpperCase() &&
        smoothed.confidence >= 0.6;

      setIsMatch(isTargetMatch);

      if (isTargetMatch && !successHandledRef.current) {
        successHandledRef.current = true;
        setScore((s) => s + 100);
        setStreak((st) => {
          const next = st + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });

        setIsSuccessToast(true);
        setTimeout(() => {
          setIsSuccessToast(false);
        }, 1500);
      }
    }
  }, [lastResult, targetSign]);

  return (
    <div className="practice-page">
      {/* Success Toast */}
      {isSuccessToast && (
        <div className="practice-toast">
          <span className="practice-toast__icon">🎉</span>
          <span className="practice-toast__text">
            Excellent! You signed <strong>{targetSign.name}</strong> correctly! (+100 pts)
          </span>
        </div>
      )}

      {/* Header */}
      <header className="practice-page__header">
        <div className="practice-page__header-left">
          <button className="practice-page__back" onClick={onBack} id="practice-back">
            ← Back
          </button>
          <span className="practice-page__title">🎯 AI Sign Practice Studio</span>
        </div>

        <div className="practice-page__header-right">
          <div className="practice-stat">
            <span className="practice-stat__label">Score</span>
            <span className="practice-stat__value">{score}</span>
          </div>
          <div className="practice-stat">
            <span className="practice-stat__label">Streak</span>
            <span className="practice-stat__value">🔥 {streak}</span>
          </div>
          <div className="practice-stat">
            <span className="practice-stat__label">Best Streak</span>
            <span className="practice-stat__value">⭐ {bestStreak}</span>
          </div>
          <button className="btn btn--secondary" onClick={onLearn} id="practice-guide">
            📖 Lessons
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="practice-page__content">
        {/* Left: Video & Live Feedback */}
        <div className="practice-main">
          <div className="practice-video-container">
            <video ref={videoRef} autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} className="landmark-canvas" style={{ transform: 'scaleX(-1)' }} />

            {/* Target overlay indicator */}
            <div className={`practice-target-overlay ${isMatch ? 'practice-target-overlay--match' : ''}`}>
              <div className="practice-target-overlay__badge">Target Sign</div>
              <div className="practice-target-overlay__sign">
                <span>{targetSign.emoji}</span> {targetSign.name}
              </div>
            </div>

            {/* AI Real-time Feedback HUD */}
            <div className="practice-hud">
              <div className="practice-hud__title">🤖 AI Live Feedback</div>
              {currentPrediction ? (
                <div className="practice-hud__result">
                  <div className="practice-hud__detected">
                    Detected: <strong>{currentPrediction.sign}</strong>
                  </div>
                  <div className="practice-hud__conf">
                    Match: {Math.round(currentPrediction.confidence * 100)}%
                  </div>
                  <div className="practice-hud__bar">
                    <div
                      className={`practice-hud__fill ${isMatch ? 'practice-hud__fill--match' : ''}`}
                      style={{ width: `${Math.round(currentPrediction.confidence * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="practice-hud__waiting">
                  🖐️ Position your hand in front of the camera...
                </div>
              )}
            </div>

            {isMediaPipeLoading && (
              <div className="practice-loading">⏳ Loading Hand Tracking AI...</div>
            )}
          </div>

          {/* Action bar below video */}
          <div className="practice-actions">
            <button className="btn btn--secondary" onClick={pickNextSign} id="next-target-btn">
              🔀 Skip / Next Sign
            </button>
            {isMatch && (
              <button className="btn btn--success" onClick={pickNextSign} id="continue-next-btn">
                ✨ Next Sign (+100) →
              </button>
            )}
          </div>
        </div>

        {/* Right: Target Guide & Sign Picker */}
        <aside className="practice-sidebar">
          {/* Target Guide Card */}
          <div className="practice-guide-card glass-card">
            <div className="practice-guide-card__header">
              <span className="practice-guide-card__emoji">{targetSign.emoji}</span>
              <div>
                <h3 className="practice-guide-card__title">{targetSign.name}</h3>
                <span className="practice-guide-card__cat">{targetSign.category}</span>
              </div>
            </div>

            <p className="practice-guide-card__desc">{targetSign.description}</p>

            <div className="practice-guide-card__steps-title">🖐️ Steps to Sign:</div>
            <ol className="practice-guide-card__steps">
              {targetSign.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>

            <div className="practice-guide-card__pattern">
              Pattern: <strong>{targetSign.fingerPattern}</strong>
            </div>
          </div>

          {/* Target Selector */}
          <div className="practice-picker">
            <div className="practice-picker__header">
              <h4>🎯 Choose Sign to Practice</h4>
              <select
                className="practice-picker__select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="greeting">Greetings</option>
                <option value="response">Responses</option>
                <option value="word">Words</option>
                <option value="number">Numbers</option>
                <option value="letter">Letters</option>
                <option value="gesture">Gestures</option>
              </select>
            </div>

            <div className="practice-picker__grid">
              {filteredCatalog.map((sign) => (
                <button
                  key={sign.name}
                  className={`practice-picker__item ${sign.name === targetSign.name ? 'practice-picker__item--active' : ''}`}
                  onClick={() => selectSign(sign)}
                >
                  <span>{sign.emoji}</span>
                  <span>{sign.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
