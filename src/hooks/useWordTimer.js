import { useEffect, useRef, useState } from 'react';

// Per-word countdown. Restarts whenever `wordIdx` changes (i.e. when the
// active word changes) or when `durationMs` changes. Calls `onTimeout`
// exactly once when the duration elapses.
export function useWordTimer({ enabled, durationMs, wordIdx, onTimeout }) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const onTimeoutRef = useRef(onTimeout);

  // Keep the callback ref fresh without restarting the timer on every render.
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled || !durationMs) {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    setElapsedMs(0);
    let fired = false;

    const id = setInterval(() => {
      const e = Date.now() - start;
      setElapsedMs(e);
      if (e >= durationMs && !fired) {
        fired = true;
        clearInterval(id);
        onTimeoutRef.current?.();
      }
    }, 80);

    return () => clearInterval(id);
  }, [enabled, durationMs, wordIdx]);

  const progress = durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 0;
  const remaining = Math.max(0, durationMs - elapsedMs);
  return { elapsedMs, remaining, progress };
}
