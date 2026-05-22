import { useEffect } from 'react';
import { CloseIcon } from './Icons';

const STEPS = {
  secondsPerWord: [5, 10, 15, 30, 60],
  dotMs:          [80, 120, 140, 180, 240],
  charSpaceMs:    [400, 700, 1000, 1500, 2200],
  wordSpaceMs:    [1000, 1600, 2200, 3000, 4000],
};

// Stepped slider — a row of clickable dots along a thin track, with the
// active dot enlarged. Value snaps to the closest preset.
function SteppedSlider({ label, value, steps, format, onChange }) {
  const currentIdx = closestIndex(steps, value);
  const fillPct = steps.length > 1 ? (currentIdx / (steps.length - 1)) * 100 : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-baseline">
        <label className="text-[12px] text-ink-2">{label}</label>
        <span className="text-[12px] text-accent tabular-nums">
          {format ? format(value) : value}
        </span>
      </div>

      {/* Track + dots */}
      <div className="relative h-6 flex items-center px-[7px]">
        {/* Inactive track */}
        <div className="absolute left-[7px] right-[7px] top-1/2 h-[3px] -translate-y-1/2 bg-line-2 rounded-full" />
        {/* Filled portion */}
        <div
          className="absolute left-[7px] top-1/2 h-[3px] -translate-y-1/2 bg-accent rounded-full transition-[width] duration-150"
          style={{ width: `calc((100% - 14px) * ${fillPct} / 100)` }}
        />
        {/* Dots */}
        <div className="relative w-full flex items-center justify-between">
          {steps.map((s, i) => {
            const active = i === currentIdx;
            const filled = i < currentIdx;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange(s)}
                aria-label={String(s)}
                className={[
                  'relative z-10 rounded-full transition-all duration-150',
                  active
                    ? 'w-[14px] h-[14px] bg-accent ring-[3px] ring-shell'
                    : filled
                    ? 'w-[8px] h-[8px] bg-accent hover:scale-125'
                    : 'w-[8px] h-[8px] bg-line-2 hover:bg-ink-3 hover:scale-125',
                ].join(' ')}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-5">
      <h3 className="text-[10px] tracking-[0.22em] uppercase text-ink-3 font-medium">
        {title}
      </h3>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

export function SettingsDrawer({ open, settings, onChange, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'transition-opacity duration-200',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      ].join(' ')}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
      />

      <div
        className={[
          'relative w-full max-w-[460px] bg-surface border border-line rounded-2xl shadow-2xl',
          'transition-transform duration-200',
          open ? 'translate-y-0 scale-100' : '-translate-y-2 scale-[0.98]',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-line">
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-ink-2 font-medium">
            Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 flex items-center justify-center transition-colors"
          >
            <CloseIcon className="w-[15px] h-[15px]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-7 flex flex-col gap-8">
          <Section title="Word timer">
            <SteppedSlider
              label="Time per word"
              value={settings.secondsPerWord}
              steps={STEPS.secondsPerWord}
              format={(v) => `${v} s`}
              onChange={(v) => onChange({ secondsPerWord: v })}
            />
          </Section>

          <Section title="Morse timing">
            <SteppedSlider
              label="Tap length"
              value={settings.dotMs}
              steps={STEPS.dotMs}
              format={(v) => `${v} ms`}
              onChange={(v) => onChange({ dotMs: v })}
            />
            <SteppedSlider
              label="Pause between letters"
              value={settings.charSpaceMs}
              steps={STEPS.charSpaceMs}
              format={(v) => `${v} ms`}
              onChange={(v) => onChange({ charSpaceMs: v })}
            />
            <SteppedSlider
              label="Pause between words"
              value={settings.wordSpaceMs}
              steps={STEPS.wordSpaceMs}
              format={(v) => `${v} ms`}
              onChange={(v) => onChange({ wordSpaceMs: v })}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function closestIndex(steps, value) {
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < steps.length; i++) {
    const d = Math.abs(steps[i] - value);
    if (d < bestDiff) { bestDiff = d; best = i; }
  }
  return best;
}
