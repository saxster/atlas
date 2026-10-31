// Figure B.4 world: 3D neuronal phospholipid bilayer cross-section on the left with voltage-gated Na⁺ channel
// (activation gate m + ball-and-chain inactivation gate h) and delayed rectifier K⁺ channel (gate n),
// paired with the Hodgkin–Huxley V_m(t), g_Na(t), and g_K(t) traces on the right.
import * as THREE from 'three';
import { PALETTE, part, box, cyl, lines, rod, V } from '@saxster/atlas/parts.js';
import { particles, axes, plot, vector } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.lipid = ['#f3d88c', '#dfb44b', '#b88c28'];   // phospholipid bilayer core
PALETTE.naCh  = ['#8fb0f0', '#4f7ed4', '#2e5599'];   // voltage-gated Na⁺ channel & Na⁺ ions
PALETTE.kCh   = ['#65c18c', '#2e8b57', '#1e5e3a'];   // delayed rectifier K⁺ channel & K⁺ ions
PALETTE.gate  = ['#f07a7e', '#e5484d', '#b8343a'];   // inactivation ball-and-chain h & V_m trace

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // ---------- left: membrane bilayer + Na⁺ and K⁺ voltage-gated channels ----------
  const gm = asm('membrane', root, {
    title: 'Axon membrane & voltage-gated ion channels',
    sub: 'phospholipid bilayer separating Na⁺-rich outside (top) from K⁺-rich cytoplasm (bottom)',
  });
  const memAnchor = new THREE.Group();
  memAnchor.position.set(-2.0, 1.15, 0);
  gm.add(memAnchor);

  // Three bilayer segments around the two channel pores (at x = -0.58 and x = +0.58)
  for (const [cx, w] of [[-1.18, 0.56], [0.0, 0.54], [1.18, 0.56]]) {
    part(memAnchor, box(w, 0.46, 0.72, 0.03), {
      pal: 'lipid', tone: 'mid', pos: [cx, 0, 0], name: 'Phospholipid bilayer', ex: [0, 0.12, 0],
    });
  }

  // Voltage-gated Na⁺ channel at x = -0.58
  const gNaAsm = asm('naChannel', root, {
    title: 'Voltage-gated Na⁺ channel (fast m gate + h ball)',
    sub: 'snaps open at −55 mV to let Na⁺ rush in, then plugs its cytoplasmic mouth with the inactivation ball h',
  });
  const naGroup = new THREE.Group();
  naGroup.position.set(-2.58, 1.15, 0);
  gNaAsm.add(naGroup);

  part(naGroup, cyl(0.11, 0.58, 20), { pal: 'naCh', tone: 'hi', pos: [-0.15, 0, 0], name: 'Na⁺ channel α-subunit (left)', ex: [-0.18, 0, 0] });
  part(naGroup, cyl(0.11, 0.58, 20), { pal: 'naCh', tone: 'hi', pos: [0.15, 0, 0], name: 'Na⁺ channel α-subunit (right)', ex: [0.18, 0, 0] });
  // Activation gate m (swings open inside pore)
  const mGateL = part(naGroup, box(0.13, 0.06, 0.16, 0.015), { pal: 'naCh', tone: 'lit', pos: [-0.07, 0.05, 0], name: 'Na⁺ activation gate m' });
  const mGateR = part(naGroup, box(0.13, 0.06, 0.16, 0.015), { pal: 'naCh', tone: 'lit', pos: [0.07, 0.05, 0], name: 'Na⁺ activation gate m' });
  // Inactivation ball-and-chain h on the cytoplasmic (-y) side
  const hBall = part(naGroup, new THREE.SphereGeometry(0.105, 20, 14), { pal: 'gate', tone: 'lit', pos: [-0.22, -0.52, 0.06], name: 'Inactivation gate ball (h)' });
  const hChain = rod(naGroup, { r: 0.018, pal: 'gate', tone: 'mid', name: 'Inactivation tether' });

  // Delayed-rectifier K⁺ channel at x = +0.58 relative to memAnchor (-1.42 world x)
  const gKAsm = asm('kChannel', root, {
    title: 'Delayed-rectifier K⁺ channel (slow n gate)',
    sub: 'opens with a 1 ms delay after depolarization so K⁺ streams outward and resets V_m toward E_K = −77 mV',
  });
  const kGroup = new THREE.Group();
  kGroup.position.set(-1.42, 1.15, 0);
  gKAsm.add(kGroup);

  part(kGroup, cyl(0.11, 0.58, 20), { pal: 'kCh', tone: 'hi', pos: [-0.15, 0, 0], name: 'K⁺ channel subunit (left)', ex: [-0.18, 0, 0] });
  part(kGroup, cyl(0.11, 0.58, 20), { pal: 'kCh', tone: 'hi', pos: [0.15, 0, 0], name: 'K⁺ channel subunit (right)', ex: [0.18, 0, 0] });
  const nGateL = part(kGroup, box(0.13, 0.06, 0.16, 0.015), { pal: 'kCh', tone: 'lit', pos: [-0.07, -0.08, 0], name: 'K⁺ delayed gate n' });
  const nGateR = part(kGroup, box(0.13, 0.06, 0.16, 0.015), { pal: 'kCh', tone: 'lit', pos: [0.07, -0.08, 0], name: 'K⁺ delayed gate n' });

  // Na⁺ ions (blue) and K⁺ ions (green) + flux arrows
  const naIons = particles(memAnchor, 36, { radius: 0.044, color: 'naCh', name: 'Na⁺ ions' });
  const kIons = particles(memAnchor, 36, { radius: 0.044, color: 'kCh', name: 'K⁺ ions' });
  const naArrow = vector(naGroup, [0, 0.65, 0.12], [0, -0.45, 0.12], { color: 'blue', name: 'Inward Na⁺ current I_Na' });
  const kArrow = vector(kGroup, [0, -0.55, 0.12], [0, 0.62, 0.12], { color: 'green', name: 'Outward K⁺ current I_K' });

  // ---------- right: Hodgkin–Huxley V_m(t) and conductances chart ----------
  const gc = asm('trace', root, {
    title: 'Membrane potential V_m(t) & conductances g_Na, g_K',
    sub: 'V_m swings from −70 mV toward E_Na (+55 mV) when g_Na surges, then drops to −75 mV near E_K (−77 mV) when g_K peaks',
  });
  const ax = axes(gc, {
    x: [0, M.DURATION], y: [-80, 60], size: [3.2, 2.35], at: [0.25, 0.96, 0],
    ticks: { x: 5, y: 5 }, names: { x: '<i>t</i> ms', y: '<i>V</i><sub>m</sub> mV' }, grid: true,
  });
  labels.push(...ax.labels);

  // Reference lines: V_rest = -70 mV, threshold V_th = -55 mV, and E_Na = +55 mV
  const pRest0 = ax.to(0, M.V_REST), pRest1 = ax.to(M.DURATION, M.V_REST);
  const pTh0 = ax.to(0, M.V_TH), pTh1 = ax.to(M.DURATION, M.V_TH);
  lines(gc, [...pRest0.toArray(), ...pRest1.toArray()], '#8a8275', 0.55);
  lines(gc, [...pTh0.toArray(), ...pTh1.toArray()], '#b8343a', 0.45);

  // Map conductance g (0..30 mS/cm²) into voltage chart y-space (-80..+40) so both curves sit cleanly on the same board
  const gToY = g => -80 + g * 3.8;
  const vmCurve = plot(gc, t => M.membranePotential(t), {
    axes: ax, x: [0, M.DURATION], samples: 160, color: 'gate', width: 0.046, name: 'Membrane potential V_m(t)',
  });
  const gNaCurve = plot(gc, t => gToY(M.gNa(t)), {
    axes: ax, x: [0, M.DURATION], samples: 140, color: 'naCh', width: 0.034, name: 'Na⁺ conductance g_Na(t)',
  });
  const gKCurve = plot(gc, t => gToY(M.gK(t)), {
    axes: ax, x: [0, M.DURATION], samples: 140, color: 'kCh', width: 0.034, name: 'K⁺ conductance g_K(t)',
  });

  const nowDot = part(gc, new THREE.SphereGeometry(0.068, 20, 14), {
    pal: 'gate', tone: 'lit', name: 'Current V_m(t)',
  });
  const naDot = part(gc, new THREE.SphereGeometry(0.052, 16, 12), {
    pal: 'naCh', tone: 'lit', name: 'Current g_Na(t)',
  });
  const kDot = part(gc, new THREE.SphereGeometry(0.052, 16, 12), {
    pal: 'kCh', tone: 'lit', name: 'Current g_K(t)',
  });

  let cur = { t: 0, v: M.V_REST, gNa: M.G_NA_REST, gK: M.G_K_REST, cond: false };
  label('board', 'Outside (high [Na⁺])', () => V(-1.75, 2.72, 0.08));
  label('board', 'Cytoplasm (high [K⁺])', () => V(-1.25, -0.45, 0.08));
  label('vec blue', 'Na⁺ channel', () => V(-2.35, 1.76, 0.18));
  label('mark', 'K⁺ channel', () => V(-0.95, 0.48, 0.18));
  label('mark', 'V_th = −55 mV', () => ax.to(4.85, -92, 0.04));
  label('vec red', () => `V_m = ${cur.v >= 0 ? '+' : '−'}${Math.abs(cur.v).toFixed(0)} mV`, () => ax.to(4.85, 68, 0.06));
  label('vec blue', 'g_Na(t)', () => cur.t >= 1.6 ? ax.to(2.8, 42, 0.04) : null);
  label('board', 'g_K(t)', () => cur.t >= 2.4 ? ax.to(4.85, -45, 0.04) : null);

  function update(s, look = {}) {
    const t = s.t;
    const tEnd = Math.max(0.08, t);
    const showCond = (look.cond || 0) > 0.3 || t >= 1.4;

    // Gate positions on the Na⁺ and K⁺ channels
    const mOpen = (s.m - 0.05) / 0.94;          // 0 = closed, 1 = wide open
    const hPlug = 1 - (s.h - 0.04) / 0.88;      // 0 = dangling open, 1 = plugging pore mouth
    const nOpen = (s.n - 0.18) / 0.77;          // 0 = closed, 1 = open

    mGateL.position.x = -0.055 - 0.055 * mOpen;
    mGateR.position.x = 0.055 + 0.055 * mOpen;
    mGateL.rotation.z = 0.55 * mOpen;
    mGateR.rotation.z = -0.55 * mOpen;

    // Inactivation ball swings from (-0.22, -0.52) into the cytoplasmic pore mouth (0, -0.29)
    hBall.position.set(-0.22 * (1 - hPlug), -0.52 + 0.23 * hPlug, 0.06 * (1 - hPlug));
    hChain.set(V(-0.15, -0.28, 0), hBall.position);

    nGateL.position.x = -0.055 - 0.055 * nOpen;
    nGateR.position.x = 0.055 + 0.055 * nOpen;
    nGateL.rotation.z = -0.55 * nOpen;
    nGateR.rotation.z = 0.55 * nOpen;

    // Position Na⁺ ions (top reservoir + streaming downward through Na⁺ pore x = -0.58 when g_Na is high)
    const naStream = Math.min(1, s.gNa / 18);
    for (let i = 0; i < 36; i++) {
      if (i < 12) {
        // Channel stream particles
        const phase = ((i / 12) + t * (0.4 + 1.8 * naStream)) % 1;
        const y = 0.72 - phase * (0.55 + 0.85 * naStream);
        const x = -0.58 + 0.04 * Math.sin(i * 2.1 + t * 6);
        naIons.set(i, [x, y, 0.05 * Math.cos(i * 1.7)]);
      } else {
        // Extracellular reservoir (y > 0.35)
        const k = i - 12;
        const x = -1.35 + (k % 8) * 0.38 + 0.03 * Math.sin(t * 3 + k);
        const y = 0.42 + Math.floor(k / 8) * 0.22 + 0.02 * Math.cos(t * 2.5 + k);
        naIons.set(i, [x, y, ((k % 3) - 1) * 0.16]);
      }
    }
    naIons.show(36);

    // Position K⁺ ions (bottom reservoir + streaming upward through K⁺ pore x = +0.58 when g_K is high)
    const kStream = Math.min(1, (s.gK - M.G_K_REST) / 12);
    for (let i = 0; i < 36; i++) {
      if (i < 12) {
        const phase = ((i / 12) + t * (0.3 + 1.6 * kStream)) % 1;
        const y = -0.72 + phase * (0.52 + 0.90 * kStream);
        const x = 0.58 + 0.04 * Math.cos(i * 2.3 + t * 5);
        kIons.set(i, [x, y, 0.05 * Math.sin(i * 1.9)]);
      } else {
        // Cytoplasmic reservoir (y < -0.35)
        const k = i - 12;
        const x = -1.35 + (k % 8) * 0.38 + 0.03 * Math.cos(t * 3 + k);
        const y = -0.42 - Math.floor(k / 8) * 0.22 + 0.02 * Math.sin(t * 2.5 + k);
        kIons.set(i, [x, y, ((k % 3) - 1) * 0.16]);
      }
    }
    kIons.show(36);

    // Current vectors through the pores
    const naLen = Math.min(0.95, 0.18 + naStream * 0.78);
    naArrow.set([0, 0.48, 0.14], [0, 0.48 - naLen, 0.14]);
    naArrow.object.visible = s.gNa > 0.8;

    const kLen = Math.min(0.95, 0.18 + kStream * 0.78);
    kArrow.set([0, -0.48, 0.14], [0, -0.48 + kLen, 0.14]);
    kArrow.object.visible = s.gK > 2.5;

    // Progressive trace drawing up to current time t
    vmCurve.update(u => M.membranePotential(u), { x: [0, tEnd] });
    gNaCurve.update(u => gToY(M.gNa(u)), { x: [0, tEnd] });
    gKCurve.update(u => gToY(M.gK(u)), { x: [0, tEnd] });
    gNaCurve.object.visible = showCond;
    gKCurve.object.visible = showCond;

    nowDot.position.copy(ax.to(t, s.v, 0.05));
    naDot.position.copy(ax.to(t, gToY(s.gNa), 0.04));
    kDot.position.copy(ax.to(t, gToY(s.gK), 0.04));
    naDot.visible = showCond;
    kDot.visible = showCond;

    cur = { t, v: s.v, gNa: s.gNa, gK: s.gK, cond: showCond };
  }

  return { update, labels };
}
