// Builds an SVG path string for a morse pattern, rendered as audio-style
// sine bursts (dots = short, dashes = long) with flat "silence" between.
export function buildWavePath(pattern) {
  const DOT_W = 14;
  const DASH_W = 36;
  const GAP_W = 6;
  const H = 28;
  const AMP = 9;
  const CY = H / 2;
  const CYCLES_PER_PX = 0.18;

  let totalW = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (i > 0) totalW += GAP_W;
    totalW += pattern[i] === '.' ? DOT_W : DASH_W;
  }
  if (totalW === 0) totalW = 1;

  let d = '';
  let x = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (i > 0) {
      d += `M${x} ${CY}L${x + GAP_W} ${CY}`;
      x += GAP_W;
    }
    const w = pattern[i] === '.' ? DOT_W : DASH_W;
    const steps = Math.max(14, Math.round(w * 1.6));
    d += `M${x} ${CY}`;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const px = x + t * w;
      // Sin envelope — fades in & out at the edges so bursts look like real audio.
      const env = Math.sin(Math.PI * t);
      const py = CY - AMP * env * Math.sin(2 * Math.PI * CYCLES_PER_PX * (px - x));
      d += `L${px.toFixed(2)} ${py.toFixed(2)}`;
    }
    x += w;
  }
  d += `M${x} ${CY}L${x + 2} ${CY}`;
  totalW += 2;

  return { d, width: totalW, height: H };
}
