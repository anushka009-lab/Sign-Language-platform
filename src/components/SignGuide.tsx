/**
 * SignGuide — Interactive sign language reference panel
 * 
 * Shows all recognizable signs organized by category with
 * instructions, finger patterns, and difficulty indicators.
 */
import { useState, useMemo } from 'react';
import { SIGN_CATALOG } from '../ml/signClassifier';
import type { SignInfo } from '../ml/signClassifier';

interface SignGuideProps {
  isOpen: boolean;
  onClose: () => void;
  currentSign?: string | null;
}

type CategoryFilter = 'all' | SignInfo['category'];

const CATEGORY_LABELS: Record<CategoryFilter, { label: string; emoji: string }> = {
  all: { label: 'All Signs', emoji: '🌐' },
  greeting: { label: 'Greetings', emoji: '👋' },
  response: { label: 'Responses', emoji: '💬' },
  word: { label: 'Words', emoji: '📝' },
  number: { label: 'Numbers', emoji: '🔢' },
  letter: { label: 'Letters', emoji: '🔤' },
  gesture: { label: 'Gestures', emoji: '🤙' },
  'two-handed': { label: 'Two-Handed', emoji: '🙌' },
};

const DIFFICULTY_COLORS: Record<SignInfo['difficulty'], string> = {
  easy: 'var(--success)',
  medium: 'var(--warning)',
  hard: 'var(--danger)',
};

export default function SignGuide({ isOpen, onClose, currentSign }: SignGuideProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [expandedSign, setExpandedSign] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSigns = useMemo(() => {
    let signs = SIGN_CATALOG;

    if (filter !== 'all') {
      signs = signs.filter((s) => s.category === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      signs = signs.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      );
    }

    return signs;
  }, [filter, searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set(SIGN_CATALOG.map((s) => s.category));
    return ['all' as CategoryFilter, ...Array.from(cats)] as CategoryFilter[];
  }, []);

  if (!isOpen) return null;

  return (
    <div className="sign-guide-overlay" onClick={onClose}>
      <div className="sign-guide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sign-guide__header">
          <div className="sign-guide__title">
            <span className="sign-guide__title-icon">📖</span>
            <h2>Sign Language Guide</h2>
            <span className="sign-guide__count">{SIGN_CATALOG.length} signs</span>
          </div>
          <button
            className="sign-guide__close"
            onClick={onClose}
            aria-label="Close guide"
            id="close-sign-guide"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="sign-guide__search">
          <input
            type="text"
            placeholder="Search signs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sign-guide__search-input"
            id="sign-guide-search"
          />
        </div>

        {/* Category Filters */}
        <div className="sign-guide__filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`sign-guide__filter-btn ${filter === cat ? 'sign-guide__filter-btn--active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {CATEGORY_LABELS[cat].emoji} {CATEGORY_LABELS[cat].label}
            </button>
          ))}
        </div>

        {/* Sign Cards */}
        <div className="sign-guide__cards">
          {filteredSigns.length === 0 && (
            <div className="sign-guide__empty">
              No signs found matching "{searchQuery}"
            </div>
          )}
          {filteredSigns.map((sign) => {
            const isExpanded = expandedSign === sign.name;
            const isActive = currentSign?.toUpperCase() === sign.name.toUpperCase();

            return (
              <div
                key={sign.name}
                className={`sign-card ${isActive ? 'sign-card--active' : ''} ${isExpanded ? 'sign-card--expanded' : ''}`}
                onClick={() => setExpandedSign(isExpanded ? null : sign.name)}
              >
                <div className="sign-card__header">
                  <div className="sign-card__emoji">{sign.emoji}</div>
                  <div className="sign-card__info">
                    <div className="sign-card__name">
                      {sign.name}
                      {isActive && <span className="sign-card__active-badge">DETECTED</span>}
                    </div>
                    <div className="sign-card__desc">{sign.description}</div>
                  </div>
                  <div
                    className="sign-card__difficulty"
                    style={{ color: DIFFICULTY_COLORS[sign.difficulty] }}
                    title={`Difficulty: ${sign.difficulty}`}
                  >
                    {'●'.repeat(sign.difficulty === 'easy' ? 1 : sign.difficulty === 'medium' ? 2 : 3)}
                  </div>
                </div>

                {isExpanded && (
                  <div className="sign-card__details">
                    <div className="sign-card__section">
                      <div className="sign-card__section-title">🖐️ How to Sign</div>
                      <ol className="sign-card__steps">
                        {sign.instructions.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="sign-card__meta">
                      <div className="sign-card__meta-item">
                        <span className="sign-card__meta-label">Pattern</span>
                        <span className="sign-card__meta-value">{sign.fingerPattern}</span>
                      </div>
                      <div className="sign-card__meta-item">
                        <span className="sign-card__meta-label">Category</span>
                        <span className="sign-card__meta-value">
                          {CATEGORY_LABELS[sign.category].emoji} {CATEGORY_LABELS[sign.category].label}
                        </span>
                      </div>
                      <div className="sign-card__meta-item">
                        <span className="sign-card__meta-label">Difficulty</span>
                        <span
                          className="sign-card__meta-value"
                          style={{ color: DIFFICULTY_COLORS[sign.difficulty] }}
                        >
                          {sign.difficulty.charAt(0).toUpperCase() + sign.difficulty.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
