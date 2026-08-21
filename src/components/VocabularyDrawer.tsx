/**
 * VocabularyDrawer.tsx — In-Call Live Vocabulary & Shortcut Sidebar
 * 
 * Prompt 6 Features:
 * - Collapsible right-hand drawer UI for an active video conference session.
 * - Header search bar: "Search medical, technical, or custom terms...".
 * - Tag cloud of custom quick-phrases and abbreviations (PRD, API, Medical Terminology, CI/CD, Blood Pressure, etc.).
 * - Hover gesture preview tooltips for every vocabulary chip.
 * - Single-click high-visibility "Emergency Shortcut / Phrase Trigger" button with pulsing emergency style.
 * - Real-time mini feed displaying recently triggered custom vocabulary tags during the call.
 */

import React, { useState } from 'react';

export interface VocabItem {
  id: string;
  term: string;
  category: 'technical' | 'medical' | 'general';
  gestureIcon: string;
  previewText: string;
}

export interface TriggeredTag {
  id: string;
  term: string;
  timestamp: string;
  speaker: string;
}

interface VocabularyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerPhrase?: (term: string) => void;
}

export const SAMPLE_VOCAB_ITEMS: VocabItem[] = [
  // Technical & Software
  { id: 'v-1', term: 'API', category: 'technical', gestureIcon: '🤟 [A-P-I]', previewText: 'Finger-spelled A-P-I gesture alignment' },
  { id: 'v-2', term: 'PRD', category: 'technical', gestureIcon: '📄 [P-R-D]', previewText: 'Product Requirement Document shortcut' },
  { id: 'v-3', term: 'Database', category: 'technical', gestureIcon: '🗄️ [STACK]', previewText: 'Stacked horizontal hands motion' },
  { id: 'v-4', term: 'CI/CD', category: 'technical', gestureIcon: '⚙️ [PIPELINE]', previewText: 'Interlocking gear hands gesture' },
  { id: 'v-5', term: 'Frontend', category: 'technical', gestureIcon: '💻 [DISPLAY]', previewText: 'Open palm frame motion' },
  { id: 'v-6', term: 'MediaPipe', category: 'technical', gestureIcon: '🤖 [VISION]', previewText: 'Index fingers eye-to-camera tracking' },

  // Medical Terminology
  { id: 'v-7', term: 'Medical Terminology', category: 'medical', gestureIcon: '🩺 [MEDICINE]', previewText: 'Middle finger palm tap motion' },
  { id: 'v-8', term: 'Blood Pressure', category: 'medical', gestureIcon: '🩸 [CUFF]', previewText: 'Arm squeeze gesture' },
  { id: 'v-9', term: 'Emergency Room', category: 'medical', gestureIcon: '🚑 [E-R]', previewText: 'E-R sign abbreviation' },
  { id: 'v-10', term: 'Prescription', category: 'medical', gestureIcon: '💊 [RX]', previewText: 'Palm write gesture' },
  { id: 'v-11', term: 'Heart Rate', category: 'medical', gestureIcon: '💓 [PULSE]', previewText: 'Chest rhythm tap' },

  // General Quick Phrases
  { id: 'v-12', term: 'Repeat Please', category: 'general', gestureIcon: '🔄 [AGAIN]', previewText: 'Curved hand palm arc' },
  { id: 'v-13', term: 'Slow Down', category: 'general', gestureIcon: '🐢 [SLOW]', previewText: 'Hand stroke up arm' },
  { id: 'v-14', term: 'Agree', category: 'general', gestureIcon: '👍 [THINK-SAME]', previewText: 'Y-hand shape slide' },
  { id: 'v-15', term: 'Need Assistance', category: 'general', gestureIcon: '🆘 [HELP]', previewText: 'Closed fist on open palm lift' },
];

export const VocabularyDrawer: React.FC<VocabularyDrawerProps> = ({
  isOpen,
  onClose,
  onTriggerPhrase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'technical' | 'medical' | 'general'>('all');
  
  // Real-time mini feed state showing recently triggered custom vocabulary tags
  const [recentFeed, setRecentFeed] = useState<TriggeredTag[]>([
    { id: 'f-1', term: 'API', timestamp: '14:02', speaker: 'Alex (Signer)' },
    { id: 'f-2', term: 'PRD', timestamp: '14:05', speaker: 'Sarah (Hearing)' },
    { id: 'f-3', term: 'Medical Terminology', timestamp: '14:08', speaker: 'Alex (Signer)' },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter items by search query and category
  const filteredVocab = SAMPLE_VOCAB_ITEMS.filter((item) => {
    const matchesSearch = item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && item.category === activeCategory;
  });

  // Handle triggering a vocabulary tag chip
  const handleTriggerChip = (term: string) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntry: TriggeredTag = {
      id: `f-${Date.now()}`,
      term,
      timestamp: nowStr,
      speaker: 'You (Local)',
    };
    setRecentFeed((prev) => [newEntry, ...prev.slice(0, 7)]);
    if (onTriggerPhrase) {
      onTriggerPhrase(term);
    }
    setToastMessage(`✨ Triggered shortcut: "${term}"`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Single-Click Emergency Shortcut Trigger Handler
  const handleEmergencyTrigger = () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const emergencyTerm = 'EMERGENCY: Immediate Assistance Requested!';
    const newEntry: TriggeredTag = {
      id: `f-emerg-${Date.now()}`,
      term: '🚨 EMERGENCY ALERT',
      timestamp: nowStr,
      speaker: 'You (Local)',
    };
    setRecentFeed((prev) => [newEntry, ...prev.slice(0, 7)]);
    if (onTriggerPhrase) {
      onTriggerPhrase(emergencyTerm);
    }
    setToastMessage('🚨 Emergency Shortcut Phrase Triggered!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <aside className="vocab-drawer" role="dialog" aria-label="In-Call Live Vocabulary and Shortcut Drawer">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            top: '4.5rem',
            left: '1rem',
            right: '1rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#ffffff',
            padding: '0.6rem 1rem',
            borderRadius: '0.65rem',
            fontWeight: 700,
            fontSize: '0.8rem',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
            zIndex: 100,
            textAlign: 'center',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ---- Drawer Header ---- */}
      <div className="vocab-drawer__header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📚</span> Live Vocabulary & Sign Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.25rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Search Bar: "Search medical, technical, or custom terms..." */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search medical, technical, or custom terms..."
          className="vocab-search-input"
          id="input-vocab-search"
        />

        {/* Category Pills Filter */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {(['all', 'technical', 'medical', 'general'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'capitalize',
                background: activeCategory === cat ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Tag Cloud of Custom Quick-Phrases & Abbreviations ---- */}
      <div className="vocab-tag-cloud">
        {filteredVocab.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.825rem', width: '100%' }}>
            No custom terms match your search query.
          </div>
        ) : (
          filteredVocab.map((item) => (
            <button
              key={item.id}
              className="vocab-chip"
              onClick={() => handleTriggerChip(item.term)}
            >
              <span>{item.gestureIcon.split(' ')[0]}</span>
              <span>{item.term}</span>

              {/* Hover Gesture Preview Tooltip */}
              <div className="vocab-chip__tooltip">
                <div style={{ fontWeight: 800, color: '#38bdf8' }}>{item.gestureIcon}</div>
                <div style={{ color: '#cbd5e1', marginTop: '0.15rem' }}>{item.previewText}</div>
                <div style={{ fontSize: '0.65rem', color: '#34d399', marginTop: '0.2rem', fontWeight: 700 }}>
                  Click to trigger gesture in call
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* ---- Bottom Controls: Emergency Trigger & Mini Feed ---- */}
      <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(15, 23, 42, 0.95)' }}>
        {/* Real-Time Mini Feed Showing Recently Triggered Custom Vocabulary Tags */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚡ Recently Triggered Vocabulary Feed
            </span>
            <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>Live Feed</span>
          </div>

          <div className="vocab-mini-feed">
            {recentFeed.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '0.5rem' }}>
                No vocabulary triggered yet. Click any chip above to emit.
              </div>
            ) : (
              recentFeed.map((feed) => (
                <div key={feed.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '0.15rem 0.45rem', borderRadius: '0.4rem', fontWeight: 700, fontSize: '0.725rem' }}>
                      {feed.term}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>by {feed.speaker}</span>
                  </span>
                  <span style={{ fontSize: '0.675rem', color: '#64748b' }}>[{feed.timestamp}]</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* High-Visibility, Single-Click "Emergency Shortcut / Phrase Trigger" Button */}
        <button
          className="btn-emergency-trigger"
          onClick={handleEmergencyTrigger}
          id="btn-emergency-trigger"
        >
          <span>🚨</span>
          <span>Emergency Shortcut / Phrase Trigger</span>
        </button>
      </div>
    </aside>
  );
};
