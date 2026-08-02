import React, { useEffect, useState } from 'react';
import useAnalytics from '../hooks/useAnalytics';
import GlassCard from '../components/GlassCard';
import StatCounter from '../components/StatCounter';
import BurnoutGauge from '../components/BurnoutGauge';
import Loader from '../components/Loader';
import Heatmap from '../components/Heatmap';
import AIInsightCard from '../components/AIInsightCard';
import * as api from '../services/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(22, 34, 53, 0.97)',
        border: '1px solid var(--border-glass-hover)',
        borderRadius: '12px',
        padding: '12px 16px',
        color: 'var(--text-primary)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
      }}>
        <p style={{ margin: '0 0 8px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill, margin: '4px 0', fontSize: '14px' }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { summary, burnout, bestTime, breakRec, studyPlan, subjectPerf, loading, error } = useAnalytics();
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    api.getWeeklyTrends().then(setWeeklyTrends).catch(() => setWeeklyTrends([]));
    api.getHeatmapData().then(setHeatmapData).catch(() => setHeatmapData([]));
    api
      .getAiInsights()
      .then((res) => {
        setAiEnabled(res.enabled);
        setAiInsight(res.insight || res.message);
      })
      .catch(() => setAiInsight(null))
      .finally(() => setAiLoading(false));
  }, []);

  if (loading) return <Loader count={6} />;

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3>Failed to load analytics</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!summary || summary.total_sessions === 0) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-state-icon">🚀</div>
        <h3>No Study Sessions Yet</h3>
        <p>Head over to the Session tab to log your first study session and unlock insights!</p>
      </div>
    );
  }

  const hourlyData = bestTime?.hourly_breakdown?.map((item) => {
    const h = Number(item.hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return {
      ...item,
      hourLabel: `${hr} ${ampm}`,
      avg_focus: parseFloat(item.avg_focus),
      avg_fatigue: parseFloat(item.avg_fatigue),
    };
  }) || [];

  const needsBreak = breakRec?.break_min > 0;

  const subjectData = (subjectPerf || []).map((s) => ({
    ...s,
    avg_focus: parseFloat(s.avg_focus),
    avg_fatigue: parseFloat(s.avg_fatigue),
    avg_duration_min: parseFloat(s.avg_duration_min),
  }));

  const trendData = weeklyTrends.map((w) => ({
    ...w,
    week_label: new Date(w.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    avg_focus: parseFloat(w.avg_focus),
    avg_fatigue: parseFloat(w.avg_fatigue),
  }));

  return (
    <div className="fade-in">
      <h1 className="page-title">Analytics Dashboard</h1>

      {/* Summary Stats */}
      <div className="stats-grid">
        <GlassCard delay={1}>
          <div className="card-header">Total Sessions</div>
          <div className="card-value"><StatCounter end={summary.total_sessions} /></div>
        </GlassCard>

        <GlassCard delay={2}>
          <div className="card-header">Total Hours</div>
          <div className="card-value"><StatCounter end={summary.total_hours} decimals={1} suffix="h" /></div>
        </GlassCard>

        <GlassCard delay={3}>
          <div className="card-header">Avg Session</div>
          <div className="card-value"><StatCounter end={summary.avg_session_min} decimals={0} suffix="m" /></div>
        </GlassCard>

        <GlassCard delay={4}>
          <div className="card-header">Avg Focus</div>
          <div className="card-value">
            <StatCounter end={summary.avg_focus} decimals={1} />
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}> /10</span>
          </div>
        </GlassCard>
      </div>

      <div className="dashboard-grid">
        {/* AI Insight */}
        <GlassCard className="col-span-12" delay={5}>
          <div className="card-header">🤖 AI Coach Insight</div>
          <AIInsightCard text={aiInsight} loading={aiLoading} enabled={aiEnabled} disabledMessage={aiInsight} />
        </GlassCard>

        {/* Burnout Risk */}
        <GlassCard className="col-span-4" delay={6}>
          <div className="card-header">Burnout Risk</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
            {burnout ? <BurnoutGauge score={burnout.score} risk={burnout.risk} /> : <span className="text-muted">Not enough data</span>}
          </div>
          {burnout && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Sessions (7d)</div>
                <div style={{ fontWeight: 600 }}>{burnout.recent_sessions}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Hours (7d)</div>
                <div style={{ fontWeight: 600 }}>{burnout.total_hours_this_week}h</div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Break Recommendation & Study Plan */}
        <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GlassCard delay={7}>
            <div className="card-header">Current Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ fontSize: '3rem' }}>{needsBreak ? '☕' : '✅'}</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                  {needsBreak ? `Take a ${breakRec.break_min} min break` : 'Ready to study!'}
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>{breakRec?.reason || 'Your focus and fatigue levels look stable.'}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={8}>
            <div className="card-header">Optimal Study Plan</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Recommended Session Length</p>
                <p className="mono" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studyPlan?.recommended_session_length_min || '45'} mins</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Best Duration Bucket</p>
                <p className="mono" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studyPlan?.best_duration_bucket?.duration_bucket || '--'}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Weekly Trend */}
        <GlassCard className="col-span-6" delay={9} style={{ minHeight: '350px' }}>
          <div className="card-header">4-Week Trend</div>
          {trendData.length > 0 ? (
            <div style={{ height: '280px', width: '100%', marginTop: '16px' }}>
              <ResponsiveContainer>
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="week_label" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                  <Line type="monotone" dataKey="avg_focus" name="Focus" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="avg_fatigue" name="Fatigue" stroke="#FF6B6B" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>Not enough weekly data yet</p></div>
          )}
        </GlassCard>

        {/* Best Study Time Chart */}
        <GlassCard className="col-span-6" delay={10} style={{ minHeight: '350px' }}>
          <div className="card-header">Focus by Time of Day</div>
          {hourlyData.length > 0 ? (
            <div style={{ height: '280px', width: '100%', marginTop: '16px' }}>
              <ResponsiveContainer>
                <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="hourLabel" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avg_focus" name="Avg Focus" radius={[4, 4, 0, 0]} fill="url(#colorFocus)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>Not enough hourly data</p></div>
          )}
        </GlassCard>

        {/* Study Heatmap */}
        <GlassCard className="col-span-12" delay={11}>
          <div className="card-header">90-Day Study Heatmap</div>
          <Heatmap data={heatmapData} />
        </GlassCard>

        {/* Subject Performance Chart */}
        <GlassCard className="col-span-12" delay={12} style={{ minHeight: '350px' }}>
          <div className="card-header">Subject Performance</div>
          {subjectData.length > 0 ? (
            <div style={{ height: '280px', width: '100%', marginTop: '16px' }}>
              <ResponsiveContainer>
                <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                  <Bar dataKey="avg_focus" name="Focus" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avg_fatigue" name="Fatigue" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avg_duration_min" name="Duration (m)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>No subject data yet</p></div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}