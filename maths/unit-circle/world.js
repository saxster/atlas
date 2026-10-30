// The figure: eight drawing boards standing in a row along x, one per page, each with the unit circle drawn on it.
// The circle is drawn RW world units across per radius; every length on a board is (radii) × RW. y up, the board's
// plane is z = 0 and everything drawn stands just in front of it. Red is sine (the height), blue is cosine (the
// sideways shadow), ink is the radius; amber is light.
import * as THREE from 'three';
import { part, box, cyl, lines, liveTube, PALETTE, V } from '../../engine/parts.js';
import * as M from './model.js';

// the lamps need a warm hue; cosine gets a clear blue of its own
PALETTE.amber = ['#f6dc9a', '#e9bf5c', '#c49a3a'];
PALETTE.blue = ['#a9c3e2', '#5b88c0', '#3f6896'];
// the square on the radius: a quiet grey, so it shows on the white board
PALETTE.slate = ['#e4e4e8', '#cfcfd5', '#b4b4bb'];

export const RW = 1.5;                  // world units per radius
export const CY = 2.6;                  // height of every circle's centre O
export const STATIONS = { circle: 0, sine: 9, cosine: 18, pythag: 27, radian: 36, wave: 46, tangent: 66, signs: 75 };
export const PEN = 1.3;                 // the wave's pen, in radii right of O
const ZB = -0.14;                       // the board's centre plane (its face is at z = −0.12)
const ZL = 0.1;                         // labels float this far in front of the drawing
const UP = V(0, 1, 0);

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at, text) => labels.push({ cls, html, at, text });

  // faint graph-paper ground
  const grid = [];
  for (let x = -4; x <= 82; x++) grid.push(x, 0.001, -3, x, 0.001, 4);
  for (let z = -3; z <= 4; z++) grid.push(-4, 0.001, z, 82, 0.001, z);
  lines(root, grid, '#e6e6e2');

  // ---------- helpers ----------
  // a line whose points change every frame (solid or dashed)
  const dyn = (parent, n, { color = '#8a8a8f', dash = 0 } = {}) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const mat = dash ? new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: dash * 0.8 }) : new THREE.LineBasicMaterial({ color });
    const l = new THREE.Line(g, mat); l.userData = { noEdge: true }; l.frustumCulled = false; parent.add(l);
    l.set = pts => {
      const a = g.attributes.position.array;
      for (let i = 0; i < n; i++) { const p = pts[Math.min(i, pts.length - 1)]; a[3 * i] = p.x; a[3 * i + 1] = p.y; a[3 * i + 2] = p.z; }
      g.attributes.position.needsUpdate = true; if (dash) l.computeLineDistances();
    };
    return l;
  };
  // a straight solid from a to b: a thin rod (round) or a bar (square), resized every frame
  const stretch = (m, a, b) => {
    const len = a.distanceTo(b);
    m.visible = len > 0.006;
    if (!m.visible) return;
    m.position.copy(a); m.scale.set(1, len, 1);
    m.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
  };
  const rod = (g, { r = 0.016, pal = 'ink', name, tone = 'hi' } = {}) => {
    const m = part(g, cyl(r, 1, 12).translate(0, 0.5, 0), { pal, name, tone });
    m.set = (a, b) => stretch(m, a, b); return m;
  };
  const bar = (g, { w = 0.075, pal = 'red', name, tone = 'hi' } = {}) => {
    const m = part(g, new THREE.BoxGeometry(w, 1, w).translate(0, 0.5, 0), { pal, name, tone });
    m.set = (a, b) => stretch(m, a, b); return m;
  };
  const dot = (g, r, pal, name, tone = 'hi') => part(g, new THREE.SphereGeometry(r, 24, 16), { pal, name, tone });
  // an arc of a circle about c (radius r world units, from angle a0 to a1) as a tube rebuilt in place
  const arcTube = (g, n, radius, pal, name) => {
    const m = part(g, liveTube(n, radius), { pal, name, tone: 'hi' });
    m.set = (c, r, a0, a1) => {
      m.visible = Math.abs(a1 - a0) > 0.02;
      if (!m.visible) return;
      const pts = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push(V(c.x + r * Math.cos(a), c.y + r * Math.sin(a), c.z)); }
      m.geometry.update(pts);
    };
    return m;
  };

  // A drawing board centred on x0: board, stand, faint squared paper, axes with ±1 ticks, the circle and O.
  // b = the board's extent in radii. Returns W(mx, my, z): radii on this board → world.
  function board(x0, { b = [-1.45, 1.45, -1.45, 1.45], parent = root, axes = [-1.3, 1.3, -1.3, 1.3], ticks = true } = {}) {
    const W = (mx, my, z = 0) => V(x0 + mx * RW, CY + my * RW, z);
    const [bx0, bx1, by0, by1] = b, bw = (bx1 - bx0) * RW, bh = (by1 - by0) * RW, c = W((bx0 + bx1) / 2, (by0 + by1) / 2, ZB);
    part(root, box(bw, bh, 0.04, 0.015), { tone: 'lo', pal: 'board', pos: c.toArray(), name: 'Board' });
    const yb = CY + by0 * RW;
    part(root, box(Math.min(bw * 0.5, 2.4), yb, 0.5, 0.02), { tone: 'lo', pal: 'base', pos: [c.x, yb / 2, ZB - 0.2], name: 'Stand' });
    // squared paper: a line every quarter of a radius
    const sq = [], zq = ZB + 0.022;
    for (let k = Math.ceil(bx0 * 4); k <= Math.floor(bx1 * 4); k++) sq.push(...W(k / 4, by0, zq).toArray(), ...W(k / 4, by1, zq).toArray());
    for (let k = Math.ceil(by0 * 4); k <= Math.floor(by1 * 4); k++) sq.push(...W(bx0, k / 4, zq).toArray(), ...W(bx1, k / 4, zq).toArray());
    lines(root, sq, '#ececE8');
    // axes, and ticks at ±1
    const [ax0, ax1, ay0, ay1] = axes, ax = [...W(ax0, 0).toArray(), ...W(ax1, 0).toArray(), ...W(0, ay0).toArray(), ...W(0, ay1).toArray()];
    if (ticks) for (const s of [-1, 1]) ax.push(...W(s, -0.04).toArray(), ...W(s, 0.04).toArray(), ...W(-0.04, s).toArray(), ...W(0.04, s).toArray());
    lines(root, ax, '#8a8a8f');
    label('axis', '<i>x</i>', () => W(ax1 + 0.02, -0.1, ZL));
    label('axis', '<i>y</i>', () => W(-0.07, ay1 - 0.04, ZL));
    const ring = part(parent, new THREE.TorusGeometry(RW, 0.022, 10, 180), { tone: 'mid', pal: 'paper', pos: W(0, 0).toArray(), name: 'Circle' });
    dot(root, 0.04, 'ink', 'Origin', 'mid').position.copy(W(0, 0));
    return { W, ring };
  }
  // the moving point P, the radius OP and the angle θ marked from +x, on a board
  function pointP(W, g, { arc = true } = {}) {
    const P = dot(g, 0.075, 'red', 'Point P');
    const OP = rod(g, { name: 'Radius' });
    const ang = arc ? arcTube(g, 48, 0.012, 'ink', 'Angle') : null;
    return {
      P, OP,
      set(th) {
        const p = W(Math.cos(th), Math.sin(th));
        P.position.copy(p); OP.set(W(0, 0), p);
        if (ang) { const a = ((th % M.TAU) + M.TAU) % M.TAU; ang.set(W(0, 0), 0.34, 0, a); }
        return p;
      },
    };
  }
  // the label that rides P, pushed out along the radius
  const riding = (W, th, out = 1.2) => W(out * Math.cos(th), out * Math.sin(th), ZL);
  const ex = g => Math.max(g.userData.explode, 0);
  let T = 0;                                   // the time of the frame being drawn, for labels

  // ---------- 0 · the unit circle ----------
  const S0 = STATIONS.circle, g0 = asm('circle', root, { title: 'The unit circle', sub: 'radius 1, P = (cos θ, sin θ)' });
  const B0 = board(S0, { parent: g0 }), W0 = B0.W, p0 = pointP(W0, g0);
  const drop0 = dyn(root, 3, { color: '#6e6e74', dash: 0.06 });
  const foot0 = [bar(g0, { w: 0.05, pal: 'blue', name: 'cos θ' }), bar(g0, { w: 0.05, pal: 'red', name: 'sin θ' })];
  label('vec', '<i>P</i>', () => riding(W0, M.steady(T), 1.2));
  label('mark', '1', () => W0(1.1, -0.1, ZL)); label('mark', '−1', () => W0(-1.13, -0.1, ZL));
  label('mark', '1', () => W0(-0.1, 1.1, ZL)); label('mark', '−1', () => W0(-0.13, -1.1, ZL));
  label('mark', '<i>O</i>', () => W0(-0.1, -0.12, ZL));
  label('mark', 'θ', () => { const a = (M.steady(T) % M.TAU) / 2; return W0(0.36 * Math.cos(a), 0.36 * Math.sin(a), ZL); });
  label('vec blue', 'cos θ', () => ex(g0) > 0.3 ? W0(Math.cos(M.steady(T)) / 2, Math.sin(M.steady(T)) < 0 ? 0.13 : -0.13, ZL) : null);
  label('vec red', 'sin θ', () => ex(g0) > 0.3 ? W0(Math.cos(M.steady(T)) + (Math.cos(M.steady(T)) < 0 ? -0.24 : 0.24), Math.sin(M.steady(T)) / 2, ZL) : null);

  // ---------- 1 · sine is the height: level light from the right, a screen on the left ----------
  const S1 = STATIONS.sine, B1 = board(S1, { b: [-1.55, 1.5, -1.45, 1.45], axes: [-1.25, 1.2, -1.3, 1.3] }), W1 = B1.W, p1 = pointP(W1, root);
  const g1 = asm('sine', root, { title: 'Sine: the height', sub: 'P’s shadow cast by level light' });
  const LX = 1.36, SX = -1.38;                                         // the lamp's and the screen's x, in radii
  part(g1, box(0.1, 2.7 * RW, 0.26, 0.03), { tone: 'mid', pal: 'amber', pos: W1(LX, 0, 0.02).toArray(), name: 'Lamp' });
  part(root, box(0.06, 2.7 * RW, 0.3, 0.02), { tone: 'mid', pal: 'paper', pos: W1(SX, 0, 0.02).toArray(), name: 'Screen' });
  const sh1 = bar(g1, { pal: 'red', name: 'Shadow, sin θ' }), shDot1 = dot(g1, 0.05, 'ink', 'Shadow, sin θ');
  const ray1 = dyn(root, 2, { color: '#d9a73a' }), path1 = dyn(root, 2, { color: '#8a8a8f', dash: 0.07 }), yx1 = dot(root, 0.035, 'red', 'Projection', 'mid');
  { const c = [];                                                     // ghost radii at 30°, 45°, 60°, and marks on the screen
    for (const s of M.SPECIAL.slice(1, 4)) c.push(...W1(0, 0).toArray(), ...W1(s.cos, s.sin).toArray());
    lines(root, c, '#cfcfd3');
    const m = []; for (const s of M.SPECIAL) m.push(...W1(SX + 0.04, s.sin, 0.05).toArray(), ...W1(SX + 0.13, s.sin, 0.05).toArray());
    lines(root, m, '#6e6e74');
    for (const s of M.SPECIAL) label('tick', s.sinText, () => W1(SX - 0.07, s.sin, ZL)); }
  label('vec red', 'sin θ', () => { const s = Math.sin(M.steady(T)); return Math.abs(s) > 0.12 ? W1(SX + 0.26, s / 2, ZL) : null; });
  label('vec', '<i>P</i>', () => riding(W1, M.steady(T) - 0.24, 0.84));     // inside and just behind P, off the radius and clear of the shadow's label
  label('axis', 'level light', () => W1(LX - 0.1, 1.28, ZL));

  // ---------- 2 · cosine is the sideways shadow: light from above, a screen below ----------
  const S2 = STATIONS.cosine, B2 = board(S2, { b: [-1.45, 1.45, -1.85, 1.5], axes: [-1.3, 1.3, -1.25, 1.2] }), W2 = B2.W, p2 = pointP(W2, root);
  const g2 = asm('cosine', root, { title: 'Cosine: the sideways shadow', sub: 'P’s shadow cast by light from above' });
  const LY = 1.36, SY = -1.38;
  part(g2, box(2.7 * RW, 0.1, 0.26, 0.03), { tone: 'mid', pal: 'amber', pos: W2(0, LY, 0.02).toArray(), name: 'Lamp' });
  part(root, box(2.7 * RW, 0.06, 0.3, 0.02), { tone: 'mid', pal: 'paper', pos: W2(0, SY, 0.02).toArray(), name: 'Screen' });
  const sh2 = bar(g2, { pal: 'blue', name: 'Shadow, cos θ' }), shDot2 = dot(g2, 0.05, 'ink', 'Shadow, cos θ');
  const ray2 = dyn(root, 2, { color: '#d9a73a' }), path2 = dyn(root, 2, { color: '#8a8a8f', dash: 0.07 }), xx2 = dot(root, 0.035, 'blue', 'Projection', 'mid');
  { const c = [];
    for (const s of M.SPECIAL.slice(1, 4)) c.push(...W2(0, 0).toArray(), ...W2(s.cos, s.sin).toArray());
    lines(root, c, '#cfcfd3');
    const m = []; for (const s of M.SPECIAL) m.push(...W2(s.cos, SY + 0.04, 0.05).toArray(), ...W2(s.cos, SY + 0.13, 0.05).toArray());
    lines(root, m, '#6e6e74');
    // staggered, so the close surds don't collide
    M.SPECIAL.forEach((s, i) => label('mark', s.cosText, () => W2(s.cos, SY - (i % 2 ? 0.36 : 0.13), ZL))); }
  label('vec blue', 'cos θ', () => { const c = Math.cos(M.steady(T)); return Math.abs(c) > 0.2 ? W2(c / 2, SY + 0.28, ZL) : null; });
  label('vec', '<i>P</i>', () => riding(W2, M.steady(T) - 0.24, 0.84));
  label('board', 'light', () => W2(-1.3, LY - 0.17, ZL));

  // ---------- 3 · sin² + cos² = 1: the right triangle under P, and a square on each side ----------
  const S3 = STATIONS.pythag, B3 = board(S3, { b: [-1.45, 1.75, -1.45, 1.75], axes: [-1.3, 1.6, -1.3, 1.6] }), W3 = B3.W, p3 = pointP(W3, root, { arc: false });
  const g3 = asm('pythag', root, { title: 'The triangle under P', sub: 'hypotenuse 1, sides cos θ and sin θ' });
  const leg3c = bar(g3, { w: 0.06, pal: 'blue', name: 'cos θ' }), leg3s = bar(g3, { w: 0.06, pal: 'red', name: 'sin θ' });
  // a square plate hinged on side A→B, folded out of the board by φ (0: flat on the board, 90°: standing up)
  const plate = (pal, name) => {
    const m = part(g3, new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0.5), { pal, name, tone: 'hi' });
    m.matrixAutoUpdate = false;
    m.set = (A, B, n, phi) => {           // n: unit outward normal in the board's plane
      const u = B.clone().sub(A), L = u.length(), v = n.clone().multiplyScalar(Math.cos(phi)).add(V(0, 0, Math.sin(phi))).multiplyScalar(L);
      const w = u.clone().cross(v).normalize().multiplyScalar(0.016);
      if (w.z > 0 && phi < 0.01) w.negate();
      m.matrix.makeBasis(u, v, w).setPosition(A.clone().add(V(0, 0, -0.05)));
      m.matrixWorldNeedsUpdate = true;
      return A.clone().addScaledVector(u, 0.5).addScaledVector(v, 0.5);
    };
    return m;
  };
  const sqS = plate('red', 'sin²θ'), sqC = plate('blue', 'cos²θ'), sqH = plate('slate', '1²');
  const ctr = { s: V(), c: V(), h: V() };
  label('vec', 'sin²θ', () => ctr.s.clone().setZ(ZL + 0.6 * Math.max(ctr.s.z, 0)));
  label('vec', 'cos²θ', () => ctr.c.clone().setZ(ZL + 0.6 * Math.max(ctr.c.z, 0)));
  label('vec', '1²', () => ctr.h.clone().setZ(ZL + 0.6 * Math.max(ctr.h.z, 0)));
  label('mark', 'θ', () => W3(0.22, 0.07, ZL));

  // ---------- 4 · radians: the arc, measured in radii ----------
  const S4 = STATIONS.radian, B4 = board(S4), W4 = B4.W, p4 = pointP(W4, root, { arc: false });
  const g4 = asm('radian', root, { title: 'The arc', sub: 'its length in radii is the angle in radians' });
  const arc4 = part(g4, liveTube(160, 0.034), { pal: 'red', name: 'Arc, s = θ', tone: 'hi' });
  { const c = [];
    for (let k = 1; k <= 6; k++) c.push(...W4(Math.cos(k), Math.sin(k)).toArray(), ...W4(1.09 * Math.cos(k), 1.09 * Math.sin(k)).toArray());
    c.push(...W4(0, 0).toArray(), ...W4(Math.cos(1), Math.sin(1)).toArray());             // the 1-radian wedge
    lines(root, c, '#6e6e74');
    for (let k = 1; k <= 6; k++) label('mark', String(k), () => W4(1.22 * Math.cos(k), 1.22 * Math.sin(k), ZL));
    label('mark', '2π', () => W4(1.22, 0.08, ZL));
    label('mark', '1 rad', () => W4(0.5 * Math.cos(0.5), 0.5 * Math.sin(0.5), ZL)); }
  // unrolled (opened): the arc straightened up the line x = 1, with a mark every radius
  const unroll4 = new THREE.Group(); root.add(unroll4);
  { const c = []; for (let k = 1; k <= 6; k++) c.push(...W4(0.94, k).toArray(), ...W4(1.06, k).toArray()); c.push(...W4(1, 0).toArray(), ...W4(1, 6.6).toArray()); lines(unroll4, c, '#6e6e74'); }
  for (let k = 1; k <= 6; k++) label('tick', String(k), () => unroll4.visible ? W4(0.9, k, ZL) : null);
  label('vec red', '<i>s</i> = θ', () => { const a = M.unwind(T); return a > 0.5 && ex(g4) < 0.3 ? W4(0.72 * Math.cos(a / 2), 0.72 * Math.sin(a / 2), ZL) : null; });

  // ---------- 5 · the sine wave: P's height drawn on a strip sliding to the right ----------
  const S5 = STATIONS.wave, SL = M.STRIP.len;
  const B5 = board(S5, { b: [-1.45, PEN + SL + 0.3, -1.45, 1.45], axes: [-1.3, PEN + SL + 0.15, -1.3, 1.3] }), W5 = B5.W, p5 = pointP(W5, root);
  part(root, new THREE.BoxGeometry(SL * RW, 2.3 * RW, 0.012), { tone: 'lo', pal: 'base', pos: W5(PEN + SL / 2, 0, -0.07).toArray(), name: 'Strip' });
  const g5 = asm('wave', root, { title: 'The trace', sub: 'P’s height against how far it has turned' });
  const trace5 = part(g5, liveTube(280, 0.03), { pal: 'red', name: 'Trace, y = sin t', tone: 'hi' });
  const pen5 = dot(g5, 0.06, 'ink', 'Pen');
  const slope5 = part(g5, liveTube(280, 0.014), { pal: 'blue', name: 'Slope, cos t', tone: 'hi' });
  const level5 = dyn(root, 2, { color: '#8a8a8f', dash: 0.07 });
  const ticks5 = lines(root, new Array(4 * 6).fill(0), '#6e6e74');
  ticks5.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage); ticks5.frustumCulled = false;
  { const yb = -1.3, c = [...W5(PEN, yb).toArray(), ...W5(PEN + M.TAU, yb).toArray()];        // one wavelength, 2π
    for (const u of [0, M.TAU]) c.push(...W5(PEN + u, yb - 0.06).toArray(), ...W5(PEN + u, yb + 0.06).toArray());
    for (let k = 1; k <= 6; k++) c.push(...W5(PEN + k, -1.17).toArray(), ...W5(PEN + k, -1.12).toArray());
    lines(root, c, '#6e6e74'); }
  label('mark', 'one turn: 2π', () => W5(PEN + Math.PI, -1.56, ZL));
  label('tick', '1', () => W5(PEN - 0.05, 1, ZL)); label('tick', '−1', () => W5(PEN - 0.05, -1, ZL)); label('tick', '0', () => W5(PEN - 0.05, 0.06, ZL));
  label('board', '<i>y</i> = sin <i>t</i>', () => W5(PEN + 0.1, 1.32, ZL));
  label('axis', 'paper moves →', () => W5(PEN + SL - 0.05, 1.32, ZL));
  label('vec blue', 'slope = cos <i>t</i>', () => ex(g5) > 0.3 ? W5(PEN + 3.2, Math.cos(M.steady(T) - 3.2) > 0 ? -0.85 : 0.85, ZL) : null);

  // ---------- 6 · tangent: the ray OP carried on to the line x = 1 ----------
  const S6 = STATIONS.tangent, B6 = board(S6, { b: [-1.45, 1.75, -1.45, 2.7], axes: [-1.3, 1.6, -1.3, 2.55] }), W6 = B6.W, p6 = pointP(W6, root);
  part(root, cyl(0.014, 3.9 * RW, 10), { tone: 'mid', pal: 'dark', pos: W6(1, 1.2, 0).toArray(), name: 'Tangent line' });
  const g6 = asm('tangent', root, { title: 'The tangent length', sub: 'from (1, 0) up to the ray: tan θ' });
  const tan6 = bar(g6, { pal: 'red', name: 'tan θ' }), T6 = dot(g6, 0.06, 'ink', 'Where the ray meets x = 1');
  const ray6 = rod(root, { r: 0.01, pal: 'dark', name: 'Ray', tone: 'mid' });
  const sim6 = dyn(root, 3, { color: '#3f6896' }), simS6 = dyn(root, 2, { color: '#b8343a' });
  lines(root, [...W6(0.94, 1).toArray(), ...W6(1.06, 1).toArray()], '#6e6e74');
  label('tick', '1', () => W6(0.92, 1, ZL));
  label('vec red', 'tan θ', () => { const y = M.tan(M.tsway(T)); return Math.abs(y) > 0.25 ? W6(1.32, y / 2, ZL) : null; });
  label('vec', '<i>P</i>', () => { const a = M.tsway(T); return W6(Math.cos(a) - 0.2 * Math.sin(a) - 0.12, Math.sin(a) + 0.2 * Math.cos(a), ZL); });
  label('board', '<i>x</i> = 1', () => W6(1.08, -1.22, ZL));

  // ---------- 7 · beyond 90°: the signs of the shadows in each quadrant ----------
  const S7 = STATIONS.signs, B7 = board(S7, { b: [-1.6, 1.6, -1.55, 1.55], axes: [-1.35, 1.35, -1.35, 1.35] }), W7 = B7.W, p7 = pointP(W7, root);
  const g7 = asm('signs', root, { title: 'The two shadows, signed', sub: 'right and up are +, left and down are −' });
  const c7 = bar(g7, { pal: 'blue', name: 'cos θ' }), s7 = bar(g7, { pal: 'red', name: 'sin θ' });
  const ref7 = dot(root, 0.05, 'dark', 'Reference angle', 'mid'), refL7 = dyn(root, 3, { color: '#8a8a8f', dash: 0.06 });
  for (const [x, y, t] of [[1, 1, 'sin +&nbsp; cos +'], [-1, 1, 'sin +&nbsp; cos −'], [-1, -1, 'sin −&nbsp; cos −'], [1, -1, 'sin −&nbsp; cos +']]) label('mark', t, () => W7(x * 1.18, y > 0 ? 1.12 : -1.36, ZL));
  label('vec blue', 'cos θ', () => { const a = M.steady(T); return Math.abs(Math.cos(a)) > 0.3 ? W7(Math.cos(a) / 2, Math.sin(a) > 0 ? -0.15 : 0.15, ZL) : null; });
  label('vec red', 'sin θ', () => { const a = M.steady(T); return Math.abs(Math.sin(a)) > 0.3 ? W7(Math.cos(a) + (Math.cos(a) > 0 ? 0.26 : -0.26), Math.sin(a) / 2, ZL) : null; });
  label('vec', '<i>P</i>', () => riding(W7, M.steady(T), 1.2));

  // ---------- breakdown views: each opens onto its whole board, not just the lit part ----------
  const view = (g, W, x, y, r) => { g.userData.focus = () => ({ target: W(x, y).toArray(), radius: r }); };
  view(g0, W0, 0, 0.05, 2.3); view(g1, W1, -0.02, 0, 2.45); view(g2, W2, 0, -0.2, 2.6); view(g3, W3, 0.15, 0.15, 2.7);
  view(g5, W5, 3.4, 0, 7.2); view(g6, W6, 0.15, 0.6, 3.2); view(g7, W7, 0, 0, 2.45);
  let th4 = 0;                                 // the radian board opens onto the unrolled arc, however long it is
  g4.userData.focus = () => { const top = Math.max(1.2, th4); return { target: W4(0.2, (top - 1.25) / 2).toArray(), radius: RW * (top + 1.3) / 2 + 0.3 }; };

  // ---------- per frame ----------
  function update(t, look) {
    T = t;
    // 0 · the circle (opened: P's coordinates as two shadows)
    { const th = M.steady(t), p = p0.set(th), e = ex(g0), c = Math.cos(th), s = Math.sin(th);
      drop0.visible = e > 0.3; drop0.set([W0(0, s), p, W0(c, 0)]);
      if (e > 0.3) { foot0[0].set(W0(0, 0, 0.03), W0(c, 0, 0.03)); foot0[1].set(W0(c, 0, 0.03), W0(c, s, 0.03)); } else foot0.forEach(b => { b.visible = false; }); }
    // 1 · sine
    { const th = M.steady(t), s = Math.sin(th); p1.set(th);
      sh1.set(W1(SX + 0.07, 0, 0.06), W1(SX + 0.07, s, 0.06)); shDot1.position.copy(W1(SX + 0.07, s, 0.06));
      ray1.set([W1(LX - 0.05, s), W1(Math.cos(th), s)]); path1.set([W1(Math.cos(th), s), W1(SX + 0.04, s)]); yx1.position.copy(W1(0, s, 0.02)); }
    // 2 · cosine
    { const th = M.steady(t), c = Math.cos(th); p2.set(th);
      sh2.set(W2(0, SY + 0.07, 0.06), W2(c, SY + 0.07, 0.06)); shDot2.position.copy(W2(c, SY + 0.07, 0.06));
      ray2.set([W2(c, LY - 0.05), W2(c, Math.sin(th))]); path2.set([W2(c, Math.sin(th)), W2(c, SY + 0.04)]); xx2.position.copy(W2(c, 0, 0.02)); }
    // 3 · the triangle and its squares; look.unfold lays the squares flat as the page turns in
    { const th = M.sway(t), c = Math.cos(th), s = Math.sin(th), O = W3(0, 0), F = W3(c, 0), P = p3.set(th);
      leg3c.set(O.clone().setZ(0.02), F.clone().setZ(0.02)); leg3s.set(F.clone().setZ(0.02), P.clone().setZ(0.02));
      const phi = (1 - (look.unfold ?? 0)) * Math.PI / 2 + 0.6 * ex(g3);           // opened: they fold part way up again
      ctr.c.copy(sqC.set(O, F, V(0, -1, 0), phi));
      ctr.s.copy(sqS.set(F, P, V(1, 0, 0), phi));
      ctr.h.copy(sqH.set(O, P, V(-s, c, 0), phi)); }
    // 4 · radians (opened: the arc unrolled up the line x = 1)
    { const th = M.unwind(t), e = ex(g4), n = 160; p4.set(th); th4 = th;
      const pts = []; for (let i = 0; i <= n; i++) { const a = th * i / n, k = Math.min(e, 1); pts.push(W4((1 - k) * Math.cos(a) + k, (1 - k) * Math.sin(a) + k * a, 0.01)); }
      arc4.visible = th > 0.02; if (arc4.visible) arc4.geometry.update(pts);
      unroll4.visible = e > 0.3; }
    // 5 · the wave
    { const th = M.steady(t), p = p5.set(th), n = 280, pts = [], sl = [], e = ex(g5);
      for (let i = 0; i <= n; i++) { const u = SL * i / n; pts.push(W5(PEN + u, M.wave(t, u), 0.01)); sl.push(W5(PEN + u, Math.cos(th - u), 0.005)); }
      trace5.geometry.update(pts); pen5.position.copy(W5(PEN, Math.sin(th), 0.01));
      slope5.visible = e > 0.3; if (slope5.visible) slope5.geometry.update(sl);
      level5.set([p, W5(PEN, Math.sin(th))]);
      // a tick on the strip's top edge wherever the trace crossed 0 going up (one per turn), riding with the paper
      const a = ticks5.geometry.attributes.position, k0 = Math.floor(th / M.TAU);
      for (let k = 0; k < 6; k++) { const u = th - (k0 - k) * M.TAU, on = u >= 0 && u <= SL, q0 = W5(PEN + u, 1.08), q1 = W5(PEN + u, 1.15);
        a.setXYZ(2 * k, q0.x, on ? q0.y : -5, 0); a.setXYZ(2 * k + 1, q1.x, on ? q1.y : -5, 0); }
      a.needsUpdate = true; }
    // 6 · tangent (opened: the small triangle under P and the big one under T have the same shape)
    { const th = M.tsway(t), P = p6.set(th), y = M.tan(th), e = ex(g6);
      tan6.set(W6(1, 0, 0.03), W6(1, y, 0.03)); T6.position.copy(W6(1, y, 0.03));
      ray6.set(W6(0, 0), W6(1, y));
      sim6.visible = simS6.visible = e > 0.3; sim6.set([W6(0, 0, 0.02), W6(Math.cos(th), 0, 0.02), P.clone().setZ(0.02)]); simS6.set([W6(Math.cos(th), 0, 0.02), P.clone().setZ(0.02)]); }
    // 7 · signs (opened: the reference angle, P reflected into the first quadrant)
    { const th = M.steady(t), c = Math.cos(th), s = Math.sin(th), e = ex(g7); p7.set(th);
      c7.set(W7(0, 0, 0.03), W7(c, 0, 0.03)); s7.set(W7(c, 0, 0.03), W7(c, s, 0.03));
      const r = M.reference(th); ref7.visible = refL7.visible = e > 0.3;
      ref7.position.copy(W7(Math.cos(r), Math.sin(r), 0.02)); refL7.set([W7(c, s, 0.02), W7(0, 0, 0.02), W7(Math.cos(r), Math.sin(r), 0.02)]); }
  }
  return { update, labels };
}
