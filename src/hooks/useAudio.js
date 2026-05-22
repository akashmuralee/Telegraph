import { useRef, useCallback, useState, useEffect } from 'react';
import * as Tone from 'tone';

const UNMUTED_DB = -12;

// Lazy-initialised Tone.js synth. `ensureAudio()` must be called from a
// user-gesture handler (click/keydown) the first time, after which playback
// from any source works.
//
// `muted` mutes the synth output without disabling playback scheduling, so
// visual wave animations still run while audio is silent.
export function useAudio() {
  const synthRef = useRef(null);
  const readyRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  // Reflect the current `muted` state on the underlying synth volume.
  useEffect(() => {
    mutedRef.current = muted;
    if (synthRef.current) {
      synthRef.current.volume.value = muted ? -Infinity : UNMUTED_DB;
    }
  }, [muted]);

  const ensureAudio = useCallback(async () => {
    if (readyRef.current) return true;
    try {
      await Tone.start();
      synthRef.current = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.008, decay: 0.1, sustain: 1, release: 0.04 },
      }).toDestination();
      synthRef.current.volume.value = mutedRef.current ? -Infinity : UNMUTED_DB;
      readyRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  const playBeep = useCallback(() => {
    synthRef.current?.triggerAttack(620);
  }, []);

  const stopBeep = useCallback(() => {
    synthRef.current?.triggerRelease();
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  return { ensureAudio, playBeep, stopBeep, synthRef, readyRef, muted, toggleMute };
}
