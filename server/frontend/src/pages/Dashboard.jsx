import React from 'react';
import useAnalytics from '../hooks/useAnalytics';
import GlassCard from '../components/GlassCard';
import StatCounter from '../components/StatCounter';
import BurnoutGauge from '../components/BurnoutGauge';
import Loader from '../components/Loader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 15, 35, 0.95)',
        border: '1px solid rgba(124, 58, 237, 0.3)',
        borderRadius: '12px',
        padding: '12px 16px',
        color: '#f0f0ff',
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

  if (loading) return <Loader count={6} />;
  
  if (error) {
    return (
      <div className=\"empty-state\">
        <div className=\"empty-state-icon\">⚠️</div>
        <h3>Failed to load analytics</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!summary || summary.total_sessions === 0) {
    return (
      <div className=\"empty-state fade-in\">
        <div className=\"empty-state-icon\">🚀</div>
        <h3>No Study Sessions Yet</h3>
        <p>Head over to the Session tab to log your first study session and unlock insights!</p>
      </div>
    );
  }

  const hourlyData = bestTime?.hourly_breakdown?.map(item => {
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

  const subjectData = (subjectPerf || []).map(s => ({
    ...s,
    avg_focus: parseFloat(s.avg_focus),
    avg_fatigue: parseFloat(s.avg_fatigue),
    avg_duration_min: parseFloat(s.avg_duration_min),
  }));

  return (
    <div className=\"fade-in\">
      <h1 className=\"page-title\">Analytics Dashboard</h1>

      <div className=\"stats-grid\">
        <GlassCard delay={1}>
          <div className=\"card-header\">Total Sessions</div>
          <div className=\"card-value\"><StatCounter end={summary.total_sessions} /></div>
        </GlassCard>
        <GlassCard delay={2}>
          <div className=\"card-header\">Total Hours</div>
          <div className=\"card-value\"><StatCounter end={summary.total_hours} decimals={1} suffix=\"h\" /></div>
        </GlassCard>
        <GlassCard delay={3}>
          <div className=\"card-header\">Avg Session</div>
          <div className=\"card-value\"><StatCounter end={summary.avg_session_min} decimals={0} suffix=\"m\" /></div>
        </GlassCard>
        <GlassCard delay={4}>
          <div className=\"card-header\">Avg Focus</div>
          <div className=\"card-value\">
            <StatCounter end={summary.avg_focus} decimals={1} />
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}> /10</span>
          </div>
        </GlassCard>
      </div>

      <div className=\"dashboard-grid\">
        <GlassCard className=\"col-span-4\" delay={5}>
          <div className=\"card-header\">Burnout Risk</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
            {burnout ? <BurnoutGauge score={burnout.score} risk={burnout.risk} /> : <span className=\"text-muted\">Not enough data</span>}
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

        <div className=\"col-span-8\" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GlassCard delay={6}>
            <div className=\"card-header\">Current Status</div>
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
          <GlassCard delay={7}>
            <div className=\"card-header\">Optimal Study Plan</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Recommended Session Length</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studyPlan?.recommended_session_length_min || '45'} mins</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Best Duration Bucket</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studyPlan?.best_duration_bucket?.duration_bucket || '--'}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard className=\"col-span-6\" delay={8} style={{ minHeight: '350px' }}>
          <div className=\"card-header\">Focus by Time of Day</div>
          {hourlyData.length > 0 ? (
            <div style={{ height: '280px', width: '100%', marginTop: '16px' }}>
              <ResponsiveContainer>
                <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id=\"colorFocus\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">
                      <stop offset=\"0%\" stopColor=\"#7c3aed\" stopOpacity={1}/>
                      <stop offset=\"100%\" stopColor=\"#a855f7\" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray=\"3 3\" stroke=\"rgba(255,255,255,0.1)\" vertical={false} />
                  <XAxis dataKey=\"hourLabel\" stroke=\"var(--text-secondary)\" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke=\"var(--text-secondary)\" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey=\"avg_focus\" name=\"Avg Focus\" radius={[4, 4, 0, 0]} fill=\"url(#colorFocus)\" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className=\"empty-state\"><p>Not enough hourly data</p></div>
          )}
        </GlassCard>

        <GlassCard className=\"col-span-6\" delay={9} style={{ minHeight: '350px' }}>
          <div className=\"card-header\">Subject Performance</div>
          {subjectData.length > 0 ? (
            <div style={{ height: '280px', width: '100%', marginTop: '16px' }}>
              <ResponsiveContainer>
                <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray=\"3 3\" stroke=\"rgba(255,255,255,0.1)\" vertical={false} />
                  <XAxis dataKey=\"subject\" stroke=\"var(--text-secondary)\" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke=\"var(--text-secondary)\" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                  <Bar dataKey=\"avg_focus\" name=\"Focus\" fill=\"#7c3aed\" radius={[4, 4, 0, 0]} />
                  <Bar dataKey=\"avg_fatigue\" name=\"Fatigue\" fill=\"#06b6d4\" radius={[4, 4, 0, 0]} />
                  <Bar dataKey=\"avg_duration_min\" name=\"Duration (m)\" fill=\"#10b981\" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className=\"empty-state\"><p>No subject data yet</p></div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}