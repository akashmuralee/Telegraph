import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { pickWords } from '../lib/words';

const initialState = (count) => {
  const words = pickWords(count);
  return {
    words,
    typed: words.map(() => ''),
    wordIdx: 0,
    charIdx: 0,
    correctChars: 0,
    totalChars: 0,
    finished: false,
    // Monotonic counter bumped on every RESET so dependents (timers, etc.)
    // can detect a new run even when wordIdx happens to stay at 0.
    version: 0,
  };
};

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return { ...initialState(action.count), version: (state?.version ?? 0) + 1 };

    case 'COMMIT_CHAR': {
      if (state.finished) return state;
      const { ch } = action;
      const target = state.words[state.wordIdx]?.[state.charIdx];
      const typed = state.typed.slice();
      typed[state.wordIdx] = (typed[state.wordIdx] || '') + ch;
      return {
        ...state,
        typed,
        totalChars: state.totalChars + 1,
        correctChars: state.correctChars + (target === ch ? 1 : 0),
        charIdx: state.charIdx + 1,
      };
    }

    case 'COMMIT_SPACE': {
      if (state.finished) return state;
      const next = state.wordIdx + 1;
      if (next >= state.words.length) {
        return { ...state, finished: true };
      }
      return { ...state, wordIdx: next, charIdx: 0 };
    }

    case 'JUMP_TO': {
      if (state.finished) return state;
      const { wIdx, cIdx } = action;
      if (wIdx < 0 || wIdx >= state.words.length) return state;
      const word = state.words[wIdx];
      if (cIdx < 0 || cIdx > word.length) return state;

      // Truncate typed state: keep earlier words fully, cut typed[wIdx] at
      // cIdx, and clear everything after the target word.
      const typed = state.typed.slice();
      typed[wIdx] = (typed[wIdx] || '').slice(0, cIdx);
      for (let i = wIdx + 1; i < typed.length; i++) typed[i] = '';

      // Recompute stats from the surviving typed state.
      let correctChars = 0;
      let totalChars = 0;
      for (let i = 0; i <= wIdx; i++) {
        const tw = typed[i] || '';
        const w = state.words[i];
        for (let j = 0; j < tw.length; j++) {
          totalChars++;
          if (tw[j] === w?.[j]) correctChars++;
        }
      }

      return {
        ...state,
        typed,
        wordIdx: wIdx,
        charIdx: cIdx,
        correctChars,
        totalChars,
      };
    }

    case 'BACK': {
      if (state.finished) return state;
      const cur = state.typed[state.wordIdx] || '';
      if (cur.length > 0) {
        const removed = cur.slice(-1);
        const target = state.words[state.wordIdx][cur.length - 1];
        const typed = state.typed.slice();
        typed[state.wordIdx] = cur.slice(0, -1);
        return {
          ...state,
          typed,
          charIdx: Math.max(0, state.charIdx - 1),
          totalChars: Math.max(0, state.totalChars - 1),
          correctChars:
            removed === target ? Math.max(0, state.correctChars - 1) : state.correctChars,
        };
      }
      if (state.wordIdx > 0) {
        const prev = state.wordIdx - 1;
        const prevTyped = state.typed[prev] || '';
        return { ...state, wordIdx: prev, charIdx: prevTyped.length };
      }
      return state;
    }

    default:
      return state;
  }
}

export function useTypingTest(wordCount) {
  const [state, dispatch] = useReducer(reducer, wordCount, initialState);
  const startRef = useRef(null);
  const [wpm, setWpm] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  // Per-second WPM samples for the results chart.
  // Each entry: { t (sec), wpm (corrected), rawWpm (all chars) }
  const [samples, setSamples] = useState([]);

  // Reset whenever wordCount changes.
  useEffect(() => {
    dispatch({ type: 'RESET', count: wordCount });
    startRef.current = null;
    setWpm(0);
    setElapsed(0);
    setSamples([]);
  }, [wordCount]);

  // WPM ticker — also records one sample per ~second.
  useEffect(() => {
    if (!startRef.current || state.finished) return;
    const id = setInterval(() => {
      const ms = Date.now() - startRef.current;
      const sec = ms / 1000;
      const mins = ms / 60000;
      setElapsed(sec);
      if (mins <= 0) return;
      const w = Math.round(state.correctChars / 5 / mins);
      const r = Math.round(state.totalChars / 5 / mins);
      setWpm(w);
      setSamples((prev) => {
        const last = prev[prev.length - 1];
        if (!last || sec - last.t >= 1) {
          return [...prev, { t: sec, wpm: w, rawWpm: r }];
        }
        return prev;
      });
    }, 500);
    return () => clearInterval(id);
  }, [state.correctChars, state.totalChars, state.finished]);

  const begin = useCallback(() => {
    if (!startRef.current) startRef.current = Date.now();
  }, []);

  const commitChar = useCallback(
    (ch) => {
      begin();
      dispatch({ type: 'COMMIT_CHAR', ch });
    },
    [begin]
  );
  const commitSpace = useCallback(() => {
    begin();
    dispatch({ type: 'COMMIT_SPACE' });
  }, [begin]);
  const back = useCallback(() => dispatch({ type: 'BACK' }), []);
  const jump = useCallback((wIdx, cIdx) => dispatch({ type: 'JUMP_TO', wIdx, cIdx }), []);
  const restart = useCallback(() => {
    dispatch({ type: 'RESET', count: wordCount });
    startRef.current = null;
    setWpm(0);
    setElapsed(0);
    setSamples([]);
  }, [wordCount]);

  // Final WPM/accuracy when finished.
  const accuracy =
    state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100;

  const finalWpm = state.finished
    ? (() => {
        const mins = elapsed / 60;
        return mins > 0 ? Math.round(state.correctChars / 5 / mins) : 0;
      })()
    : wpm;

  // Raw WPM = all chars typed (correct + incorrect) per minute.
  const rawWpm = (() => {
    const mins = elapsed / 60;
    return mins > 0 ? Math.round(state.totalChars / 5 / mins) : 0;
  })();

  return {
    ...state,
    wpm: finalWpm,
    rawWpm,
    accuracy,
    elapsed,
    samples,
    begin,
    commitChar,
    commitSpace,
    back,
    jump,
    restart,
  };
}
