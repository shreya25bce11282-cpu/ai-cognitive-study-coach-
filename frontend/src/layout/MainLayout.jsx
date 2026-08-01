import React, { useState } from 'react';
import Dashboard from '../pages/Dashboard';
import Session from '../pages/Session';
import History from '../pages/History';

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
  { id: 'session',   label: '🧠 Session',   icon: '🧠' },
  { id: 'history',   label: '📋 History',   icon: '📋' },
];

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderPage = () => {
    switch (activeTab) {
      case 'session': return <Session />;
      case 'history': return <History />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
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
      </header>
      <main className="app-main" key={activeTab}>
        {renderPage()}
      </main>
    </div>
  );
}
