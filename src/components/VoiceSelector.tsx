/**
 * VoiceSelector.tsx — AI Voice Profile & Speech Settings Component
 * Implements PRD Phase 3 voice_presets schema: pitch, speech rate, voice selection, and preview.
 */
import React, { useEffect, useState } from 'react';

export interface VoiceProfile {
  voiceName: string;
  pitch: number; // 0.5 to 1.5
  rate: number; // 0.5 to 2.0
  gender: 'female' | 'male' | 'neutral';
  lang: string;
}

interface VoiceSelectorProps {
  currentProfile: VoiceProfile;
  onProfileChange: (profile: VoiceProfile) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  currentProfile,
  onProfileChange,
  isOpen,
  onClose,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testText, setTestText] = useState('Hello! I am using SignBridge AI voice synthesis.');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      }
    };

    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  const handleVoiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = voices.find((v) => v.name === e.target.value);
    onProfileChange({
      ...currentProfile,
      voiceName: e.target.value,
      lang: selected?.lang || currentProfile.lang,
    });
  };

  const handleTestVoice = () => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(testText);
    const selectedVoice = voices.find((v) => v.name === currentProfile.voiceName);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = currentProfile.pitch;
    utterance.rate = currentProfile.rate;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '1.25rem',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🔊</span> AI Voice Profile & Speech Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Voice Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#cbd5e1' }}>
            Synthetic Voice Profile
          </label>
          <select
            value={currentProfile.voiceName}
            onChange={handleVoiceSelect}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
            {voices.length === 0 && <option value="">Default System Voice</option>}
          </select>
        </div>

        {/* Pitch Controls */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <span style={{ color: '#cbd5e1' }}>Voice Pitch</span>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>{currentProfile.pitch.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={currentProfile.pitch}
            onChange={(e) => onProfileChange({ ...currentProfile, pitch: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#6366f1' }}
          />
        </div>

        {/* Speed / Speech Rate */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <span style={{ color: '#cbd5e1' }}>Speech Speed (Rate)</span>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>{currentProfile.rate.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={currentProfile.rate}
            onChange={(e) => onProfileChange({ ...currentProfile, rate: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#6366f1' }}
          />
        </div>

        {/* Voice Preview Section */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            onClick={handleTestVoice}
            disabled={isSpeaking}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: isSpeaking ? 'not-allowed' : 'pointer',
              opacity: isSpeaking ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span>{isSpeaking ? '🔊 Speaking...' : '▶️ Test Voice Sample'}</span>
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
