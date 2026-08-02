import React from 'react';

const formatDate = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function AchievementCard({ achievement, delay = 0 }) {
  const unlocked = Boolean(achievement.unlocked_at);

  return (
    <div
      className={`achievement-card slide-up ${unlocked ? 'unlocked' : 'locked'}`}
      style={{ animationDelay: `${delay * 0.05}s` }}
    >
      <div className="achievement-icon">{unlocked ? achievement.icon : '🔒'}</div>
      <div>
        <div className="achievement-title">{achievement.title}</div>
        <div className="achievement-desc">{achievement.description}</div>
        {unlocked && (
          <div className="achievement-desc" style={{ marginTop: 4, color: 'var(--accent-amber)' }}>
            Unlocked {formatDate(achievement.unlocked_at)}
          </div>
        )}
      </div>
    </div>
  );
}