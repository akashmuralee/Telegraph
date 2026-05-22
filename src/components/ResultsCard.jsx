import { WpmChart } from './WpmChart';

// "Consistency" — 100% minus the coefficient of variation of WPM samples.
function calcConsistency(samples) {
  if (!samples || samples.length < 2) return 100;
  const wpms = samples.map((s) => s.wpm);
  const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
  if (mean <= 0) return 0;
  const variance = wpms.reduce((sum, w) => sum + (w - mean) ** 2, 0) / wpms.length;
  const stddev = Math.sqrt(variance);
  const cv = stddev / mean;
  return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
}

function fmtSession(sec) {
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${String(h).padStart(2, '0')}:${mm}:${ss}`;
}

function StatBlock({ label, value, sub, big, accent = true }) {
  const valueSize = big ? 'text-[64px] leading-[0.9]' : 'text-[32px] leading-[1]';
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] text-ink-3 lowercase tracking-wide">{label}</span>
      <span className={[valueSize, accent ? 'text-accent' : 'text-ink', 'font-light tabular-nums'].join(' ')}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-ink-3 tabular-nums">{sub}</span>}
    </div>
  );
}

export function ResultsCard({
  wpm,
  accuracy,
  elapsed,
  correctChars,
  totalChars,
  rawWpm = 0,
  samples = [],
  wordCount = 0,
}) {
  const incorrect = Math.max(0, totalChars - correctChars);
  const consistency = calcConsistency(samples);

  return (
    <div className="w-full">
      {/* Top row: big WPM / ACC + test type on the left, chart on the right.
          items-stretch makes the chart match the stats column's height; the
          inner flex wrapper gives the SVG a definite height to fill. */}
      <div className="flex gap-8 items-stretch">
        <div className="flex flex-col gap-5 min-w-[140px]">
          <StatBlock label="wpm" value={wpm} big />
          <StatBlock label="acc" value={`${accuracy}%`} big />
          <div className="mt-2 flex flex-col gap-0.5">
            <span className="text-[12px] text-ink-3 lowercase tracking-wide">test type</span>
            <span className="text-[14px] text-accent">words {wordCount}</span>
            <span className="text-[14px] text-accent">english</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 flex">
          <WpmChart samples={samples} />
        </div>
      </div>

      {/* Bottom row: small stat cells */}
      <div className="grid grid-cols-4 gap-6 mt-10">
        <StatBlock label="raw" value={rawWpm} />
        <StatBlock
          label="characters"
          value={`${correctChars}/${incorrect}/0/0`}
        />
        <StatBlock label="consistency" value={`${consistency}%`} />
        <StatBlock
          label="time"
          value={`${Math.round(elapsed)}s`}
          sub={`${fmtSession(elapsed)} session`}
        />
      </div>
    </div>
  );
}
