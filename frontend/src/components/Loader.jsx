import React from 'react';

export default function Loader({ count = 3 }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card shimmer-card">
          <div className="shimmer-line shimmer-line--title" />
          <div className="shimmer-line shimmer-line--value" />
          <div className="shimmer-line shimmer-line--subtitle" />
        </div>
      ))}
    </div>
  );
}