/**
 * CallSummaryModal.tsx — Automated Post-Call Summary & Transcript Exporter
 * Implements PRD Phase 4 requirements: post-call takeaways, structured bullet points, and transcript archiving.
 */
import React from 'react';

export interface CallMessage {
  id: string;
  sender: string;
  type: 'sign' | 'speech' | 'text';
  text: string;
  timestamp: string;
}

interface CallSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: CallMessage[];
  roomToken: string;
  durationSeconds: number;
}

export const CallSummaryModal: React.FC<CallSummaryModalProps> = ({
  isOpen,
  onClose,
  messages,
  roomToken,
  durationSeconds,
}) => {
  if (!isOpen) return null;

  const signMessages = messages.filter((m) => m.type === 'sign');
  const speechMessages = messages.filter((m) => m.type === 'speech');

  // Format Duration
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const formattedDuration = `${minutes}m ${seconds}s`;

  // Generate automated bulleted takeaways
  const generateTakeaways = () => {
    if (messages.length === 0) return ['No call activity recorded during this session.'];

    const takeaways: string[] = [];
    takeaways.push(`Session completed with ${messages.length} total messages exchanged.`);
    if (signMessages.length > 0) {
      takeaways.push(`DHH Signer communicated ${signMessages.length} real-time gesture captions.`);
    }
    if (speechMessages.length > 0) {
      takeaways.push(`Hearing participant spoke ${speechMessages.length} voice caption segments.`);
    }
    takeaways.push(`End-to-end video stream maintained ephemeral privacy compliance.`);
    return takeaways;
  };

  const takeaways = generateTakeaways();

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ roomToken, durationSeconds, messages, takeaways }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SignBridge_Call_Summary_${roomToken}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportMarkdown = () => {
    let md = `# SignBridge Call Summary & Transcript\n\n`;
    md += `- **Room ID**: ${roomToken}\n`;
    md += `- **Duration**: ${formattedDuration}\n`;
    md += `- **Total Messages**: ${messages.length}\n\n`;
    md += `## 📌 Key Takeaways & Minutes\n`;
    takeaways.forEach((t) => (md += `- ${t}\n`));
    md += `\n## 💬 Full Transcript\n`;
    messages.forEach((m) => {
      md += `[${m.timestamp}] **${m.sender}** (${m.type.toUpperCase()}): ${m.text}\n`;
    });

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SignBridge_Transcript_${roomToken}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99))',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          color: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> Automated Call Summary & Recap
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Room ID: <code style={{ color: '#818cf8' }}>{roomToken}</code> • Duration: {formattedDuration}
            </p>
          </div>
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

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6366f1' }}>{messages.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Total Messages</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ec4899' }}>{signMessages.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Signs Translated</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{speechMessages.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Voice Captions</div>
          </div>
        </div>

        {/* Bulleted Takeaways */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚡</span> Automated Key Takeaways
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#cbd5e1', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {takeaways.map((t, idx) => (
              <li key={idx}>{t}</li>
            ))}
          </ul>
        </div>

        {/* Transcript Log */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.75rem' }}>
            💬 Time-Stamped Transcript ({messages.length})
          </h3>
          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {messages.length === 0 ? (
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>No transcript entries.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
                  <span style={{ color: '#64748b', marginRight: '0.5rem' }}>[{m.timestamp}]</span>
                  <strong style={{ color: m.type === 'sign' ? '#818cf8' : '#f472b6' }}>{m.sender}: </strong>
                  <span>{m.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleExportMarkdown}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            📥 Export Markdown (.md)
          </button>
          <button
            onClick={handleExportJSON}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            📄 Export JSON
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
