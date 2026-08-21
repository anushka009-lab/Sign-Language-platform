import { useState } from 'react';
import LandingPage from './components/LandingPage';
import CallRoom from './components/CallRoom';
import LearnPage from './components/LearnPage';
import PracticePage from './components/PracticePage';
import GestureStudio from './components/GestureStudio';
import { GestureCalibration } from './components/GestureCalibration';
import { CallSummaryModal } from './components/CallSummaryModal';
import { UserDashboard } from './components/UserDashboard';

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
    </>
  );
}
