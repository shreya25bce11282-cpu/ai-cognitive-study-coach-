import React, { useEffect, useState } from 'react';

export default function AIInsightCard({ text, loading = false, enabled = true, disabledMessage }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplayed('');
      return;
    }
    setDisplayed('');
    let i = 0;
    const speed = Math.max(4, Math.floor(600 / Math.max(text.length, 1)));
    const interval = setInterval(() => {
      i += Math.max(1, Math.floor(text.length / 120));
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text]);

  if (!enabled) {
    return (
      <div className="ai-insight-card">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          🤖 {disabledMessage || 'AI Coach is disabled. Add a GEMINI_API_KEY to your .env to enable it.'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ai-insight-card">
        <span className="typing-dots">
          <span /><span /><span />
        </span>
      </div>
    );
  }

  return (
    <div className="ai-insight-card fade-in">
      <p style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{displayed}</p>
    </div>
  );
}