// The figure: a row of small scenes along x, one per page, floating over faint graph paper. Electron pairs as soft
// lobes, a tetrahedron in a cube, then methane, ammonia and water at their measured geometry, a lone pair that swells,
// and the molecules where the rule of thumb runs out. Ball-and-stick: atoms are drawn small (not to their size);
// positions are to scale, S world units per ångström. Every position, angle and length comes from model.js.
import * as THREE from 'three';
import { part, cyl, lines, shadeMat, PALETTE, V } from '@saxster/atlas/parts.js';
import * as M from './model.js';

// the chapter's own colours: sulfur's yellow; violet for a lone pair, sage green for a bond pair (an electron domain)
PALETTE.sulfur = ['#f4e7a6', '#e3c75c', '#b99b36'];
PALETTE.lone = ['#8d6be0', '#6a45c8', '#4c2e99'];
PALETTE.pair = ['#6fb488', '#4f9a6c', '#3a7a52'];

export const S = 1.25;                     // world units per Å
export const STATIONS = { domains: 0, tetra: 11, ch4: 21, nh3: 31, h2o: 41, swell: 51, real: 63, edge: 78 };
export const SPACING = { domains: 2.9, real: 3.0, edge: 2.1 };
const RAD = { H: 0.17, C: 0.30, N: 0.28, O: 0.27, S: 0.36 };          // drawn radii, world units (not atomic sizes)
const PAL = { H: 'paper', C: 'ink', N: 'blue', O: 'red', S: 'sulfur' };
const ELEMENT = { H: 'Hydrogen atoms', C: 'Carbon atom', N: 'Nitrogen atom', O: 'Oxygen atom', S: 'Sulfur atom' };
const UP = V(0, 1, 0);
const R_ARC = 0.62, R_OUT = 0.17;          // angle arcs (world units from the centre), and how far past an arc's middle its number sits
const EX = 0.5;                            // how far a breakdown pulls each pair out along its own direction
const ARC = '#5a5a60', FAINT = '#b9b9be';
const v3 = a => V(a[0], a[1], a[2]);
const cap = s => s[0].toUpperCase() + s.slice(1);

// A lobe of electron density, pointing along +y from the nucleus: widest at u = 0.5^(1/k) of its length
// (k < 1: bunched near the nucleus, as a lone pair; k > 1: further out, as a pair shared with a second nucleus).
function lobeGeo(L, W, k, y0 = 0) {
  const pts = [];
  for (let i = 0; i <= 28; i++) { const u = i / 28; pts.push(new THREE.Vector2(W * Math.pow(Math.sin(Math.PI * Math.pow(u, k)), 0.62), y0 + L * u)); }
  return new THREE.LatheGeometry(pts, 36);
}
// formulas in labels: CH₄ → CH<sub>4</sub>, since the serif label face draws ₄ as an old-style 4
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
// arc numbers: the centred 'mark' label, set in the board labels' italic ink (the board class hangs text right of its anchor)
const ctr = html => `<span style="font:italic 17px/1 var(--serif);color:var(--hi)">${html}</span>`;
// coordinates on the cube: tick labels, in ink and large enough to read
const coord = html => `<span style="font:13px/1 var(--mono);color:var(--hi)">${html}</span>`;
// phones: the readout fills the figure's bottom-right corner, so captions under a lone molecule move to its left
const narrow = () => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 900px), (max-height: 520px)').matches;
export const chem = s => s.replace(/[₀-₉]+/g, m => `<sub>${[...m].map(c => SUBS.indexOf(c)).join('')}</sub>`);

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
  // an electron pair: a tinted, translucent lobe with an ink outline. The blend happens in linear light, so an
  // opacity of 0.5 reads on paper as roughly a 30 % tint. edge: false for a lobe that wraps its bond and
  // H atom (page 1.5's bond pairs), whose outline would hide theirs in the edge pass.
  const lobe = (parent, geo, u, { name = 'Lone pairs', pal = 'lone', op = 0.5, edge = true, ex: e = [0, 0, 0] } = {}) => {
    const m = part(parent, geo, { tone: 'mid', name, ex: e, mat: shadeMat(pal, { opacity: op }) });
    m.quaternion.setFromUnitVectors(UP, v3(u));
    if (!edge) m.userData.noEdge = true;
    m.renderOrder = 2;
    return m;
  };
  // lobes start at the atom's surface, so the atom keeps its own outline
  const LONE = lobeGeo(0.9, 0.42, 0.8, 0.24), PAIR = lobeGeo(1.0, 0.30, 1.25, 0.12);
  // an angle arc between directions a and b, radius R_ARC, in parent's frame; returns its midpoint direction
  const arcPts = (a, b, R = R_ARC, n = 24) => {
    const A = v3(a).normalize(), B = v3(b).normalize(), w = A.angleTo(B), c = [];
    const at = s => A.clone().multiplyScalar(Math.sin((1 - s) * w)).add(B.clone().multiplyScalar(Math.sin(s * w))).divideScalar(Math.sin(w)).multiplyScalar(R);
    for (let i = 0; i < n; i++) { const p = at(i / n), q = at((i + 1) / n); c.push(p.x, p.y, p.z, q.x, q.y, q.z); }
    return c;
  };
  const arc = (parent, a, b, color = ARC) => lines(parent, arcPts(a, b), color);
  const mid = (a, b) => v3(a).normalize().add(v3(b).normalize()).normalize();
  // an angle's number: at its arc's middle, a little further out, brought toward the camera so nothing hides it
  const arcAt = (obj, m, R = R_ARC) => () => toCam(obj.localToWorld(m.clone().multiplyScalar(R + R_OUT)), 0.45);
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
  // the two bonds whose angle is labelled: the pair facing the reader (ring azimuths 30° and 150°, see model.domains)
  const front = (k, d) => M.kindOf(k) === 'AX4' ? [d.bonds[1], d.bonds[2]] : [d.bonds[0], d.bonds[1]];
  const caption = (html, at) => label('mark', html, at);

  // ---------- 0 · electron pairs, as far apart as they can get: 2, 3 and 4 ----------
  const X0 = STATIONS.domains, sets = { 2: [[-1, 0, 0], [1, 0, 0]], 3: [[0, 1, 0], [Math.sin(2 * Math.PI / 3), Math.cos(2 * Math.PI / 3), 0], [-Math.sin(2 * Math.PI / 3), Math.cos(2 * Math.PI / 3), 0]], 4: M.domains('AX4').bonds };
  const DOM = {};
  for (const n of [2, 3, 4]) {
    const g = asm(`domains${n}`, root, { title: `${n} electron pairs`, sub: `${M.SPREAD_NAME[n]}: ${M.SPREAD[n].toFixed(n === 4 ? 1 : 0)}° apart` });
    const x = X0 + (n - 3) * SPACING.domains, spin = new THREE.Group(); spin.position.set(x, 0, 0); g.add(spin); spins.push(spin);
    ball(spin, 'C', [0, 0, 0], { r: 0.17, pal: 'dark', name: 'Central atom' });
    for (const u of sets[n]) lobe(spin, PAIR, u, { name: 'Electron pairs', pal: 'pair', op: 0.5, ex: M.scale(u, EX) });
    if (n > 2) { const [a, b] = n === 4 ? [sets[4][1], sets[4][2]] : [sets[3][1], sets[3][2]]; arc(spin, a, b);
      const m = mid(a, b); label('mark', ctr(`${M.SPREAD[n].toFixed(n === 4 ? 1 : 0)}°`), arcAt(spin, m)); }
    caption(`${n} pairs`, () => V(x, -1.3, 0));
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
  arc(tSpin, CORNERS[0], CORNERS[3]);
  { const m = mid(CORNERS[0], CORNERS[3]);
    label('mark', ctr(`${M.TET_DEG.toFixed(2)}°`), arcAt(tSpin, m)); }
  label('tick', coord('(1, 1, 1)'), () => toCam(tSpin.localToWorld(v3(M.scale(CORNERS[0], CUBE * 1.12))), 0.3).add(V(0.15, 0.1, 0)));
  // on phones the corner hint runs along the figure's top edge, so this one sits below its corner instead of above
  label('tick', coord('(−1, 1, −1)'), () => narrow() ? toCam(tSpin.localToWorld(v3(M.scale(CORNERS[3], CUBE))), 0.3).add(V(0.1, -0.34, 0))
    : toCam(tSpin.localToWorld(v3(M.scale(CORNERS[3], CUBE * 1.12))), 0.3));

  // ---------- 2–4 · methane, ammonia, water at their measured geometry ----------
  const one = (key, k, title, sub) => {
    const m = M.MOL[k], g = asm(key, root, { title, sub });
    const d = M.domains(M.kindOf(k), m.angle, M.squeeze(M.kindOf(k)).lone);
    const mol = molecule(g, STATIONS[key], m.centre, m.r, d); spins.push(mol.spin);
    const [a, b] = front(k, d);
    arc(mol.spin, a, b);
    const mm = mid(a, b);
    label('mark', ctr(`${m.angle.toFixed(1)}°`), arcAt(mol.spin, mm));
    caption(chem(m.formula), () => narrow() ? V(STATIONS[key] - 1.6, -1.05, 0) : V(STATIONS[key], -1.3, 0));   // the shape's name is in the figure's title
    if (d.lone.length) label('mark', d.lone.length > 1 ? 'lone pairs' : 'lone pair', () => toCam(mol.at(v3(d.lone[0]).multiplyScalar(0.8).add(V(0.85, 0.1, 0))), 0.2));
    return { g, mol, d };
  };
  const ch4 = one('ch4', 'CH4', 'Methane', 'four bonds, no lone pairs');
  const nh3 = one('nh3', 'NH3', 'Ammonia', 'three bonds and one lone pair');
  const h2o = one('h2o', 'H2O', 'Water', 'two bonds and two lone pairs');

  // ---------- 5 · why a lone pair pushes harder: it swells from a bond pair's size to its own ----------
  const X5 = STATIONS.swell, m5 = M.MOL.NH3;
  const g5 = asm('swell', root, { title: 'A lone pair swells', sub: 'held by one nucleus, it spreads wide near it' });
  const s5 = new THREE.Group(); s5.position.set(X5, 0, 0); g5.add(s5); spins.push(s5);
  ball(s5, 'N', [0, 0, 0]);
  const PAIR5 = lobeGeo(m5.r * S, 0.24, 1.0);                       // a bond pair: shared, stretched between N and H
  const LONE5 = lobeGeo(1, 1, 0.85, 0.2);                            // the lone pair, unit size: scaled each frame by its strength
  const sw = { H: [], B: [], P: [] };
  for (let i = 0; i < 3; i++) { sw.H.push(ball(s5, 'H', [0, 0, 0])); sw.B.push(stick(s5, [0, 1, 0], m5.r * S)); sw.P.push(lobe(s5, PAIR5, [0, 1, 0], { name: 'Bond pairs', pal: 'pair', op: 0.36, edge: false })); }
  const lone5 = lobe(s5, LONE5, [0, 1, 0], { name: 'Lone pair', op: 0.5 });
  const arc5 = lines(s5, new Array(24 * 6).fill(0), ARC); arc5.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  let ang5 = M.TET_DEG, mid5 = V(0, -1, 0);
  label('mark', '', () => toCam(s5.localToWorld(mid5.clone().multiplyScalar(R_ARC + R_OUT)), 0.45), () => ctr(`${ang5.toFixed(1)}°`));
  label('mark', 'lone pair', () => toCam(s5.localToWorld(V(0.85, 0.85, 0)), 0.2));
  caption(chem('NH₃'), () => narrow() ? V(X5 - 1.6, -1.05, 0) : V(X5, -1.3, 0));
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
    // q = 1: exactly a bond pair's domain (0.24 wide, as long as the bond); at full strength more than twice as wide
    const W = 0.24 + (0.56 - 0.24) * u, L = m5.r * S + (1.0 - m5.r * S) * u;
    lone5.scale.set(W, L, W);
    lone5.userData.ex.set(0, EX, 0);
    const a = arc5.geometry.attributes.position; arcPts(d.bonds[0], d.bonds[1]).forEach((v, i) => { a.array[i] = v; });
    a.needsUpdate = true; arc5.geometry.computeBoundingSphere();
    mid5 = mid(d.bonds[0], d.bonds[1]);
  }
  setSwell(1);

  // ---------- 6 · the real molecules: measured lengths and angles, atoms only ----------
  const X6 = STATIONS.real;
  const real = M.MAIN.map((k, i) => {
    const m = M.MOL[k], key = `real_${k}`, g = asm(key, root, { title: `${cap(m.name)}, as measured`, sub: `${m.centre}–H ${m.r.toFixed(3)} Å, ${m.angle.toFixed(2)}°` });
    const x = X6 + (i - 1) * SPACING.real, d = M.domains(M.kindOf(k), m.angle);
    const mol = molecule(g, x, m.centre, m.r, d, { lone: false }); spins.push(mol.spin);
    const [a, b] = front(k, d);
    arc(mol.spin, a, b);
    const mm = mid(a, b);
    label('mark', ctr(`${m.angle.toFixed(2)}°`), arcAt(mol.spin, mm));
    caption(chem(m.formula), () => V(x, -1.6, 0));                    // below water's angle, which hangs lowest
    return { g, mol };
  });

  // ---------- 7 · where it stops working: water against hydrogen sulfide ----------
  const X7 = STATIONS.edge, edge = {};
  for (const [k, sgn] of [['H2O', -1], ['H2S', 1]]) {
    const m = M.MOL[k], key = k === 'H2O' ? 'edge_h2o' : 'h2s', p = M.PREDICT[k];
    const g = asm(key, root, { title: cap(m.name), sub: `measured ${m.angle.toFixed(1)}°; the toy VSEPR model says ${p.bond.toFixed(1)}°` });
    const x = X7 + sgn * SPACING.edge, d = M.domains('AX2E2', m.angle, p.lone);
    const mol = molecule(g, x, m.centre, m.r, d); spins.push(mol.spin);
    arc(mol.spin, d.bonds[0], d.bonds[1]);
    const mm = mid(d.bonds[0], d.bonds[1]);
    label('mark', ctr(`${m.angle.toFixed(1)}°`), arcAt(mol.spin, mm));
    caption(chem(m.formula), () => V(x, -1.9, 0));
    edge[k] = { g, mol, d };
  }
  // where the rule of thumb would put sulfur's hydrogens: full-size translucent grey atoms on dashed bonds, at the model's angle
  const ghost = new THREE.Group(); edge.H2S.mol.spin.add(ghost);
  { const gd = M.domains('AX2E2', M.PREDICT.H2S.bond), rr = M.MOL.H2S.r * S, c = [], gm = shadeMat('dark', { opacity: 0.3 });
    for (const u of gd.bonds) {
      const m = part(ghost, SPH, { tone: 'mid', name: 'VSEPR’s prediction', pos: M.scale(u, rr), mat: gm }); m.scale.setScalar(RAD.H); m.renderOrder = 2;
      for (let s = 0.22; s < 0.9; s += 0.09) c.push(...M.scale(u, rr * s), ...M.scale(u, rr * (s + 0.05)));
    }
    lines(ghost, c, '#7a7a80');
    // named under the left-hand ghost, in the open space between the two molecules
    const lm = v3(gd.bonds[0]);
    label('mark', `<span style="color:var(--hi)">VSEPR ≈ ${M.PREDICT.H2S.bond.toFixed(0)}°</span>`, () => toCam(edge.H2S.mol.at(lm.clone().multiplyScalar(rr).add(V(-0.05, -0.45, 0))), 0.3)); }

  // ---------- per frame ----------
  function update({ t, q }) {
    const r = M.rock(t) * M.DEG;
    for (const s of spins) s.rotation.y = r;
    setSwell(q);
  }
  return { update, labels };
}
