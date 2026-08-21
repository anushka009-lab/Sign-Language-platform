import { useState } from 'react';
import LandingPage from './components/LandingPage';
import CallRoom from './components/CallRoom';
import LearnPage from './components/LearnPage';
import PracticePage from './components/PracticePage';
import GestureStudio from './components/GestureStudio';
import { GestureCalibration } from './components/GestureCalibration';
import { CallSummaryModal } from './components/CallSummaryModal';
import { UserDashboard } from './components/UserDashboard';
import { PipWidget } from './components/PipWidget';

export type UserMode = 'deaf' | 'hearing';

export type AppView = 'landing' | 'dashboard' | 'calibration' | 'call' | 'learn' | 'practice' | 'studio' | 'summary';

export interface CallConfig {
  roomId: string;
  userName: string;
  userMode: UserMode;
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [callConfig, setCallConfig] = useState<CallConfig | null>(null);
  const [showPipWidget, setShowPipWidget] = useState(false);

  // Transition from landing -> calibration screen before joining meeting
  const handleStartCalibration = (config: CallConfig) => {
    setCallConfig(config);
    setCurrentView('calibration');
  };

  const handleConfirmJoinCall = () => {
    setCurrentView('call');
  };

  const handleLeaveCall = () => {
    setCallConfig(null);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
  };

  return (
    <>
      <div className="app-bg" aria-hidden="true" />
      {currentView === 'dashboard' ? (
        <UserDashboard
          onStartCall={handleStartCalibration}
          onNavigate={handleNavigate}
        />
      ) : currentView === 'calibration' && callConfig ? (
        <GestureCalibration
          config={callConfig}
          onJoinMeeting={handleConfirmJoinCall}
          onBack={() => setCurrentView('dashboard')}
        />
      ) : currentView === 'call' && callConfig ? (
        <CallRoom config={callConfig} onLeave={handleLeaveCall} />
      ) : currentView === 'learn' ? (
        <LearnPage onBack={() => handleNavigate('dashboard')} onPractice={() => handleNavigate('practice')} />
      ) : currentView === 'practice' ? (
        <PracticePage onBack={() => handleNavigate('dashboard')} onLearn={() => handleNavigate('learn')} />
      ) : currentView === 'studio' ? (
        <GestureStudio onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />
      ) : currentView === 'summary' ? (
        <CallSummaryModal
          isOpen={true}
          isStandaloneDashboard={true}
          onClose={() => handleNavigate('dashboard')}
          roomToken={callConfig?.roomId || 'sb-call-892'}
        />
      ) : (
        <LandingPage onJoin={handleStartCalibration} onNavigate={handleNavigate} />
      )}

      {/* Global Toggle Button for Floating Picture-in-Picture (PiP) Overlay Widget */}
      <button
        onClick={() => setShowPipWidget((prev) => !prev)}
        id="btn-toggle-pip-widget"
        title="Toggle Floating Picture-in-Picture (PiP) Translation Overlay"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '1.5rem',
          zIndex: 9998,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          color: '#38bdf8',
          borderRadius: '9999px',
          padding: '0.55rem 1.1rem',
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          backdropFilter: 'blur(10px)',
        }}
      >
        <span>🖼️</span>
        <span>{showPipWidget ? 'Hide PiP Overlay' : 'Floating PiP Overlay'}</span>
      </button>

      {/* Floating Picture-in-Picture Translation Overlay Widget */}
      <PipWidget
        isOpen={showPipWidget}
        onClose={() => setShowPipWidget(false)}
        onExpandFullscreen={() => {
          if (!callConfig) {
            setCallConfig({ roomId: 'sb-pip-room', userName: 'Alex Morgan', userMode: 'deaf' });
          }
          setCurrentView('call');
        }}
      />
    </>
  );
}
