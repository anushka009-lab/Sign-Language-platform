/**
 * AccessibilitySettings.tsx — Dedicated Accessibility & Subtitle Customization Screen
 * 
 * Prompt 10 Features:
 * - Top Half: Live preview card displaying sample translated text ("Hello, nice to meet you on SignBridge.").
 * - Bottom Configuration Panel:
 *   - Caption Style toggles: Solid Black, Glass Blur, High-Contrast Yellow on Black.
 *   - Continuous font size slider (14px to 36px).
 *   - Font Family Toggle: OpenDyslexic vs. Sans-Serif accessibility fonts.
 *   - Screen-reader auto-announcement toggle (ARIA Live politeness).
 *   - Color-coded speaker differentiation switches.
 */

import React, { useState } from 'react';

export type CaptionStyle = 'solid' | 'glass' | 'yellow';
export type AccessibilityFont = 'sans' | 'dyslexic';
export type SpeakerColorTheme = 'default' | 'high-contrast';

interface AccessibilitySettingsProps {
  onBack: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ onBack }) => {
  // Accessibility Configuration States
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('glass');
  const [fontSize, setFontSize] = useState<number>(22); // 14px to 36px
  const [fontFamily, setFontFamily] = useState<AccessibilityFont>('sans');
  const [enableScreenReader, setEnableScreenReader] = useState(true);
  const [speakerColorTheme, setSpeakerColorTheme] = useState<SpeakerColorTheme>('default');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save Settings Handler
  const handleSaveSettings = () => {
    setToastMessage('✅ Accessibility & Subtitle Preferences Saved!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Reset Defaults Handler
  const handleResetDefaults = () => {
    setCaptionStyle('glass');
    setFontSize(22);
    setFontFamily('sans');
    setEnableScreenReader(true);
    setSpeakerColorTheme('default');
    setToastMessage('🔄 Settings reset to default values.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="a11y-screen" role="region" aria-label="Accessibility and Subtitle Preferences">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
            zIndex: 1200,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ---- Header ---- */}
      <header className="a11y-header">
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
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>♿</span> Accessibility & Subtitle Customization Panel
            </h1>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', margin: '0.15rem 0 0 0' }}>
              Customize caption styles, typography sizes, dyslexia fonts, and screen reader announcements.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleResetDefaults}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              borderRadius: '0.6rem',
              padding: '0.45rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSaveSettings}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '0.6rem',
              padding: '0.45rem 1rem',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            }}
          >
            Save & Apply Preferences
          </button>
        </div>
      </header>

      {/* ---- Main Body ---- */}
      <div className="a11y-body">
        {/* TOP HALF: Live Preview Card */}
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>👁️</span> Live Subtitle & Typography Preview
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
              Real-time updates as you adjust settings below
            </span>
          </div>

          <div
            className={`a11y-preview-card ${
              captionStyle === 'solid'
                ? 'a11y-preview-card--solid'
                : captionStyle === 'yellow'
                ? 'a11y-preview-card--yellow'
                : 'a11y-preview-card--glass'
            }`}
          >
            {/* Speaker Differentiation Tag */}
            <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  background:
                    speakerColorTheme === 'high-contrast'
                      ? '#facc15'
                      : captionStyle === 'yellow'
                      ? '#facc15'
                      : 'rgba(99, 102, 241, 0.25)',
                  color:
                    speakerColorTheme === 'high-contrast' || captionStyle === 'yellow'
                      ? '#000000'
                      : '#a5b4fc',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                🤟 Signer (AI Voice: Alex)
              </span>
              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>00:14 • 98% Confidence</span>
            </div>

            {/* Sample Translated Text Preview */}
            <p
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: fontFamily === 'dyslexic' ? '"OpenDyslexic", "Comic Sans MS", sans-serif' : 'inherit',
                margin: 0,
                textAlign: 'center',
                lineHeight: 1.45,
                fontWeight: captionStyle === 'yellow' ? 800 : 600,
              }}
            >
              "Hello, nice to meet you on SignBridge."
            </p>
          </div>
        </div>

        {/* BOTTOM HALF: Configuration Panel */}
        <div className="a11y-config-panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚙️</span> Subtitle & Typography Configuration
          </h2>

          {/* 1. Caption Style Toggles */}
          <div className="a11y-config-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>
              Caption Visual Style Preset
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
              {/* Option A: Solid Black */}
              <button
                onClick={() => setCaptionStyle('solid')}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '0.75rem',
                  background: '#000000',
                  color: '#ffffff',
                  border: captionStyle === 'solid' ? '2.5px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.15)',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ⬛ Solid Black Backdrop
              </button>

              {/* Option B: Glass Blur */}
              <button
                onClick={() => setCaptionStyle('glass')}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(30, 41, 59, 0.7)',
                  color: '#f8fafc',
                  border: captionStyle === 'glass' ? '2.5px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.15)',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  textAlign: 'center',
                }}
              >
                ✨ Glassmorphism Blur
              </button>

              {/* Option C: High-Contrast Yellow on Black */}
              <button
                onClick={() => setCaptionStyle('yellow')}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '0.75rem',
                  background: '#000000',
                  color: '#facc15',
                  border: captionStyle === 'yellow' ? '3px solid #facc15' : '1px solid rgba(255, 255, 255, 0.15)',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ⚡ High-Contrast Yellow
              </button>
            </div>
          </div>

          {/* 2. Continuous Font Size Slider (14px to 36px) */}
          <div className="a11y-config-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>
                Subtitle Font Size (14px – 36px)
              </label>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(14, 165, 233, 0.15)', padding: '0.2rem 0.65rem', borderRadius: '0.5rem', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                {fontSize}px
              </span>
            </div>

            <input
              type="range"
              min={14}
              max={36}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              id="slider-font-size"
              style={{ width: '100%', accentColor: '#6366f1', height: '6px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: '#94a3b8' }}>
              <span>14px (Compact)</span>
              <span>24px (Standard)</span>
              <span>36px (Large Accessibility)</span>
            </div>
          </div>

          {/* 3. Toggle for OpenDyslexic / Sans-Serif Fonts */}
          <div className="a11y-config-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>
              Accessibility Font Family
            </label>
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <button
                onClick={() => setFontFamily('sans')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: fontFamily === 'sans' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Modern Sans-Serif (Default)
              </button>

              <button
                onClick={() => setFontFamily('dyslexic')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: fontFamily === 'dyslexic' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  fontFamily: '"OpenDyslexic", "Comic Sans MS", sans-serif',
                  cursor: 'pointer',
                }}
              >
                📖 OpenDyslexic Font
              </button>
            </div>
          </div>

          {/* 4. Screen-Reader Auto-Announcement Toggles (ARIA Live) */}
          <div className="a11y-config-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>
                  Screen-Reader Live Region Announcements (ARIA Live)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  Automatically announce translated sign language sentences to screen-readers as they are emitted.
                </div>
              </div>

              <input
                type="checkbox"
                checked={enableScreenReader}
                onChange={(e) => setEnableScreenReader(e.target.checked)}
                id="toggle-screen-reader"
                style={{ width: '22px', height: '22px', accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* 5. Color-Coded Speaker Differentiation Switches */}
          <div className="a11y-config-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>
              Color-Coded Speaker Differentiation Palette
            </label>
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <button
                onClick={() => setSpeakerColorTheme('default')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: speakerColorTheme === 'default' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: speakerColorTheme === 'default' ? '2px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.12)',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: '#818cf8' }}>● Indigo (Signer)</span>
                <span>/</span>
                <span style={{ color: '#34d399' }}>● Emerald (Hearing)</span>
              </button>

              <button
                onClick={() => setSpeakerColorTheme('high-contrast')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: speakerColorTheme === 'high-contrast' ? 'rgba(250, 204, 21, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: speakerColorTheme === 'high-contrast' ? '2px solid #facc15' : '1px solid rgba(255, 255, 255, 0.12)',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: '#facc15' }}>● Yellow (Signer)</span>
                <span>/</span>
                <span style={{ color: '#38bdf8' }}>● Cyan (Hearing)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
