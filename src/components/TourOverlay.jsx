import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CloseIcon } from './Icons';

// Spotlight-style tour. Each step optionally targets a `data-tour` element;
// the overlay cuts a rounded hole around it and floats a tooltip nearby.
const STEPS = [
  {
    title: 'Welcome to Monkey Morse',
    body: 'A clean place to practice morse code by typing — monkeytype, but for dits and dahs.',
  },
  {
    title: 'This is a practice tool',
    body: "Monkey Morse won't teach you the alphabet from scratch. If you're brand new to morse, learn the basics first at",
    link: { label: 'morse.withgoogle.com/learn', href: 'https://morse.withgoogle.com/learn/' },
    bodyAfter: ' then come back here to practice.',
  },
  {
    title: 'Pick a mode',
    body: 'Writing sends morse with the telegraph key. Reading plays morse for you to decode.',
    target: '[data-tour="mode"]',
  },
  {
    title: 'Test length',
    body: 'Choose how many words per session — 15 / 25 / 50 / 100.',
    target: '[data-tour="word-count"]',
  },
  {
    title: 'This is your field',
    body: 'Words appear here in writing mode, morse waves in reading. The per-word timer lives in the pill at the bottom.',
    target: '[data-tour="field"]',
  },
  {
    title: 'Your input',
    body: 'Writing: tap the telegraph key or hold space (short = dot, long = dash). Reading: type the matching letter on your keyboard and click any wave to replay it.',
    target: '[data-tour="footer"]',
  },
  {
    title: 'Settings & help',
    body: 'Adjust speed and mute audio via the gear icon. Re-open this tour any time with the help icon.',
    target: '[data-tour="header-tools"]',
  },
  {
    title: "You're set",
    body: 'Press the key (writing) or hit start (reading) to begin. Good luck.',
  },
];

const PAD = 10;
const TOOLTIP_W = 380;
const TOOLTIP_H_EST = 240;
const GAP = 16;
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const DUR = 320;

function measure(selector) {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
}

function tooltipPos(rect) {
  if (!rect) {
    const tx = window.innerWidth / 2 - TOOLTIP_W / 2;
    const ty = window.innerHeight / 2 - TOOLTIP_H_EST / 2;
    return { tx, ty };
  }
  const cx = rect.x + rect.width / 2;
  const tx = Math.max(GAP, Math.min(window.innerWidth - TOOLTIP_W - GAP, cx - TOOLTIP_W / 2));
  // Below if the target sits in the upper 55% of the viewport, else above.
  const below = rect.y + rect.height < window.innerHeight * 0.55;
  const ty = below
    ? rect.y + rect.height + PAD + GAP
    : Math.max(GAP, rect.y - PAD - GAP - TOOLTIP_H_EST);
  return { tx, ty };
}

export function TourOverlay({ open, onClose }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  // Disable transitions for the first frame after the rect first appears,
  // so the spotlight doesn't slide in from the previous step's geometry.
  const [primed, setPrimed] = useState(false);
  const wasNullRef = useRef(true);

  const current = STEPS[step];

  // Reset to step 0 on open.
  useEffect(() => {
    if (open) {
      setStep(0);
      setPrimed(false);
      wasNullRef.current = true;
    }
  }, [open]);

  // Measure the target whenever the step changes, plus react to resize /
  // target size changes. No polling interval — that was causing the
  // mid-transition jitter.
  useLayoutEffect(() => {
    if (!open) return;

    const update = () => setRect(measure(current.target));
    update();

    window.addEventListener('resize', update);

    let ro;
    const el = current.target ? document.querySelector(current.target) : null;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }

    // One delayed remeasure to catch layout shifts from CSS transitions
    // (e.g. mode crossfade, field height animation).
    const t = setTimeout(update, 360);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', update);
      ro?.disconnect();
    };
  }, [open, current.target]);

  // When rect transitions from null → set, lock transitions for one frame
  // so the spotlight pops into place at its real position instead of
  // sliding in from the last known coordinates.
  useLayoutEffect(() => {
    if (rect === null) {
      wasNullRef.current = true;
      setPrimed(false);
      return;
    }
    if (wasNullRef.current) {
      wasNullRef.current = false;
      setPrimed(false);
      // Two rAFs ensures the initial style commits before transitions enable.
      requestAnimationFrame(() => requestAnimationFrame(() => setPrimed(true)));
    } else {
      setPrimed(true);
    }
  }, [rect]);

  // Keyboard nav.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStep((s) => Math.max(0, s - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const isLast = step === STEPS.length - 1;
  const { tx, ty } = tooltipPos(rect);

  // Build the transition string — disabled on the first frame after rect
  // appears, enabled afterwards.
  const moveTransition = primed
    ? `transform ${DUR}ms ${EASE}, width ${DUR}ms ${EASE}, height ${DUR}ms ${EASE}, opacity 220ms ease`
    : 'opacity 220ms ease';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      className={[
        'fixed inset-0 z-50 pointer-events-none',
        'transition-opacity duration-200',
        open ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      {/* Flat backdrop scrim — used on non-target steps (Welcome / Practice
          tool / Ready). When a target is highlighted, this fades out and
          the cutout element's box-shadow takes over as the dim layer. */}
      <div
        className="absolute inset-0 bg-black/70"
        style={{
          opacity: rect ? 0 : 1,
          transition: 'opacity 220ms ease',
        }}
      />
      <div
        aria-hidden
        className="absolute top-0 left-0 rounded-xl pointer-events-none"
        style={{
          opacity: rect ? 1 : 0,
          width: (rect?.width ?? 0) + PAD * 2,
          height: (rect?.height ?? 0) + PAD * 2,
          transform: `translate3d(${(rect?.x ?? 0) - PAD}px, ${(rect?.y ?? 0) - PAD}px, 0)`,
          boxShadow: '0 0 0 100vmax rgba(0, 0, 0, 0.72)',
          transition: moveTransition,
          willChange: 'transform, width, height',
        }}
      />

      {/* Highlight ring */}
      <div
        aria-hidden
        className="absolute top-0 left-0 rounded-xl pointer-events-none ring-2 ring-accent/70 shadow-[0_0_0_4px_rgba(232,168,37,0.12)]"
        style={{
          opacity: rect ? 1 : 0,
          width: (rect?.width ?? 0) + PAD * 2,
          height: (rect?.height ?? 0) + PAD * 2,
          transform: `translate3d(${(rect?.x ?? 0) - PAD}px, ${(rect?.y ?? 0) - PAD}px, 0)`,
          transition: moveTransition,
          willChange: 'transform, width, height',
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute top-0 left-0 pointer-events-auto bg-surface border border-line rounded-2xl shadow-2xl"
        style={{
          width: TOOLTIP_W,
          transform: `translate3d(${tx}px, ${ty}px, 0)`,
          transition: `transform ${DUR}ms ${EASE}`,
          willChange: 'transform',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close tour"
          className="absolute top-3 right-3 w-7 h-7 rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 flex items-center justify-center transition-colors"
        >
          <CloseIcon className="w-[14px] h-[14px]" />
        </button>

        <div className="px-7 pt-7 pb-5 flex flex-col gap-3">
          <span className="text-[10px] tracking-[0.22em] uppercase text-ink-3 font-medium">
            Step {step + 1} of {STEPS.length}
          </span>
          <h2 className="text-[18px] font-medium text-ink leading-tight">{current.title}</h2>
          <p className="text-[13px] leading-[1.6] text-ink-2">
            {current.body}
            {current.link && (
              <>
                {' '}
                <a
                  href={current.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-[3px] decoration-accent/40 hover:decoration-accent transition-colors"
                >
                  {current.link.label}&nbsp;↗
                </a>
                {current.bodyAfter || ''}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-line">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={[
                  'h-1.5 rounded-full transition-all duration-200',
                  i === step ? 'w-5 bg-accent' : 'w-1.5 bg-line-2 hover:bg-ink-3',
                ].join(' ')}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="px-3 py-1.5 text-[11px] tracking-[0.1em] uppercase text-ink-3 hover:text-ink rounded-full transition-colors"
              >
                back
              </button>
            )}
            <button
              onClick={() => (isLast ? onClose?.() : setStep((s) => s + 1))}
              className="px-4 py-1.5 text-[11px] tracking-[0.1em] uppercase text-accent bg-accent-dim hover:bg-accent/20 rounded-full transition-colors"
            >
              {isLast ? "let's go" : 'next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
