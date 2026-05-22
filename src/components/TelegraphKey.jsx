// Side-view telegraph key. The lever rotates around a pivot; the knob end
// dips on press and the right-hand spring end lifts, just like a real key.
export function TelegraphKey({ isPressed, onPressDown, onPressUp }) {
  const angle = isPressed ? 4 : -1.5;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onPressDown(); }}
        onMouseUp={(e) => { e.preventDefault(); onPressUp(); }}
        onMouseLeave={() => onPressUp()}
        onTouchStart={(e) => { e.preventDefault(); onPressDown(); }}
        onTouchEnd={(e) => { e.preventDefault(); onPressUp(); }}
        aria-label="Telegraph key"
        className="block focus:outline-none cursor-pointer w-full max-w-[360px]"
      >
        <svg viewBox="0 0 360 190" className="w-full" fill="none">
          {/* Floor shadow */}
          <ellipse cx="180" cy="178" rx="150" ry="5" fill="#000" opacity="0.45" />

          {/* Base */}
          <rect x="20" y="132" width="320" height="34" rx="4"
            className="fill-surface-2 stroke-line-2" strokeWidth="1" />
          <rect x="20" y="132" width="320" height="3" className="fill-line" />

          {/* Pivot column */}
          <rect x="170" y="92" width="20" height="42" rx="2" className="fill-line-2" />

          {/* Left contact post (under the knob) */}
          <rect x="78" y="112" width="8" height="22" className="fill-line" />

          {/* Right spring post */}
          <rect x="284" y="112" width="8" height="22" className="fill-line" />

          {/* Glow under knob while pressed */}
          {isPressed && (
            <circle cx="90" cy="122" r="16" className="fill-accent" opacity="0.22" />
          )}

          {/* Lever group (rotates around pivot) */}
          <g style={{
            transformBox: 'view-box',
            transformOrigin: '180px 100px',
            transform: `rotate(${angle}deg)`,
            transition: 'transform 110ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <rect x="50" y="96" width="260" height="8" rx="3" className="fill-line-2" />
            <rect x="84" y="60" width="12" height="38" className="fill-line-2" />
            <circle cx="90" cy="52" r="22"
              className={isPressed ? 'fill-accent-dim stroke-accent' : 'fill-surface stroke-line-2'}
              strokeWidth={isPressed ? 2 : 1.5} />
            <circle cx="90" cy="52" r="10"
              className={isPressed ? 'fill-accent' : 'fill-line-2'} />
            <circle cx="86" cy="48" r="3" className="fill-ink" opacity="0.5" />
            <circle cx="300" cy="100" r="6"
              className="fill-line-2 stroke-line" strokeWidth="1" />
          </g>

          {/* Pivot pin (rendered on top so it stays visually anchored) */}
          <circle cx="180" cy="100" r="3.5"
            className={isPressed ? 'fill-accent' : 'fill-ink-3'} />
        </svg>
      </button>

      <p className="text-[11px] text-ink-3 tracking-[0.06em] text-center leading-[1.6]">
        tap the knob · or hold <kbd>space</kbd>
        <br />
        short press = dot, long press = dash
      </p>
    </div>
  );
}
