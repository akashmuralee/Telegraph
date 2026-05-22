import { useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { REVERSE_MORSE } from '../lib/morse';

const PLAY_FREQ = 620;
const PLAY_DOT = 90;
const PLAY_DASH = PLAY_DOT * 3;
const PLAY_INTRA = PLAY_DOT;
const PLAY_INTER = PLAY_DOT * 3;
const START_OFFSET_MS = 60;

// Plays the audio for a word and animates each character's foreground SVG
// path (drawn via stroke-dashoffset) in sync with the tone bursts.
// Expects a `containerRef` whose .rword > .rchar > .rwave svg > path.fg
// nodes match the words array layout.
export function useMorsePlayback({ words, ensureAudio, synthRef, containerRef, isReading }) {
  const timeoutsRef = useRef([]);
  const tokenRef = useRef(0);
  const playingRef = useRef(false);
  const onPlayingChangeRef = useRef(null);

  const stop = useCallback(() => {
    tokenRef.current++;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (synthRef.current) {
      try { synthRef.current.triggerRelease(); } catch {}
    }
    const root = containerRef.current;
    if (root) {
      root.querySelectorAll('.rchar.playing').forEach((el) => el.classList.remove('playing'));
      root.querySelectorAll('.rwave path.fg').forEach((p) => {
        p.style.transition = 'none';
        const len = p.style.getPropertyValue('--len') || '0';
        p.style.strokeDashoffset = len;
      });
    }
    playingRef.current = false;
    onPlayingChangeRef.current?.(false);
  }, [containerRef, synthRef]);

  const playWord = useCallback(async (wIdx) => {
    if (!isReading) return;
    if (!words[wIdx]) return;
    const ok = await ensureAudio();
    if (!ok) return;

    stop();
    const token = ++tokenRef.current;
    playingRef.current = true;
    onPlayingChangeRef.current?.(true);

    const root = containerRef.current;
    const rwordEl = root?.querySelectorAll('.rword')[wIdx];
    if (!rwordEl) return;

    const audioStart = Tone.now() + START_OFFSET_MS / 1000;
    let cumMs = 0;

    const word = words[wIdx];
    for (let ci = 0; ci < word.length; ci++) {
      const rchar = rwordEl.children[ci];
      const pattern = REVERSE_MORSE[word[ci]] || '';
      const charStartMs = cumMs;
      let charMs = 0;

      for (let pi = 0; pi < pattern.length; pi++) {
        if (pi > 0) charMs += PLAY_INTRA;
        const dur = pattern[pi] === '.' ? PLAY_DOT : PLAY_DASH;
        try {
          synthRef.current?.triggerAttackRelease(
            PLAY_FREQ,
            dur / 1000,
            audioStart + (charStartMs + charMs) / 1000
          );
        } catch {}
        charMs += dur;
      }

      const startDelay = START_OFFSET_MS + charStartMs;
      const drawMs = charMs;
      timeoutsRef.current.push(
        setTimeout(() => {
          if (token !== tokenRef.current) return;
          animateCharStart(rchar, drawMs);
        }, startDelay)
      );
      timeoutsRef.current.push(
        setTimeout(() => {
          if (token !== tokenRef.current) return;
          animateCharEnd(rchar);
        }, startDelay + drawMs + 60)
      );

      cumMs += charMs + PLAY_INTER;
    }

    timeoutsRef.current.push(
      setTimeout(() => {
        if (token !== tokenRef.current) return;
        playingRef.current = false;
        onPlayingChangeRef.current?.(false);
      }, START_OFFSET_MS + cumMs)
    );
  }, [words, ensureAudio, synthRef, containerRef, isReading, stop]);

  // Plays a single character's morse and animates that one wave.
  // Used when the user clicks an individual wave block.
  const playChar = useCallback(async (wIdx, cIdx) => {
    const word = words[wIdx];
    if (!word || cIdx >= word.length) return;
    const letter = word[cIdx];
    const pattern = REVERSE_MORSE[letter];
    if (!pattern) return;

    const ok = await ensureAudio();
    if (!ok) return;

    stop();
    const token = ++tokenRef.current;
    playingRef.current = true;
    onPlayingChangeRef.current?.(true);

    const root = containerRef.current;
    const rwordEl = root?.querySelectorAll('.rword')[wIdx];
    const rchar = rwordEl?.children[cIdx];

    const audioStart = Tone.now() + START_OFFSET_MS / 1000;
    let charMs = 0;
    for (let pi = 0; pi < pattern.length; pi++) {
      if (pi > 0) charMs += PLAY_INTRA;
      const dur = pattern[pi] === '.' ? PLAY_DOT : PLAY_DASH;
      try {
        synthRef.current?.triggerAttackRelease(
          PLAY_FREQ,
          dur / 1000,
          audioStart + charMs / 1000
        );
      } catch {}
      charMs += dur;
    }

    if (rchar) {
      timeoutsRef.current.push(
        setTimeout(() => {
          if (token !== tokenRef.current) return;
          animateCharStart(rchar, charMs);
        }, START_OFFSET_MS)
      );
      timeoutsRef.current.push(
        setTimeout(() => {
          if (token !== tokenRef.current) return;
          animateCharEnd(rchar);
        }, START_OFFSET_MS + charMs + 60)
      );
    }

    timeoutsRef.current.push(
      setTimeout(() => {
        if (token !== tokenRef.current) return;
        playingRef.current = false;
        onPlayingChangeRef.current?.(false);
      }, START_OFFSET_MS + charMs)
    );
  }, [words, ensureAudio, synthRef, containerRef, stop]);

  useEffect(() => () => stop(), [stop]);

  const onPlayingChange = useCallback((fn) => {
    onPlayingChangeRef.current = fn;
  }, []);

  return { playWord, playChar, stop, onPlayingChange };
}

function animateCharStart(rchar, durMs) {
  if (!rchar) return;
  rchar.classList.add('playing');
  const fg = rchar.querySelector('.rwave path.fg');
  if (!fg) return;
  const len = fg.style.getPropertyValue('--len') || fg.getTotalLength();
  fg.style.transition = 'none';
  fg.style.strokeDashoffset = len;
  // Force reflow so the next style change actually transitions.
  fg.getBoundingClientRect();
  requestAnimationFrame(() => {
    fg.style.transition = `stroke-dashoffset ${durMs}ms linear`;
    fg.style.strokeDashoffset = '0';
  });
}

function animateCharEnd(rchar) {
  if (!rchar) return;
  rchar.classList.remove('playing');
  const fg = rchar.querySelector('.rwave path.fg');
  if (!fg) return;
  const len = fg.style.getPropertyValue('--len') || fg.getTotalLength();
  fg.style.transition = 'stroke-dashoffset 220ms ease-out';
  fg.style.strokeDashoffset = len;
}
