// Left: Total Cost C(Q) and its tangent slope MC = dC/dQ.
// Right: Supply P_s(Q) = MC(Q) crossing Demand P_d(Q) at (Q* = 40, P* = ₹50), with Consumer & Producer Surplus via prims.area.
import * as THREE from 'three';
import { PALETTE, part, rod, lines, V } from '@saxster/atlas/parts.js';
import { axes, plot, area } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.surplus = ['#6bc48e', '#2e8b57', '#1e5e3a'];
PALETTE.amber   = ['#f5c96b', '#d99b26', '#9e6d14'];

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // ---------- left: Total Cost C(Q) and sliding tangent slope MC = dC/dQ ----------
  const gCost = asm('cost', root, {
    title: 'Total Cost C(Q) & Marginal Cost slope',
    sub: 'C(Q) = 40 + 10Q + ½Q² bends upward; its tangent slope dC/dQ = 10 + Q is the Marginal Cost of the next unit',
  });
  const axCost = axes(gCost, {
    x: [0, M.Q_MAX], y: [0, 2600], size: [2.4, 2.3], at: [-2.85, 0.0, 0],
    ticks: { x: 3, y: 4 }, names: { x: '<i>Q</i>', y: '<i>C</i> (₹)' }, grid: true,
  });
  labels.push(...axCost.labels);

  plot(gCost, M.totalCost, {
    axes: axCost, x: [0, M.Q_MAX], samples: 80, color: 'hi', width: 0.038, name: 'Total cost C(Q)',
  });
  const tanRod = rod(gCost, { r: 0.026, pal: 'red', name: 'Tangent slope MC = dC/dQ' });
  const costDot = part(gCost, new THREE.SphereGeometry(0.065, 20, 14), {
    pal: 'red', tone: 'lit', name: 'Point (Q, C(Q))',
  });

  // ---------- right: Supply = MC(Q) and Demand P_d(Q) ----------
  const gMkt = asm('market', root, {
    title: 'Supply, Demand & Market Equilibrium',
    sub: 'supply P_s(Q) = MC(Q) = 10 + Q crosses demand P_d(Q) = 90 − Q at Q* = 40 units, P* = ₹50',
  });
  const axMkt = axes(gMkt, {
    x: [0, M.Q_MAX], y: [0, 110], size: [2.7, 2.3], at: [0.35, 0.0, 0],
    ticks: { x: 3, y: 4 }, names: { x: '<i>Q</i>', y: '<i>P</i> (₹)' }, grid: true,
  });
  labels.push(...axMkt.labels);

  // Shaded Consumer Surplus (between P* = 50 and P_d(q)) and Producer Surplus (between MC(q) and P* = 50)
  const csShade = area(gMkt, M.demandPrice, {
    axes: axMkt, x: [0, 10], y0: M.P_STAR, pal: 'blue', opacity: 0.24, name: 'Consumer surplus ∫(P_d − P*) dQ',
  });
  const psShade = area(gMkt, M.supplyPrice, {
    axes: axMkt, x: [0, 10], y0: M.P_STAR, pal: 'surplus', opacity: 0.24, name: 'Producer surplus ∫(P* − MC) dQ',
  });

  plot(gMkt, M.supplyPrice, {
    axes: axMkt, x: [0, M.Q_MAX], samples: 60, color: 'red', width: 0.038, name: 'Supply curve P_s(Q) = MC(Q)',
  });
  plot(gMkt, q => M.demandPrice(q), {
    axes: axMkt, x: [0, M.Q_MAX], samples: 60, color: 'blue', width: 0.038, name: 'Demand curve P_d(Q) = 90 − Q',
  });

  // Equilibrium dashed reference lines at P* = 50, Q* = 40
  const pEq0 = axMkt.to(0, M.P_STAR), pEqStar = axMkt.to(M.Q_STAR, M.P_STAR), pEqQ = axMkt.to(M.Q_STAR, 0);
  lines(gMkt, [...pEq0.toArray(), ...pEqStar.toArray(), ...pEqStar.toArray(), ...pEqQ.toArray()], '#6a655d', 0.6);

  const sDot = part(gMkt, new THREE.SphereGeometry(0.062, 20, 14), {
    pal: 'red', tone: 'lit', name: 'Marginal cost P_s(Q)',
  });
  const dDot = part(gMkt, new THREE.SphereGeometry(0.062, 20, 14), {
    pal: 'blue', tone: 'lit', name: 'Buyer value P_d(Q)',
  });
  const gapRod = rod(gMkt, { r: 0.022, pal: 'surplus', name: 'Marginal social gain P_d(Q) − MC(Q)' });

  // Comparison 1: Price ceiling at P = ₹30 (shortage Q_d − Q_s = 40, DWL triangle)
  const gCeil = asm('ceiling', root, {
    title: 'Price ceiling at P = ₹30',
    sub: 'capping price at ₹30 cuts quantity supplied to Q_s = 20 while demand rises to Q_d = 60 (shortage = 40, DWL = ₹400)',
  });
  const pC0 = axMkt.to(0, M.P_CEIL), pC1 = axMkt.to(M.Q_MAX, M.P_CEIL);
  const ceilLine = lines(gCeil, [...pC0.toArray(), ...pC1.toArray()], '#c84b31', 0.85);
  const dwlShade = area(gCeil, M.demandPrice, {
    axes: axMkt, x: [M.Q_CEIL, M.Q_STAR], y0: M.supplyPrice, pal: 'amber', opacity: 0.34, name: 'Lost surplus (deadweight loss)',
  });

  // Comparison 2: Demand shift P_d(Q) = 110 − Q → new equilibrium (Q* = 50, P* = ₹60)
  const gShift = asm('shift', root, {
    title: 'Demand shift to P_d = 110 − Q',
    sub: 'higher demand pushes equilibrium along the supply curve to Q* = 50 units and P* = ₹60',
  });
  const shiftCurve = plot(gShift, q => M.demandPrice(q, M.P_MAX_SHIFT), {
    axes: axMkt, x: [0, M.Q_MAX], samples: 60, color: 'amber', width: 0.036, name: 'Shifted demand P_d = 110 − Q',
  });
  const shiftDot = part(gShift, new THREE.SphereGeometry(0.065, 20, 14), {
    pal: 'amber', tone: 'lit', pos: axMkt.to(M.Q_STAR_SHIFT, M.P_STAR_SHIFT, 0.05).toArray(), name: 'New equilibrium (50, ₹60)',
  });

  let cur = { Q: 10, mc: M.marginalCost(10), pd: M.demandPrice(10), ceilOn: false, shiftOn: false };
  label('vec red', () => `MC = ₹${cur.mc.toFixed(0)}`, () => axCost.to(28, 2280));
  label('mark', 'eq (40, ₹50)', () => pEqStar.clone().add(V(0.45, -0.05, 0.05)));
  label('vec red', '<i>P<sub>s</sub></i> = MC', () => axMkt.to(53, M.supplyPrice(53)).add(V(-0.32, 0.24, 0.05)));
  label('vec blue', '<i>P<sub>d</sub></i>', () => axMkt.to(53, M.demandPrice(53)).add(V(-0.22, -0.24, 0.05)));

  function update(s, look = {}) {
    const ceilOn = (look.ceiling || 0) > 0.3;
    const shiftOn = (look.shift || 0) > 0.3;
    const Q = s.Q, cQ = M.totalCost(Q), mc = s.mc, pd = s.pd;

    // Left board: point on C(Q) and tangent segment of slope MC(Q)
    costDot.position.copy(axCost.to(Q, cQ, 0.04));
    const dq = 8;
    const q0 = Math.max(0, Q - dq), q1 = Math.min(M.Q_MAX, Q + dq);
    tanRod.set(
      axCost.to(q0, cQ + mc * (q0 - Q), 0.03),
      axCost.to(q1, cQ + mc * (q1 - Q), 0.03),
    );

    // Right board: supply and demand points at Q, and surplus areas up to min(Q, Q*)
    const ceilW = look.ceiling || 0;
    const qBase = Math.min(Q, M.Q_STAR);
    const qTrade = qBase + (M.Q_CEIL - qBase) * ceilW;
    csShade.update(M.demandPrice, { x: [0, Math.max(1, qTrade)], y0: M.P_STAR });
    psShade.update(M.supplyPrice, { x: [0, Math.max(1, qTrade)], y0: M.P_STAR });

    const pS = axMkt.to(Q, mc, 0.04), pD = axMkt.to(Q, pd, 0.04);
    sDot.position.copy(pS);
    dDot.position.copy(pD);
    gapRod.set(pS, pD);

    ceilLine.visible = ceilOn;
    dwlShade.object.visible = ceilW > 0.02;
    dwlShade.object.material.uniforms.uOpacity.value = 0.34 * ceilW;
    shiftCurve.object.visible = shiftOn;
    shiftDot.visible = shiftOn;

    cur = { Q, mc, pd, ceilOn, shiftOn };
  }

  return { update, labels };
}
