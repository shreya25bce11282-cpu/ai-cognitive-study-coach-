import React, { useEffect, useState } from 'react';

const COLORS = {
  LOW: { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.4)' },
  MEDIUM: { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)' },
  HIGH: { stroke: '#FF6B6B', glow: 'rgba(255, 107, 107, 0.4)' },
};

export default function BurnoutGauge({ score = 0, risk = 'LOW' }) {
  const [offset, setOffset] = useState(440);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const color = COLORS[risk] || COLORS.LOW;

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"
        />
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
          filter="url(#glow)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        <text x="90" y="82" textAnchor="middle" fill={color.stroke} fontSize="36" fontWeight="700" fontFamily="Inter">
          {score}
        </text>
        <text x="90" y="108" textAnchor="middle" fill="#64748B" fontSize="13" fontWeight="500" fontFamily="Inter">
          {risk} RISK
        </text>
      </svg>
    </div>
  );
}