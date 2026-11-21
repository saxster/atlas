import * as THREE from 'three';
import { PALETTE, part, box, lines, V } from '@saxster/atlas/parts.js';

export function buildWorld(E, p = { exposedShare: 0.95, hazardProb: 0.35, buggy: 0 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  const gCounts = asm('counts', root, {
    title: 'Raw incident count vs total fleet denominator',
    sub: 'left towers show raw accident counts (8 vs 2); right towers reveal the total fleet denominators (950 vs 50)',
  });
  gCounts.userData.focus = () => ({ target: [-1.1, 1.1, 0], radius: 2.3 });

  const gRates = asm('rates', root, {
    title: 'Per-vessel rate = Events / Fleet',
    sub: 'dividing accidents by each fleet denominator flips the apparent hazard 4.7× toward the unequipped group',
  });
  gRates.userData.focus = () => ({ target: [1.5, 1.1, 0], radius: 2.0 });

  part(gCounts, box(6.2, 0.08, 2.2), { pal: 'board', tone: 'faint', pos: [0, -0.05, 0], name: 'Harbour ledger base' });
  const unit = box(1, 1, 1, 0.015);
  const mExpDen = part(gCounts, unit, { pal: 'blue', tone: 'mid', name: 'Exposed fleet denominator (N_exp)' });
  const mExpEvt = part(gCounts, unit, { pal: 'red', tone: 'lit', name: 'Exposed incidents (E_exp)' });
  const mUnexpDen = part(gCounts, unit, { pal: 'ochre', tone: 'mid', name: 'Unexposed fleet denominator (N_unexp)' });
  const mUnexpEvt = part(gCounts, unit, { pal: 'red', tone: 'lit', name: 'Unexposed incidents (E_unexp)' });

  const mRateExp = part(gRates, unit, { pal: 'green', tone: 'lit', name: 'Exposed incidence rate' });
  const mRateUnexp = part(gRates, unit, { pal: 'red', tone: 'lit', name: 'Unexposed incidence rate' });

  lines(gCounts, [-2.8, 0, 0.7, 2.8, 0, 0.7], '#9a958d', 0.7);

  let cur = { rExp: 0.84, rUnexp: 4.0, evExp: 8, evUnexp: 2, buggy: 0, nExp: 950, nUnexp: 50 };
  const place = (m, x, y, w, h, d, z = 0) => {
    m.scale.set(Math.max(0.03, w), Math.max(0.03, h), Math.max(0.03, d));
    m.position.set(x, y + Math.max(0.03, h) / 2, z);
    m.userData.home.copy(m.position);
  };

  label('axis', () => cur.buggy ? 'BUGGY: NUMERATORS ONLY' : 'FULL FLEET DENOMINATORS', () => V(0.3, 2.55, 0.1));
  label('mark', () => `Beacon: ${cur.evExp.toFixed(0)}/${cur.nExp}`, () => V(-2.05, -0.35, 0.6));
  label('mark', () => `None: ${cur.evUnexp.toFixed(0)}/${cur.nUnexp}`, () => V(-0.45, -0.35, 0.6));
  label('vec blue', () => `Exp ${cur.rExp.toFixed(2)}%`, () => V(1.15, 0.95, 0.45));
  label('vec red', () => `Unexp ${cur.rUnexp.toFixed(2)}%`, () => V(2.15, 2.15, 0.45));

  function update(s) {
    const { e, snap } = s;
    const g = Math.max(0.08, snap.frac);
    const r = e.rates;
    cur = {
      rExp: r.rateExposed * 100,
      rUnexp: r.rateUnexposed * 100,
      evExp: snap.evExp,
      evUnexp: snap.evUnexp,
      buggy: e.buggy,
      nExp: r.nExposed,
      nUnexp: r.nUnexposed,
    };

    const hDenExp = e.buggy ? 0.04 : Math.max(0.15, (r.nExposed / 1000) * 2.2 * g);
    const hDenUnexp = e.buggy ? 0.04 : Math.max(0.15, (r.nUnexposed / 1000) * 2.2 * g);
    place(mExpDen, -2.05, 0, 0.8, hDenExp, 0.6, -0.25);
    place(mUnexpDen, -0.45, 0, 0.8, hDenUnexp, 0.6, -0.25);

    const hEvExp = Math.max(0.08, (snap.evExp / Math.max(10, r.totalEvents + 2)) * 1.9);
    const hEvUnexp = Math.max(0.08, (snap.evUnexp / Math.max(10, r.totalEvents + 2)) * 1.9);
    place(mExpEvt, -2.05, 0, 0.42, hEvExp, 0.42, 0.42);
    place(mUnexpEvt, -0.45, 0, 0.42, hEvUnexp, 0.42, 0.42);

    const hRateExp = e.buggy ? hEvExp : Math.max(0.08, Math.min(2.1, (r.rateExposed * 100 / 5.0) * 2.1 * g));
    const hRateUnexp = e.buggy ? hEvUnexp : Math.max(0.08, Math.min(2.1, (r.rateUnexposed * 100 / 5.0) * 2.1 * g));
    place(mRateExp, 1.15, 0, 0.55, hRateExp, 0.55, 0.1);
    place(mRateUnexp, 2.15, 0, 0.55, hRateUnexp, 0.55, 0.1);
  }
  return { update, labels };
}
