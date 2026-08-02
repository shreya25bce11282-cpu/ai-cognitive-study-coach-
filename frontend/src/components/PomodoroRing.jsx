import React from 'react';

const PHASE_LABELS = {
  work: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

const PHASE_COLORS = {
  work: '#10B981',
  shortBreak: '#FF6B6B',
  longBreak: '#FF6B6B',
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function PomodoroRing({ phase, remaining, total, subject, completedPomodoros = 0, size = 300 }) {
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.max(0, Math.min(1, 1 - remaining / total)) : 0;
  const offset = circumference - pct * circumference;
  const color = PHASE_COLORS[phase] || '#10B981';
  const center = size / 2;

  return (
    <div className="timer-ring-container pulse-glow" style={{ width: size, height: size, borderRadius: '50%' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
        />
      </svg>
      <div className="timer-text-container">
        <div className="mono" style={{ fontSize: size * 0.14, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          {formatTime(remaining)}
        </div>
        <div className="timer-subject">{subject}</div>
        <div className={`timer-phase-label ${phase}`}>{PHASE_LABELS[phase] || phase}</div>
        <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          🍅 {completedPomodoros} pomodoro{completedPomodoros === 1 ? '' : 's'} completed
        </div>
      </div>
    </div>
  );
}