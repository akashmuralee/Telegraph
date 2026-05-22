import { useRef, useState, useCallback, useEffect } from 'react';

// Captures press-and-release events to build a morse sequence.
//   short hold  → '.'
//   long  hold  → '-'
// Calls `onLetter` after `charSpaceMs` of silence with the decoded sequence,
// and `onWord`   after `wordSpaceMs` of silence with no input.
export function useMorseKey({
  dotMs,
  charSpaceMs,
  wordSpaceMs,
  onLetter,
  onWord,
  onPressStart,
  onPressEnd,
  enabled,
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [currentSeq, setCurrentSeq] = useState('');
  const pressStartRef = useRef(0);
  const charTimerRef = useRef(null);
  const wordTimerRef = useRef(null);
  const seqRef = useRef('');

  // Keep seqRef in sync — used in timer callbacks.
  useEffect(() => {
    seqRef.current = currentSeq;
  }, [currentSeq]);

  const clearTimers = useCallback(() => {
    if (charTimerRef.current) {
      clearTimeout(charTimerRef.current);
      charTimerRef.current = null;
    }
    if (wordTimerRef.current) {
      clearTimeout(wordTimerRef.current);
      wordTimerRef.current = null;
    }
  }, []);

  const scheduleSpace = useCallback(() => {
    clearTimers();
    charTimerRef.current = setTimeout(() => {
      if (seqRef.current) {
        onLetter?.(seqRef.current);
        setCurrentSeq('');
      }
      wordTimerRef.current = setTimeout(() => {
        onWord?.();
      }, Math.max(80, wordSpaceMs - charSpaceMs));
    }, charSpaceMs);
  }, [charSpaceMs, wordSpaceMs, onLetter, onWord, clearTimers]);

  const pressDown = useCallback(() => {
    if (!enabled || isPressed) return;
    clearTimers();
    setIsPressed(true);
    pressStartRef.current = Date.now();
    onPressStart?.();
  }, [enabled, isPressed, clearTimers, onPressStart]);

  const pressUp = useCallback(() => {
    if (!isPressed) return;
    setIsPressed(false);
    onPressEnd?.();
    const duration = Date.now() - pressStartRef.current;
    const symbol = duration < dotMs * 1.6 ? '.' : '-';
    setCurrentSeq((s) => s + symbol);
    scheduleSpace();
  }, [isPressed, dotMs, scheduleSpace, onPressEnd]);

  const popSymbol = useCallback(() => {
    setCurrentSeq((s) => {
      const next = s.slice(0, -1);
      if (next.length === 0) clearTimers();
      else scheduleSpace();
      return next;
    });
  }, [scheduleSpace, clearTimers]);

  // Keyboard <space> support.
  useEffect(() => {
    if (!enabled) return;
    const down = (e) => {
      if (e.key !== ' ' || e.repeat) return;
      e.preventDefault();
      pressDown();
    };
    const up = (e) => {
      if (e.key !== ' ') return;
      pressUp();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [enabled, pressDown, pressUp]);

  // Always tidy timers on unmount.
  useEffect(() => () => clearTimers(), [clearTimers]);

  return { isPressed, currentSeq, pressDown, pressUp, popSymbol, clearSeq: () => setCurrentSeq('') };
}
