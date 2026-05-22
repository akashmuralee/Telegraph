import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { SettingsDrawer } from './components/SettingsDrawer';
import { WritingPanel } from './components/WritingPanel';
import { ReadingPanel } from './components/ReadingPanel';
import { TelegraphKey } from './components/TelegraphKey';
import { Controls } from './components/Controls';
import { ResultsCard } from './components/ResultsCard';
import { useAudio } from './hooks/useAudio';
import { useTypingTest } from './hooks/useTypingTest';
import { useMorseKey } from './hooks/useMorseKey';
import { useMorsePlayback } from './hooks/useMorsePlayback';
import { useWordTimer } from './hooks/useWordTimer';
import { MORSE } from './lib/morse';

const DEFAULT_SETTINGS = {
  wordCount: 25,
  hint: true,
  secondsPerWord: 15,
  dotMs: 140,
  charSpaceMs: 700,
  wordSpaceMs: 1600,
};

// How many lines of words the writing-mode field shows, scaled by word count.
const VISIBLE_LINES_BY_COUNT = { 15: 2, 25: 3, 50: 5, 100: 7 };

export default function App() {
  const [mode, setMode] = useState('writing'); // 'writing' | 'reading'
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [readingPace, setReadingPace] = useState('word'); // 'word' | 'letter'

  // Mode-swap fade. `modeFading` drives a quick opacity dip during the swap
  // so writing/reading don't pop in/out.
  const [modeFading, setModeFading] = useState(false);
  const MODE_FADE_MS = 220;

  const test = useTypingTest(settings.wordCount);
  const audio = useAudio();

  // Per-word countdown. When time runs out we just advance to the next word.
  const timer = useWordTimer({
    enabled: !test.finished,
    durationMs: settings.secondsPerWord * 1000,
    wordIdx: test.wordIdx,
    testVersion: test.version,
    onTimeout: useCallback(() => test.commitSpace(), [test]),
  });
  const readingContainerRef = useRef(null);

  const playback = useMorsePlayback({
    words: test.words,
    ensureAudio: audio.ensureAudio,
    synthRef: audio.synthRef,
    containerRef: readingContainerRef,
    isReading: mode === 'reading',
  });

  // ── Writing mode: morse key ──
  const morseKey = useMorseKey({
    dotMs: settings.dotMs,
    charSpaceMs: settings.charSpaceMs,
    wordSpaceMs: settings.wordSpaceMs,
    enabled: mode === 'writing' && !test.finished,
    onLetter: (seq) => test.commitChar(MORSE[seq] ?? '?'),
    onWord: () => test.commitSpace(),
    onPressStart: async () => {
      await audio.ensureAudio();
      audio.playBeep();
    },
    onPressEnd: () => audio.stopBeep(),
  });

  // ── Reading mode: auto-play current word (pace = 'word') ──
  useEffect(() => {
    if (mode !== 'reading' || test.finished) return;
    if (readingPace !== 'word') return;
    if (!test.words.length) return;
    const id = setTimeout(() => playback.playWord(test.wordIdx), 50);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, readingPace, test.wordIdx, test.words]);

  // ── Reading mode: auto-play current letter (pace = 'letter') ──
  useEffect(() => {
    if (mode !== 'reading' || test.finished) return;
    if (readingPace !== 'letter') return;
    if (!test.words.length) return;
    const id = setTimeout(() => playback.playChar(test.wordIdx, test.charIdx), 50);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, readingPace, test.wordIdx, test.charIdx, test.words]);

  // ── Reading mode: keyboard input ──
  useEffect(() => {
    if (mode !== 'reading') return;
    const onKey = (e) => {
      if (test.finished) return;
      if (e.key === 'Tab') { e.preventDefault(); test.restart(); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        test.back();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        test.commitSpace();
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        const letter = e.key.toLowerCase();
        const word = test.words[test.wordIdx];
        test.commitChar(letter);
        if (word && test.charIdx + 1 >= word.length) {
          test.commitSpace();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, test]);

  // ── Writing-mode global shortcuts ──
  useEffect(() => {
    if (mode !== 'writing') return;
    const onKey = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        test.restart();
        morseKey.clearSeq();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (morseKey.currentSeq.length > 0) morseKey.popSymbol();
        else test.back();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, test, morseKey]);

  const updateSettings = useCallback((patch) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const switchMode = useCallback(
    async (m) => {
      if (m === mode) return;
      playback.stop();
      setModeFading(true);
      // Fade out, then swap mode + restart test, then fade back in.
      setTimeout(() => {
        setMode(m);
        test.restart();
        setModeFading(false);
      }, MODE_FADE_MS);
      if (m === 'reading') await audio.ensureAudio();
    },
    [audio, playback, test, mode]
  );

  const handleRestart = useCallback(() => {
    playback.stop();
    test.restart();
    morseKey.clearSeq();
  }, [playback, test, morseKey]);

  // Clicking a wave in reading mode plays that letter's morse and, if the
  // wave is the currently active letter, also commits it as typed.
  const handleCharClick = useCallback(
    (wIdx, cIdx) => {
      playback.playChar(wIdx, cIdx);
      if (test.finished) return;
      if (wIdx !== test.wordIdx || cIdx !== test.charIdx) return;
      const letter = test.words[wIdx]?.[cIdx];
      if (!letter) return;
      test.commitChar(letter);
      if (cIdx + 1 >= test.words[wIdx].length) {
        test.commitSpace();
      }
    },
    [playback, test]
  );

  return (
    <div className="min-h-svh relative">
      {/* Header — floats at the top of the viewport. Absolute so it doesn't
          take space from <main>, letting main centre on the full viewport. */}
      <div className="absolute top-0 left-0 right-0 px-6 pt-6 z-10">
        <div className="w-full max-w-[880px] mx-auto">
          <Header
            wpm={test.wpm}
            accuracy={test.accuracy}
            settingsOpen={settingsOpen}
            onToggleSettings={() => setSettingsOpen((o) => !o)}
          />
        </div>
      </div>

      {/* Main — vertically centred in the full viewport. */}
      <main className="min-h-svh w-full flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-[880px] flex flex-col">
          <Toolbar
            mode={mode}
            onModeChange={switchMode}
            wordCount={settings.wordCount}
            onWordCountChange={(n) => updateSettings({ wordCount: n })}
            hint={settings.hint}
            onHintChange={(h) => updateSettings({ hint: h })}
            muted={audio.muted}
            onMuteToggle={audio.toggleMute}
            readingPace={readingPace}
            onReadingPaceChange={setReadingPace}
          />

          {/* Field — the time progress is rendered inside each panel's
              existing pill (Writing's "Now" / Reading's progress strip).
              Crossfades on mode change so writing/reading don't pop. */}
          <div
            className="relative"
            style={{
              opacity: modeFading ? 0 : 1,
              transition: `opacity ${MODE_FADE_MS}ms ease`,
            }}
          >
            {!test.finished && mode === 'writing' && (
              <WritingPanel
                words={test.words}
                typed={test.typed}
                wordIdx={test.wordIdx}
                charIdx={test.charIdx}
                finished={test.finished}
                hint={settings.hint}
                currentSeq={morseKey.currentSeq}
                timerProgress={timer.progress}
                visibleLines={VISIBLE_LINES_BY_COUNT[settings.wordCount] ?? 3}
              />
            )}

            {!test.finished && mode === 'reading' && (
              <ReadingPanel
                ref={readingContainerRef}
                words={test.words}
                typed={test.typed}
                wordIdx={test.wordIdx}
                charIdx={test.charIdx}
                finished={test.finished}
                timerProgress={timer.progress}
                onCharClick={handleCharClick}
              />
            )}

            {test.finished && (
              <ResultsCard
                wpm={test.wpm}
                accuracy={test.accuracy}
                elapsed={test.elapsed}
                correctChars={test.correctChars}
                totalChars={test.totalChars}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer — "new test" on top, telegraph key (or matching placeholder)
          below so the button keeps the same vertical position across modes. */}
      <footer className="absolute bottom-0 left-0 right-0 px-6 pb-6 z-10 pointer-events-none">
        <div
          className="w-full max-w-[880px] mx-auto flex flex-col items-center gap-2 pointer-events-auto"
          style={{
            opacity: modeFading ? 0 : 1,
            transition: `opacity ${MODE_FADE_MS}ms ease`,
          }}
        >
          <Controls onRestart={handleRestart} />
          {mode === 'writing' && !test.finished ? (
            <TelegraphKey
              isPressed={morseKey.isPressed}
              onPressDown={async () => {
                await audio.ensureAudio();
                morseKey.pressDown();
              }}
              onPressUp={morseKey.pressUp}
            />
          ) : (
            // Reserve the key's height so the "new test" button doesn't
            // shift down when we're in reading mode (or test is finished).
            <div className="h-[220px]" aria-hidden />
          )}
        </div>
      </footer>

      {/* Settings modal — rendered at the page root so it overlays everything. */}
      <SettingsDrawer
        open={settingsOpen}
        settings={settings}
        onChange={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
