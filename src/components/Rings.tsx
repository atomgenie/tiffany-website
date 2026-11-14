/**
 * Contour lines ("courbes de niveau") from Tiffany's portfolio cover and CV:
 * organic concentric rings, generated deterministically at build time.
 */

function random(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function ringPath(cx: number, cy: number, rx: number, ry: number, k: number, phases: number[], wobble: number) {
  const n = 72;
  const points: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r =
      1 + wobble * (0.5 * Math.sin(3 * a + phases[0]) + 0.3 * Math.sin(5 * a + phases[1]) + 0.2 * Math.sin(2 * a + phases[2]));
    points.push([cx + Math.cos(a) * rx * k * r, cy + Math.sin(a) * ry * k * r]);
  }
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(points[0][0])},${f(points[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    // Catmull-Rom → cubic Bézier for smooth closed curves.
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + "Z";
}

export function Rings({
  rings = 10,
  seed = 7,
  className,
  width = 600,
  height = 400,
}: {
  rings?: number;
  seed?: number;
  className?: string;
  width?: number;
  height?: number;
}) {
  const rnd = random(seed);
  const phases = [rnd() * 6, rnd() * 6, rnd() * 6];
  const cx = width / 2;
  const cy = height / 2;
  const rx = width * 0.46;
  const ry = height * 0.46;
  const paths = Array.from({ length: rings }, (_, i) => {
    const k = 0.18 + 0.82 * ((i + 1) / rings);
    const shift = (1 - k) * 0.25;
    return ringPath(cx - rx * shift, cy - ry * shift * 0.6, rx, ry, k, phases.map((p) => p + i * 0.18), 0.09 + 0.04 * k);
  });
  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
        {paths.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
