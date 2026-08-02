import React, { useMemo } from 'react';

function levelForMinutes(minutes) {
  if (minutes <= 0) return 0;
  if (minutes < 20) return 1;
  if (minutes < 45) return 2;
  if (minutes < 90) return 3;
  return 4;
}

const LEVEL_COLORS = [
  'rgba(255,255,255,0.05)',
  'rgba(16, 185, 129, 0.25)',
  'rgba(16, 185, 129, 0.5)',
  'rgba(16, 185, 129, 0.75)',
  '#10B981',
];

export default function Heatmap({ data = [], days = 90 }) {
  const byDay = useMemo(() => {
    const map = new Map();
    data.forEach((d) => map.set(d.day.slice(0, 10), d.minutes));
    return map;
  }, [data]);

  const cells = useMemo(() => {
    const today = new Date();
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push({ date: key, minutes: byDay.get(key) || 0 });
    }
    // Pad the start so the grid begins on a Sunday for clean week columns
    const firstDow = new Date(arr[0].date).getDay();
    const padding = Array.from({ length: firstDow }, () => ({ date: null, minutes: 0 }));
    return [...padding, ...arr];
  }, [byDay, days]);

  return (
    <div>
      <div className="heatmap-grid">
        {cells.map((cell, i) => (
          <div
            key={i}
            className="heatmap-cell"
            title={cell.date ? `${cell.date}: ${cell.minutes} min` : ''}
            style={{
              background: cell.date ? LEVEL_COLORS[levelForMinutes(cell.minutes)] : 'transparent',
            }}
          />
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        {LEVEL_COLORS.map((c, i) => (
          <div key={i} className="heatmap-cell" style={{ background: c, cursor: 'default' }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}