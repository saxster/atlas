import * as THREE from 'three';
import { PALETTE, part, box, V } from '@saxster/atlas/parts.js';

export function buildWorld(E, p = { severeShareA: 0.80, severeShareB: 0.20, stratified: 1 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  const gSnow = asm('snow', root, {
    title: 'Snow’s Grand Experiment (South London, 1854)',
    sub: 'intermingled Southwark & Vauxhall vs Lambeth water pipes hold elevation & wealth constant across 66,153 houses',
  });
  gSnow.userData.focus = () => ({ target: [-1.45, 1.1, 0], radius: 2.2 });

  const gSimp = asm('simpson', root, {
    title: 'Simpson’s Paradox: pooled vs severity-stratified survival',
    sub: 'Center A outperforms Clinic B in mild AND critical strata, yet pooled league tables invert when A takes 80% critical patients',
  });
  gSimp.userData.focus = () => ({ target: [1.5, 1.1, 0], radius: 2.2 });

  part(gSnow, box(6.2, 0.06, 2.3), { pal: 'board', tone: 'faint', pos: [0, -0.03, 0], name: 'Comparative evidence base' });
  const unit = box(1, 1, 1, 0.015);
  const mSV = part(gSnow, unit, { pal: 'red', tone: 'lit', name: 'Southwark & Vauxhall (71.4 / 10k)' });
  const mLam = part(gSnow, unit, { pal: 'green', tone: 'lit', name: 'Lambeth Co. (5.4 / 10k)' });

  const mA1 = part(gSimp, unit, { pal: 'blue', tone: 'lit', name: 'Hospital A survival bar' });
  const mB1 = part(gSimp, unit, { pal: 'ochre', tone: 'lit', name: 'Clinic B survival bar' });
  const mA2 = part(gSimp, unit, { pal: 'blue', tone: 'mid', name: 'Hospital A second stratum' });
  const mB2 = part(gSimp, unit, { pal: 'ochre', tone: 'mid', name: 'Clinic B second stratum' });

  let cur = { sv: 71.4, lam: 5.4, pA: 81.6, pB: 85.0, strat: 1 };
  const place = (m, x, w, h, d, z = 0) => {
    m.scale.set(Math.max(0.05, w), Math.max(0.05, h), Math.max(0.05, d));
    m.position.set(x, Math.max(0.05, h) / 2, z);
    m.userData.home.copy(m.position);
  };

  label('vec red', () => `S&V ${cur.sv.toFixed(1)}/10k`, () => V(-2.0, 2.38, 0.45));
  label('vec green', () => `Lam ${cur.lam.toFixed(1)}/10k`, () => V(-0.95, 0.55, 0.45));
  label('axis', () => cur.strat ? 'STRATIFIED: A WINS BOTH' : `POOLED: B ${cur.pB.toFixed(1)}% > A ${cur.pA.toFixed(1)}%`, () => V(1.6, 2.55, 0.1));
  label('vec blue', () => cur.strat ? 'A 96% | 78%' : `A ${cur.pA.toFixed(1)}%`, () => V(0.85, 2.15, 0.35));
  label('mark', () => cur.strat ? 'B 90% | 65%' : `B ${cur.pB.toFixed(1)}%`, () => V(1.95, 1.85, 0.35));

  function update(s) {
    const { e, snap } = s;
    const g = Math.max(0.08, snap.frac);
    cur = {
      sv: snap.svRateVis,
      lam: snap.lamRateVis,
      pA: e.simpson.pooledA * 100,
      pB: e.simpson.pooledB * 100,
      strat: e.stratified,
    };

    place(mSV, -2.0, 0.68, Math.max(0.12, (snap.svRateVis / 75) * 2.2), 0.68);
    place(mLam, -0.95, 0.68, Math.max(0.08, (snap.lamRateVis / 75) * 2.2), 0.68);

    if (e.stratified) {
      place(mA1, 0.85, 0.44, e.simpson.survMildA * 2.0 * g, 0.44, -0.35);
      place(mB1, 1.45, 0.44, e.simpson.survMildB * 2.0 * g, 0.44, -0.35);
      place(mA2, 0.85, 0.44, e.simpson.survSevA * 2.0 * g, 0.44, 0.35);
      place(mB2, 1.45, 0.44, e.simpson.survSevB * 2.0 * g, 0.44, 0.35);
    } else {
      place(mA1, 0.95, 0.65, e.simpson.pooledA * 2.0 * g, 0.65, 0);
      place(mB1, 2.05, 0.65, e.simpson.pooledB * 2.0 * g, 0.65, 0);
      place(mA2, 0.95, 0.05, 0.05, 0.05, 0);
      place(mB2, 2.05, 0.05, 0.05, 0.05, 0);
    }
  }
  return { update, labels };
}
