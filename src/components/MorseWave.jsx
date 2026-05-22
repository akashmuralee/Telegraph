import { useEffect, useRef } from 'react';
import { buildWavePath } from '../lib/waveform';

// Two overlaid paths:
//   .bg — always visible at the current wave color
//   .fg — accent, hidden by default (full dashoffset). Audio playback animates
//          stroke-dashoffset → 0 to "draw" the wave in sync with the tones.
export function MorseWave({ pattern }) {
  const fgRef = useRef(null);
  const { d, width, height } = buildWavePath(pattern);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const len = fg.getTotalLength();
    fg.style.setProperty('--len', len);
    fg.style.strokeDasharray = String(len);
    fg.style.strokeDashoffset = String(len);
  }, [d]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block overflow-visible"
    >
      <path
        d={d}
        className="bg"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        ref={fgRef}
        d={d}
        className="fg"
        fill="none"
        stroke="#e8a825"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ opacity: 0 }}
      />
    </svg>
  );
}
