import React, { useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from '../pages/Dashboard';
import Session from '../pages/Session';
import History from '../pages/History';
import AICoach from '../pages/AICoach';
import Progress from '../pages/Progress';
import StreakFlame from '../components/StreakFlame';
import AmbientSound from '../components/AmbientSound';
import useGamification from '../hooks/useGamification';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'session', label: '🧠 Session' },
  { id: 'history', label: '📋 History' },
  { id: 'ai-coach', label: '🤖 AI Coach' },
  { id: 'progress', label: '🏆 Progress' },
];

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { stats, refresh: refreshGamification } = useGamification();

  const handleTab = useCallback((idx) => {
    const tab = TABS[idx - 1];
    if (tab) setActiveTab(tab.id);
  }, []);

  useKeyboardShortcuts({
    onTab: handleTab,
    onToggleSession: () => setActiveTab('session'),
  });

  const renderPage = () => {
    switch (activeTab) {
      case 'session':
        return <Session onSessionSaved={refreshGamification} />;
      case 'history':
        return <History />;
      case 'ai-coach':
        return <AICoach />;
      case 'progress':
        return <Progress stats={stats} />;
      default:
        return <Dashboard />;
    }
  };

  const progress = stats
    ? Math.round((stats.progress || 0) * 100)
    : 0;

  return (
    <div className="app-layout">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-glass)',
          },
        }}
      />
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon">🧬</span>
          <h1>Cognitive Study Coach</h1>
        </div>

        <nav className="nav-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="app-header-right">
          <AmbientSound compact />
          {stats && (
            <>
              <StreakFlame streak={stats.current_streak || 0} size={36} />
              <div className="xp-bar-header">
                <span className="level-badge">Lv {stats.level}</span>
                <div className="xp-bar-track">
                  <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="app-main" key={activeTab}>
        {renderPage()}
      </main>

      <div className="shortcut-hint-bar">
        <span><span className="kbd">Space</span> Session</span>
        <span><span className="kbd">Esc</span> Cancel</span>
        <span><span className="kbd">1</span>–<span className="kbd">5</span> Switch tabs</span>
      </div>
    </div>
  );
}