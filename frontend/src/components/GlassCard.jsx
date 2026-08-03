import React, { useRef, useCallback } from 'react';

export default function GlassCard({ children, className = '', style = {}, delay = 0 }) {
  const ref = useRef(null);

  // Cursor-reactive spotlight + subtle 3D tilt. Pure CSS-var / inline-transform
  // driven so it stays lightweight and needs no extra dependency.
  const handleMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const rotateY = ((x / rect.width) - 0.5) * 6;
    const rotateX = ((y / rect.height) - 0.5) * -6;

    el.style.setProperty('--mx', `${px}%`);
    el.style.setProperty('--my', `${py}%`);
    el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '50%');
    el.style.transform = '';
  }, []);

  return (
    <div
      ref={ref}
      className={`glass-card slide-up ${className}`}
      style={{ animationDelay: `${delay * 0.1}s`, ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}