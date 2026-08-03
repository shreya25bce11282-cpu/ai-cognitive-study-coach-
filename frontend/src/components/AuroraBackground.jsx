import React from 'react';

/**
 * Fixed, full-viewport animated mesh-gradient backdrop.
 * Purely decorative — sits behind all content, ignores pointer events,
 * and never affects layout or scroll height.
 */
export default function AuroraBackground() {
  return (
    <div className="aurora-bg" aria-hidden="true">
      <span className="aurora-blob aurora-blob--1" />
      <span className="aurora-blob aurora-blob--2" />
      <span className="aurora-blob aurora-blob--3" />
      <div className="aurora-grid" />
    </div>
  );
}