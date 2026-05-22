import { useEffect, useRef } from 'react';
import { REVERSE_MORSE } from '../lib/morse';

function Char({ target, typed, isCurrent }) {
  let cls = 'relative inline-block';
  let body = target;
  if (typed !== undefined) {
    if (target === undefined) {
      cls += ' text-incorrect/70';
      body = typed;
    } else if (typed === target) {
      cls += ' text-correct';
    } else {
      cls += ' text-incorrect';
    }
  }
  return (
    <span className={cls + (isCurrent ? ' caret-left' : '')}>{body}</span>
  );
}

export function WritingPanel({
  words,
  typed,
  wordIdx,
  charIdx,
  finished,
  hint,
  currentSeq,
  timerProgress = 0,
}) {
  const wrapRef = useRef(null);

  // Keep the active word scrolled into view (middle line).
  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const active = root.querySelectorAll('[data-word]')[wordIdx];
    if (!active) return;
    const lineH = parseFloat(getComputedStyle(root).lineHeight) || 32;
    root.scrollTop = Math.max(0, active.offsetTop - lineH);
  }, [wordIdx]);

  const expected = words[wordIdx]?.[charIdx];
  const expectedCode = expected ? REVERSE_MORSE[expected] : null;

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className="text-[24px] leading-[1.7] tracking-[0.04em] text-pending overflow-hidden relative"
        style={{ minHeight: 'calc(1.7em * 3)', maxHeight: 'calc(1.7em * 3)' }}
      >
        {words.map((w, wi) => {
          const tw = typed[wi] || '';
          const maxLen = Math.max(w.length, tw.length);
          const chars = [];
          for (let ci = 0; ci < maxLen; ci++) {
            const isCurrent = wi === wordIdx && ci === charIdx && !finished;
            chars.push(
              <Char
                key={ci}
                target={w[ci]}
                typed={tw[ci]}
                isCurrent={isCurrent}
              />
            );
          }
          const endCurrent = wi === wordIdx && charIdx >= maxLen && !finished;
          return (
            <span
              key={wi}
              data-word={wi}
              className="inline-block mr-[0.55em] whitespace-nowrap align-top"
            >
              {chars}
              {/* Zero-width space gives this marker a text baseline, so
                  the caret aligns with character carets instead of dropping. */}
              <span className={'relative inline-block w-px' + (endCurrent ? ' caret-left' : '')}>
                {'​'}
              </span>
            </span>
          );
        })}
      </div>

      {/* "Now" pill — doubles as the per-word time progress bar. A faint
          accent fill depletes from the right as the timer ticks down.
          Fixed height so toggling the hint on/off doesn't shift the bar. */}
      <div className="relative overflow-hidden flex items-center gap-2.5 h-[36px] mt-5 px-3.5 bg-surface border border-line rounded-full">
        {!finished && (
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 bg-ink/10 rounded-full pointer-events-none"
            style={{
              width: `${Math.max(0, (1 - timerProgress) * 100)}%`,
              transition: 'width 80ms linear',
            }}
          />
        )}
        <span className="relative text-[10px] tracking-[0.16em] uppercase text-ink-3">Now</span>
        <div className="relative flex items-center gap-1.5 flex-1 min-h-[8px]">
          {[...currentSeq].map((ch, i) => (
            <div
              key={i}
              className={
                'rounded-full bg-accent flex-shrink-0 animate-pip-in ' +
                (ch === '.' ? 'w-[7px] h-[7px]' : 'w-[20px] h-[7px]')
              }
            />
          ))}
        </div>
        {hint && !finished && expected !== undefined && (
          <span className="relative text-[11px] text-ink-3 tracking-[0.08em] whitespace-nowrap">
            {expected.toUpperCase()}
            <b className="text-accent font-medium ml-1.5">{expectedCode}</b>
          </span>
        )}
        {hint && !finished && expected === undefined && words[wordIdx] && (
          <span className="relative text-[11px] text-ink-3 tracking-[0.08em] whitespace-nowrap">
            next: <b className="text-accent font-medium ml-1.5">space</b>
          </span>
        )}
      </div>
    </div>
  );
}
