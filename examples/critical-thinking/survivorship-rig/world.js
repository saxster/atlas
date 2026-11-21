import * as THREE from 'three';
import { PALETTE, part, box, cyl, V } from '@saxster/atlas/parts.js';

export function buildWorld(E, p = { defeatMultiplier: 28, onRoad: 1, buggy: 0 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // Left: Stylized cutaway aircraft showing Wald's Engine vs Fuselage/Tail survivor hits
  const gPlane = asm('wald', root, {
    title: 'Wald’s returning bomber (1943)',
    sub: 'visible bullet marks cluster on tail & fuselage; engines have fewer survivor marks because hits there prevent return',
  });
  gPlane.userData.focus = () => ({ target: [-1.4, 0.85, 0], radius: 2.2 });

  const fus = part(gPlane, cyl(0.32, 2.5, 20), { pal: 'paper', tone: 'mid', pos: [-1.4, 0.9, 0], rot: [0, 0, Math.PI / 2], name: 'Fuselage (1.73 hits/ft² — survives)' });
  const wing = part(gPlane, box(0.7, 0.08, 2.8), { pal: 'ochre', tone: 'mid', pos: [-1.55, 0.92, 0], name: 'Wings/Tail (1.80 hits/ft² — survives)' });
  const engL = part(gPlane, cyl(0.16, 0.48, 16), { pal: 'red', tone: 'lit', pos: [-1.65, 0.92, 0.72], rot: [0, 0, Math.PI / 2], name: 'Port Engine (1.11 hits/ft² — armor here!)' });
  const engR = part(gPlane, cyl(0.16, 0.48, 16), { pal: 'red', tone: 'lit', pos: [-1.65, 0.92, -0.72], rot: [0, 0, Math.PI / 2], name: 'Starboard Engine (unseen fatal zone)' });
  const nose = part(gPlane, cyl(0.20, 0.42, 16, 0.31), { pal: 'blue', tone: 'mid', pos: [-2.82, 0.9, 0], rot: [0, 0, Math.PI / 2], name: 'Cockpit nose' });
  [fus, wing, engL, engR, nose].forEach(m => m.userData.home.copy(m.position));

  // Right: Lab Dynamometer vs Real-Road Exhaust Towers (VW Emissions Test Scope)
  const gScope = asm('scope', root, {
    title: 'Lab test bench vs real-road highway exhaust',
    sub: 'passing a predictable lab cycle does not prove compliance when steering-angle detection switches emissions off-cycle',
  });
  gScope.userData.focus = () => ({ target: [1.55, 1.0, 0], radius: 2.1 });

  part(gScope, box(2.5, 0.06, 1.6), { pal: 'board', tone: 'faint', pos: [1.55, -0.03, 0], name: 'Chassis dynamometer bed' });
  const unit = box(1, 1, 1, 0.015);
  const mLab = part(gScope, unit, { pal: 'green', tone: 'lit', name: 'Lab Dynamometer NOx (0.038 g/km)' });
  const mRoad = part(gScope, unit, { pal: 'red', tone: 'lit', name: 'Real-Road NOx Plume' });

  let cur = { nox: 0.038, ratio: 0.9, buggy: 0, onRoad: 1 };
  const place = (m, x, w, h, d) => {
    m.scale.set(w, Math.max(0.05, h), d);
    m.position.set(x, Math.max(0.05, h) / 2, 0);
    m.userData.home.copy(m.position);
  };

  label('axis', () => cur.buggy ? 'BUGGY: ARMOR VISIBLE HOLES' : 'WALD: ARMOR MISSING ENGINES', () => V(-0.4, 2.38, 0));
  label('mark', 'Engine 1.11/ft²', () => V(-1.85, 1.55, 0.95));
  label('mark', 'Wings 1.80/ft²', () => V(-1.35, 0.22, 1.25));
  label('vec green', 'Lab 0.04', () => V(0.95, 0.65, 0.45));
  label('vec red', () => `Road ${cur.nox.toFixed(2)} (${cur.ratio.toFixed(1)}×)`, () => V(2.15, 2.35, 0.4));

  function update(s) {
    const { e, snap } = s;
    cur = { nox: snap.nox, ratio: snap.ratio, buggy: e.buggy, onRoad: e.onRoad };
    const bob = Math.sin(snap.frac * Math.PI * 2) * 0.04;
    fus.position.y = 0.9 + bob;
    wing.position.y = 0.92 + bob;
    engL.position.y = 0.92 + bob;
    engR.position.y = 0.92 + bob;
    nose.position.y = 0.9 + bob;

    // Highlight engine vs wings according to buggy vs Wald lens
    engL.scale.setScalar(e.buggy ? 0.85 : 1.15);
    engR.scale.setScalar(e.buggy ? 0.85 : 1.15);
    wing.scale.set(1, e.buggy ? 1.8 : 1.0, 1);

    place(mLab, 0.95, 0.65, 0.25, 0.65);
    const hRoad = Math.min(2.3, 0.25 + (snap.nox / 1.5) * 2.0);
    place(mRoad, 2.15, 0.65, hRoad, 0.65);
  }
  return { update, labels };
}
