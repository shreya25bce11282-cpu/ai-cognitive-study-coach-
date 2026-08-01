import React, { useEffect, useState, useRef } from 'react';

export default function StatCounter({ end, duration = 1200, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    const target = parseFloat(end) || 0;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * target);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration]);

  return (
    <span className="stat-counter">
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}
