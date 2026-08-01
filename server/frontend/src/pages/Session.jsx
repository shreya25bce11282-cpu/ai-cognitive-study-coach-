import React, { useState } from 'react';
import useActiveSession from '../hooks/useActiveSession';
import useSessions from '../hooks/useSessions';
import GlassCard from '../components/GlassCard';
import RatingSlider from '../components/RatingSlider';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function Session() {
  const { phase, session, elapsed, result, error, start, stop, submitRating, reset } = useActiveSession();
  const { sessions } = useSessions();
  const [subjectText, setSubjectText] = useState('');
  const [focusRating, setFocusRating] = useState(5);
  const [fatigueRating, setFatigueRating] = useState(5);

  const recentSubjects = [...new Set(sessions.map(s => s.subject))].slice(0, 5);

  if (phase === 'idle') {
    return (
      <div className=\"fade-in\" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>
        <h1 className=\"page-title\" style={{ textAlign: 'center' }}>Ready to Study?</h1>
        <GlassCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                Subject / Topic
              </label>
              <input type=\"text\" placeholder=\"What are you studying?\" value={subjectText} onChange={(e) => setSubjectText(e.target.value)} />
            </div>
            {recentSubjects.length > 0 && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Recent subjects:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {recentSubjects.map(sub => (
                    <span key={sub} className=\"badge badge-medium\" style={{ cursor: 'pointer' }} onClick={() => setSubjectText(sub)}>{sub}</span>
                  ))}
                </div>
              </div>
            )}
            <button className=\"btn-primary\" style={{ marginTop: '20px', padding: '16px', fontSize: '1.1rem' }} onClick={() => start(subjectText || 'General Study')} disabled={!subjectText.trim()}>
              🚀 Start Session
            </button>
            {error && <p style={{ color: 'var(--accent-red)', textAlign: 'center' }}>{error}</p>}
          </div>
        </GlassCard>
      </div>
    );
  }

  if (phase === 'active') {
    const targetSeconds = 60 * 60;
    const pct = Math.min((elapsed / targetSeconds) * 100, 100);
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;

    return (
      <div className=\"fade-in\" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Focus Mode</h2>
        <div className=\"timer-ring-container pulse-glow\" style={{ width: '300px', height: '300px', margin: '40px auto', borderRadius: '50%' }}>
          <svg width=\"300\" height=\"300\" viewBox=\"0 0 300 300\">
            <circle cx=\"150\" cy=\"150\" r={radius} fill=\"none\" stroke=\"rgba(255,255,255,0.05)\" strokeWidth=\"8\" />
            <circle cx=\"150\" cy=\"150\" r={radius} fill=\"none\" stroke=\"var(--accent-cyan)\" strokeWidth=\"8\" strokeLinecap=\"round\" strokeDasharray={circumference} strokeDashoffset={offset} transform=\"rotate(-90 150 150)\" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className=\"timer-text-container\">
            <div className=\"timer-time\">{formatTime(elapsed)}</div>
            <div className=\"timer-subject\">{session?.subject}</div>
          </div>
        </div>
        <button className=\"btn-danger\" onClick={stop} style={{ minWidth: '200px' }}>⏹️ End Session</button>
      </div>
    );
  }

  if (phase === 'rating') {
    return (
      <div className=\"fade-in\" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className=\"page-title\" style={{ textAlign: 'center' }}>Great Job!</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          You studied for {Math.round(elapsed / 60)} minutes. How did it go?
        </p>
        <GlassCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <RatingSlider label=\"How focused were you?\" value={focusRating} onChange={setFocusRating} type=\"focus\" />
            <RatingSlider label=\"How fatigued do you feel?\" value={fatigueRating} onChange={setFatigueRating} type=\"fatigue\" />
            <button className=\"btn-primary\" onClick={() => submitRating(focusRating, fatigueRating)}>✅ Save Session</button>
            {error && <p style={{ color: 'var(--accent-red)', textAlign: 'center' }}>{error}</p>}
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className=\"fade-in\" style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '5rem', marginBottom: '20px', animation: 'checkmark 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>🎉</div>
      <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Session Logged!</h2>
      <GlassCard style={{ textAlign: 'left', marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Subject</p>
            <p style={{ fontWeight: '600' }}>{result?.subject || session?.subject}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Duration</p>
            <p style={{ fontWeight: '600' }}>{result?.duration_min ? parseFloat(result.duration_min).toFixed(0) : Math.round(elapsed / 60)} min</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Focus</p>
            <p style={{ fontWeight: '600', color: 'var(--accent-green)' }}>{result?.focus_rating}/10</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fatigue</p>
            <p style={{ fontWeight: '600', color: 'var(--accent-amber)' }}>{result?.fatigue_rating}/10</p>
          </div>
        </div>
      </GlassCard>
      <button className=\"btn-primary\" onClick={reset}>Start New Session</button>
    </div>
  );
}