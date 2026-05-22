import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { REVERSE_MORSE } from '../lib/morse';
import { MorseWave } from './MorseWave';

function colorClassFor({ typedCh, targetCh, isCurrent }) {
  if (typedCh !== undefined) {
    if (typedCh === targetCh) return 'rchar correct text-correct';
    return 'rchar incorrect text-incorrect';
  }
  if (isCurrent) return 'rchar current text-accent';
  return 'rchar text-ink-2';
}

export const ReadingPanel = forwardRef(function ReadingPanel(
  { words, typed, wordIdx, charIdx, finished, timerProgress = 0, onCharClick, wpm = 0, accuracy = 100, showStats = false },
  ref
) {
  // The progress bar shows TIME remaining for the current word — depletes
  // from 100% → 0% as the timer ticks down.
  const progressPct = Math.max(0, (1 - timerProgress) * 100);

  // Internal ref so we can drive auto-scroll from inside the component;
  // useImperativeHandle keeps the forwarded ref (used by useMorsePlayback)
  // pointing at the same DOM element.
  const containerRef = useRef(null);
  useImperativeHandle(ref, () => containerRef.current, []);

  // Track whether there's more content below the visible area — drives the
  // bottom fade scrim. Updates on scroll, resize, and content changes.
  const [showBottomScrim, setShowBottomScrim] = useState(false);
  const updateScrim = useCallback(() => {
    const c = containerRef.current;
    if (!c) return setShowBottomScrim(false);
    const overflow = c.scrollHeight > c.clientHeight + 1;
    const atBottom = c.scrollTop + c.clientHeight >= c.scrollHeight - 2;
    setShowBottomScrim(overflow && !atBottom);
  }, []);
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    updateScrim();
    c.addEventListener('scroll', updateScrim, { passive: true });
    const ro = new ResizeObserver(updateScrim);
    ro.observe(c);
    return () => {
      c.removeEventListener('scroll', updateScrim);
      ro.disconnect();
    };
  }, [updateScrim]);
  // Re-check whenever the word list changes (new test / different length).
  useEffect(() => { updateScrim(); }, [words, updateScrim]);

  // Auto-scroll the active letter into view whenever the cursor moves.
  useEffect(() => {
    if (finished) return;
    const container = containerRef.current;
    if (!container) return;
    const rword = container.querySelectorAll('.rword')[wordIdx];
    const rchar = rword?.children[charIdx] || rword?.lastElementChild;
    if (!rchar) return;
    const cRect = container.getBoundingClientRect();
    const rRect = rchar.getBoundingClientRect();
    const pad = 12;
    if (rRect.bottom > cRect.bottom - pad) {
      container.scrollTo({
        top: container.scrollTop + (rRect.bottom - cRect.bottom) + pad * 2,
        behavior: 'smooth',
      });
    } else if (rRect.top < cRect.top + pad) {
      container.scrollTo({
        top: container.scrollTop - (cRect.top - rRect.top) - pad,
        behavior: 'smooth',
      });
    }
  }, [wordIdx, charIdx, finished]);

  return (
    <div className="relative pt-12">
      {/* Waves grow to fit their content. A generous max-height (≈ half the
          viewport) only kicks in for big tests, at which point scroll
          takes over. Small tests just show everything at once. */}
      <div className="relative">
      <div
        ref={containerRef}
        className="flex flex-wrap gap-x-6 gap-y-5 overflow-y-auto overflow-x-hidden p-3 [scrollbar-width:thin] [scrollbar-color:theme(colors.line-2)_transparent]"
        style={{ maxHeight: '50vh' }}
      >
        {words.map((w, wi) => (
          <span key={wi} className="rword inline-flex gap-1">
            {[...w].map((targetCh, ci) => {
              const typedCh = (typed[wi] || '')[ci];
              const isCurrent = wi === wordIdx && ci === charIdx && !finished;
              return (
                <button
                  key={ci}
                  type="button"
                  onClick={() => onCharClick?.(wi, ci)}
                  className={[
                    'flex flex-col items-center gap-1.5 px-1.5 py-1.5 rounded-[10px] cursor-pointer',
                    'transition-[background-color,transform] duration-150 hover:bg-surface-2',
                    'focus:outline-none',
                    colorClassFor({ typedCh, targetCh, isCurrent }),
                    isCurrent ? 'bg-accent-dim shadow-[inset_0_0_0_1px_theme(colors.accent)]' : '',
                  ].join(' ')}
                >
                  <span className="rwave block leading-none">
                    <MorseWave pattern={REVERSE_MORSE[targetCh] || ''} />
                  </span>
                  <span className="text-[15px] min-h-[1.1em] leading-none lowercase">
                    {typedCh !== undefined ? typedCh : ' '}
                  </span>
                </button>
              );
            })}
          </span>
        ))}
      </div>
      {/* Bottom fade scrim — only visible when there's more below to scroll. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 rounded-b-md transition-opacity duration-200"
        style={{
          opacity: showBottomScrim ? 1 : 0,
          background: 'linear-gradient(to bottom, rgba(14,14,13,0) 0%, #0e0e0d 100%)',
        }}
      />
      </div>

      {/* Time pill — mirrors writing mode's "Now" pill. A faint white-ish
          fill depletes from the right as the per-word timer ticks down. */}
      <div className="relative overflow-hidden flex items-center gap-2.5 h-[36px] mt-5 px-3.5 bg-surface border border-line rounded-full">
        {!finished && (
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 bg-ink/10 rounded-full pointer-events-none"
            style={{
              width: `${progressPct}%`,
              transition: 'width 80ms linear',
            }}
          />
        )}
        <span className="relative text-[10px] tracking-[0.16em] uppercase text-ink-3">Word</span>
        <div className="relative flex-1" />
        <span className="relative text-[11px] text-ink-3 tracking-[0.06em] whitespace-nowrap tabular-nums">
          {wordIdx} / {words.length}
        </span>
        {showStats && !finished && (
          <span className="relative flex items-center gap-2 text-[11px] text-ink-3 tracking-[0.06em] whitespace-nowrap tabular-nums pl-2 ml-1 border-l border-line">
            <span><b className="text-accent font-medium">{wpm}</b> wpm</span>
            <span className="text-line-2">·</span>
            <span><b className="text-accent font-medium">{accuracy}</b>%</span>
          </span>
        )}
      </div>

      <p className="text-center text-ink-3 text-[12px] tracking-[0.04em] mt-2">
        listen to the morse and type the letter on your keyboard
      </p>
    </div>
  );
});
