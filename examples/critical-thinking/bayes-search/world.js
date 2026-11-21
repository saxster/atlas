import * as THREE from 'three';
import { PALETTE, part, box, V } from '@saxster/atlas/parts.js';

export function buildWorld(E, p = { priorA: 0.55, pd: 0.70, sweepsOnA: 2, buggy: 0 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  const gGrid = asm('grid', root, {
    title: 'AF447 Atlantic 4-sector Bayesian search grid',
    sub: 'height shows updated P(wreck in sector | missed sweeps, Pd); missing an imperfect sonar sweep shrinks A but never zeros it',
  });
  gGrid.userData.focus = () => ({ target: [0, 1.0, 0], radius: 2.4 });

  part(gGrid, box(5.4, 0.06, 2.2), { pal: 'board', tone: 'faint', pos: [0, -0.03, 0], name: 'Atlantic ocean search sectors' });
  const unit = box(1, 1, 1, 0.02);
  const mA = part(gGrid, unit, { pal: 'red', tone: 'lit', name: 'Sector A (Primary last-position zone, swept)' });
  const mB = part(gGrid, unit, { pal: 'blue', tone: 'lit', name: 'Sector B (Adjacent deep ridge)' });
  const mC = part(gGrid, unit, { pal: 'blue', tone: 'mid', name: 'Sector C (North corridor)' });
  const mD = part(gGrid, unit, { pal: 'blue', tone: 'mid', name: 'Sector D (South ridge)' });

  let cur = { pA: 0.55, pOther: 0.15, buggy: 0, sweeps: 0 };
  const place = (m, x, h) => {
    const H = Math.max(0.04, h * 3.0);
    m.scale.set(0.85, H, 1.1);
    m.position.set(x, H / 2, 0);
    m.userData.home.copy(m.position);
  };

  label('axis', () => cur.buggy ? 'BUGGY: MISSED SWEEP -> 0%' : 'BAYESIAN OCEAN SEARCH SURFACE', () => V(0.8, 2.55, 0));
  label('vec red', () => `A: ${(cur.buggy && cur.sweeps > 0.2 ? 0 : cur.pA * 100).toFixed(1)}%`, () => V(-1.8, 1.45, 0.45));
  label('vec blue', () => `B: ${(cur.pOther * 100).toFixed(1)}%`, () => V(-0.6, 1.55, 0.45));
  label('mark', () => `C: ${(cur.pOther * 100).toFixed(1)}%`, () => V(0.6, 1.25, 0.45));
  label('mark', () => `D: ${(cur.pOther * 100).toFixed(1)}%`, () => V(1.8, 1.55, 0.45));

  function update(s) {
    const { e, snap } = s;
    cur = { pA: snap.postA, pOther: snap.postEachOther, buggy: e.buggy, sweeps: snap.stepSweeps };
    const visA = e.buggy && snap.stepSweeps > 0.1 ? 0.015 : snap.postA;
    place(mA, -1.8, visA);
    place(mB, -0.6, snap.postEachOther);
    place(mC, 0.6, snap.postEachOther);
    place(mD, 1.8, snap.postEachOther);
  }
  return { update, labels };
}
