// Electric field E(x, y) and potential V(x, y) of a set of point charges { x, y, q } in a plane (in units k_e = 1).
// Softened denominator r = hypot(dx, dy, SOFT) prevents singularities on the grid while remaining exact outside the core.

export const SOFT = 0.28;
export const X = [-3, 3], Y = [-2, 2];

export function fieldAt(charges, x, y, soft = SOFT) {
  let ex = 0, ey = 0;
  for (const c of charges) {
    const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy + soft * soft, r3 = r2 * Math.sqrt(r2);
    ex += c.q * dx / r3;
    ey += c.q * dy / r3;
  }
  return [ex, ey];
}

export function potentialAt(charges, x, y, soft = SOFT) {
  let v = 0;
  for (const c of charges) v += c.q / Math.hypot(x - c.x, y - c.y, soft);
  return v;
}

export const netCharge = charges => charges.reduce((s, c) => s + c.q, 0);

export function pairEnergy(charges) {
  let u = 0;
  for (let i = 0; i < charges.length; i++) {
    for (let j = i + 1; j < charges.length; j++) {
      const r = Math.max(Math.hypot(charges[i].x - charges[j].x, charges[i].y - charges[j].y), 0.25);
      u += charges[i].q * charges[j].q / r;
    }
  }
  return u;
}
