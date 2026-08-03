import React, { useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from '../pages/Dashboard';
import Session from '../pages/Session';
import History from '../pages/History';
import AICoach from '../pages/AICoach';
import Progress from '../pages/Progress';
import StreakFlame from '../components/StreakFlame';
import AmbientSound from '../components/AmbientSound';
import AuroraBackground from '../components/AuroraBackground';
import useGamification from '../hooks/useGamification';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'session', label: '🧠 Session' },
  { id: 'history', label: '📋 History' },
  { id: 'ai-coach', label: '🤖 AI Coach' },
  { id: 'progress', label: '🏆 Progress' },
];

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

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
      <AuroraBackground />

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
          <span className="logo-icon float-anim">🧬</span>
          <h1>Cognitive Study Coach</h1>
        </div>

        <nav className="nav-tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                className={`nav-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="nav-tab-pill"
                    transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                  />
                )}
                <span className="nav-tab-label">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="app-header-right">
          <AmbientSound compact />
          {stats && (
            <>
              <StreakFlame streak={stats.current_streak || 0} size={36} />
              <div className="xp-bar-header">
                <span className="level-badge">Lv {stats.level}</span>
                <div className="xp-bar-track">
                  <motion.div
                    className="xp-bar-fill"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="shortcut-hint-bar">
        <span><span className="kbd">Space</span> Session</span>
        <span><span className="kbd">Esc</span> Cancel</span>
        <span><span className="kbd">1</span>–<span className="kbd">5</span> Switch tabs</span>
      </div>
    </div>
  );
}