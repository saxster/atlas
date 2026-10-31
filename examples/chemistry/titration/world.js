// 3D burette and titration flask on the left where amber HA molecules convert to blue A⁻ ions (and phenolphthalein
// turns pink above pH 8.2), paired with the 3D pH(V_b) titration curve on the right.
import * as THREE from 'three';
import { PALETTE, part, cyl, shadeMat, lines, V } from '@saxster/atlas/parts.js';
import { axes, plot, area, particles, vector } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.glass = ['#f4f1ea', '#e5dfd2', '#cdc4b2'];
PALETTE.acid  = ['#f5c96b', '#d99b26', '#9e6d14']; // protonated weak acid HA (amber)
PALETTE.base  = ['#6aa8d8', '#3376ad', '#1f4e78']; // conjugate base A⁻ (blue)
PALETTE.pink  = ['#f4a6c8', '#d95b96', '#9e3366']; // phenolphthalein basic tint

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // ---------- left: burette + titration vessel ----------
  const gf = asm('flask', root, {
    title: 'Burette & buffer vessel (HA + OH⁻ → A⁻ + H₂O)',
    sub: 'amber HA weak-acid molecules convert 1-for-1 into blue A⁻ conjugate-base ions as NaOH drips in; phenolphthalein turns pink above pH 8.2',
  });
  const anchor = new THREE.Group();
  anchor.position.set(-1.95, 1.05, 0);
  gf.add(anchor);

  // Burette barrel and stopcock above the flask
  part(anchor, cyl(0.11, 1.05, 28), {
    pal: 'glass', tone: 'mid', pos: [0, 1.72, 0], name: 'Burette barrel (0.100 M NaOH)',
  });
  part(anchor, cyl(0.032, 0.24, 20), {
    pal: 'dark', tone: 'hi', pos: [0, 1.12, 0], name: 'Burette tip',
  });
  part(anchor, cyl(0.045, 0.34, 20), {
    pal: 'red', tone: 'mid', pos: [0, 1.24, 0], rot: [0, 0, Math.PI / 2], name: 'Stopcock valve',
  });

  // Falling OH⁻ droplet
  const drop = part(anchor, new THREE.SphereGeometry(0.052, 18, 14), {
    pal: 'base', tone: 'lit', pos: [0, 0.85, 0], name: 'NaOH titrant droplet',
  });

  // Cylindrical reaction beaker / flask
  part(anchor, cyl(1.12, 0.08, 48), {
    pal: 'glass', tone: 'lo', pos: [0, -0.92, 0], name: 'Flask base',
  });
  const topRim = part(anchor, new THREE.TorusGeometry(1.12, 0.025, 14, 64), {
    pal: 'dark', tone: 'mid', pos: [0, 0.72, 0], rot: [Math.PI / 2, 0, 0], name: 'Flask rim',
  });
  topRim.userData.noEdge = true;
  const botRim = part(anchor, new THREE.TorusGeometry(1.12, 0.025, 14, 64), {
    pal: 'dark', tone: 'mid', pos: [0, -0.88, 0], rot: [Math.PI / 2, 0, 0], name: 'Flask floor ring',
  });
  botRim.userData.noEdge = true;

  // Translucent phenolphthalein liquid cylinder (grows slightly as V_b increases and tints pink above pH 8.2)
  const liqMat = shadeMat('pink', { opacity: 0.06 });
  const liqCyl = part(anchor, cyl(1.08, 1.0, 40), {
    pal: 'pink', tone: 'mid', pos: [0, -0.35, 0], name: 'Solution with phenolphthalein indicator', mat: liqMat,
  });
  liqCyl.userData.noEdge = true;
  liqCyl.renderOrder = 2;

  // HA (amber) and A⁻ (blue) molecular beads
  const haBeads = particles(anchor, M.N_MOLECULES, { radius: 0.052, color: 'acid', name: 'Weak acid HA (CH₃COOH)' });
  const aBeads  = particles(anchor, M.N_MOLECULES, { radius: 0.052, color: 'base', name: 'Conjugate base A⁻ (CH₃COO⁻)' });
  const cloudPts = M.flaskCloud(M.N_MOLECULES, 2026);

  // ---------- right: pH(V_b) titration curve ----------
  const gc = asm('curve', root, {
    title: 'Titration curve pH(V_b) & buffer plateau',
    sub: 'Henderson–Hasselbalch buffer zone around V_{1/2} = 12.5 mL (pH = pK_a = 4.74) followed by the vertical equivalence cliff at V_eq = 25.0 mL (pH = 8.72)',
  });
  const ax = axes(gc, {
    x: [0, M.V_MAX], y: [0, 14], size: [3.3, 2.35], at: [0.25, 0.0, 0],
    ticks: { x: 5, y: 4 }, names: { x: '<i>V</i><sub>b</sub> (mL NaOH)', y: 'pH' }, grid: true,
  });
  labels.push(...ax.labels);

  // Shaded buffer region V_b ∈ [5, 20] mL
  const bufShade = area(gc, v => M.phAt(v), {
    axes: ax, x: [5, 20], pal: 'base', opacity: 0.18, name: 'Buffer plateau (pH ≈ pK_a ± 1)',
  });

  // Neutral line pH = 7 and equivalence vertical guide V_eq = 25.0 mL
  const pN0 = ax.to(0, 7), pN1 = ax.to(M.V_MAX, 7);
  const pEq0 = ax.to(M.V_EQ, 0), pEq1 = ax.to(M.V_EQ, 13.2);
  lines(gc, [...pN0.toArray(), ...pN1.toArray()], '#9a9aa0', 0.55);
  lines(gc, [...pEq0.toArray(), ...pEq1.toArray()], '#b8829a', 0.65);

  // Full faint guide curve + progressive live titration curve + strong-acid comparison
  plot(gc, v => M.phAt(v), {
    axes: ax, x: [0, M.V_MAX], samples: 160, color: 'grey', width: 0.018, name: 'Full weak-acid curve reference',
  });
  const strongCurve = plot(gc, v => M.phStrongAt(v), {
    axes: ax, x: [0, M.V_MAX], samples: 160, color: 'ink', width: 0.022, name: 'Strong acid (0.1 M HCl) comparison',
  });
  const liveCurve = plot(gc, v => M.phAt(v), {
    axes: ax, x: [0, 0.2], samples: 140, color: 'red', width: 0.044, name: 'Weak-acid titration curve pH(V_b)',
  });

  // Key landmark dots: half-equivalence (12.5 mL, 4.74) and equivalence point (25.0 mL, 8.72)
  const halfDot = part(gc, new THREE.SphereGeometry(0.06, 18, 12), {
    pal: 'base', tone: 'lit', pos: ax.to(M.V_HALF, M.PKA, 0.03).toArray(),
    name: 'Half-equivalence point (12.5 mL, pH = pK_a = 4.74)',
  });
  const eqDot = part(gc, new THREE.SphereGeometry(0.062, 18, 12), {
    pal: 'pink', tone: 'lit', pos: ax.to(M.V_EQ, M.phAt(M.V_EQ), 0.03).toArray(),
    name: 'Equivalence point (25.0 mL, pH = 8.72)',
  });
  const nowDot = part(gc, new THREE.SphereGeometry(0.072, 20, 14), {
    pal: 'red', tone: 'lit', name: 'Current titration state (V_b, pH)',
  });
  const phVec = vector(gc, [0, 0, 0], [0, 0.3, 0], {
    color: 'red', name: 'Current pH level',
  });

  let cur = M.speciesAt(0);
  label('board', () => `HA ${(cur.alphaHA * 100).toFixed(0)}% · A⁻ ${(cur.alphaA * 100).toFixed(0)}%`, () => V(-1.45, -2.15, 0.45));
  label('vec blue', '½-eq: pH = p<i>K</i><sub>a</sub> = 4.74', () => ax.to(34.5, -5.8, 0.05));
  label('vec red', () => `eq (25 mL, pH ${M.phAt(M.V_EQ).toFixed(2)})`, () => ax.to(34.5, 18.0, 0.05));
  label('mark', 'strong acid (HCl)', () => ax.to(34.5, -9.2, 0.05));

  function update(s, look = {}) {
    const { Vb, pH, alphaHA, alphaA } = s;
    const nBase = Math.round(alphaA * M.N_MOLECULES);
    const nAcid = M.N_MOLECULES - nBase;

    // Liquid column height expands from 1.05 to 1.48 as V_b goes from 0 to 35 mL
    const hLiq = 1.05 + 0.42 * (Vb / M.V_MAX);
    const yBot = -0.88;
    liqCyl.scale.set(1, hLiq, 1);
    liqCyl.position.y = yBot + 0.5 * hLiq;

    // Phenolphthalein indicator tinting above pH 8.2
    const pinkFrac = M.indicatorPink(pH);
    liqMat.opacity = 0.05 + 0.38 * pinkFrac;

    // Animated falling droplet while V_b > 0
    const dropPhase = (Vb * 2.5) % 1;
    drop.visible = Vb > 0.05 && Vb < M.V_MAX - 0.05;
    drop.position.y = 1.02 - dropPhase * (1.02 - (yBot + hLiq));

    let iHA = 0, iA = 0;
    for (let i = 0; i < M.N_MOLECULES; i++) {
      const p = cloudPts[i];
      const wx = p.x + 0.03 * Math.sin(Vb * 1.1 + p.phase);
      const wy = yBot + 0.08 + p.u * (hLiq - 0.16) + 0.02 * Math.cos(Vb * 0.9 + p.phase);
      if (i < nAcid) {
        haBeads.set(iHA++, [wx, wy, p.z]);
      } else {
        aBeads.set(iA++, [wx, wy, p.z]);
      }
    }
    haBeads.show(iHA);
    aBeads.show(iA);

    // Progressive titration curve
    const vEnd = Math.max(0.25, Vb);
    liveCurve.update(v => M.phAt(v), { x: [0, vEnd] });
    bufShade.object.visible = Vb >= 5.0;
    halfDot.visible = Vb >= M.V_HALF - 0.1;
    eqDot.visible = Vb >= M.V_EQ - 0.1;
    strongCurve.object.visible = (look.strong || 0) > 0.2 || Vb >= M.V_EQ - 0.1;

    const pNow = ax.to(Vb, pH, 0.04);
    nowDot.position.copy(pNow);
    const pBase = ax.to(Vb, 0, 0.04);
    phVec.set(pBase, pNow);

    cur = { Vb, pH, alphaHA, alphaA };
  }

  return { update, labels };
}
