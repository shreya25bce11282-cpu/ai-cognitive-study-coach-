import React from 'react';

// Bronze (1-6 days) -> Silver (7-29) -> Gold (30-99) -> Diamond (100+)
function tierFor(streak) {
  if (streak >= 100) return { name: 'Diamond', colors: ['#b9f2ff', '#5eead4', '#0ea5e9'] };
  if (streak >= 30) return { name: 'Gold', colors: ['#fde68a', '#F59E0B', '#b45309'] };
  if (streak >= 7) return { name: 'Silver', colors: ['#e2e8f0', '#94a3b8', '#475569'] };
  return { name: 'Bronze', colors: ['#f0b98a', '#cd7f32', '#7c4a1e'] };
}

export default function StreakFlame({ streak = 0, size = 56 }) {
  const tier = tierFor(streak);
  const [light, mid, dark] = tier.colors;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg
        className="flame-anim"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        style={{ filter: `drop-shadow(0 0 10px ${mid}66)` }}
      >
        <defs>
          <linearGradient id={`flameGrad-${tier.name}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={dark} />
            <stop offset="55%" stopColor={mid} />
            <stop offset="100%" stopColor={light} />
          </linearGradient>
        </defs>
        <path
          d="M32 58c-11 0-18-8-18-18 0-9 5-13 6-21 0.5-4 0-8-2-11 8 1 14 7 15 15 3-5 3-11 0-16 10 4 16 14 16 24 0 5-2 9-4 12 3-2 5-5 6-9 3 5 3 13-1 18-3 4-8 6-18 6Z"
          fill={`url(#flameGrad-${tier.name})`}
        />
      </svg>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: mid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {tier.name}
      </span>
    </div>
  );
}