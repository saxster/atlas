// The figure: a row of small scenes along x, one per page, floating over faint graph paper. Electron pairs as soft
// lobes, a tetrahedron in a cube, then methane, ammonia and water at their measured geometry, a lone pair that swells,
// and the molecules where the rule of thumb runs out. Ball-and-stick: atoms are drawn small (not to their size);
// positions are to scale, S world units per ångström. Every position, angle and length comes from model.js.
import * as THREE from 'three';
import { part, cyl, lines, shadeMat, PALETTE, V } from '../../engine/parts.js';
import * as M from './model.js';

// the chapter's own colours: sulfur's yellow, and a faint violet-grey for electron pairs
PALETTE.sulfur = ['#f4e7a6', '#e3c75c', '#b99b36'];
PALETTE.lobe = ['#f7f5fc', '#e8e4f3', '#cfc9e0'];

export const S = 1.25;                     // world units per Å
export const STATIONS = { domains: 0, tetra: 11, ch4: 21, nh3: 31, h2o: 41, swell: 51, real: 63, edge: 78 };
export const SPACING = { domains: 3.1, real: 3.0, edge: 1.85 };
const RAD = { H: 0.17, C: 0.30, N: 0.28, O: 0.27, S: 0.36 };          // drawn radii, world units (not atomic sizes)
const PAL = { H: 'paper', C: 'ink', N: 'blue', O: 'red', S: 'sulfur' };
const ELEMENT = { H: 'Hydrogen atoms', C: 'Carbon atom', N: 'Nitrogen atom', O: 'Oxygen atom', S: 'Sulfur atom' };
const UP = V(0, 1, 0);
const R_ARC = 0.52, R_LAB = 0.9;           // angle arcs, and where their numbers sit (world units from the centre)
const EX = 0.5;                            // how far a breakdown pulls each pair out along its own direction
const ARC = '#5a5a60', FAINT = '#b9b9be';
const v3 = a => V(a[0], a[1], a[2]);

// A lobe of electron density, pointing along +y from the nucleus: widest at u = 0.5^(1/k) of its length
// (k < 1: bunched near the nucleus, as a lone pair; k > 1: further out, as a pair shared with a second nucleus).
function lobeGeo(L, W, k) {
  const pts = [];
  for (let i = 0; i <= 28; i++) { const u = i / 28; pts.push(new THREE.Vector2(W * Math.pow(Math.sin(Math.PI * Math.pow(u, k)), 0.62), L * u)); }
  return new THREE.LatheGeometry(pts, 36);
}

export function buildWorld(E) {
  const { scene, asm, camera } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at, text) => labels.push({ cls, html, at, text });
  const ex = g => Math.max(g.userData.explode, 0);
  // a label point brought a little toward the camera, so the thing it names never stands in front of it
  const toCam = (p, d) => p.add(camera.position.clone().sub(p).normalize().multiplyScalar(d));

  // faint graph paper below everything
  { const g = [], y = -1.75;
    for (let x = -6; x <= 86; x++) g.push(x, y, -3, x, y, 3);
    for (let z = -3; z <= 3; z++) g.push(-6, y, z, 86, y, z);
    lines(root, g, '#ececE8'); }

  const SPH = new THREE.SphereGeometry(1, 36, 24);
  const ball = (parent, el, at, { r = RAD[el], name = ELEMENT[el], ex: e = [0, 0, 0], pal = PAL[el], tone = 'hi' } = {}) => {
    const m = part(parent, SPH, { pal, tone, name, pos: at, ex: e }); m.scale.setScalar(r); return m;
  };
  // a bond: a stick from the centre along u, length l (world units)
  const STICK = cyl(1, 1, 20);
  const stick = (parent, u, l, { r = 0.055, ex: e = [0, 0, 0], name = 'Bonds', pal = 'dark' } = {}) => {
    const m = part(parent, STICK, { pal, tone: 'mid', name, pos: M.scale(u, l / 2), ex: e });
    m.scale.set(r, l, r); m.quaternion.setFromUnitVectors(UP, v3(u)); return m;
  };
  const lobeMat = op => shadeMat('lobe', { opacity: op });
  const lobe = (parent, geo, u, { name = 'Lone pairs', op = 0.62, ex: e = [0, 0, 0] } = {}) => {
    const m = part(parent, geo, { tone: 'lo', name, ex: e, mat: lobeMat(op) });
    m.quaternion.setFromUnitVectors(UP, v3(u));
    m.userData.noEdge = true;                       // soft: no ink outline, so the atoms inside stay drawn
    m.renderOrder = 2;
    return m;
  };
  const LONE = lobeGeo(0.95, 0.40, 0.8), PAIR = lobeGeo(1.05, 0.30, 1.25);
  // an angle arc between directions a and b, radius R_ARC, in parent's frame; returns its midpoint direction
  const arcPts = (a, b, R = R_ARC, n = 24) => {
    const A = v3(a).normalize(), B = v3(b).normalize(), w = A.angleTo(B), c = [];
    const at = s => A.clone().multiplyScalar(Math.sin((1 - s) * w)).add(B.clone().multiplyScalar(Math.sin(s * w))).divideScalar(Math.sin(w)).multiplyScalar(R);
    for (let i = 0; i < n; i++) { const p = at(i / n), q = at((i + 1) / n); c.push(p.x, p.y, p.z, q.x, q.y, q.z); }
    return c;
  };
  const arc = (parent, a, b, color = ARC) => lines(parent, arcPts(a, b), color);
  const mid = (a, b) => v3(a).normalize().add(v3(b).normalize()).normalize();
  // a molecule: centre atom, bonds and H atoms along d.bonds, lone-pair lobes along d.lone; all inside a group that rocks
  function molecule(g, x, el, rA, d, { lone = true, y = 0 } = {}) {
    const spin = new THREE.Group(); spin.position.set(x, y, 0); g.add(spin);
    ball(spin, el, [0, 0, 0]);
    const H = d.bonds.map(u => ball(spin, 'H', M.scale(u, rA * S), { ex: M.scale(u, EX) }));
    const B = d.bonds.map(u => stick(spin, u, rA * S, { ex: M.scale(u, EX) }));
    const L = lone ? d.lone.map(u => lobe(spin, LONE, u, { ex: M.scale(u, EX) })) : [];
    return { spin, H, B, L, at: p => spin.localToWorld(p.clone()) };
  }
  const spins = [];
  const caption = (html, at) => label('mark', html, at);

  // ---------- 0 · electron pairs, as far apart as they can get: 2, 3 and 4 ----------
  const X0 = STATIONS.domains, sets = { 2: [[-1, 0, 0], [1, 0, 0]], 3: [[0, 1, 0], [Math.sin(2 * Math.PI / 3), Math.cos(2 * Math.PI / 3), 0], [-Math.sin(2 * Math.PI / 3), Math.cos(2 * Math.PI / 3), 0]], 4: M.domains('AX4').bonds };
  const DOM = {};
  for (const n of [2, 3, 4]) {
    const g = asm(`domains${n}`, root, { title: `${n} electron pairs`, sub: `${M.SPREAD_NAME[n]}: ${M.SPREAD[n].toFixed(n === 4 ? 1 : 0)}° apart` });
    const x = X0 + (n - 3) * SPACING.domains, spin = new THREE.Group(); spin.position.set(x, 0, 0); g.add(spin); spins.push(spin);
    ball(spin, 'C', [0, 0, 0], { r: 0.17, pal: 'dark', name: 'Central atom' });
    for (const u of sets[n]) lobe(spin, PAIR, u, { name: 'Electron pairs', op: 0.7, ex: M.scale(u, EX) });
    if (n > 2) { const [a, b] = n === 4 ? [sets[4][1], sets[4][2]] : [sets[3][1], sets[3][2]]; arc(spin, a, b);
      const m = mid(a, b); label('board', `${M.SPREAD[n].toFixed(n === 4 ? 1 : 0)}°`, () => toCam(spin.localToWorld(m.clone().multiplyScalar(R_LAB)), 0.4)); }
    caption(`${n} pairs · ${M.SPREAD_NAME[n]}`, () => V(x, -1.42, 0));
    DOM[n] = { g, spin };
  }

  // ---------- 1 · the tetrahedral angle: alternate corners of a cube ----------
  const X1 = STATIONS.tetra, CUBE = 0.9;
  const gT = asm('tetra', root, { title: 'A tetrahedron in a cube', sub: 'cos θ = −1/3, θ = 109.47°' });
  const tSpin = new THREE.Group(); tSpin.position.set(X1, 0, 0); gT.add(tSpin); spins.push(tSpin);
  { const c = [], a = CUBE;
    for (const s of [-1, 1]) for (const t of [-1, 1]) c.push(-a, s * a, t * a, a, s * a, t * a, s * a, -a, t * a, s * a, a, t * a, s * a, t * a, -a, s * a, t * a, a);
    lines(tSpin, c, FAINT); }
  const CORNERS = [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]];
  { const c = []; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) c.push(...M.scale(CORNERS[i], CUBE), ...M.scale(CORNERS[j], CUBE)); lines(tSpin, c, '#9a9aa0'); }
  ball(tSpin, 'C', [0, 0, 0], { r: 0.14, name: 'Centre' });
  for (const k of CORNERS) {
    const u = M.unit(k), l = M.len(k) * CUBE;
    ball(tSpin, 'H', M.scale(k, CUBE), { r: 0.1, name: 'Corners', ex: M.scale(u, EX) });
    stick(tSpin, u, l, { r: 0.03, pal: 'ink', name: 'Vectors', ex: M.scale(u, EX) });
  }
  arc(tSpin, CORNERS[0], CORNERS[1]);
  { const m = mid(CORNERS[0], CORNERS[1]);
    label('board', `${M.TET_DEG.toFixed(2)}°`, () => toCam(tSpin.localToWorld(m.clone().multiplyScalar(R_LAB)), 0.3)); }
  label('tick', '(1, 1, 1)', () => toCam(tSpin.localToWorld(v3(M.scale(CORNERS[0], CUBE * 1.12))), 0.3).add(V(0.15, 0.1, 0)));
  label('tick', '(−1, −1, 1)', () => toCam(tSpin.localToWorld(v3(M.scale(CORNERS[1], CUBE * 1.12))), 0.3));

  // ---------- 2–4 · methane, ammonia, water at their measured geometry ----------
  const one = (key, k, title, sub) => {
    const m = M.MOL[k], g = asm(key, root, { title, sub });
    const d = M.domains(M.kindOf(k), m.angle, M.squeeze(M.kindOf(k)).lone);
    const mol = molecule(g, STATIONS[key], m.centre, m.r, d); spins.push(mol.spin);
    const [a, b] = M.kindOf(k) === 'AX2E2' ? d.bonds : [d.bonds[1], d.bonds[2]];
    arc(mol.spin, a, b);
    const mm = mid(a, b);
    label('board', `${m.angle.toFixed(1)}°`, () => toCam(mol.at(mm.clone().multiplyScalar(R_LAB)), 0.45));
    caption(`${m.formula} · ${m.shape}`, () => V(STATIONS[key], -1.42, 0));
    if (d.lone.length) label('mark', d.lone.length > 1 ? 'lone pairs' : 'lone pair', () => toCam(mol.at(v3(d.lone[0]).multiplyScalar(1.15).add(V(0.5, 0.05, 0))), 0.2));
    return { g, mol, d };
  };
  const ch4 = one('ch4', 'CH4', 'Methane, CH₄', 'four bonds, no lone pairs');
  const nh3 = one('nh3', 'NH3', 'Ammonia, NH₃', 'three bonds and one lone pair');
  const h2o = one('h2o', 'H2O', 'Water, H₂O', 'two bonds and two lone pairs');

  // ---------- 5 · why a lone pair pushes harder: it swells from a bond pair's size to its own ----------
  const X5 = STATIONS.swell, m5 = M.MOL.NH3;
  const g5 = asm('swell', root, { title: 'A lone pair swells', sub: 'held by one nucleus, it spreads wide near it' });
  const s5 = new THREE.Group(); s5.position.set(X5, 0, 0); g5.add(s5); spins.push(s5);
  ball(s5, 'N', [0, 0, 0]);
  const PAIR5 = lobeGeo(m5.r * S, 0.24, 1.0);                       // a bond pair: shared, stretched between N and H
  const sw = { H: [], B: [], P: [] };
  for (let i = 0; i < 3; i++) { sw.H.push(ball(s5, 'H', [0, 0, 0])); sw.B.push(stick(s5, [0, 1, 0], m5.r * S)); sw.P.push(lobe(s5, PAIR5, [0, 1, 0], { name: 'Bond pairs', op: 0.45 })); }
  const lone5 = lobe(s5, PAIR5, [0, 1, 0], { name: 'Lone pair', op: 0.62 });
  const arc5 = lines(s5, new Array(24 * 6).fill(0), ARC); arc5.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  let ang5 = M.TET_DEG, mid5 = V(0, -1, 0);
  label('board', '', () => toCam(s5.localToWorld(mid5.clone().multiplyScalar(R_LAB)), 0.45), () => `${ang5.toFixed(1)}°`);
  label('mark', 'lone pair', () => toCam(s5.localToWorld(V(0.55, 1.12, 0)), 0.2));
  caption('NH₃ · the lone pair grows', () => V(X5, -1.42, 0));
  function setSwell(q) {
    const u = (q - 1) / (M.Q_LONE - 1), sq = M.squeeze('AX3E', q), d = M.domains('AX3E', sq.bond);
    ang5 = sq.bond;
    d.bonds.forEach((b, i) => {
      const at = M.scale(b, m5.r * S), e = M.scale(b, EX);
      sw.H[i].userData.home.set(...at); sw.H[i].userData.ex.set(...e);
      sw.B[i].userData.home.set(...M.scale(b, m5.r * S / 2)); sw.B[i].userData.ex.set(...e); sw.B[i].quaternion.setFromUnitVectors(UP, v3(b));
      sw.P[i].quaternion.setFromUnitVectors(UP, v3(b)); sw.P[i].userData.ex.set(...e);
    });
    // q = 1: the lone pair is the size of a bond pair; q = Q_LONE: shorter, and much wider near the nucleus
    lone5.scale.set(1 + 0.75 * u, 1 - 0.3 * u, 1 + 0.75 * u);
    lone5.userData.ex.set(0, EX, 0);
    const a = arc5.geometry.attributes.position; arcPts(d.bonds[1], d.bonds[2]).forEach((v, i) => { a.array[i] = v; });
    a.needsUpdate = true; arc5.geometry.computeBoundingSphere();
    mid5 = mid(d.bonds[1], d.bonds[2]);
  }
  setSwell(1);

  // ---------- 6 · the real molecules: measured lengths and angles, atoms only ----------
  const X6 = STATIONS.real;
  const real = M.MAIN.map((k, i) => {
    const m = M.MOL[k], key = `real_${k}`, g = asm(key, root, { title: `${m.formula}, as measured`, sub: `${m.centre}–H ${m.r.toFixed(3)} Å, ${m.angle.toFixed(2)}°` });
    const x = X6 + (i - 1) * SPACING.real, d = M.domains(M.kindOf(k), m.angle);
    const mol = molecule(g, x, m.centre, m.r, d, { lone: false }); spins.push(mol.spin);
    const [a, b] = M.kindOf(k) === 'AX2E2' ? d.bonds : [d.bonds[1], d.bonds[2]];
    arc(mol.spin, a, b);
    const mm = mid(a, b);
    label('board', `${m.angle.toFixed(2)}°`, () => toCam(mol.at(mm.clone().multiplyScalar(R_LAB)), 0.45));
    // the length, beside the bond on the left: half way along it, pushed out sideways
    const bl = v3(a), side = V(-bl.y, bl.x, 0).normalize().multiplyScalar(i === 0 ? -0.22 : 0.22);
    label('tick', `${m.r.toFixed(3)} Å`, () => toCam(mol.at(bl.clone().multiplyScalar(m.r * S * 0.55).add(side).add(V(-0.08, 0, 0))), 0.4));
    caption(m.formula, () => V(x, -1.42, 0));
    return { g, mol };
  });

  // ---------- 7 · where it stops working: water against hydrogen sulfide ----------
  const X7 = STATIONS.edge, edge = {};
  for (const [k, sgn] of [['H2O', -1], ['H2S', 1]]) {
    const m = M.MOL[k], key = k === 'H2O' ? 'edge_h2o' : 'h2s', p = M.PREDICT[k];
    const g = asm(key, root, { title: `${m.formula}, ${m.name}`, sub: `measured ${m.angle.toFixed(1)}°; the toy VSEPR model says ${p.bond.toFixed(1)}°` });
    const x = X7 + sgn * SPACING.edge, d = M.domains('AX2E2', m.angle, p.lone);
    const mol = molecule(g, x, m.centre, m.r, d); spins.push(mol.spin);
    arc(mol.spin, d.bonds[0], d.bonds[1]);
    const mm = mid(d.bonds[0], d.bonds[1]);
    label('board', `${m.angle.toFixed(1)}°`, () => toCam(mol.at(mm.clone().multiplyScalar(R_LAB + 0.12)), 0.45));
    caption(`${m.formula} · measured`, () => V(x, -1.42, 0));
    edge[k] = { g, mol, d };
  }
  // where the rule of thumb would put sulfur's hydrogens: ghost outlines at the model's angle
  const ghost = new THREE.Group(); edge.H2S.mol.spin.add(ghost);
  { const gd = M.domains('AX2E2', M.PREDICT.H2S.bond), rr = M.MOL.H2S.r * S, c = [], ghostMat = new THREE.LineBasicMaterial({ color: '#a8a8ae' });
    for (const u of gd.bonds) {
      const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(RAD.H, 1)), ghostMat); l.userData = { noEdge: true };
      l.position.set(...M.scale(u, rr)); ghost.add(l);
      for (let s = 0.22; s < 0.92; s += 0.1) c.push(...M.scale(u, rr * s), ...M.scale(u, rr * (s + 0.05)));
    }
    lines(ghost, c, '#a8a8ae');
    const lm = v3(gd.bonds[1]);
    label('tick', `VSEPR ≈ ${M.PREDICT.H2S.bond.toFixed(0)}°`, () => toCam(edge.H2S.mol.at(lm.clone().multiplyScalar(rr + 0.3).add(V(0.95, -0.05, 0))), 0.3)); }

  // ---------- per frame ----------
  function update({ t, q }) {
    const r = M.rock(t) * M.DEG;
    for (const s of spins) s.rotation.y = r;
    setSwell(q);
  }
  return { update, labels };
}
