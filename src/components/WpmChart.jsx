// Compact WPM-over-time chart drawn as inline SVG (no chart lib dep).
// Two lines:
//   accent solid  → live WPM (correct chars only)
//   ink-2  solid  → raw  WPM (all chars typed)
// Plus a dashed accent horizontal line at the average WPM.

const W = 800;
const H = 240;
const PAD = { l: 50, r: 40, t: 16, b: 28 };

function yTicks(max) {
  // 5 evenly spaced ticks 0..max
  return Array.from({ length: 5 }, (_, i) => Math.round((max * i) / 4));
}

export function WpmChart({ samples }) {
  if (!samples || samples.length < 2) {
    return (
      <div className="flex items-center justify-center h-[240px] text-[12px] text-ink-3">
        Not enough samples to plot — try a longer test.
      </div>
    );
  }

  const maxT = Math.max(...samples.map((s) => s.t));
  const maxRawWpm = Math.max(20, ...samples.map((s) => Math.max(s.wpm, s.rawWpm)));
  // Round Y-max up to a clean multiple of 20.
  const yMax = Math.max(20, Math.ceil((maxRawWpm * 1.15) / 20) * 20);

  const toX = (t) => PAD.l + (t / maxT) * (W - PAD.l - PAD.r);
  const toY = (v) => H - PAD.b - (Math.max(0, Math.min(v, yMax)) / yMax) * (H - PAD.t - PAD.b);

  const linePath = (key) =>
    samples
      .map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(s.t).toFixed(1)} ${toY(s[key]).toFixed(1)}`)
      .join(' ');

  const wpmAvg = Math.round(
    samples.reduce((sum, s) => sum + s.wpm, 0) / samples.length
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full h-full"
      preserveAspectRatio="none"
    >
      {/* Y-axis grid + labels */}
      {yTicks(yMax).map((v) => {
        const y = toY(v);
        return (
          <g key={v}>
            <line
              x1={PAD.l}
              y1={y}
              x2={W - PAD.r}
              y2={y}
              stroke="#2e2e2b"
              strokeWidth="1"
            />
            <text
              x={PAD.l - 8}
              y={y + 4}
              fill="#a0a099"
              fontSize="10"
              textAnchor="end"
              fontFamily="DM Mono, monospace"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* X-axis baseline */}
      <line
        x1={PAD.l}
        y1={H - PAD.b}
        x2={W - PAD.r}
        y2={H - PAD.b}
        stroke="#3a3a37"
        strokeWidth="1"
      />

      {/* X labels at start, middle, end */}
      {[0, maxT / 2, maxT].map((t, i) => (
        <text
          key={i}
          x={toX(t)}
          y={H - PAD.b + 16}
          fill="#a0a099"
          fontSize="10"
          textAnchor="middle"
          fontFamily="DM Mono, monospace"
        >
          {t.toFixed(t < 1 ? 1 : 0)}
        </text>
      ))}

      {/* Y-axis title */}
      <text
        x={14}
        y={(H - PAD.t - PAD.b) / 2 + PAD.t}
        fill="#a0a099"
        fontSize="10"
        textAnchor="middle"
        fontFamily="DM Mono, monospace"
        transform={`rotate(-90 14 ${(H - PAD.t - PAD.b) / 2 + PAD.t})`}
      >
        Words per Minute
      </text>

      {/* Raw WPM line */}
      <path
        d={linePath('rawWpm')}
        stroke="#a0a099"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Live WPM line */}
      <path
        d={linePath('wpm')}
        stroke="#e8a825"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Average dashed line */}
      <line
        x1={PAD.l}
        y1={toY(wpmAvg)}
        x2={W - PAD.r}
        y2={toY(wpmAvg)}
        stroke="#e8a825"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        opacity="0.7"
      />
    </svg>
  );
}
