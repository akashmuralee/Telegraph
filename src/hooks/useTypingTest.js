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

  // Reset whenever wordCount changes.
  useEffect(() => {
    dispatch({ type: 'RESET', count: wordCount });
    startRef.current = null;
    setWpm(0);
    setElapsed(0);
  }, [wordCount]);

  // WPM ticker.
  useEffect(() => {
    if (!startRef.current || state.finished) return;
    const id = setInterval(() => {
      const ms = Date.now() - startRef.current;
      const mins = ms / 60000;
      setElapsed(ms / 1000);
      if (mins > 0) setWpm(Math.round(state.correctChars / 5 / mins));
    }, 500);
    return () => clearInterval(id);
  }, [state.correctChars, state.finished]);

  const ensureStarted = useCallback(() => {
    if (!startRef.current) startRef.current = Date.now();
  }, []);

  const commitChar = useCallback(
    (ch) => {
      ensureStarted();
      dispatch({ type: 'COMMIT_CHAR', ch });
    },
    [ensureStarted]
  );
  const commitSpace = useCallback(() => {
    ensureStarted();
    dispatch({ type: 'COMMIT_SPACE' });
  }, [ensureStarted]);
  const back = useCallback(() => dispatch({ type: 'BACK' }), []);
  const restart = useCallback(() => {
    dispatch({ type: 'RESET', count: wordCount });
    startRef.current = null;
    setWpm(0);
    setElapsed(0);
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

  return {
    ...state,
    wpm: finalWpm,
    accuracy,
    elapsed,
    commitChar,
    commitSpace,
    back,
    restart,
  };
}
