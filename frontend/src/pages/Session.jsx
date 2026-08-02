import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useActiveSession, { DEFAULT_POMODORO } from '../hooks/useActiveSession';
import useSessions from '../hooks/useSessions';
import GlassCard from '../components/GlassCard';
import RatingSlider from '../components/RatingSlider';
import PomodoroRing from '../components/PomodoroRing';
import AmbientSound from '../components/AmbientSound';
import AIInsightCard from '../components/AIInsightCard';
import * as api from '../services/api';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function Session({ onSessionSaved }) {
  const {
    phase, session, elapsed, result, error, start, stop, submitRating, reset,
    mode, pomodoroPhase, pomodoroRemaining, completedPomodoros,
    notes, setNotes, tags, addTag, removeTag,
  } = useActiveSession();
  const { sessions, refresh: refreshSessions } = useSessions();
  const [subjectText, setSubjectText] = useState('');
  const [focusRating, setFocusRating] = useState(5);
  const [fatigueRating, setFatigueRating] = useState(5);
  const [sessionMode, setSessionMode] = useState('classic');
  const [tagDraft, setTagDraft] = useState('');
  const [aiTip, setAiTip] = useState(null);
  const [aiTipLoading, setAiTipLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const recentSubjects = [...new Set(sessions.map((s) => s.subject))].slice(0, 5);

  // Fetch a post-session AI tip once we land in 'done'
  useEffect(() => {
    if (phase === 'done') {
      setAiTipLoading(true);
      api
        .getAiInsights()
        .then((res) => {
          setAiEnabled(res.enabled);
          setAiTip(res.insight || res.message);
        })
        .catch(() => setAiTip(null))
        .finally(() => setAiTipLoading(false));

      refreshSessions();
      onSessionSaved && onSessionSaved();

      if (result?.xp_earned || result?.gamification?.xpEarned) {
        toast.success(`+${result.xp_earned || result.gamification.xpEarned} XP earned!`, { icon: '⚡' });
      }
      (result?.newly_unlocked || []).forEach((a) => {
        toast.success(`Achievement unlocked: ${a.title} ${a.icon}`, { duration: 5000 });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagDraft);
      setTagDraft('');
    } else if (e.key === 'Backspace' && !tagDraft && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  // --- IDLE PHASE ---
  if (phase === 'idle') {
    return (
      <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '20px' }}>
        <h1 className="page-title" style={{ textAlign: 'center' }}>Ready to Study?</h1>
        <GlassCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                Subject / Topic
              </label>
              <input
                type="text"
                placeholder="What are you studying?"
                value={subjectText}
                onChange={(e) => setSubjectText(e.target.value)}
              />
            </div>

            {recentSubjects.length > 0 && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Recent subjects:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {recentSubjects.map((sub) => (
                    <span key={sub} className="badge badge-medium" style={{ cursor: 'pointer' }} onClick={() => setSubjectText(sub)}>
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                Mode
              </label>
              <div className="mode-toggle">
                <button className={sessionMode === 'classic' ? 'active' : ''} onClick={() => setSessionMode('classic')}>
                  ⏱️ Classic
                </button>
                <button className={sessionMode === 'pomodoro' ? 'active' : ''} onClick={() => setSessionMode('pomodoro')}>
                  🍅 Pomodoro (25/5/15)
                </button>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: '10px', padding: '16px', fontSize: '1.1rem' }}
              onClick={() => start(subjectText || 'General Study', sessionMode, DEFAULT_POMODORO)}
              disabled={!subjectText.trim()}
            >
              🚀 Start Session
            </button>
            {error && <p style={{ color: 'var(--accent-coral)', textAlign: 'center' }}>{error}</p>}
          </div>
        </GlassCard>
      </div>
    );
  }

  // --- ACTIVE PHASE ---
  if (phase === 'active') {
    if (mode === 'pomodoro') {
      return (
        <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Pomodoro Mode</h2>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PomodoroRing
              phase={pomodoroPhase}
              remaining={pomodoroRemaining}
              total={
                pomodoroPhase === 'work'
                  ? DEFAULT_POMODORO.work
                  : pomodoroPhase === 'longBreak'
                  ? DEFAULT_POMODORO.longBreak
                  : DEFAULT_POMODORO.shortBreak
              }
              subject={session?.subject}
              completedPomodoros={completedPomodoros}
            />
          </div>

          <div style={{ margin: '20px 0' }}>
            <AmbientSound />
          </div>

          <button className="btn-danger" onClick={stop} style={{ minWidth: '200px' }}>
            ⏹️ End Session
          </button>
        </div>
      );
    }

    const targetSeconds = 60 * 60; // 60 mins for ring visual
    const pct = Math.min((elapsed / targetSeconds) * 100, 100);
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;

    return (
      <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Focus Mode</h2>

        <div className="timer-ring-container pulse-glow" style={{ width: '300px', height: '300px', margin: '40px auto', borderRadius: '50%' }}>
          <svg width="300" height="300" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle
              cx="150" cy="150" r={radius}
              fill="none"
              stroke="var(--accent-teal)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 150 150)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="timer-text-container">
            <div className="timer-time mono">{formatTime(elapsed)}</div>
            <div className="timer-subject">{session?.subject}</div>
          </div>
        </div>

        <div style={{ margin: '20px 0' }}>
          <AmbientSound />
        </div>

        <button className="btn-danger" onClick={stop} style={{ minWidth: '200px' }}>
          ⏹️ End Session
        </button>
      </div>
    );
  }

  // --- RATING PHASE ---
  if (phase === 'rating') {
    return (
      <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="page-title" style={{ textAlign: 'center' }}>Great Job!</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          You studied for {Math.round(elapsed / 60)} minutes. How did it go?
        </p>

        <GlassCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <RatingSlider label="How focused were you?" value={focusRating} onChange={setFocusRating} type="focus" />
            <RatingSlider label="How fatigued do you feel?" value={fatigueRating} onChange={setFatigueRating} type="fatigue" />

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                Notes (optional, markdown supported)
              </label>
              <textarea
                placeholder="What did you cover? Anything worth remembering?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                Tags
              </label>
              <div className="tag-input-container">
                {tags.map((t) => (
                  <span key={t} className="tag-chip">
                    {t}
                    <button onClick={() => removeTag(t)}>&times;</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="exam prep, revision..."
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
              </div>
            </div>

            <button className="btn-primary" onClick={() => submitRating(focusRating, fatigueRating)}>
              ✅ Save Session
            </button>
            {error && <p style={{ color: 'var(--accent-coral)', textAlign: 'center' }}>{error}</p>}
          </div>
        </GlassCard>
      </div>
    );
  }

  // --- DONE PHASE ---
  return (
    <div className="fade-in" style={{ maxWidth: '520px', margin: '20px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '5rem', marginBottom: '20px', animation: 'checkmark 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
        🎉
      </div>
      <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Session Logged!</h2>

      <GlassCard style={{ textAlign: 'left', marginBottom: '20px' }}>
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
            <p style={{ fontWeight: '600', color: 'var(--accent-emerald)' }}>{result?.focus_rating}/10</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fatigue</p>
            <p style={{ fontWeight: '600', color: 'var(--accent-amber)' }}>{result?.fatigue_rating}/10</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>XP Earned</p>
            <p className="mono" style={{ fontWeight: '700', color: 'var(--accent-amber)' }}>
              +{result?.xp_earned ?? result?.gamification?.xpEarned ?? 0} XP
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Streak</p>
            <p style={{ fontWeight: '600' }}>🔥 {result?.gamification?.currentStreak ?? '--'} days</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard style={{ textAlign: 'left', marginBottom: '32px' }}>
        <div className="card-header">🤖 AI Coach Tip</div>
        <AIInsightCard text={aiTip} loading={aiTipLoading} enabled={aiEnabled} />
      </GlassCard>

      <button className="btn-primary" onClick={reset}>
        Start New Session
      </button>
    </div>
  );
}