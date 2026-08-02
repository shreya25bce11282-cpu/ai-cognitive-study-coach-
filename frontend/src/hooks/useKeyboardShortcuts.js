import { useEffect } from 'react';

/**
 * Global keyboard shortcuts.
 * @param {Object} handlers
 * @param {Function} [handlers.onToggleSession] - Space: start/stop session
 * @param {Function} [handlers.onCancel] - Escape: cancel current action
 * @param {Function} [handlers.onTab] - 1-5: switch tab by index (1-based)
 */
export default function useKeyboardShortcuts({ onToggleSession, onCancel, onTab } = {}) {
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTyping) return;

      if (e.code === 'Space') {
        e.preventDefault();
        onToggleSession && onToggleSession();
      } else if (e.code === 'Escape') {
        onCancel && onCancel();
      } else if (/^Digit[1-5]$/.test(e.code)) {
        const idx = parseInt(e.code.replace('Digit', ''), 10);
        onTab && onTab(idx);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onToggleSession, onCancel, onTab]);
}