import * as THREE from 'three';
import { PALETTE, part, box, cyl, V } from '@saxster/atlas/parts.js';

export function buildWorld(E, p = { tempF: 31, buggyCensored: 0 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // Left: Cutaway Solid Rocket Booster (SRB) clevis-tang field joint + primary/secondary Viton O-rings + blow-by plume
  const gJoint = asm('joint', root, {
    title: 'SRB aft field joint cutaway (Clevis + Tang + O-Rings)',
    sub: 'at 75°F Viton rubber rebounds in milliseconds as the joint flexes; at 31°F cold Viton stiffens and hot gas jets past the seal',
  });
  gJoint.userData.focus = () => ({ target: [-1.3, 1.05, 0], radius: 2.1 });

  part(gJoint, box(1.8, 0.14, 1.4), { pal: 'dark', tone: 'mid', pos: [-1.4, 0.3, 0], name: 'Lower clevis steel casing' });
  part(gJoint, box(0.26, 1.45, 1.3), { pal: 'paper', tone: 'hi', pos: [-2.05, 1.05, 0], name: 'Outer clevis wall' });
  part(gJoint, box(0.24, 1.45, 1.3), { pal: 'paper', tone: 'mid', pos: [-1.35, 1.05, 0], name: 'Inner clevis wall' });
  const tang = part(gJoint, box(0.24, 1.18, 1.25), { pal: 'blue', tone: 'lit', pos: [-1.7, 1.45, 0], name: 'Upper booster tang (flexes at ignition)' });
  const oRing1 = part(gJoint, cyl(0.11, 1.26, 20), { pal: 'ochre', tone: 'lit', pos: [-1.54, 0.92, 0], rot: [Math.PI / 2, 0, 0], name: 'Primary Viton O-ring' });
  const oRing2 = part(gJoint, cyl(0.11, 1.26, 20), { pal: 'ochre', tone: 'mid', pos: [-1.54, 0.62, 0], rot: [Math.PI / 2, 0, 0], name: 'Secondary Viton O-ring' });
  const plume = part(gJoint, cyl(0.08, 1.2, 16, 0.28), { pal: 'red', tone: 'lit', pos: [-2.35, 0.9, 0], rot: [0, 0, Math.PI / 2], name: 'Hot-gas blow-by jet' });

  // Right: Visual Scatterplot Pillars across Temperature Bins (40-85°F) — showing censored 7 vs all 23 flights
  const gPlot = asm('plot', root, {
    title: 'Tufte 23-flight temperature comparison',
    sub: 'comparing damaged flights (red) alongside zero-incident warm flights (green) exposes the cold-weather boundary',
  });
  gPlot.userData.focus = () => ({ target: [1.5, 1.05, 0], radius: 2.2 });

  part(gPlot, box(2.8, 0.06, 1.6), { pal: 'board', tone: 'faint', pos: [1.55, -0.03, 0], name: 'Launch temperature axis (30°F to 82°F)' });
  const unit = box(1, 1, 1, 0.015);
  const bColdDam = part(gPlot, unit, { pal: 'red', tone: 'lit', name: 'Damaged <= 63°F (4 of 4 flights!)' });
  const bWarmDam = part(gPlot, unit, { pal: 'red', tone: 'mid', name: 'Damaged >= 66°F (3 of 19 flights)' });
  const bWarmSafe = part(gPlot, unit, { pal: 'green', tone: 'lit', name: 'Undamaged >= 66°F (16 zero-incident flights)' });

  let cur = { tempF: 31, distress: 0.99, resil: 0.12, buggy: 0 };
  const place = (m, x, w, h, d, z = 0) => {
    m.scale.set(w, Math.max(0.04, h), d);
    m.position.set(x, Math.max(0.04, h) / 2, z);
    m.userData.home.copy(m.position);
  };

  label('vec blue', () => `Pad ${cur.tempF.toFixed(0)}°F`, () => V(-1.65, 2.38, 0.25));
  label('vec red', () => `Risk ${Math.round(cur.distress * 100)}%`, () => V(-2.45, 1.45, 0.45));
  label('mark', () => `Viton Flex ${Math.round(cur.resil * 100)}%`, () => V(-0.65, 0.72, 0.65));
  label('axis', () => cur.buggy ? 'BUGGY: 7 DAMAGED ONLY' : 'FULL 23 LAUNCHES', () => V(1.65, 2.48, 0));
  label('mark', () => cur.buggy ? '16 clean hidden!' : '16 clean warm', () => V(2.35, 2.34, 0.35));

  function update(s) {
    const { e, snap } = s;
    cur = { tempF: snap.curTempF, distress: snap.curDistress, resil: snap.curResil, buggy: e.buggyCensored };

    // Gap opens slightly at ignition; soft Viton expands to seal it, stiff cold Viton leaves gap open
    const gap = 0.08 * (1 - snap.curResil);
    oRing1.scale.set(0.6 + 0.5 * snap.curResil, 1, 0.6 + 0.5 * snap.curResil);
    oRing2.scale.set(0.6 + 0.5 * snap.curResil, 1, 0.6 + 0.5 * snap.curResil);
    tang.position.x = -1.7 + gap * 0.5;
    plume.visible = snap.curDistress > 0.35;
    const pLen = Math.max(0.05, snap.curDistress * 1.4);
    plume.scale.set(pLen, 0.4 + snap.curDistress * 0.9, 0.4 + snap.curDistress * 0.9);
    plume.position.x = -2.2 - pLen * 0.45;

    place(bColdDam, 0.75, 0.55, 1.0, 0.55);
    place(bWarmDam, 1.55, 0.55, 0.75, 0.55);
    place(bWarmSafe, 2.35, 0.55, e.buggyCensored ? 0.04 : 2.1, 0.55);
  }
  return { update, labels };
}
