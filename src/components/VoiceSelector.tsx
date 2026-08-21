/**
 * VoiceSelector.tsx — AI Voice Profile & TTS Customization Slide-Out Drawer
 * 
 * Features:
 * - Slide-out drawer layout with dark-mode glassmorphism backdrop.
 * - Active Avatar Card: "Current Output: Alex (Natural Warm - English US)"
 * - Voice Grid categorized by tone: Expressive, Professional, Casual, Soft.
 * - Gender and language tags for each voice card.
 * - Range sliders for Pitch (0.5x to 2.0x) and Speech Rate (0.8x to 1.5x).
 * - Prominent "Play Sample Audio" button with live animated audio waveform.
 * - Primary CTA "Save & Apply Voice".
 */

import React, { useEffect, useState, useRef } from 'react';

export interface VoiceProfile {
  voiceName: string;
  pitch: number; // 0.5x to 2.0x
  rate: number;  // 0.8x to 1.5x
  gender: 'female' | 'male' | 'neutral';
  lang: string;  // e.g. "English US" or "en-US"
  tone?: 'Expressive' | 'Professional' | 'Casual' | 'Soft';
  description?: string;
  characteristics?: string;
  avatarGradient?: string;
  avatarInitials?: string;
}

export interface VoicePreset {
  id: string;
  name: string;
  characteristics: string;
  tone: 'Expressive' | 'Professional' | 'Casual' | 'Soft';
  gender: 'female' | 'male' | 'neutral';
  lang: string;
  langCode: string;
  avatarGradient: string;
  avatarInitials: string;
  description: string;
  defaultPitch: number;
  defaultRate: number;
}

export const PRESET_VOICES: VoicePreset[] = [
  // Expressive Tone
  {
    id: 'alex',
    name: 'Alex',
    characteristics: 'Natural Warm',
    tone: 'Expressive',
    gender: 'male',
    lang: 'English US',
    langCode: 'en-US',
    avatarGradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    avatarInitials: 'AL',
    description: 'Smooth, human-like voice with warm tone & articulate dynamics.',
    defaultPitch: 1.0,
    defaultRate: 1.0,
  },
  {
    id: 'sophia',
    name: 'Sophia',
    characteristics: 'Vibrant & Energetic',
    tone: 'Expressive',
    gender: 'female',
    lang: 'English US',
    langCode: 'en-US',
    avatarGradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    avatarInitials: 'SP',
    description: 'Bright and expressive cadence ideal for engaging video calls.',
    defaultPitch: 1.15,
    defaultRate: 1.05,
  },
  {
    id: 'david',
    name: 'David',
    characteristics: 'Dynamic Narrator',
    tone: 'Expressive',
    gender: 'male',
    lang: 'English UK',
    langCode: 'en-GB',
    avatarGradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
    avatarInitials: 'DV',
    description: 'Rich narrative voice with expressive inflection and depth.',
    defaultPitch: 0.95,
    defaultRate: 1.0,
  },

  // Professional Tone
  {
    id: 'marcus',
    name: 'Marcus',
    characteristics: 'Articulate & Clear',
    tone: 'Professional',
    gender: 'male',
    lang: 'English US',
    langCode: 'en-US',
    avatarGradient: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
    avatarInitials: 'MC',
    description: 'Clear, crisp demeanor crafted for formal meetings & presentations.',
    defaultPitch: 0.9,
    defaultRate: 1.0,
  },
  {
    id: 'elena',
    name: 'Elena',
    characteristics: 'Formal & Precise',
    tone: 'Professional',
    gender: 'female',
    lang: 'English UK',
    langCode: 'en-GB',
    avatarGradient: 'linear-gradient(135deg, #3b82f6 0%, #4338ca 100%)',
    avatarInitials: 'EL',
    description: 'Polished corporate tone with flawless pronunciation.',
    defaultPitch: 1.0,
    defaultRate: 0.95,
  },
  {
    id: 'hiroshi',
    name: 'Hiroshi',
    characteristics: 'Polished Business',
    tone: 'Professional',
    gender: 'male',
    lang: 'English US',
    langCode: 'en-US',
    avatarGradient: 'linear-gradient(135deg, #64748b 0%, #38bdf8 100%)',
    avatarInitials: 'HR',
    description: 'Steady, calm voice optimized for technical clarity.',
    defaultPitch: 0.95,
    defaultRate: 1.0,
  },

  // Casual Tone
  {
    id: 'emma',
    name: 'Emma',
    characteristics: 'Friendly & Conversational',
    tone: 'Casual',
    gender: 'female',
    lang: 'English US',
    langCode: 'en-US',
    avatarGradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    avatarInitials: 'EM',
    description: 'Welcoming, conversational style for casual everyday chat.',
    defaultPitch: 1.1,
    defaultRate: 1.0,
  },
  {
    id: 'liam',
    name: 'Liam',
    characteristics: 'Relaxed & Upbeat',
    tone: 'Casual',
    gender: 'male',
    lang: 'English CA',
    langCode: 'en-CA',
    avatarGradient: 'linear-gradient(135deg, #84cc16 0%, #059669 100%)',
    avatarInitials: 'LM',
    description: 'Approachably relaxed tone with upbeat rhythm.',
    defaultPitch: 0.95,
    defaultRate: 1.05,
  },
  {
    id: 'chloe',
    name: 'Chloe',
    characteristics: 'Warm & Welcoming',
    tone: 'Casual',
    gender: 'female',
    lang: 'English AU',
    langCode: 'en-AU',
    avatarGradient: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
    avatarInitials: 'CH',
    description: 'Warm Australian accent with smooth conversational pace.',
    defaultPitch: 1.05,
    defaultRate: 1.0,
  },

  // Soft Tone
  {
    id: 'luna',
    name: 'Luna',
    characteristics: 'Calm & Gentle',
    tone: 'Soft',
    gender: 'female',
    lang: 'English US',
    langCode: 'en-US',
    avatarGradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    avatarInitials: 'LN',
    description: 'Soft, soothing voice designed for reduced vocal intensity.',
    defaultPitch: 1.1,
    defaultRate: 0.9,
  },
  {
    id: 'oliver',
    name: 'Oliver',
    characteristics: 'Mellow & Smooth',
    tone: 'Soft',
    gender: 'male',
    lang: 'English UK',
    langCode: 'en-GB',
    avatarGradient: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
    avatarInitials: 'OL',
    description: 'Mellow low-resonance tone with gentle speech pace.',
    defaultPitch: 0.85,
    defaultRate: 0.95,
  },
  {
    id: 'aria',
    name: 'Aria',
    characteristics: 'Whisper Warmth',
    tone: 'Soft',
    gender: 'neutral',
    lang: 'English US',
    langCode: 'en-US',
    avatarGradient: 'linear-gradient(135deg, #d946ef 0%, #f43f5e 100%)',
    avatarInitials: 'AR',
    description: 'Gentle neutral profile ensuring comfortable, soothing audio.',
    defaultPitch: 1.0,
    defaultRate: 0.9,
  },
];

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
  // Local state for active editing before saving
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('alex');
  const [pitch, setPitch] = useState<number>(currentProfile.pitch || 1.0);
  const [speechRate, setSpeechRate] = useState<number>(currentProfile.rate || 1.0);
  const [selectedToneTab, setSelectedToneTab] = useState<'All' | 'Expressive' | 'Professional' | 'Casual' | 'Soft'>('All');
  
  // Audio preview state
  const [sampleText, setSampleText] = useState<string>(
    'Hello! I am using SignBridge AI voice synthesis to translate sign language in real-time.'
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // System voices from browser
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedSystemVoice, setSelectedSystemVoice] = useState<string>('');

  // Audio Context synth fallback ref for equalizer visualizer
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync state when drawer opens or currentProfile changes
  useEffect(() => {
    if (isOpen) {
      // Find matching preset by name or default to 'alex'
      const match = PRESET_VOICES.find(
        (p) => p.name.toLowerCase() === currentProfile.voiceName.toLowerCase() ||
               currentProfile.voiceName.includes(p.name)
      );
      if (match) {
        setSelectedVoiceId(match.id);
      } else {
        setSelectedVoiceId('alex');
      }

      // Clamp pitch to 0.5x - 2.0x
      setPitch(Math.min(2.0, Math.max(0.5, currentProfile.pitch || 1.0)));
      // Clamp rate to 0.8x - 1.5x
      setSpeechRate(Math.min(1.5, Math.max(0.8, currentProfile.rate || 1.0)));
    }
  }, [isOpen, currentProfile]);

  // Load browser speech synthesis voices
  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const available = window.speechSynthesis.getVoices();
        setSystemVoices(available);
      }
    };
    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Keyboard accessibility (Escape key to close drawer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Active voice preset details
  const activePreset = PRESET_VOICES.find((v) => v.id === selectedVoiceId) || PRESET_VOICES[0];

  // Filter voices by tone tab
  const filteredVoices = PRESET_VOICES.filter((v) => {
    if (selectedToneTab === 'All') return true;
    return v.tone === selectedToneTab;
  });

  // Handle Voice Card Selection
  const handleSelectVoiceCard = (preset: VoicePreset) => {
    setSelectedVoiceId(preset.id);
    setPitch(preset.defaultPitch);
    setSpeechRate(preset.defaultRate);

    // Stop existing audio if playing
    if (isPlaying) {
      stopAudioPreview();
    }
  };

  // Play / Pause Audio Preview
  const stopAudioPreview = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const playAudioPreview = () => {
    if (isPlaying) {
      stopAudioPreview();
      return;
    }

    setIsPlaying(true);

    // Play SpeechSynthesis if available
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sampleText);

      // Pitch & Rate from state
      utterance.pitch = pitch;
      utterance.rate = speechRate;

      // Select system voice if explicit, or search by langCode
      if (selectedSystemVoice) {
        const matched = systemVoices.find((v) => v.name === selectedSystemVoice);
        if (matched) utterance.voice = matched;
      } else {
        const matchedLang = systemVoices.find(
          (v) => v.lang.startsWith(activePreset.langCode) || v.name.includes(activePreset.name)
        );
        if (matchedLang) utterance.voice = matchedLang;
      }

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    }

    // Play sound tone via Web Audio API context fallback to guarantee sound output
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Map pitch to frequency (Hz)
        const baseFreq = activePreset.gender === 'female' ? 260 : activePreset.gender === 'male' ? 140 : 200;
        osc.frequency.setValueAtTime(baseFreq * pitch, ctx.currentTime);
        osc.type = 'sine';

        // Envelope
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      }
    } catch {
      // Ignore web audio context restrictions if blocked
    }
  };

  // Save & Apply Voice
  const handleSaveAndApply = () => {
    stopAudioPreview();

    const updatedProfile: VoiceProfile = {
      voiceName: `${activePreset.name} (${activePreset.characteristics})`,
      pitch: pitch,
      rate: speechRate,
      gender: activePreset.gender,
      lang: activePreset.langCode,
      tone: activePreset.tone,
      description: activePreset.description,
      characteristics: activePreset.characteristics,
      avatarGradient: activePreset.avatarGradient,
      avatarInitials: activePreset.avatarInitials,
    };

    onProfileChange(updatedProfile);

    // Show temporary toast confirmation
    setToastMessage(`Voice profile applied: ${activePreset.name} (${activePreset.characteristics})`);

    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 400);
  };

  return (
    <div
      className="voice-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-drawer-title"
    >
      <div
        className="voice-drawer-content"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking drawer inside
      >
        {/* ---- Drawer Header ---- */}
        <header className="voice-drawer-header">
          <div>
            <h2 id="voice-drawer-title" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f8fafc' }}>
              <span style={{ fontSize: '1.4rem' }}>🎙️</span> AI Voice Profile & TTS
            </h2>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
              Customize synthetic speech output tone, speed, and pitch for SignBridge calls.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI Voice Drawer"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
          >
            ✕
          </button>
        </header>

        {/* ---- Drawer Body ---- */}
        <div className="voice-drawer-body">
          {/* Toast Notification overlay if active */}
          {toastMessage && (
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'fadeInBackdrop 0.2s ease-out',
            }}>
              <span>✓</span> {toastMessage}
            </div>
          )}

          {/* ---- Top Section: Active Avatar Card ---- */}
          <section className="active-avatar-card">
            <div className="active-avatar-glow" />
            <div className="active-avatar-badge">
              <span className="pulse-dot" />
              <span>Active Output</span>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc', marginBottom: '0.75rem' }}>
              Current Output: {activePreset.name} ({activePreset.characteristics} - {activePreset.lang})
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Glowing Avatar circle */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: activePreset.avatarGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {activePreset.avatarInitials}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                    {activePreset.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 500 }}>
                    ({activePreset.characteristics})
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.6rem 0', lineHeight: 1.4 }}>
                  {activePreset.description}
                </p>

                {/* Quick tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <span className="voice-tag voice-tag--tone">Tone: {activePreset.tone}</span>
                  <span className="voice-tag voice-tag--gender">
                    {activePreset.gender === 'female' ? '♀ Female' : activePreset.gender === 'male' ? '♂ Male' : '⚥ Neutral'}
                  </span>
                  <span className="voice-tag voice-tag--lang">🌐 {activePreset.lang}</span>
                  <span className="voice-tag" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' }}>
                    Pitch {pitch.toFixed(2)}x | Speed {speechRate.toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ---- Voice Grid Categorized by Tone ---- */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>👥</span> Select Voice Preset
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {filteredVoices.length} voices available
              </span>
            </div>

            {/* Tone Category Filter Pills */}
            <div className="tone-tabs">
              {(['All', 'Expressive', 'Professional', 'Casual', 'Soft'] as const).map((tone) => {
                const count = tone === 'All' ? PRESET_VOICES.length : PRESET_VOICES.filter(v => v.tone === tone).length;
                return (
                  <button
                    key={tone}
                    onClick={() => setSelectedToneTab(tone)}
                    className={`tone-tab-btn ${selectedToneTab === tone ? 'active' : ''}`}
                  >
                    <span>{tone === 'All' ? '✨ All' : tone === 'Expressive' ? '🔥 Expressive' : tone === 'Professional' ? '💼 Professional' : tone === 'Casual' ? '☕ Casual' : '🌙 Soft'}</span>
                    <span style={{
                      background: selectedToneTab === tone ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '9999px',
                      fontSize: '0.675rem',
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Grid of Voice Cards */}
            <div className="voice-grid">
              {filteredVoices.map((voice) => {
                const isSelected = voice.id === selectedVoiceId;
                return (
                  <div
                    key={voice.id}
                    className={`voice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectVoiceCard(voice)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Avatar Icon */}
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: voice.avatarGradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.6)' : 'none',
                          flexShrink: 0,
                        }}
                      >
                        {voice.avatarInitials}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {voice.name}
                          </span>
                          {isSelected && (
                            <span style={{
                              background: '#6366f1',
                              color: '#ffffff',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                            }}>
                              ✓
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {voice.characteristics}
                        </div>
                      </div>
                    </div>

                    {/* Tag Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      <span className="voice-tag voice-tag--tone">{voice.tone}</span>
                      <span className="voice-tag voice-tag--gender">
                        {voice.gender === 'female' ? 'Female' : voice.gender === 'male' ? 'Male' : 'Neutral'}
                      </span>
                      <span className="voice-tag voice-tag--lang">{voice.lang}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional Hardware System Voice Override */}
            {systemVoices.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Hardware System Voice Engine (Optional Override)
                </label>
                <select
                  value={selectedSystemVoice}
                  onChange={(e) => setSelectedSystemVoice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.6rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: '0.775rem',
                    outline: 'none',
                  }}
                >
                  <option value="">Auto-matched to preset ({systemVoices.length} OS voices found)</option>
                  {systemVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* ---- Interactive Range Sliders Section ---- */}
          <section className="slider-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🎛️</span> Speech Customization Sliders
            </h3>

            {/* Pitch Range Slider (0.5x to 2.0x) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>🎵</span> Voice Pitch
                </label>
                <span style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#818cf8',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {pitch.toFixed(2)}x
                </span>
              </div>

              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="custom-range-slider"
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: '#64748b', marginTop: '0.35rem' }}>
                <span>0.5x (Deep Pitch)</span>
                <span>1.0x (Standard)</span>
                <span>2.0x (High Pitch)</span>
              </div>

              {/* Quick preset buttons for pitch */}
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem' }}>
                {[0.8, 1.0, 1.2, 1.5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setPitch(val)}
                    style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: '0.3rem',
                      fontSize: '0.675rem',
                      fontWeight: 600,
                      background: pitch === val ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${pitch === val ? '#6366f1' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: pitch === val ? '#a5b4fc' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {val.toFixed(1)}x
                  </button>
                ))}
              </div>
            </div>

            {/* Speech Rate (Speed) Slider (0.8x to 1.5x) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>⚡</span> Speech Rate (Speed)
                </label>
                <span style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#818cf8',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {speechRate.toFixed(2)}x
                </span>
              </div>

              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="custom-range-slider"
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: '#64748b', marginTop: '0.35rem' }}>
                <span>0.8x (Slow Pace)</span>
                <span>1.0x (Normal)</span>
                <span>1.5x (Fast Pace)</span>
              </div>

              {/* Quick preset buttons for rate */}
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem' }}>
                {[0.8, 1.0, 1.2, 1.4].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSpeechRate(val)}
                    style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: '0.3rem',
                      fontSize: '0.675rem',
                      fontWeight: 600,
                      background: speechRate === val ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${speechRate === val ? '#6366f1' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: speechRate === val ? '#a5b4fc' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {val.toFixed(1)}x
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ---- Audio Preview & Animated Audio Waveform ---- */}
          <section className="waveform-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🔊</span> Voice Preview & Audio Waveform
              </label>
              {isPlaying && (
                <span style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span className="pulse-dot" /> Synthesizing Audio...
                </span>
              )}
            </div>

            {/* Text Input / Quick Phrases */}
            <div>
              <textarea
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.6rem',
                  backgroundColor: 'rgba(7, 10, 19, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.4,
                }}
                placeholder="Type sample text to test TTS output..."
              />
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', overflowX: 'auto', paddingBottom: '0.1rem' }}>
                {[
                  'Hello! I am using SignBridge AI voice.',
                  'Real-time sign language translation.',
                  'Smooth, accessible video calling.',
                ].map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSampleText(phrase)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.35rem',
                      fontSize: '0.675rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Phrase {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Prominent Play Sample Audio Button */}
            <button
              onClick={playAudioPreview}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '0.75rem',
                background: isPlaying
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.925rem',
                cursor: 'pointer',
                boxShadow: isPlaying
                  ? '0 0 20px rgba(239, 68, 68, 0.4)'
                  : '0 8px 25px rgba(99, 102, 241, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                transition: 'all 0.25s ease',
              }}
            >
              <span>{isPlaying ? '⏸️ Stop Sample Audio' : '▶️ Play Sample Audio'}</span>
            </button>

            {/* Live Animated Audio Waveform Equalizer Bars */}
            <div className="waveform-bars">
              {Array.from({ length: 16 }).map((_, i) => {
                // Generate varied heights and animation delays for equalizers
                const delay = (i * 0.08).toFixed(2);
                return (
                  <div
                    key={i}
                    className={`waveform-bar ${isPlaying ? 'animating' : ''}`}
                    style={{
                      animationDelay: `${delay}s`,
                      height: isPlaying ? undefined : '6px',
                    }}
                  />
                );
              })}
            </div>
          </section>
        </div>

        {/* ---- Drawer Footer: Primary CTA ---- */}
        <footer className="voice-drawer-footer">
          <button
            onClick={handleSaveAndApply}
            style={{
              width: '100%',
              padding: '0.95rem 1.5rem',
              borderRadius: '0.875rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.01em',
              cursor: 'pointer',
              boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span>✓ Save & Apply Voice</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
