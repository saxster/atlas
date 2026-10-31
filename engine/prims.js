// Building blocks: the pieces most figures are made of, each one call. Every primitive is
//   prim(parent, spec) → { object, labels, ...extras }
// object: a THREE.Object3D added to parent. labels: the stage's label format ([{ cls, html, at() → Vector3 | null }]),
// so a world returns [...a.labels, ...b.labels]. A label hides with its object (object.visible = false).
// Any prim given { axes } takes points in the axes' data coordinates; without, in parent coordinates. Points are
// [x, y, z?] arrays or Vector3s. Give a prim the same parent as its axes (to() returns parent coordinates).
//
// axes(parent, { x: [min, max], y: [min, max], z?, size?: [wx, wy, wz] (world length of each axis, default 4),
//   at?: [x, y, z] (world point where the axes cross: data 0 on each axis, or its min when 0 is out of range),
//   ticks?: n | { x, y, z } (about n numbered ticks; 0 for none), names?: { x, y, z } (html), grid?: bool })
//   → { object, labels, to(x, y, z = 0, out?) → Vector3, x, y, z }
//   Without a z range the plane is upright: data y is up, z is a world offset toward the viewer. With one, z is up
//   and data y runs into the page (right-handed), the usual picture of z = f(x, y).
// plot(parent, f, { axes, x?, samples = 200, color = 'hi', width = 0.04 }) → { object, labels, update(f, { x? }?) }   y = f(x)
// area(parent, f, { axes, x?, y0 = 0, bars = 0, rule = 'mid', samples = 120, pal = 'blue', opacity = 0.26 })
//   → { object, labels, update(f, { x?, y0?, bars?, rule? }) }   shaded region or n Riemann bars between y0 and f(x)
// surface(parent, f, { axes, x?, y?, n = 40, pal = 'paper' }) → { object, labels, update(f) }               z = f(x, y)
// curve(parent, r, { t: [a, b], samples = 200, radius = 0.02, axes?, color = 'hi' }) → { object, labels, update(r) }
// vector(parent, from, to, { color = 'red', label?, axes?, side = 1, gap = 0.22 }) → { object, labels, set(from, to, side?) }
//   the label stands gap world units off the arrow's middle
// field(parent, fn, { axes, x?, y?, z?, n = [7, 5], scale = 0.35, color = 'blue' }) → { object, labels, arrows, update(fn, scale?) }
// streamline(parent, fn, { axes, from = [0, 0, 0], dt = 0.04, steps = 80, radius = 0.018, color = 'blue' })
//   → { object, labels, points, update(fn, from?) }
// lattice(parent, fn, { axes, x?, y?, n = [6, 6], samples = 36, color = '#8a8a8f', opacity = 0.72 }) → { object, labels, update(fn) }
// blob(parent, { radius = 0.5, lobes = 14, amp = 0.14, cleft = 0, seed = 1, rings = 24, segs = 36, pal = 'green', tone = 'mid', pos })
//   → { object, mesh, labels, update(spec) }
// particles(parent, count, { radius = 0.05, color = 'red', axes? }) → { object, labels, set(i, p), show(n) }
// molecule(parent, xyz, { scale = 1, names = true }) → { object, labels, atoms: [{ elem, pos }], bonds: [[i, j]] }
//   xyz: XYZ text in ångström; atoms are centred on their centroid, pos as given in the text. Bonds join atoms closer
//   than 1.15 × the sum of their covalent radii.
// Colours: 'hi' (ink), 'grey', any PALETTE name ('red', 'blue', 'paper' …), 'ochre', 'green', or '#hex'.
// update/set rewrite geometry in place, so they can run every frame.
import * as THREE from 'three';
import { part, arrow, setArrow, lines, liveTube, shadeMat, PALETTE, TONE, V } from './parts.js';
import { rng } from './rng.js';

const EXTRA = { ochre: '#c8962e', green: '#3f8a63' };
// a colour as a palette name, made on first use for '#hex', 'ochre' and 'green' (a theme may have replaced PALETTE since)
function palOf(c) {
  if (c === 'hi' || c === 'ink') return 'ink';
  if (c === 'grey' || c === 'gray') return 'dark';
  if (PALETTE[c]) return c;
  const hex = c.startsWith?.('#') ? c : EXTRA[c];
  if (!hex) throw new Error(`prims: no colour '${c}'`);
  const b = new THREE.Color(hex), mix = (to, u) => '#' + b.clone().lerp(new THREE.Color(to), u).getHexString();
  PALETTE[c] = [mix('#ffffff', 0.35), '#' + b.getHexString(), mix('#000000', 0.22)];
  return c;
}
const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
// a label riding obj: local is in obj's parent's frame (where prims build), returned in world coordinates
const pin = (cls, html, obj, local) => ({ cls, html, at: () => { const p = local(); return p && shown(obj) ? (obj.parent ? obj.parent.localToWorld(p.clone()) : p.clone()) : null; } });
const toOf = axes => axes ? axes.to : (x, y, z = 0, out = V()) => out.set(x, y, z);
const point = (to, p, out) => p.isVector3 ? to(p.x, p.y, p.z, out) : to(p[0], p[1], p[2] ?? 0, out);
const num = v => { const s = String(+v.toFixed(6)); return s.startsWith('-') ? '−' + s.slice(1) : s; };
// about n ticks at round steps (1, 2 or 5 × 10^k) inside [a, b]
function tickValues([a, b], n) {
  if (!n || b <= a) return [];
  const raw = (b - a) / n, p = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 5, 10].map(k => k * p).find(s => s >= raw * 0.99);
  const out = [], i0 = Math.ceil(a / step - 1e-9);
  for (let i = i0; i * step <= b + step * 1e-9; i++) out.push(i === 0 ? 0 : +(i * step).toPrecision(12));
  return out;
}

export function axes(parent, { x, y, z, size = [4, 4, 4], at = [0, 0, 0], ticks = 5, names = {}, grid = false } = {}) {
  const R = { x, y, z: z || [0, 0] }, o = {}, k = {};
  for (const [i, a] of ['x', 'y', 'z'].entries()) {
    const [lo, hi] = R[a];
    o[a] = Math.min(Math.max(0, lo), hi);
    k[a] = hi > lo ? size[i] / (hi - lo) : 1;
  }
  const up = !!z;
  const to = (px, py, pz = 0, out = V()) => {
    const dx = (px - o.x) * k.x, dy = (py - o.y) * k.y, dz = (pz - o.z) * k.z;
    return up ? out.set(at[0] + dx, at[1] + dz, at[2] - dy) : out.set(at[0] + dx, at[1] + dy, at[2] + dz);
  };
  const object = new THREE.Group(); parent.add(object);
  const labels = [], seg = [], t = typeof ticks === 'number' ? { x: ticks, y: ticks, z: ticks } : ticks;
  const P = (a, v) => [a === 'x' ? v : o.x, a === 'y' ? v : o.y, a === 'z' ? v : o.z];
  // ticks and their numbers stand off below the x axis and left of the others, in world units
  const WAY = { x: V(0, -1, 0), y: V(-1, 0, 0), z: V(-1, 0, 0) }, off = (a, v, d) => to(...P(a, v)).addScaledVector(WAY[a], d);
  for (const a of up ? ['x', 'y', 'z'] : ['x', 'y']) {
    seg.push(...to(...P(a, R[a][0])).toArray(), ...to(...P(a, R[a][1])).toArray());
    for (const v of tickValues(R[a], t[a] ?? 0)) {
      if (v === o[a]) continue;
      seg.push(...off(a, v, 0).toArray(), ...off(a, v, 0.06).toArray());
      // x numbers centre under their tick; the label class right-aligns, so shift the text back by half its width
      const html = a === 'x' ? `<span style="display:inline-block;transform:translateX(50%)">${num(v)}</span>` : num(v);
      labels.push(pin('tick', html, object, () => off(a, v, 0.22)));
    }
    // the name over the axis's far end (right-aligned: it ends at the axis), clear of that end's tick number
    if (names[a]) labels.push(pin('axis', names[a], object, () => to(...P(a, R[a][1])).add(a === 'y' && up ? V(-0.16, 0, 0) : V(0, 0.3, 0))));
  }
  if (grid) {
    const base = up ? R.z[0] : o.z, faint = [];
    for (const v of tickValues(R.x, t.x ?? 0)) faint.push(...to(v, R.y[0], base).toArray(), ...to(v, R.y[1], base).toArray());
    for (const v of tickValues(R.y, t.y ?? 0)) faint.push(...to(R.x[0], v, base).toArray(), ...to(R.x[1], v, base).toArray());
    lines(object, faint, '#ececE8').position.z = up ? 0 : -0.01;
  }
  lines(object, seg, '#8a8a8f');
  return { object, labels, to, x: R.x, y: R.y, z: z || null };
}

// a tube along n + 1 points, rewritten in place (liveTube); thin enough to be its own stroke, so no edge pass
function tube(parent, n, radius, color, name) {
  const mesh = part(parent, liveTube(n, radius, 8), { pal: palOf(color), tone: 'hi', name });
  if (radius < 0.03) mesh.userData.noEdge = true;
  mesh.frustumCulled = false;
  return { mesh, pts: Array.from({ length: n + 1 }, () => V()) };
}

export function plot(parent, f, { axes, x, samples = 200, color = 'hi', width = 0.04, name = 'Plot' } = {}) {
  let curX = x || axes.x, curF = f;
  const to = toOf(axes), { mesh, pts } = tube(parent, samples, width / 2, color, name);
  const update = (g = curF, opts = {}) => {
    curF = g; if (opts.x) curX = opts.x;
    const [a, b] = curX;
    for (let i = 0; i <= samples; i++) { const u = a + (b - a) * i / samples; to(u, curF(u), 0, pts[i]); }
    mesh.geometry.update(pts);
  };
  update(f);
  return { object: mesh, labels: [], update };
}

export function area(parent, f, { axes, x, y0 = 0, bars = 0, rule = 'mid', samples = 120, pal = 'blue', opacity = 0.26, name = 'Area' } = {}) {
  const to = toOf(axes), max = Math.max(samples, bars || 0), idx = [];
  for (let i = 0; i < max; i++) { const q = 4 * i; idx.push(q, q + 2, q + 1, q + 2, q + 3, q + 1); }
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(max * 12);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const mat = shadeMat(palOf(pal), { opacity });
  mat.side = THREE.DoubleSide;
  const mesh = part(parent, geo, { pal: palOf(pal), tone: 'lo', name, mat });
  mesh.userData.noEdge = true; mesh.frustumCulled = false; mesh.renderOrder = 1;
  const lpos = new Float32Array(max * 24), lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const outline = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: '#6e6e74' }));
  outline.userData = { noEdge: true }; outline.frustumCulled = false; mesh.add(outline);
  let curF = f, curX = x || axes.x, curY0 = y0, curBars = bars, curRule = rule;
  const p0 = V(), p1 = V(), p2 = V(), p3 = V();
  const update = (g = curF, opts = {}) => {
    curF = g; if (opts.x) curX = opts.x; if (opts.y0 !== undefined) curY0 = opts.y0;
    if (opts.bars !== undefined) curBars = opts.bars; if (opts.rule) curRule = opts.rule;
    const [a, b] = curX, base = typeof curY0 === 'function' ? curY0 : () => curY0;
    const n = curBars > 0 ? Math.min(curBars, max) : max, z = -0.006, zl = 0.004;
    for (let i = 0; i < max; i++) {
      const u0 = i < n ? a + (b - a) * i / n : b, u1 = i < n ? a + (b - a) * (i + 1) / n : b;
      const us = curRule === 'left' ? u0 : curRule === 'right' ? u1 : (u0 + u1) / 2;
      const yl = curBars > 0 ? curF(us) : curF(u0), yr = curBars > 0 ? yl : curF(u1);
      const bl = base(u0), br = curBars > 0 ? base(us) : base(u1);
      // order lower/upper y so quad faces always wind counter-clockwise (+z normal) whether f >= y0 or f < y0
      const flip = (yl - bl) + (yr - br) < 0;
      const y0L = flip ? yl : bl, y1L = flip ? bl : yl;
      const y0R = flip ? yr : br, y1R = flip ? br : yr;
      to(u0, y0L, z, p0).toArray(pos, 12 * i); to(u0, y1L, z, p1).toArray(pos, 12 * i + 3);
      to(u1, y0R, z, p2).toArray(pos, 12 * i + 6); to(u1, y1R, z, p3).toArray(pos, 12 * i + 9);
      if (curBars > 0 && i < n) {
        to(u0, y0L, zl, p0); to(u0, y1L, zl, p1); to(u1, y0R, zl, p2); to(u1, y1R, zl, p3);
        const o = 24 * i;
        p0.toArray(lpos, o); p1.toArray(lpos, o + 3); p1.toArray(lpos, o + 6); p3.toArray(lpos, o + 9);
        p3.toArray(lpos, o + 12); p2.toArray(lpos, o + 15); p2.toArray(lpos, o + 18); p0.toArray(lpos, o + 21);
      } else lpos.fill(0, 24 * i, 24 * (i + 1));
    }
    outline.visible = curBars > 0;
    if (curBars > 0) lgeo.attributes.position.needsUpdate = true;
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); geo.computeBoundingBox();
  };
  update(f);
  return { object: mesh, labels: [], update };
}

export function curve(parent, r, { t: [a, b] = [0, 1], samples = 200, radius = 0.02, axes, color = 'hi', name = 'Curve' } = {}) {
  const to = toOf(axes), { mesh, pts } = tube(parent, samples, radius, color, name);
  const update = g => { for (let i = 0; i <= samples; i++) point(to, g(a + (b - a) * i / samples), pts[i]); mesh.geometry.update(pts); };
  update(r);
  return { object: mesh, labels: [], update };
}

export function surface(parent, f, { axes, x, y, n = 40, pal = 'paper', name = 'Surface' } = {}) {
  const [x0, x1] = x || axes.x, [y0, y1] = y || axes.y, to = toOf(axes), m = n + 1;
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(m * m * 3), idx = [], p = V();
  // counter-clockwise seen from +z in data, so the faces look up when z is up
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const q = j * m + i; idx.push(q, q + 1, q + m, q + 1, q + m + 1, q + m); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const mesh = part(parent, geo, { pal: palOf(pal), tone: 'mid', name });
  const update = g => {
    for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) {
      const u = x0 + (x1 - x0) * i / n, v = y0 + (y1 - y0) * j / n;
      to(u, v, g(u, v), p).toArray(pos, 3 * (j * m + i));
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); geo.computeBoundingBox();
  };
  update(f);
  return { object: mesh, labels: [], update };
}

export function vector(parent, from, to, { color = 'red', label, axes, side = 1, gap = 0.22, name = 'Vector' } = {}) {
  const map = toOf(axes), object = arrow(parent, palOf(color), { name });
  const A = V(), B = V(), D = V(), off = V();
  const set = (f, t, s = side) => { side = s; point(map, f, A); point(map, t, B); setArrow(object, A, D.subVectors(B, A)); };
  set(from, to);
  // the label beside the arrow's middle, in the picture plane: side 1 is its clockwise side (below a rightward arrow),
  // −1 the other; set(from, to, side) moves it, so it can stay out of the way of what the arrow sits in
  const at = () => { off.set(D.y, -D.x, 0); if (off.lengthSq() < 1e-6 * D.lengthSq() + 1e-12) off.set(0, 1, 0); return A.clone().lerp(B, 0.5).addScaledVector(off.normalize(), gap * side); };
  const cls = ['red', 'blue', 'grey'].includes(color) ? `vec ${color}` : 'vec';
  return { object, labels: label ? [pin(cls, label, object, at)] : [], set };
}

export function field(parent, fn, { axes, x, y, z, n = [7, 5], scale = 0.35, color = 'blue', name = 'Field' } = {}) {
  const map = toOf(axes), [x0, x1] = x || axes.x, [y0, y1] = y || axes.y, [z0, z1] = z || axes?.z || [0, 0];
  const [nx, ny, nz = 1] = Array.isArray(n) ? n : [n, n, 1], pal = palOf(color);
  const object = new THREE.Group(); object.name = name; parent.add(object);
  const grid = [], arrows = [], A = V(), B = V(), D = V();
  const step = (lo, hi, count, i) => count <= 1 ? (lo + hi) / 2 : lo + (hi - lo) * (i + 0.5) / count;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    grid.push([step(x0, x1, nx, i), step(y0, y1, ny, j), step(z0, z1, nz, k)]);
    arrows.push(arrow(object, pal, { r: 0.022, head: 0.11, headR: 0.06, name }));
  }
  let curFn = fn, curScale = scale;
  const update = (g = curFn, s = curScale) => {
    curFn = g; curScale = s;
    for (let i = 0; i < grid.length; i++) {
      const [px, py, pz] = grid[i], [vx = 0, vy = 0, vz = 0] = curFn(px, py, pz);
      map(px, py, pz, A); map(px + vx * s, py + vy * s, pz + vz * s, B);
      setArrow(arrows[i], A, D.subVectors(B, A));
    }
  };
  update(fn, scale);
  return { object, labels: [], arrows, update };
}

export function streamline(parent, fn, startOrOpts = [0, 0, 0], maybeOpts = {}) {
  const isSpec = !Array.isArray(startOrOpts) && !startOrOpts?.isVector3;
  const opts = isSpec ? startOrOpts : maybeOpts;
  const { axes, from = [0, 0, 0], dt = 0.04, steps = 80, radius = 0.018, color = 'blue', name = 'Streamline' } = opts;
  const start = isSpec ? from : startOrOpts;
  const to = toOf(axes), { mesh, pts } = tube(parent, steps, radius, color, name);
  let curFn = fn, curStart = start;
  const step3 = (g, x, y, z, t) => { const [vx = 0, vy = 0, vz = 0] = g(x, y, z, t); return [vx, vy, vz]; };
  const update = (g = curFn, s = curStart) => {
    curFn = g; curStart = s;
    let [x, y, z = 0] = s.isVector3 ? [s.x, s.y, s.z] : s;
    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      to(x, y, z, pts[i]);
      if (i === steps) break;
      const [k1x, k1y, k1z] = step3(g, x, y, z, t);
      const [k2x, k2y, k2z] = step3(g, x + 0.5 * dt * k1x, y + 0.5 * dt * k1y, z + 0.5 * dt * k1z, t + 0.5 * dt);
      const [k3x, k3y, k3z] = step3(g, x + 0.5 * dt * k2x, y + 0.5 * dt * k2y, z + 0.5 * dt * k2z, t + 0.5 * dt);
      const [k4x, k4y, k4z] = step3(g, x + dt * k3x, y + dt * k3y, z + dt * k3z, t + dt);
      x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
      y += (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
      z += (dt / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);
    }
    mesh.geometry.update(pts);
  };
  update(fn, start);
  return { object: mesh, labels: [], points: pts, update };
}

export function lattice(parent, fn = (u, v) => [u, v], { axes, x, y, n, divisions, samples = 36, color = '#8a8a8f', opacity = 0.72, name = 'Lattice' } = {}) {
  const to = toOf(axes), [x0, x1] = x || axes.x, [y0, y1] = y || axes.y;
  const div = n ?? divisions ?? [6, 6];
  const [nx, ny] = Array.isArray(div) ? div : [div, div];
  const nSeg = ((nx + 1) + (ny + 1)) * samples;
  const pos = new Float32Array(nSeg * 6), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const object = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
  object.userData = { noEdge: true }; object.frustumCulled = false; object.name = name; parent.add(object);
  let curFn = fn;
  const pA = V(), pB = V();
  const mapPt = (g, u, v, out) => { const [X, Y, Z = 0] = g(u, v); return to(X, Y, Z, out); };
  const update = (g = curFn) => {
    curFn = g;
    let k = 0;
    for (let i = 0; i <= nx; i++) {
      const u = x0 + (x1 - x0) * i / nx;
      for (let s = 0; s < samples; s++) {
        const v0 = y0 + (y1 - y0) * s / samples, v1 = y0 + (y1 - y0) * (s + 1) / samples;
        mapPt(g, u, v0, pA).toArray(pos, k); mapPt(g, u, v1, pB).toArray(pos, k + 3); k += 6;
      }
    }
    for (let j = 0; j <= ny; j++) {
      const v = y0 + (y1 - y0) * j / ny;
      for (let s = 0; s < samples; s++) {
        const u0 = x0 + (x1 - x0) * s / samples, u1 = x0 + (x1 - x0) * (s + 1) / samples;
        mapPt(g, u0, v, pA).toArray(pos, k); mapPt(g, u1, v, pB).toArray(pos, k + 3); k += 6;
      }
    }
    geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere(); geo.computeBoundingBox();
  };
  update(fn);
  return { object, labels: [], update };
}

export function blob(parent, spec = {}) {
  const {
    radius, r = 0.5, lobes, bumps = 14, amp = 0.14, cleft = 0, seed = 1,
    rings = 24, segs = 36, pal, color = 'green', tone = 'mid', pos = [0, 0, 0], ex = [0, 0, 0], name = 'Blob',
  } = spec;
  const baseGeo = new THREE.SphereGeometry(1, segs, rings);
  const basePos = Float32Array.from(baseGeo.attributes.position.array);
  const geo = baseGeo.clone();
  const attr = geo.attributes.position;

  let cur = {
    rad: radius ?? r,
    nLobes: lobes ?? bumps,
    amp,
    cleft,
    seed,
  };

  function update(next = {}) {
    if (next.radius !== undefined || next.r !== undefined) cur.rad = next.radius ?? next.r;
    if (next.lobes !== undefined || next.bumps !== undefined) cur.nLobes = next.lobes ?? next.bumps;
    if (next.amp !== undefined) cur.amp = next.amp;
    if (next.cleft !== undefined) cur.cleft = next.cleft;
    if (next.seed !== undefined) cur.seed = next.seed;
    const rand = rng(cur.seed);
    const dirs = Array.from({ length: cur.nLobes }, () => {
      const z = rand.next() * 2 - 1, a = rand.next() * Math.PI * 2, w = Math.sqrt(Math.max(0, 1 - z * z));
      return { x: w * Math.cos(a), y: w * Math.sin(a), z, s: (rand.next() - 0.35) * cur.amp };
    });
    for (let i = 0; i < attr.count; i++) {
      const nx = basePos[3 * i], ny = basePos[3 * i + 1], nz = basePos[3 * i + 2];
      let scale = 1;
      for (const d of dirs) {
        const dot = nx * d.x + ny * d.y + nz * d.z;
        if (dot > 0) scale += d.s * dot * dot * dot;
      }
      // optional binding cleft along +x (for active-site pockets)
      if (cur.cleft > 0 && nx > 0.35 && Math.abs(ny) < 0.45) {
        const pocket = ((nx - 0.35) / 0.65) * (1 - (ny / 0.45) ** 2);
        scale -= cur.cleft * Math.max(0, pocket);
      }
      attr.setXYZ(i, nx * cur.rad * scale, ny * cur.rad * scale, nz * cur.rad * scale);
    }
    attr.needsUpdate = true;
    geo.computeVertexNormals(); geo.computeBoundingSphere(); geo.computeBoundingBox();
  }
  update();
  const object = part(parent, geo, { pal: palOf(pal ?? color), tone, pos, ex, name });
  return { object, mesh: object, labels: [], update };
}

export function particles(parent, count, { radius = 0.05, color = 'red', axes, name = 'Particles' } = {}) {
  const to = toOf(axes), object = new THREE.InstancedMesh(new THREE.SphereGeometry(radius, 16, 12), shadeMat(palOf(color)), count);
  object.userData = { tone: TONE.mid, baseTone: TONE.mid, part: name, home: V(), ex: V() };
  object.frustumCulled = false; parent.add(object);
  const m4 = new THREE.Matrix4(), p = V();
  return {
    object, labels: [],
    set(i, xyz) { point(to, xyz, p); object.setMatrixAt(i, m4.makeTranslation(p.x, p.y, p.z)); object.instanceMatrix.needsUpdate = true; object.boundingSphere = null; },
    show(n) { object.count = Math.max(0, Math.min(count, n)); },
  };
}

// covalent radii, Å (Cordero et al. 2008)
const COV = { H: 0.31, B: 0.84, C: 0.76, N: 0.71, O: 0.66, F: 0.57, Si: 1.11, P: 1.07, S: 1.05, Cl: 1.02, Br: 1.2, I: 1.39 };
const ELEM_PAL = { C: 'ink', H: 'paper', N: 'blue', O: 'red', S: 'ochre' };
export function parseXYZ(xyz) {
  const rows = xyz.trim().split('\n'), body = /^\s*\d+\s*$/.test(rows[0]) ? rows.slice(2, 2 + +rows[0]) : rows;
  return body.map(l => l.trim().split(/\s+/)).filter(w => w.length >= 4).map(([e, ...c]) => ({ elem: e[0].toUpperCase() + e.slice(1).toLowerCase(), pos: c.slice(0, 3).map(Number) }));
}
export function molecule(parent, xyz, { scale = 1, names = true, name = 'Molecule' } = {}) {
  const atoms = parseXYZ(xyz), bonds = [], cov = e => COV[e] ?? 0.75;
  for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
    const d = Math.hypot(...atoms[i].pos.map((c, k) => c - atoms[j].pos[k]));
    if (d < (cov(atoms[i].elem) + cov(atoms[j].elem)) * 1.15) bonds.push([i, j]);
  }
  const object = new THREE.Group(); object.name = name; parent.add(object);
  const c = atoms.reduce((s, a) => s.add(V(...a.pos)), V()).divideScalar(atoms.length || 1);
  const at = atoms.map(a => V(...a.pos).sub(c).multiplyScalar(scale)), r = a => (0.16 + 0.26 * cov(a.elem)) * scale, spheres = {};
  atoms.forEach((a, i) => {
    const rr = r(a), geo = spheres[rr] ??= new THREE.SphereGeometry(rr, 28, 18);
    part(object, geo, { pal: palOf(ELEM_PAL[a.elem] || 'dark'), tone: 'mid', pos: at[i].toArray(), name: a.elem });
  });
  const stick = new THREE.CylinderGeometry(0.07 * scale, 0.07 * scale, 1, 16), UP = V(0, 1, 0);
  for (const [i, j] of bonds) {
    const d = at[j].clone().sub(at[i]), m = part(object, stick, { pal: 'base', tone: 'lo', pos: at[i].clone().lerp(at[j], 0.5).toArray(), name: 'Bond' });
    m.scale.y = d.length(); m.quaternion.setFromUnitVectors(UP, d.normalize());
  }
  const labels = names ? atoms.map((a, i) => pin('mark', a.elem, object, () => object.position.clone().add(at[i]).add(V(0, r(a) + 0.16 * scale, 0)))) : [];
  return { object, labels, atoms, bonds };
}
