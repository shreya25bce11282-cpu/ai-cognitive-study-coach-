import React from 'react';
import useSessions from '../hooks/useSessions';
import GlassCard from '../components/GlassCard';
import Loader from '../components/Loader';

const formatDate = (isoString) => {
  if (!isoString) return '--';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const getFocusBadge = (score) => {
  if (score >= 7) return <span className=\"badge badge-good\">{score}/10</span>;
  if (score >= 4) return <span className=\"badge badge-medium\">{score}/10</span>;
  return <span className=\"badge badge-bad\">{score}/10</span>;
};

const getFatigueBadge = (score) => {
  if (score <= 3) return <span className=\"badge badge-good\">{score}/10</span>;
  if (score <= 6) return <span className=\"badge badge-medium\">{score}/10</span>;
  return <span className=\"badge badge-bad\">{score}/10</span>;
};

export default function History() {
  const { sessions, loading, error } = useSessions();

  if (loading) return <Loader count={3} />;
  if (error) return <div className=\"empty-state\"><h3>Error</h3><p>{error}</p></div>;

  const completedSessions = sessions.filter(s => s.ended_at);

  if (completedSessions.length === 0) {
    return (
      <div className=\"empty-state fade-in\">
        <div className=\"empty-state-icon\">📋</div>
        <h3>No sessions yet</h3>
        <p>Start your first study session to see your history here!</p>
      </div>
    );
  }

  return (
    <div className=\"fade-in\">
      <h1 className=\"page-title\">Session History</h1>
      <GlassCard className=\"table-container\" style={{ padding: '0', overflow: 'hidden' }}>
        <table>
          <thead>
            <tr><th>Subject</th><th>Date</th><th>Duration</th><th>Focus</th><th>Fatigue</th></tr>
          </thead>
          <tbody>
            {completedSessions.map((session, i) => (
              <tr key={session.id} className=\"slide-up\" style={{ animationDelay: `${i * 0.05}s` }}>
                <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{session.subject}</td>
                <td>{formatDate(session.started_at)}</td>
                <td>{session.duration_min ? parseFloat(session.duration_min).toFixed(0) : '--'} min</td>
                <td>{getFocusBadge(session.focus_rating)}</td>
                <td>{getFatigueBadge(session.fatigue_rating)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}