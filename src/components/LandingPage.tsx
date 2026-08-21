import { useState } from 'react';
import type { CallConfig, UserMode, AppView } from '../App';
import { VoiceSelector, VoiceProfile } from './VoiceSelector';

interface LandingPageProps {
  onJoin: (config: CallConfig) => void;
  onNavigate: (view: AppView) => void;
}

export default function LandingPage({ onJoin, onNavigate }: LandingPageProps) {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [userMode, setUserMode] = useState<UserMode>('deaf');
  const [showVoiceDrawer, setShowVoiceDrawer] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>({
    voiceName: 'Alex (Natural Warm - English US)',
    pitch: 1.0,
    rate: 1.0,
    gender: 'male',
    lang: 'en-US',
  });

  const generateRoomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const segments = Array.from({ length: 3 }, () =>
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    );
    return segments.join('-');
  };

  const handleCreateRoom = () => {
    const name = userName.trim() || 'User';
    const id = generateRoomId();
    onJoin({ roomId: id, userName: name, userMode });
  };

  const handleJoinRoom = () => {
    const name = userName.trim() || 'User';
    const id = roomId.trim();
    if (!id) return;
    onJoin({ roomId: id, userName: name, userMode });
  };

  return (
    <main className="landing" role="main">
      <div className="landing__logo">
        <div className="landing__logo-icon" aria-hidden="true">🤟</div>
        <h1 className="landing__logo-text">SignBridge</h1>
      </div>

      <p className="landing__tagline">
        Break communication barriers with <em>real-time sign language translation</em>.
        Connect deaf and hearing users through seamless video calls.
      </p>

      {/* ---- Learn, Practice, Gesture Studio & Voice Drawer Navigation ---- */}
      <div className="landing__nav-cards">
        <button
          className="nav-card nav-card--learn"
          onClick={() => onNavigate('learn')}
          id="nav-learn"
        >
          <div className="nav-card__icon">📚</div>
          <div className="nav-card__content">
            <h2 className="nav-card__title">Learn Signs</h2>
            <p className="nav-card__desc">Browse ASL lessons with step-by-step visual guides</p>
          </div>
          <span className="nav-card__arrow">→</span>
        </button>

        <button
          className="nav-card nav-card--practice"
          onClick={() => onNavigate('practice')}
          id="nav-practice"
        >
          <div className="nav-card__icon">🎯</div>
          <div className="nav-card__content">
            <h2 className="nav-card__title">Practice Studio</h2>
            <p className="nav-card__desc">Practice with AI-guided real-time feedback</p>
          </div>
          <span className="nav-card__arrow">→</span>
        </button>

        <button
          className="nav-card nav-card--studio"
          onClick={() => onNavigate('studio')}
          id="nav-studio"
        >
          <div className="nav-card__icon">⚡</div>
          <div className="nav-card__content">
            <h2 className="nav-card__title">Gesture Lab</h2>
            <p className="nav-card__desc">Dynamic motion recognition & custom gesture recorder</p>
          </div>
          <span className="nav-card__arrow">→</span>
        </button>

        <button
          className="nav-card"
          onClick={() => setShowVoiceDrawer(true)}
          id="nav-voice"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(217, 70, 239, 0.15))',
            borderColor: 'rgba(168, 85, 247, 0.35)',
          }}
        >
          <div className="nav-card__icon">🎙️</div>
          <div className="nav-card__content">
            <h2 className="nav-card__title">AI Voice Studio</h2>
            <p className="nav-card__desc">Customize pitch, rate & voice profile (Alex, Sophia, Marcus)</p>
          </div>
          <span className="nav-card__arrow">→</span>
        </button>

        <button
          className="nav-card"
          onClick={() => onNavigate('calibration')}
          id="nav-calibration"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
            borderColor: 'rgba(16, 185, 129, 0.35)',
          }}
        >
          <div className="nav-card__icon">⚙️</div>
          <div className="nav-card__content">
            <h2 className="nav-card__title">Pre-Call Calibration</h2>
            <p className="nav-card__desc">Hardware check, diagnostic meters & silhouette alignment</p>
          </div>
          <span className="nav-card__arrow">→</span>
        </button>

        <button
          className="nav-card"
          onClick={() => onNavigate('summary')}
          id="nav-summary"
          style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(99, 102, 241, 0.15))',
            borderColor: 'rgba(56, 189, 248, 0.35)',
          }}
        >
          <div className="nav-card__icon">📊</div>
          <div className="nav-card__content">
            <h2 className="nav-card__title">Post-Call Summary</h2>
            <p className="nav-card__desc">Executive summary, action items checklist & transcript</p>
          </div>
          <span className="nav-card__arrow">→</span>
        </button>
      </div>

      <VoiceSelector
        isOpen={showVoiceDrawer}
        onClose={() => setShowVoiceDrawer(false)}
        currentProfile={voiceProfile}
        onProfileChange={setVoiceProfile}
      />

      {/* ---- Call Actions ---- */}
      <div className="landing__actions">
        <div className="landing__section-label">
          <span className="landing__section-label-line" />
          <span>Video Call</span>
          <span className="landing__section-label-line" />
        </div>

        <div className="landing__user-input">
          <input
            id="user-name-input"
            className="landing__input"
            type="text"
            placeholder="Your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            aria-label="Your display name"
          />
        </div>

        <div className="mode-selector" role="radiogroup" aria-label="Communication mode">
          <button
            className={`mode-selector__btn ${userMode === 'deaf' ? 'mode-selector__btn--active' : ''}`}
            onClick={() => setUserMode('deaf')}
            role="radio"
            aria-checked={userMode === 'deaf'}
            id="mode-deaf"
          >
            🤟 DHH User
          </button>
          <button
            className={`mode-selector__btn ${userMode === 'hearing' ? 'mode-selector__btn--active' : ''}`}
            onClick={() => setUserMode('hearing')}
            role="radio"
            aria-checked={userMode === 'hearing'}
            id="mode-hearing"
          >
            🔊 Hearing User
          </button>
        </div>

        <button
          id="create-room-btn"
          className="btn btn--primary"
          onClick={handleCreateRoom}
        >
          ✨ Create New Room
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
        </div>

        <div className="landing__input-group">
          <input
            id="room-id-input"
            className="landing__input"
            type="text"
            placeholder="Enter room code (e.g., abc1-def2-ghi3)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            aria-label="Room code to join"
          />
        </div>

        <button
          id="join-room-btn"
          className="btn btn--secondary"
          onClick={handleJoinRoom}
          disabled={!roomId.trim()}
        >
          🔗 Join Room
        </button>
      </div>

      <div className="landing__features">
        <div className="glass-card feature-card">
          <div className="feature-card__icon" aria-hidden="true">🖐️</div>
          <h2 className="feature-card__title">Sign Detection</h2>
          <p className="feature-card__desc">MediaPipe extracts hand landmarks in real-time for instant sign recognition</p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-card__icon" aria-hidden="true">⚡</div>
          <h2 className="feature-card__title">Low Latency</h2>
          <p className="feature-card__desc">Sub-200ms translation with WebRTC peer-to-peer streaming</p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-card__icon" aria-hidden="true">🔒</div>
          <h2 className="feature-card__title">Privacy First</h2>
          <p className="feature-card__desc">All ML inference runs in your browser — no video leaves your device</p>
        </div>
      </div>
    </main>
  );
}
