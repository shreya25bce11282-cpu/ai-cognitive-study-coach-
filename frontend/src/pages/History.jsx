import React, { useState, useMemo } from 'react';
import useSessions from '../hooks/useSessions';
import GlassCard from '../components/GlassCard';
import Loader from '../components/Loader';

const PAGE_SIZE = 10;

const formatDate = (isoString) => {
  if (!isoString) return '--';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getFocusBadge = (score) => {
  if (score >= 7) return <span className="badge badge-good">{score}/10</span>;
  if (score >= 4) return <span className="badge badge-medium">{score}/10</span>;
  return <span className="badge badge-bad">{score}/10</span>;
};

const getFatigueBadge = (score) => {
  if (score <= 3) return <span className="badge badge-good">{score}/10</span>;
  if (score <= 6) return <span className="badge badge-medium">{score}/10</span>;
  return <span className="badge badge-bad">{score}/10</span>;
};

export default function History() {
  const { sessions, loading, error } = useSessions();
  const [activeTags, setActiveTags] = useState([]);
  const [page, setPage] = useState(1);

  const completedSessions = useMemo(() => sessions.filter((s) => s.ended_at), [sessions]);

  const allTags = useMemo(() => {
    const set = new Set();
    completedSessions.forEach((s) => (s.tags || []).forEach((t) => set.add(t)));
    return [...set];
  }, [completedSessions]);

  const filtered = useMemo(() => {
    if (activeTags.length === 0) return completedSessions;
    return completedSessions.filter((s) => activeTags.every((t) => (s.tags || []).includes(t)));
  }, [completedSessions, activeTags]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleTag = (tag) => {
    setPage(1);
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  if (loading) return <Loader count={3} />;
  if (error) return <div className="empty-state"><h3>Error</h3><p>{error}</p></div>;

  if (completedSessions.length === 0) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-state-icon">📋</div>
        <h3>No sessions yet</h3>
        <p>Start your first study session to see your history here!</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h1 className="page-title">Session History</h1>

      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {allTags.map((tag) => (
            <span
              key={tag}
              className={`badge badge-tag ${activeTags.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <GlassCard className="table-container" style={{ padding: '0', overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Focus</th>
              <th>Fatigue</th>
              <th>XP</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((session, i) => (
              <tr key={session.id} className="slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  {session.subject}
                  {(session.tags || []).length > 0 && (
                    <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {session.tags.map((t) => (
                        <span key={t} className="badge badge-tag" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td>{formatDate(session.started_at)}</td>
                <td>{session.duration_min ? parseFloat(session.duration_min).toFixed(0) : '--'} min</td>
                <td>{getFocusBadge(session.focus_rating)}</td>
                <td>{getFatigueBadge(session.fatigue_rating)}</td>
                <td className="mono" style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
                  {session.xp_earned ? `+${session.xp_earned}` : '--'}
                </td>
                <td style={{ maxWidth: '220px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {session.notes ? (session.notes.length > 60 ? `${session.notes.slice(0, 60)}…` : session.notes) : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
          <button className="btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <span className="mono" style={{ color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button className="btn-secondary" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}