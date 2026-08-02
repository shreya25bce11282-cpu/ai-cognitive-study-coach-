import React from 'react';

export default function GlassCard({ children, className = '', style = {}, delay = 0 }) {
  return (
    <div
      className={`glass-card slide-up ${className}`}
      style={{ animationDelay: `${delay * 0.1}s`, ...style }}
    >
      {children}
    </div>
  );
}