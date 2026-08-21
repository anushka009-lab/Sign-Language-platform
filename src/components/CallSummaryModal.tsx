/**
 * CallSummaryModal.tsx — Post-Call Automated Summary & Transcript Dashboard Component
 * 
 * Prompt 5 Specifications:
 * - Header Card with call metadata: participants, duration ("34 mins"), date, room ID.
 * - Action Row: "Download PDF Summary" & "Share Recording".
 * - Main Two-Column Layout:
 *   - Left Column: AI-generated bulleted executive summary + interactive "Action Items" checklist.
 *   - Right Column: Interactive, searchable chronological transcript with distinct speaker tags 
 *     ("Signer (AI Voice)" vs "Hearing Participant") and timestamp markers for every dialogue turn.
 */

import React, { useState } from 'react';

export interface CallMessage {
  id: string;
  sender: string;
  type: 'sign' | 'speech' | 'text';
  text: string;
  timestamp: string;
}

export interface ActionItem {
  id: string;
  label: string;
  completed: boolean;
}

interface CallSummaryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  messages?: CallMessage[];
  roomToken?: string;
  durationSeconds?: number;
  isStandaloneDashboard?: boolean;
}

export const DEFAULT_MESSAGES: CallMessage[] = [
  {
    id: 'msg-1',
    sender: 'Signer (AI Voice: Alex)',
    type: 'sign',
    text: 'Hello everyone! Welcome to our SignBridge project review call.',
    timestamp: '00:02',
  },
  {
    id: 'msg-2',
    sender: 'Hearing Participant (Sarah)',
    type: 'speech',
    text: 'Hi Alex! Excited to review the new gesture recognition performance metrics today.',
    timestamp: '00:14',
  },
  {
    id: 'msg-3',
    sender: 'Signer (AI Voice: Alex)',
    type: 'sign',
    text: 'I am demonstrating the real-time sign language translation pipeline with 98% confidence.',
    timestamp: '01:05',
  },
  {
    id: 'msg-4',
    sender: 'Hearing Participant (Sarah)',
    type: 'speech',
    text: 'That is incredible! The synthetic voice output is completely clear and perfectly synced.',
    timestamp: '01:42',
  },
  {
    id: 'msg-5',
    sender: 'Signer (AI Voice: Alex)',
    type: 'sign',
    text: 'We also added pre-call hardware calibration and customizable TTS voice profiles.',
    timestamp: '02:30',
  },
  {
    id: 'msg-6',
    sender: 'Hearing Participant (Sarah)',
    type: 'speech',
    text: 'Great work! Let us finalize the Q3 deployment timeline and share this recording with stakeholders.',
    timestamp: '03:15',
  },
];

export const CallSummaryModal: React.FC<CallSummaryModalProps> = ({
  isOpen = true,
  onClose,
  messages = DEFAULT_MESSAGES,
  roomToken = 'sb-call-892',
  durationSeconds = 2040, // 34 mins
  isStandaloneDashboard = false,
}) => {
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState<'all' | 'signer' | 'hearing'>('all');
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // Interactive Action Items Checklist state
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { id: 'act-1', label: 'Review sign language gesture transcript exports', completed: true },
    { id: 'act-2', label: 'Finalize AI voice profile preset selection for team calls', completed: false },
    { id: 'act-3', label: 'Share post-call PDF summary with project stakeholders', completed: false },
    { id: 'act-4', label: 'Confirm follow-up video call schedule for next Tuesday', completed: true },
  ]);

  if (!isOpen && !isStandaloneDashboard) return null;

  // Format Duration
  const formattedDuration = durationSeconds >= 60
    ? `${Math.floor(durationSeconds / 60)} mins`
    : `${durationSeconds}s`;

  // Toggle Action Item Checkbox
  const toggleActionItem = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = actionItems.filter((a) => a.completed).length;

  // Download PDF Summary Handler
  const handleDownloadPDF = () => {
    let pdfText = `====================================================\n`;
    pdfText += `       SIGNBRIDGE POST-CALL EXECUTIVE SUMMARY       \n`;
    pdfText += `====================================================\n\n`;
    pdfText += `Date: August 21, 2026\n`;
    pdfText += `Room Code: ${roomToken}\n`;
    pdfText += `Duration: ${formattedDuration}\n`;
    pdfText += `Participants: Signer (AI Voice: Alex), Hearing Participant (Sarah)\n\n`;
    pdfText += `----------------------------------------------------\n`;
    pdfText += `EXECUTIVE TAKEAWAYS:\n`;
    pdfText += `----------------------------------------------------\n`;
    pdfText += `• Real-time ASL sign translation completed with 98% confidence.\n`;
    pdfText += `• Pre-call hardware calibration verified camera & background noise.\n`;
    pdfText += `• Stakeholders approved technical roadmap & Q3 deployment timeline.\n\n`;
    pdfText += `----------------------------------------------------\n`;
    pdfText += `ACTION ITEMS (${completedCount}/${actionItems.length} Completed):\n`;
    pdfText += `----------------------------------------------------\n`;
    actionItems.forEach((item) => {
      pdfText += `[${item.completed ? 'X' : ' '}] ${item.label}\n`;
    });
    pdfText += `\n----------------------------------------------------\n`;
    pdfText += `FULL CHRONOLOGICAL TRANSCRIPT:\n`;
    pdfText += `----------------------------------------------------\n`;
    messages.forEach((m) => {
      pdfText += `[${m.timestamp}] ${m.sender}: ${m.text}\n`;
    });

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(pdfText);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SignBridge_Summary_${roomToken}.pdf.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setToastFeedback('📄 PDF Summary downloaded successfully!');
    setTimeout(() => setToastFeedback(null), 3000);
  };

  // Share Recording Link Handler
  const handleShareRecording = () => {
    const shareUrl = `https://signbridge.app/recording/${roomToken}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
    setToastFeedback('🔗 Recording link copied to clipboard!');
    setTimeout(() => setToastFeedback(null), 3000);
  };

  // Filter messages by search and speaker
  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sender.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (speakerFilter === 'signer') {
      return matchesSearch && (m.type === 'sign' || m.sender.toLowerCase().includes('signer'));
    }
    if (speakerFilter === 'hearing') {
      return matchesSearch && (m.type === 'speech' || m.sender.toLowerCase().includes('hearing'));
    }
    return matchesSearch;
  });

  return (
    <div
      className="summary-dashboard"
      role="region"
      aria-label="Post-Call Analytics & Summary Dashboard"
      style={
        isStandaloneDashboard
          ? undefined
          : {
              position: 'fixed',
              inset: 0,
              zIndex: 1100,
              backgroundColor: '#0a0e1a',
              overflowY: 'auto',
            }
      }
    >
      {/* Toast Banner */}
      {toastFeedback && (
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
          {toastFeedback}
        </div>
      )}

      {/* ---- Top Header Card ---- */}
      <header className="summary-dashboard__header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span>📊</span> Post-Call Automated Summary & Analytics
              </h1>
              <span style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#818cf8', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                Meeting Completed
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              AI-generated key takeaways, interactive action items, and searchable dialogue transcript.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              borderRadius: '0.6rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Close Dashboard
          </button>
        </div>

        {/* Metadata Grid & Action Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
          {/* Metadata */}
          <div className="summary-meta-grid">
            <div className="summary-meta-item">
              <span>👥</span>
              <span><strong>Participants:</strong> Signer (Alex) & Hearing (Sarah)</span>
            </div>

            <div className="summary-meta-item">
              <span>⏱️</span>
              <span><strong>Duration:</strong> <span style={{ color: '#38bdf8', fontWeight: 700 }}>{formattedDuration}</span></span>
            </div>

            <div className="summary-meta-item">
              <span>📅</span>
              <span><strong>Date:</strong> August 21, 2026</span>
            </div>

            <div className="summary-meta-item">
              <span>🔑</span>
              <span><strong>Room ID:</strong> <code style={{ color: '#a5b4fc' }}>{roomToken}</code></span>
            </div>
          </div>

          {/* Action Row: "Download PDF Summary" & "Share Recording" */}
          <div className="summary-action-row">
            <button className="btn-download-pdf" onClick={handleDownloadPDF} id="btn-download-pdf">
              <span>📄</span>
              <span>Download PDF Summary</span>
            </button>

            <button className="btn-share-recording" onClick={handleShareRecording} id="btn-share-recording">
              <span>🔗</span>
              <span>Share Recording</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---- Main Two-Column Layout ---- */}
      <div className="summary-main-columns">
        {/* ---- LEFT COLUMN: Executive Summary & Action Items ---- */}
        <div className="summary-column">
          {/* AI-Generated Bulleted Executive Summary */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚡</span> AI-Generated Executive Summary
            </h2>

            <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '1rem', padding: '1.25rem' }}>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#cbd5e1', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', lineHeight: 1.5 }}>
                <li>
                  <strong>Real-Time Translation:</strong> Signer (Alex AI Voice) communicated key project roadmap items via SignBridge gesture recognition with <span style={{ color: '#34d399', fontWeight: 700 }}>98% average accuracy</span>.
                </li>
                <li>
                  <strong>Technical Consensus:</strong> Hearing participant (Sarah) confirmed roadmap milestones, latency targets, and synthetic TTS voice output clarity.
                </li>
                <li>
                  <strong>Calibration & Hardware:</strong> Pre-call hardware diagnostics verified optimal lighting contrast, 30 FPS video feed, and low background acoustic noise.
                </li>
                <li>
                  <strong>Privacy & Compliance:</strong> Video stream maintained end-to-end TLS 1.3 encryption with zero persistent frame storage.
                </li>
              </ul>
            </div>
          </div>

          {/* Interactive "Action Items" Checklist */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>✅</span> Interactive Action Items Checklist
              </h2>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                {completedCount} of {actionItems.length} Completed
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className={`action-item-row ${item.completed ? 'completed' : ''}`}
                  onClick={() => toggleActionItem(item.id)}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleActionItem(item.id)}
                    style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer', marginTop: '2px' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: item.completed ? '#94a3b8' : '#f8fafc', fontWeight: 500, flex: 1 }}>
                    {item.label}
                  </span>
                  {item.completed && <span style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 700 }}>✓ Done</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---- RIGHT COLUMN: Searchable Chronological Transcript ---- */}
        <div className="summary-column">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💬</span> Searchable Chronological Transcript
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {filteredMessages.length} dialogue turns
            </span>
          </div>

          {/* Search Bar & Speaker Filter Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search transcript by keyword (e.g. 'roadmap', 'voice', 'hello')..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.75rem',
                backgroundColor: 'rgba(7, 10, 19, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '0.825rem',
                outline: 'none',
              }}
            />

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => setSpeakerFilter('all')}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: '9999px',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  background: speakerFilter === 'all' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                All Speakers ({messages.length})
              </button>

              <button
                onClick={() => setSpeakerFilter('signer')}
                className="speaker-tag speaker-tag--signer"
                style={{ cursor: 'pointer', opacity: speakerFilter === 'signer' ? 1 : 0.65 }}
              >
                🤟 Signer (AI Voice)
              </button>

              <button
                onClick={() => setSpeakerFilter('hearing')}
                className="speaker-tag speaker-tag--hearing"
                style={{ cursor: 'pointer', opacity: speakerFilter === 'hearing' ? 1 : 0.65 }}
              >
                🎙️ Hearing Participant
              </button>
            </div>
          </div>

          {/* Dialogue Turns List with Timestamp Markers & Distinct Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, overflowY: 'auto' }}>
            {filteredMessages.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                No transcript dialogue turns match your search.
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSigner = msg.type === 'sign' || msg.sender.toLowerCase().includes('signer');
                return (
                  <div
                    key={msg.id}
                    style={{
                      background: isSigner ? 'rgba(99, 102, 241, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                      border: `1px solid ${isSigner ? 'rgba(99, 102, 241, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                      borderRadius: '0.875rem',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Distinct Speaker Tags: "Signer (AI Voice)" vs "Hearing Participant" */}
                      <span className={`speaker-tag ${isSigner ? 'speaker-tag--signer' : 'speaker-tag--hearing'}`}>
                        <span>{isSigner ? '🤟' : '🎙️'}</span>
                        <span>{isSigner ? 'Signer (AI Voice)' : 'Hearing Participant'}</span>
                      </span>

                      {/* Timestamp Marker */}
                      <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>
                        ⏱️ [{msg.timestamp}]
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#f8fafc', lineHeight: 1.45 }}>
                      {msg.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
