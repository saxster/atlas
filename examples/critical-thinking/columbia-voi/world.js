import * as THREE from 'three';
import { PALETTE, part, box, lines, V } from '@saxster/atlas/parts.js';

export function buildWorld(E, p = { foamVolumeIn3: 1920, pBreach: 0.05, buggyPriorPass: 0 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  const gWing = asm('wing', root, {
    title: 'RCC wing leading-edge panel & foam-strike scale',
    sub: 'comparing Boeing’s calibrated 3 in³ test block (blue) against the ~1,920 in³ STS-107 bipod foam ramp (red, 640× larger)',
  });
  gWing.userData.focus = () => ({ target: [-1.35, 1.0, 0], radius: 2.2 });

  const gVOI = asm('voi', root, {
    title: 'Value of Information (looking cost vs expected rescue value)',
    sub: 'when catastrophic loss dwarfs the cost of orbital imagery, even tiny breach uncertainty justifies a closer look',
  });
  gVOI.userData.focus = () => ({ target: [1.5, 1.05, 0], radius: 2.1 });

  part(gWing, box(6.2, 0.06, 2.3), { pal: 'board', tone: 'faint', pos: [0, -0.03, 0], name: 'STS-107 engineering plinth' });
  const rcc = part(gWing, box(1.8, 0.16, 1.3), { pal: 'dark', tone: 'hi', pos: [-1.4, 0.25, 0], rot: [0, 0, -0.18], name: 'Reinforced Carbon-Carbon (RCC) Wing Panel' });
  const mTestBlock = part(gWing, box(0.28, 0.22, 0.28), { pal: 'blue', tone: 'lit', pos: [-2.15, 0.72, 0.4], name: 'Calibrated Crater test debris (<= 3 in³)' });
  const mActualFoam = part(gWing, box(1, 1, 1, 0.02), { pal: 'red', tone: 'lit', name: 'STS-107 External Tank Bipod Foam (up to 1,920 in³)' });

  const unit = box(1, 1, 1, 0.015);
  const mCost = part(gVOI, unit, { pal: 'ochre', tone: 'lit', name: 'Cost of requesting imagery' });
  const mBenefit = part(gVOI, unit, { pal: 'green', tone: 'lit', name: 'Expected Value of Information (p × q × Loss)' });

  lines(gWing, [-2.4, 0.35, -0.65, -0.4, 0.35, -0.65], '#8c8578', 0.8);

  let cur = { factor: 1, pBreach: 0.05, netVOI: 190, buggy: 0 };
  const place = (m, x, w, h, d) => {
    const H = Math.max(0.05, h);
    m.scale.set(w, H, d);
    m.position.set(x, H / 2, 0);
    m.userData.home.copy(m.position);
  };

  label('vec blue', 'Test 3 in³', () => V(-2.25, 1.05, 0.55));
  label('vec red', () => `Foam ${cur.factor.toFixed(0)}×`, () => V(-1.15, 2.2, 0.35));
  label('axis', () => cur.buggy ? 'BUGGY: "IN-FAMILY"' : 'VOI >> COST TO LOOK', () => V(1.6, 2.52, 0));
  label('mark', 'Look Cost', () => V(1.0, 0.42, 0.4));
  label('vec green', () => `VOI +${cur.netVOI.toFixed(0)}`, () => V(2.05, 2.15, 0.4));

  function update(s) {
    const { e, snap } = s;
    const g = Math.max(0.08, snap.frac);
    cur = { factor: snap.extrapolationFactor, pBreach: e.pBreach, netVOI: e.voi.netVOI, buggy: e.buggyPriorPass };

    const foamScale = e.buggyPriorPass ? 0.32 : Math.max(0.28, Math.min(1.65, Math.cbrt(snap.extrapolationFactor) * 0.19));
    mActualFoam.scale.set(foamScale * 1.35, foamScale * 0.65, foamScale * 0.9);
    mActualFoam.position.set(-1.25, 1.45 - 0.65 * snap.frac, -0.15);
    mActualFoam.userData.home.copy(mActualFoam.position);
    rcc.userData.home.copy(rcc.position);
    mTestBlock.userData.home.copy(mTestBlock.position);

    place(mCost, 1.0, 0.62, 0.12, 0.62);
    const hVal = e.buggyPriorPass ? 0.08 : Math.min(2.25, Math.max(0.15, (e.voi.expectedSaved / 400) * 2.1 * g));
    place(mBenefit, 2.05, 0.62, hVal, 0.62);
  }
  return { update, labels };
}
