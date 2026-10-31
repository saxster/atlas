// Pure 2×2 matrix algebra for Fig. M.1: The 2×2 Matrix Sandbox.
// Zero DOM or Three.js imports; verified independently in checks.mjs.

export const apply = (m, [x, y]) => [m.a * x + m.b * y, m.c * x + m.d * y];
export const det = m => m.a * m.d - m.b * m.c;
export const trace = m => m.a + m.d;
export const discriminant = m => trace(m) ** 2 - 4 * det(m);

export const unitSquareCorners = m => [
  [0, 0],
  apply(m, [1, 0]),
  apply(m, [1, 1]),
  apply(m, [0, 1]),
];

export function shoelaceArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return 0.5 * s;
}

export function eigenInfo(m) {
  const tr = trace(m), d = det(m), disc = tr * tr - 4 * d;
  if (disc < -1e-9) {
    return { real: false, l1: 0.5 * tr, l2: 0.5 * tr, im: 0.5 * Math.sqrt(-disc), dirs: [] };
  }
  const s = Math.sqrt(Math.max(0, disc));
  const l1 = 0.5 * (tr + s), l2 = 0.5 * (tr - s);
  const dirFor = lam => {
    const r1x = m.a - lam, r1y = m.b, r2x = m.c, r2y = m.d - lam;
    let vx = -r1y, vy = r1x;
    if (Math.hypot(vx, vy) < Math.hypot(r2x, r2y)) { vx = -r2y; vy = r2x; }
    const L = Math.hypot(vx, vy);
    return L > 1e-8 ? [vx / L, vy / L] : [1, 0];
  };
  const dirs = Math.abs(l1 - l2) < 1e-6 ? [{ lambda: l1, v: dirFor(l1) }] : [
    { lambda: l1, v: dirFor(l1) },
    { lambda: l2, v: dirFor(l2) },
  ];
  return { real: true, l1, l2, im: 0, dirs };
}
