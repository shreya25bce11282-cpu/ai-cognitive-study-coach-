import React from 'react';

const FEATURES = [
  { icon: '🤖', title: 'AI Study Coach', desc: 'Get personalized insights from your real session data.' },
  { icon: '🍅', title: 'Pomodoro Timer', desc: 'Configurable focus/break cycles with auto-transitions.' },
  { icon: '🔥', title: 'Streaks & XP', desc: 'Build daily habits with levels and achievements.' },
  { icon: '📈', title: 'Deep Analytics', desc: 'Focus trends, burnout risk, and heatmaps.' },
];

export default function Landing({ onStart }) {
  return (
    <div className="fade-in" style={{ maxWidth: '780px', margin: '40px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🧬</div>
      <h1 className="page-title" style={{ fontSize: '2.6rem', marginBottom: '12px' }}>
        Study Smarter, Not Harder
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '40px', lineHeight: 1.6 }}>
        Track your focus, beat burnout, and let AI turn your study data into a plan that actually works.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        {FEATURES.map((f) => (
          <div key={f.title} className="glass-card" style={{ padding: '20px', textAlign: 'left' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{f.icon}</div>
            <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>{f.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <button className="btn-primary" style={{ fontSize: '1.15rem', padding: '18px 48px' }} onClick={onStart}>
        🚀 Get Started
      </button>
    </div>
  );
}