/**
 * LearnPage — Structured sign language learning guide
 *
 * Organized lessons by category with visual demonstrations,
 * step-by-step instructions, and progress tracking.
 */
import { useState, useMemo } from 'react';
import { SIGN_CATALOG } from '../ml/signClassifier';
import type { SignInfo } from '../ml/signClassifier';

interface LearnPageProps {
  onBack: () => void;
  onPractice: () => void;
}

type LessonCategory = 'all' | SignInfo['category'];

interface Lesson {
  id: string;
  title: string;
  emoji: string;
  description: string;
  category: SignInfo['category'];
  signs: SignInfo[];
}

// Organize signs into structured lessons
function buildLessons(): Lesson[] {
  const groups: Record<string, SignInfo[]> = {};
  for (const sign of SIGN_CATALOG) {
    if (!groups[sign.category]) groups[sign.category] = [];
    groups[sign.category].push(sign);
  }

  const lessons: Lesson[] = [];

  if (groups.greeting) {
    lessons.push({
      id: 'greetings',
      title: 'Greetings & Emotions',
      emoji: '👋',
      description: 'Learn essential signs for daily greetings and expressing emotions',
      category: 'greeting',
      signs: groups.greeting,
    });
  }

  if (groups.response) {
    lessons.push({
      id: 'responses',
      title: 'Common Responses',
      emoji: '💬',
      description: 'Master yes, no, good, and other everyday responses',
      category: 'response',
      signs: groups.response,
    });
  }

  if (groups.word) {
    lessons.push({
      id: 'words',
      title: 'Essential Words',
      emoji: '📝',
      description: 'Learn important words like thank you, please, sorry, stop, and help',
      category: 'word',
      signs: groups.word,
    });
  }

  if (groups.number) {
    lessons.push({
      id: 'numbers',
      title: 'Numbers 1–5',
      emoji: '🔢',
      description: 'Count from one to five in American Sign Language',
      category: 'number',
      signs: groups.number,
    });
  }

  if (groups.letter) {
    lessons.push({
      id: 'letters',
      title: 'ASL Alphabet',
      emoji: '🔤',
      description: 'Fingerspelling letters — the building blocks of ASL',
      category: 'letter',
      signs: groups.letter,
    });
  }

  if (groups.gesture) {
    lessons.push({
      id: 'gestures',
      title: 'Common Gestures',
      emoji: '🤙',
      description: 'Popular hand gestures used in everyday communication',
      category: 'gesture',
      signs: groups.gesture,
    });
  }

  return lessons;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'var(--success)',
  medium: 'var(--warning)',
  hard: 'var(--danger)',
};

export default function LearnPage({ onBack, onPractice }: LearnPageProps) {
  const lessons = useMemo(() => buildLessons(), []);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [expandedSign, setExpandedSign] = useState<string | null>(null);
  const [completedSigns, setCompletedSigns] = useState<Set<string>>(new Set());

  const currentLesson = useMemo(
    () => lessons.find((l) => l.id === activeLesson) || null,
    [lessons, activeLesson],
  );

  const totalSigns = SIGN_CATALOG.length;
  const progress = Math.round((completedSigns.size / totalSigns) * 100);

  const toggleCompleted = (signName: string) => {
    setCompletedSigns((prev) => {
      const next = new Set(prev);
      if (next.has(signName)) {
        next.delete(signName);
      } else {
        next.add(signName);
      }
      return next;
    });
  };

  return (
    <div className="learn-page">
      {/* Header */}
      <header className="learn-page__header">
        <div className="learn-page__header-left">
          <button className="learn-page__back" onClick={onBack} id="learn-back">
            ← Back
          </button>
          <span className="learn-page__title">📚 Learn Sign Language</span>
        </div>
        <div className="learn-page__header-right">
          <div className="learn-page__progress">
            <div className="learn-page__progress-bar">
              <div
                className="learn-page__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="learn-page__progress-text">
              {completedSigns.size}/{totalSigns} learned
            </span>
          </div>
          <button
            className="btn btn--primary"
            onClick={onPractice}
            id="go-practice"
            style={{ padding: '0.5rem 1.25rem', fontSize: 'var(--font-size-sm)' }}
          >
            🎯 Practice Now
          </button>
        </div>
      </header>

      <div className="learn-page__content">
        {!activeLesson ? (
          /* ---- Lesson Grid ---- */
          <div className="learn-page__lessons">
            <div className="learn-page__intro">
              <h2>Welcome to ASL Learning</h2>
              <p>
                Choose a lesson below to start learning American Sign Language.
                Each lesson contains visual guides with step-by-step instructions.
                Mark signs as learned to track your progress.
              </p>
            </div>

            <div className="lesson-grid">
              {lessons.map((lesson) => {
                const completed = lesson.signs.filter((s) =>
                  completedSigns.has(s.name),
                ).length;
                const lessonProgress = Math.round(
                  (completed / lesson.signs.length) * 100,
                );

                return (
                  <button
                    key={lesson.id}
                    className="lesson-card glass-card"
                    onClick={() => setActiveLesson(lesson.id)}
                  >
                    <div className="lesson-card__emoji">{lesson.emoji}</div>
                    <h3 className="lesson-card__title">{lesson.title}</h3>
                    <p className="lesson-card__desc">{lesson.description}</p>
                    <div className="lesson-card__footer">
                      <span className="lesson-card__count">
                        {lesson.signs.length} signs
                      </span>
                      <div className="lesson-card__progress">
                        <div className="lesson-card__progress-bar">
                          <div
                            className="lesson-card__progress-fill"
                            style={{ width: `${lessonProgress}%` }}
                          />
                        </div>
                        <span className="lesson-card__progress-text">
                          {completed}/{lesson.signs.length}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ---- Lesson Detail View ---- */
          <div className="lesson-detail">
            <div className="lesson-detail__header">
              <button
                className="lesson-detail__back"
                onClick={() => {
                  setActiveLesson(null);
                  setExpandedSign(null);
                }}
              >
                ← All Lessons
              </button>
              <h2 className="lesson-detail__title">
                {currentLesson?.emoji} {currentLesson?.title}
              </h2>
              <p className="lesson-detail__desc">{currentLesson?.description}</p>
            </div>

            <div className="lesson-detail__signs">
              {currentLesson?.signs.map((sign, index) => {
                const isExpanded = expandedSign === sign.name;
                const isCompleted = completedSigns.has(sign.name);

                return (
                  <div
                    key={sign.name}
                    className={`learn-card ${isExpanded ? 'learn-card--expanded' : ''} ${isCompleted ? 'learn-card--completed' : ''}`}
                  >
                    <div
                      className="learn-card__header"
                      onClick={() =>
                        setExpandedSign(isExpanded ? null : sign.name)
                      }
                    >
                      <div className="learn-card__number">{index + 1}</div>
                      <div className="learn-card__emoji">{sign.emoji}</div>
                      <div className="learn-card__info">
                        <div className="learn-card__name">{sign.name}</div>
                        <div className="learn-card__desc">{sign.description}</div>
                      </div>
                      <div className="learn-card__right">
                        <span
                          className="learn-card__difficulty"
                          style={{ color: DIFFICULTY_COLORS[sign.difficulty] }}
                        >
                          {sign.difficulty}
                        </span>
                        <span className="learn-card__chevron">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="learn-card__body">
                        {/* Instructions */}
                        <div className="learn-card__section">
                          <h4 className="learn-card__section-title">
                            🖐️ How to Sign
                          </h4>
                          <div className="learn-card__steps">
                            {sign.instructions.map((step, i) => (
                              <div key={i} className="learn-card__step">
                                <span className="learn-card__step-num">
                                  {i + 1}
                                </span>
                                <span className="learn-card__step-text">
                                  {step}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Finger Pattern */}
                        <div className="learn-card__section">
                          <h4 className="learn-card__section-title">
                            ✋ Finger Pattern
                          </h4>
                          <div className="learn-card__pattern">
                            {sign.fingerPattern}
                          </div>
                        </div>

                        {/* Key Coordinates Info */}
                        <div className="learn-card__section">
                          <h4 className="learn-card__section-title">
                            📐 Recognition Details
                          </h4>
                          <div className="learn-card__coords-info">
                            <div className="learn-card__coord-item">
                              <span className="learn-card__coord-label">
                                Category
                              </span>
                              <span className="learn-card__coord-value">
                                {sign.category}
                              </span>
                            </div>
                            <div className="learn-card__coord-item">
                              <span className="learn-card__coord-label">
                                Difficulty
                              </span>
                              <span
                                className="learn-card__coord-value"
                                style={{
                                  color: DIFFICULTY_COLORS[sign.difficulty],
                                }}
                              >
                                {sign.difficulty.charAt(0).toUpperCase() +
                                  sign.difficulty.slice(1)}
                              </span>
                            </div>
                            <div className="learn-card__coord-item">
                              <span className="learn-card__coord-label">
                                Detection
                              </span>
                              <span className="learn-card__coord-value">
                                Static pose
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mark as learned */}
                        <button
                          className={`learn-card__complete-btn ${isCompleted ? 'learn-card__complete-btn--done' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompleted(sign.name);
                          }}
                        >
                          {isCompleted ? '✅ Learned!' : '☐ Mark as Learned'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
