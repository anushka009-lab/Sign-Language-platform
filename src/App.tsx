import { useState } from 'react';
import LandingPage from './components/LandingPage';
import CallRoom from './components/CallRoom';
import LearnPage from './components/LearnPage';
import PracticePage from './components/PracticePage';
import GestureStudio from './components/GestureStudio';

export type UserMode = 'deaf' | 'hearing';

export type AppView = 'landing' | 'call' | 'learn' | 'practice' | 'studio';

export interface CallConfig {
  roomId: string;
  userName: string;
  userMode: UserMode;
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [callConfig, setCallConfig] = useState<CallConfig | null>(null);

  const handleJoinCall = (config: CallConfig) => {
    setCallConfig(config);
    setCurrentView('call');
  };

  const handleLeaveCall = () => {
    setCallConfig(null);
    setCurrentView('landing');
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
  };

  return (
    <>
      <div className="app-bg" aria-hidden="true" />
      {currentView === 'call' && callConfig ? (
        <CallRoom config={callConfig} onLeave={handleLeaveCall} />
      ) : currentView === 'learn' ? (
        <LearnPage onBack={() => handleNavigate('landing')} onPractice={() => handleNavigate('practice')} />
      ) : currentView === 'practice' ? (
        <PracticePage onBack={() => handleNavigate('landing')} onLearn={() => handleNavigate('learn')} />
      ) : currentView === 'studio' ? (
        <GestureStudio onBack={() => handleNavigate('landing')} onNavigate={handleNavigate} />
      ) : (
        <LandingPage onJoin={handleJoinCall} onNavigate={handleNavigate} />
      )}
    </>
  );
}
