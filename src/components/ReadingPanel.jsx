import { forwardRef } from 'react';
import { REVERSE_MORSE } from '../lib/morse';
import { MorseWave } from './MorseWave';
import { RestartIcon } from './Icons';

function colorClassFor({ typedCh, targetCh, isCurrent }) {
  if (typedCh !== undefined) {
    if (typedCh === targetCh) return 'rchar correct text-correct';
    return 'rchar incorrect text-incorrect';
  }
  if (isCurrent) return 'rchar current text-accent';
  return 'rchar text-ink-2';
}

export const ReadingPanel = forwardRef(function ReadingPanel(
  { words, typed, wordIdx, charIdx, finished, onReplay, isPlaying, timerProgress = 0 },
  ref
) {
  // The progress bar shows TIME remaining for the current word — depletes
  // from 100% → 0% as the timer ticks down.
  const progressPct = Math.max(0, (1 - timerProgress) * 100);

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex flex-wrap gap-x-6 gap-y-5 max-h-[180px] min-h-[140px] overflow-y-auto overflow-x-hidden py-1 px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {words.map((w, wi) => (
          <span key={wi} className="rword inline-flex gap-1">
            {[...w].map((targetCh, ci) => {
              const typedCh = (typed[wi] || '')[ci];
              const isCurrent = wi === wordIdx && ci === charIdx && !finished;
              return (
                <span
                  key={ci}
                  className={[
                    'flex flex-col items-center gap-1.5 px-1.5 py-1.5 rounded-[10px]',
                    'transition-[background-color,transform] duration-150',
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
                </span>
              );
            })}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={onReplay}
          aria-label="Replay sound"
          title="Replay"
          className={[
            'w-[34px] h-[34px] rounded-full border flex items-center justify-center flex-shrink-0',
            'transition-colors duration-150',
            isPlaying
              ? 'border-accent text-accent'
              : 'border-line text-ink-2 hover:border-accent hover:text-accent',
          ].join(' ')}
        >
          <RestartIcon className="w-[14px] h-[14px]" />
        </button>
        <div className="flex-1 h-1 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: progressPct + '%' }}
          />
        </div>
        <span className="text-[11px] text-ink-3 tracking-[0.06em] min-w-[56px] text-right">
          {wordIdx} / {words.length}
        </span>
      </div>

      <p className="text-center text-ink-3 text-[12px] tracking-[0.04em] mt-2">
        listen to the morse and type the letter on your keyboard
      </p>
    </div>
  );
});
