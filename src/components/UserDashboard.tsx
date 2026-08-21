/**
 * UserDashboard.tsx — User Dashboard & Meeting History Hub
 * 
 * Prompt 7 Implementation:
 * - Left vertical navbar (Home, Meetings, Voice Settings, Custom Vocab, Analytics).
 * - Hero Cards: "Start Instant Bridge Call" (gradient CTA) & "Join with Meeting Code" (input field).
 * - Recent Meetings Data Table (Date, Participants, Mode, Duration, Quick Actions: "View AI Summary", "Download Transcript").
 * - Right Sidebar Weekly Statistics (Total Signs Translated: 1,420, Average Latency: 24ms, Accuracy: 98.4%).
 */

import React, { useState } from 'react';
import type { CallConfig, AppView } from '../App';

interface MeetingRecord {
  id: string;
  date: string;
  participants: string;
  mode: 'ASL → Voice' | 'Voice → Subtitles';
  duration: string;
  roomToken: string;
}

interface UserDashboardProps {
  onStartCall: (config: CallConfig) => void;
  onNavigate: (view: AppView) => void;
}

export const RECENT_MEETINGS_DATA: MeetingRecord[] = [
  {
    id: 'm-1',
    date: 'Aug 21, 2026',
    participants: 'Alex (Signer) & Sarah (Hearing)',
    mode: 'ASL → Voice',
    duration: '34 mins',
    roomToken: 'sb-call-892',
  },
  {
    id: 'm-2',
    date: 'Aug 19, 2026',
    participants: 'Michael & Engineering Team',
    mode: 'Voice → Subtitles',
    duration: '18 mins',
    roomToken: 'tech-review-402',
  },
  {
    id: 'm-3',
    date: 'Aug 15, 2026',
    participants: 'Elena & Dr. Vance (Medical)',
    mode: 'ASL → Voice',
    duration: '45 mins',
    roomToken: 'med-consult-110',
  },
  {
    id: 'm-4',
    date: 'Aug 12, 2026',
    participants: 'SignBridge Demo Session',
    mode: 'ASL → Voice',
    duration: '22 mins',
    roomToken: 'demo-room-777',
  },
];

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onStartCall,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'meetings' | 'voice' | 'vocab' | 'analytics'>('home');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [userNameInput, setUserNameInput] = useState('Alex Morgan');
  const [selectedUserMode, setSelectedUserMode] = useState<'deaf' | 'hearing'>('deaf');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generate random 6-char room code
  const handleStartInstantCall = () => {
    const randomRoom = `room-${Math.random().toString(36).substring(2, 8)}`;
    onStartCall({
      roomId: randomRoom,
      userName: userNameInput,
      userMode: selectedUserMode,
    });
  };

  // Join meeting with code
  const handleJoinWithCode = () => {
    if (!joinCodeInput.trim()) {
      setToastMessage('⚠️ Please enter a valid meeting code!');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    onStartCall({
      roomId: joinCodeInput.trim(),
      userName: userNameInput,
      userMode: selectedUserMode,
    });
  };

  // Download Transcript Handler
  const handleDownloadTranscript = (meeting: MeetingRecord) => {
    let transcriptText = `====================================================\n`;
    transcriptText += `   SIGNBRIDGE SESSION TRANSCRIPT: ${meeting.roomToken}\n`;
    transcriptText += `====================================================\n\n`;
    transcriptText += `Date: ${meeting.date}\n`;
    transcriptText += `Participants: ${meeting.participants}\n`;
    transcriptText += `Mode: ${meeting.mode}\n`;
    transcriptText += `Duration: ${meeting.duration}\n\n`;
    transcriptText += `[00:02] Signer (AI Voice): Hello! Welcome to our ${meeting.participants} session.\n`;
    transcriptText += `[00:14] Hearing Participant: Glad to meet you. Testing low-latency translation.\n`;
    transcriptText += `[01:05] Signer (AI Voice): All 21-landmark hand gestures are translating with 98% accuracy.\n`;

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(transcriptText);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Transcript_${meeting.roomToken}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setToastMessage(`📥 Transcript downloaded for ${meeting.roomToken}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="user-dashboard" role="region" aria-label="SignBridge User Dashboard">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
            zIndex: 1200,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ---- 1. Left Vertical Navigation Bar ---- */}
      <aside className="user-dashboard__sidebar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #38bdf8)', width: '36px', height: '36px', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#fff' }}>
              🤟
            </div>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                SignBridge
              </h1>
              <span style={{ fontSize: '0.675rem', color: '#34d399', fontWeight: 700 }}>AI Accessibility Hub</span>
            </div>
          </div>

          <nav className="dashboard-nav-menu">
            <button
              className={`dashboard-nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
              id="nav-tab-home"
            >
              <span>🏠</span> Home
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
              onClick={() => setActiveTab('meetings')}
              id="nav-tab-meetings"
            >
              <span>📅</span> Meetings
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === 'voice' ? 'active' : ''}`}
              onClick={() => onNavigate('landing')}
              id="nav-tab-voice"
            >
              <span>🎙️</span> Voice Settings
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === 'vocab' ? 'active' : ''}`}
              onClick={() => onNavigate('studio')}
              id="nav-tab-vocab"
            >
              <span>📚</span> Custom Vocab
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => onNavigate('summary')}
              id="nav-tab-analytics"
            >
              <span>📊</span> Analytics
            </button>
          </nav>
        </div>

        {/* User Profile Card at Bottom of Sidebar */}
        <div style={{ marginTop: 'auto', background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.875rem', padding: '0.75rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
            {userNameInput.charAt(0)}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userNameInput}
            </div>
            <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>
              {selectedUserMode === 'deaf' ? '🤟 Deaf / DHH Mode' : '🔊 Hearing Mode'}
            </div>
          </div>
        </div>
      </aside>

      {/* ---- 2. Main Hero Section & 3. Recent Meetings Data Table ---- */}
      <main className="user-dashboard__main">
        <div>
          {/* Dashboard Header */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                Welcome back, {userNameInput} 👋
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                Real-time sign language translation, pre-call calibration, and post-call analytics.
              </p>
            </div>

            {/* Quick Mode Toggle */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '9999px', padding: '0.25rem', display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => setSelectedUserMode('deaf')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  background: selectedUserMode === 'deaf' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                  color: selectedUserMode === 'deaf' ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                🤟 Deaf / DHH
              </button>
              <button
                onClick={() => setSelectedUserMode('hearing')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  background: selectedUserMode === 'hearing' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  color: selectedUserMode === 'hearing' ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                🔊 Hearing
              </button>
            </div>
          </div>

          {/* ---- Hero Cards: Card 1 (Start Instant Call) & Card 2 (Join Code) ---- */}
          <div className="hero-cards-grid">
            {/* Card 1: Start Instant Bridge Call (Gradient Button) */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.15))',
                border: '1.5px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '1.75rem' }}>⚡</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0', color: '#f8fafc' }}>
                  Start Instant Bridge Call
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                  Launch a zero-latency WebRTC video room with MediaPipe sign translation.
                </p>
              </div>

              <button
                onClick={handleStartInstantCall}
                id="btn-start-instant-call"
                style={{
                  width: '100%',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Start Instant Meeting</span>
                <span>→</span>
              </button>
            </div>

            {/* Card 2: Join with Meeting Code (Input Field) */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(14, 165, 233, 0.15))',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '1.75rem' }}>🔑</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0', color: '#f8fafc' }}>
                  Join with Meeting Code
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                  Enter a room code provided by another participant to connect instantly.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="Enter Room Code (e.g. sb-call-892)..."
                  id="input-meeting-code"
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(7, 10, 19, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '0.825rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleJoinWithCode}
                  id="btn-join-meeting-code"
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Join Call
                </button>
              </div>
            </div>
          </div>

          {/* ---- 3. Recent Meetings Data Table ---- */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1.25rem', padding: '1.5rem', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📅</span> Recent Meetings History
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Showing last {RECENT_MEETINGS_DATA.length} sessions
              </span>
            </div>

            <table className="recent-meetings-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Participants</th>
                  <th>Mode</th>
                  <th>Duration</th>
                  <th style={{ textAlign: 'right' }}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_MEETINGS_DATA.map((meeting) => (
                  <tr key={meeting.id}>
                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{meeting.date}</td>
                    <td>{meeting.participants}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          background: meeting.mode.includes('ASL') ? 'rgba(99, 102, 241, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                          color: meeting.mode.includes('ASL') ? '#a5b4fc' : '#34d399',
                          border: `1px solid ${meeting.mode.includes('ASL') ? 'rgba(99, 102, 241, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                        }}
                      >
                        {meeting.mode === 'ASL → Voice' ? '🤟 ASL → Voice' : '🎙️ Voice → Subtitles'}
                      </span>
                    </td>
                    <td style={{ color: '#38bdf8', fontWeight: 600 }}>{meeting.duration}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onNavigate('summary')}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#a5b4fc',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            cursor: 'pointer',
                          }}
                        >
                          View AI Summary
                        </button>
                        <button
                          onClick={() => handleDownloadTranscript(meeting)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#cbd5e1',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            cursor: 'pointer',
                          }}
                        >
                          Download Transcript
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---- 4. Small Right-Hand Sidebar: Weekly Usage Statistics ---- */}
        <aside className="weekly-stats-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📈</span> Weekly Usage Statistics
          </h3>

          {/* Metric 1: Total Signs Translated */}
          <div style={{ background: 'rgba(17, 24, 39, 0.75)', padding: '1rem', borderRadius: '0.875rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 600 }}>Total Signs Translated</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#818cf8' }}>1,420 Signs</span>
              <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>+18% this week</span>
            </div>
          </div>

          {/* Metric 2: Average Latency */}
          <div style={{ background: 'rgba(17, 24, 39, 0.75)', padding: '1rem', borderRadius: '0.875rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 600 }}>Average Recognition Latency</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399' }}>24 ms</span>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>Ultra Low-Latency</span>
            </div>
          </div>

          {/* Metric 3: Weekly Call Minutes */}
          <div style={{ background: 'rgba(17, 24, 39, 0.75)', padding: '1rem', borderRadius: '0.875rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 600 }}>Weekly Call Hours</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f472b6' }}>14.5 Hours</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>12 sessions</span>
            </div>
          </div>

          {/* Metric 4: AI Model Accuracy Score */}
          <div style={{ background: 'rgba(17, 24, 39, 0.75)', padding: '1rem', borderRadius: '0.875rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 600 }}>MediaPipe Accuracy Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8' }}>98.4%</span>
              <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>Verified</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};
