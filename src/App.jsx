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
  const [isPlaying, setIsPlaying] = useState(false);

  const playback = useMorsePlayback({
    words: test.words,
    ensureAudio: audio.ensureAudio,
    synthRef: audio.synthRef,
    containerRef: readingContainerRef,
    isReading: mode === 'reading',
  });
  useEffect(() => {
    playback.onPlayingChange(setIsPlaying);
  }, [playback]);

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

  // ── Reading mode: auto-play current word ──
  useEffect(() => {
    if (mode !== 'reading' || test.finished) return;
    if (!test.words.length) return;
    const id = setTimeout(() => playback.playWord(test.wordIdx), 50);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, test.wordIdx, test.words]);

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
      playback.stop();
      setMode(m);
      test.restart();
      if (m === 'reading') await audio.ensureAudio();
    },
    [audio, playback, test]
  );

  const handleRestart = useCallback(() => {
    playback.stop();
    test.restart();
    morseKey.clearSeq();
  }, [playback, test, morseKey]);

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
          />

          {/* Field — the time progress is rendered inside each panel's
              existing pill (Writing's "Now" / Reading's progress strip). */}
          <div className="relative">
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
                onReplay={() => playback.playWord(test.wordIdx)}
                isPlaying={isPlaying}
                timerProgress={timer.progress}
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

          <div className="mt-8">
            <Controls onRestart={handleRestart} />
          </div>
        </div>
      </main>

      {/* Footer — telegraph key floats at the bottom of the viewport,
          independent of main, so main can centre on the full viewport. */}
      <footer className="absolute bottom-0 left-0 right-0 px-6 pb-6 z-10 pointer-events-none">
        <div className="w-full max-w-[880px] mx-auto flex justify-center pointer-events-auto">
          {mode === 'writing' && !test.finished && (
            <TelegraphKey
              isPressed={morseKey.isPressed}
              onPressDown={async () => {
                await audio.ensureAudio();
                morseKey.pressDown();
              }}
              onPressUp={morseKey.pressUp}
            />
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
