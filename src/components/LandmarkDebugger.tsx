/**
 * LandmarkDebugger — Real-time hand coordinate debug overlay
 * 
 * Displays live MediaPipe landmark coordinates, finger states,
 * curl values, and hand orientation. Useful for developing
 * new sign classifications.
 */
import { useMemo } from 'react';
import type { HandDetectionResult, HandLandmark } from '../hooks/useMediaPipe';
import {
  getFingerStates,
  getAllFingerCurls,
  getHandOrientation,
  distance,
} from '../ml/signClassifier';
import type { SignPrediction } from '../ml/signClassifier';

interface LandmarkDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
  handResult: HandDetectionResult | null;
  currentSign: SignPrediction | null;
}

const LANDMARK_NAMES = [
  'WRIST',
  'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
  'INDEX_MCP', 'INDEX_PIP', 'INDEX_DIP', 'INDEX_TIP',
  'MIDDLE_MCP', 'MIDDLE_PIP', 'MIDDLE_DIP', 'MIDDLE_TIP',
  'RING_MCP', 'RING_PIP', 'RING_DIP', 'RING_TIP',
  'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP',
];

function formatCoord(v: number): string {
  return v.toFixed(4);
}

export default function LandmarkDebugger({
  isOpen,
  onClose,
  handResult,
  currentSign,
}: LandmarkDebuggerProps) {
  const landmarks: HandLandmark[] | null = useMemo(() => {
    if (!handResult || !handResult.landmarks.length) return null;
    return handResult.landmarks[0];
  }, [handResult]);

  const fingerStates = useMemo(() => {
    if (!landmarks || landmarks.length < 21) return null;
    return getFingerStates(landmarks);
  }, [landmarks]);

  const fingerCurls = useMemo(() => {
    if (!landmarks || landmarks.length < 21) return null;
    return getAllFingerCurls(landmarks);
  }, [landmarks]);

  const orientation = useMemo(() => {
    if (!landmarks || landmarks.length < 21) return null;
    return getHandOrientation(landmarks);
  }, [landmarks]);

  const palmWidth = useMemo(() => {
    if (!landmarks || landmarks.length < 21) return 0;
    return distance(landmarks[5], landmarks[17]); // INDEX_MCP to PINKY_MCP
  }, [landmarks]);

  if (!isOpen) return null;

  return (
    <div className="debugger-panel">
      <div className="debugger-panel__header">
        <div className="debugger-panel__title">
          <span className="debugger-panel__title-dot" />
          🔬 Landmark Debugger
        </div>
        <button
          className="debugger-panel__close"
          onClick={onClose}
          aria-label="Close debugger"
          id="close-debugger"
        >
          ✕
        </button>
      </div>

      <div className="debugger-panel__content">
        {!landmarks ? (
          <div className="debugger-panel__empty">
            <span>🖐️</span>
            <span>Show your hand to start tracking</span>
          </div>
        ) : (
          <>
            {/* Current Classification */}
            <div className="debugger-section">
              <div className="debugger-section__title">🤖 Classification</div>
              <div className="debugger-classification">
                <span className="debugger-classification__sign">
                  {currentSign?.sign || '—'}
                </span>
                <span className="debugger-classification__conf">
                  {currentSign ? `${Math.round(currentSign.confidence * 100)}%` : '—'}
                </span>
              </div>
            </div>

            {/* Finger States */}
            <div className="debugger-section">
              <div className="debugger-section__title">✋ Finger States</div>
              <div className="debugger-fingers">
                {fingerStates &&
                  Object.entries(fingerStates).map(([finger, extended]) => (
                    <div
                      key={finger}
                      className={`debugger-finger ${extended ? 'debugger-finger--extended' : 'debugger-finger--curled'}`}
                    >
                      <span className="debugger-finger__name">{finger}</span>
                      <span className="debugger-finger__state">
                        {extended ? '↑' : '↓'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Curl Values */}
            <div className="debugger-section">
              <div className="debugger-section__title">🌀 Curl Values (0=flat, 1=curled)</div>
              <div className="debugger-curls">
                {fingerCurls &&
                  Object.entries(fingerCurls).map(([finger, curl]) => (
                    <div key={finger} className="debugger-curl">
                      <span className="debugger-curl__name">{finger}</span>
                      <div className="debugger-curl__bar">
                        <div
                          className="debugger-curl__fill"
                          style={{ width: `${Math.min(100, curl * 100)}%` }}
                        />
                      </div>
                      <span className="debugger-curl__value">{curl.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Hand Info */}
            <div className="debugger-section">
              <div className="debugger-section__title">📐 Hand Info</div>
              <div className="debugger-info-grid">
                <div className="debugger-info-item">
                  <span className="debugger-info-label">Orientation</span>
                  <span className="debugger-info-value">{orientation || '—'}</span>
                </div>
                <div className="debugger-info-item">
                  <span className="debugger-info-label">Palm Width</span>
                  <span className="debugger-info-value">{palmWidth.toFixed(4)}</span>
                </div>
                <div className="debugger-info-item">
                  <span className="debugger-info-label">Hands</span>
                  <span className="debugger-info-value">
                    {handResult?.landmarks.length || 0}
                  </span>
                </div>
                <div className="debugger-info-item">
                  <span className="debugger-info-label">Handedness</span>
                  <span className="debugger-info-value">
                    {handResult?.handedness?.[0] || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Raw Coordinates */}
            <div className="debugger-section">
              <div className="debugger-section__title">📍 Coordinates (21 landmarks)</div>
              <div className="debugger-coords">
                <div className="debugger-coords__header">
                  <span>#</span>
                  <span>Name</span>
                  <span>X</span>
                  <span>Y</span>
                  <span>Z</span>
                </div>
                {landmarks.map((lm, i) => (
                  <div key={i} className="debugger-coords__row">
                    <span className="debugger-coords__idx">{i}</span>
                    <span className="debugger-coords__name">{LANDMARK_NAMES[i]}</span>
                    <span className="debugger-coords__val">{formatCoord(lm.x)}</span>
                    <span className="debugger-coords__val">{formatCoord(lm.y)}</span>
                    <span className="debugger-coords__val debugger-coords__val--z">
                      {formatCoord(lm.z)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
