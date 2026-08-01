import React from 'react';

const EMOJIS = ['😴', '😟', '😐', '🙂', '😊', '🤩', '🔥', '💪', '🧠', '⚡'];
const FATIGUE_EMOJIS = ['😊', '🙂', '😐', '😟', '😓', '😰', '😤', '🥵', '😵', '😫'];

export default function RatingSlider({ label, value, onChange, type = 'focus' }) {
  const emojis = type === 'fatigue' ? FATIGUE_EMOJIS : EMOJIS;
  const emoji = emojis[Math.max(0, Math.min(value - 1, 9))];

  const hue = type === 'fatigue'
    ? 120 - (value - 1) * 13
    : (value - 1) * 13;

  return (
    <div className=\"rating-slider-container\">
      <div className=\"rating-slider-header\">
        <span className=\"rating-slider-label\">{label}</span>
        <span className=\"rating-slider-emoji\" style={{ fontSize: '28px' }}>{emoji}</span>
      </div>
      <input
        type=\"range\" min=\"1\" max=\"10\" value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className=\"rating-slider\"
        style={{ '--slider-hue': hue, '--slider-pct': `${((value - 1) / 9) * 100}%` }}
      />
      <div className=\"rating-slider-labels\">
        <span>1</span>
        <span className=\"rating-slider-value\" style={{ color: `hsl(${hue}, 80%, 60%)` }}>{value}/10</span>
        <span>10</span>
      </div>
    </div>
  );
}