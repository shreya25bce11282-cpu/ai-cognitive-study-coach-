import React, { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import StreakFlame from '../components/StreakFlame';
import AchievementCard from '../components/AchievementCard';
import Loader from '../components/Loader';
import useGamification from '../hooks/useGamification';
import * as api from '../services/api';

export default function Progress() {
  const { stats, achievements, loading, error, refresh } = useGamification();
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [newSubject, setNewSubject] = useState('');
  const [newTarget, setNewTarget] = useState(5);

  const loadGoals = () => {
    setGoalsLoading(true);
    api
      .getGoalsProgress()
      .then(setGoals)
      .catch(() => setGoals([]))
      .finally(() => setGoalsLoading(false));
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newTarget) return;
    await api.createGoal(newSubject.trim(), parseFloat(newTarget));
    setNewSubject('');
    setNewTarget(5);
    loadGoals();
  };

  const handleDeleteGoal = async (id) => {
    await api.deleteGoal(id);
    loadGoals();
  };

  if (loading) return <Loader count={4} />;
  if (error) return <div className="empty-state"><h3>Error</h3><p>{error}</p></div>;

  const unlockedCount = achievements.filter((a) => a.unlocked_at).length;

  return (
    <div className="fade-in">
      <h1 className="page-title">🏆 Progress</h1>

      <div className="dashboard-grid">
        {/* Streak + Level Summary */}
        <GlassCard className="col-span-4" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="card-header" style={{ width: '100%' }}>Current Streak</div>
          <StreakFlame streak={stats?.current_streak || 0} size={72} />
          <p className="mono" style={{ fontSize: '2rem', fontWeight: 800, marginTop: '12px' }}>
            {stats?.current_streak || 0} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>days</span>
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Longest: {stats?.longest_streak || 0} days
          </p>
        </GlassCard>

        <GlassCard className="col-span-8">
          <div className="card-header">Level {stats?.level || 1}</div>
          <div className="card-value">{stats?.total_xp || 0} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>XP</span></div>
          <div className="xp-bar-large">
            <div className="xp-bar-large-fill" style={{ width: `${Math.round((stats?.progress || 0) * 100)}%` }} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
            {stats?.nextCeiling ? `${stats.nextCeiling - stats.total_xp} XP to level ${stats.level + 1}` : 'Max level reached!'}
          </p>
        </GlassCard>

        {/* Achievements */}
        <GlassCard className="col-span-12">
          <div className="card-header">
            Achievements
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{unlockedCount}/{achievements.length}</span>
          </div>
          <div className="achievement-grid">
            {achievements.map((a, i) => (
              <AchievementCard key={a.achievement_key} achievement={a} delay={i} />
            ))}
          </div>
        </GlassCard>

        {/* Study Goals */}
        <GlassCard className="col-span-12">
          <div className="card-header">Weekly Study Goals</div>

          {goalsLoading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading goals...</p>
          ) : goals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No goals set yet. Add one below!</p>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              {goals.map((g) => {
                const color =
                  g.percent_complete >= 100 ? 'var(--accent-emerald)' : g.percent_complete >= 50 ? 'var(--accent-amber)' : 'var(--accent-coral)';
                return (
                  <div key={g.id} className="goal-row">
                    <div className="goal-row-header">
                      <span style={{ fontWeight: 600 }}>{g.subject}</span>
                      <span>
                        <span className="mono">{g.hours_studied}h / {g.weekly_hours_target}h</span>
                        <button className="btn-icon" style={{ marginLeft: '10px', width: '28px', height: '28px' }} onClick={() => handleDeleteGoal(g.id)} title="Remove goal">
                          &times;
                        </button>
                      </span>
                    </div>
                    <div className="goal-progress-track">
                      <div className="goal-progress-fill" style={{ width: `${g.percent_complete}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: '160px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Subject</label>
              <input type="text" placeholder="e.g. Mathematics" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Hours/week</label>
              <input type="number" min="0.5" step="0.5" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '14px 28px' }}>
              + Add Goal
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}