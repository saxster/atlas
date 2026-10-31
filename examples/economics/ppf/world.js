// Three linked PPF boards:
// Left: Island A's PPF (max 50 cloth or 100 grain, slope −2) + post-trade bundle outside its frontier.
// Middle: Highland B's PPF (max 60 cloth or 60 grain, slope −1) + post-trade bundle outside its frontier.
// Right: Joint kinked World PPF (max 110 cloth or 160 grain, kink at 60C, 100G) vs. interior autarky (55C, 80G).
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

  // ---------- left: Island A (comparative advantage in grain: 1C costs 2G) ----------
  const gA = asm('islandA', root, {
    title: 'Island A’s PPF (100 grain or 50 cloth)',
    sub: 'steep frontier: making 1 bale of cloth sacrifices 2 tons of grain, so Island A has comparative advantage in grain (0.5 cloth/grain)',
  });
  const axA = axes(gA, {
    x: [0, 65], y: [0, 110], size: [1.85, 2.2], at: [-3.35, 0.0, 0],
    ticks: { x: 3, y: 4 }, names: { x: 'cloth <i>C<sub>A</sub></i>', y: 'grain <i>G<sub>A</sub></i>' }, grid: true,
  });
  labels.push(...axA.labels);

  area(gA, M.ppfGrainA, {
    axes: axA, x: [0, M.C_A_MAX], y0: 0, pal: 'red', opacity: 0.18, name: 'Island A feasible production set',
  });
  plot(gA, M.ppfGrainA, {
    axes: axA, x: [0, M.C_A_MAX], samples: 40, color: 'red', width: 0.036, name: 'Island A PPF: G = 100 − 2C',
  });
  // Trade line from A's specialization point (0, 100) with slope −1.5
  const tradeRodA = rod(gA, { r: 0.020, pal: 'surplus', name: 'Terms-of-trade line (1.5 grain per cloth)' });
  const prodDotA = part(gA, new THREE.SphereGeometry(0.058, 18, 12), {
    pal: 'red', tone: 'lit', name: 'Island A production point',
  });
  const consDotA = part(gA, new THREE.SphereGeometry(0.064, 18, 12), {
    pal: 'surplus', tone: 'lit', name: 'Island A consumption after trade (30C, 55G)',
  });

  // ---------- middle: Highland B (comparative advantage in cloth: 1C costs 1G) ----------
  const gB = asm('islandB', root, {
    title: 'Highland B’s PPF (60 grain or 60 cloth)',
    sub: 'flatter frontier: making 1 bale of cloth sacrifices only 1 ton of grain, giving Highland B comparative advantage in cloth',
  });
  const axB = axes(gB, {
    x: [0, 65], y: [0, 110], size: [1.85, 2.2], at: [-0.95, 0.0, 0],
    ticks: { x: 3, y: 4 }, names: { x: 'cloth <i>C<sub>B</sub></i>', y: 'grain <i>G<sub>B</sub></i>' }, grid: true,
  });
  labels.push(...axB.labels);

  area(gB, M.ppfGrainB, {
    axes: axB, x: [0, M.C_B_MAX], y0: 0, pal: 'blue', opacity: 0.18, name: 'Highland B feasible production set',
  });
  plot(gB, M.ppfGrainB, {
    axes: axB, x: [0, M.C_B_MAX], samples: 40, color: 'blue', width: 0.036, name: 'Highland B PPF: G = 60 − C',
  });
  const tradeRodB = rod(gB, { r: 0.020, pal: 'surplus', name: 'Terms-of-trade line (1.5 grain per cloth)' });
  const prodDotB = part(gB, new THREE.SphereGeometry(0.058, 18, 12), {
    pal: 'blue', tone: 'lit', name: 'Highland B production point',
  });
  const consDotB = part(gB, new THREE.SphereGeometry(0.064, 18, 12), {
    pal: 'surplus', tone: 'lit', name: 'Highland B consumption after trade (30C, 45G)',
  });

  // ---------- right: Joint World PPF & the specialization kink ----------
  const gWorld = asm('world', root, {
    title: 'Joint World PPF & the gains from specialization',
    sub: 'autarky (55C, 80G) sits inside the frontier; specializing at the kink (60C, 100G) unlocks +5 cloth and +20 grain',
  });
  const axW = axes(gWorld, {
    x: [0, 115], y: [0, 165], size: [2.15, 2.2], at: [1.45, 0.0, 0],
    ticks: { x: 3, y: 4 }, names: { x: 'world cloth <i>C</i>', y: 'world grain <i>G</i>' }, grid: true,
  });
  labels.push(...axW.labels);

  area(gWorld, M.worldPpfGrain, {
    axes: axW, x: [0, 110], y0: 0, pal: 'amber', opacity: 0.20, name: 'Joint world feasible set',
  });
  plot(gWorld, M.worldPpfGrain, {
    axes: axW, x: [0, 110], samples: 90, color: 'amber', width: 0.038, name: 'Kinked World PPF',
  });

  // Reference marker at Autarky (55, 80) and Kink (60, 100)
  const pAut = axW.to(55, 80, 0.03), pKink = axW.to(60, 100, 0.03);
  lines(gWorld, [...pAut.toArray(), ...pKink.toArray()], '#2e8b57', 0.85);
  part(gWorld, new THREE.SphereGeometry(0.048, 16, 12), {
    pal: 'dark', tone: 'mid', pos: pAut.toArray(), name: 'Autarky total (55C, 80G)',
  });
  const worldDot = part(gWorld, new THREE.SphereGeometry(0.068, 20, 14), {
    pal: 'surplus', tone: 'lit', name: 'World output (C, G)',
  });
  const gainRod = rod(gWorld, { r: 0.022, pal: 'surplus', name: 'Output gain from specialization' });

  let cur = M.stateAt(0, 0);

  label('vec red', () => `A: (${cur.consA.C.toFixed(0)}C, ${cur.consA.G.toFixed(0)}G)`, () =>
    V(-1.55, -0.82, 0.06));
  label('vec blue', () => `B: (${cur.consB.C.toFixed(0)}C, ${cur.consB.G.toFixed(0)}G)`, () =>
    V(0.85, 3.05, 0.06));
  label('mark', 'autarky (55, 80)', () => axW.to(112, 75, 0.06));
  label('vec red', () => `World (${cur.world.C.toFixed(0)}C, ${cur.world.G.toFixed(0)}G)`, () =>
    V(3.55, -0.82, 0.06));

  function update(s) {
    cur = s;
    const pProdA = axA.to(s.prodA.C, s.prodA.G, 0.04);
    const pConsA = axA.to(s.consA.C, s.consA.G, 0.05);
    prodDotA.position.copy(pProdA);
    consDotA.position.copy(pConsA);
    consDotA.visible = s.v > 0.02;
    tradeRodA.set(pProdA, pConsA);

    const pProdB = axB.to(s.prodB.C, s.prodB.G, 0.04);
    const pConsB = axB.to(s.consB.C, s.consB.G, 0.05);
    prodDotB.position.copy(pProdB);
    consDotB.position.copy(pConsB);
    consDotB.visible = s.v > 0.02;
    tradeRodB.set(pProdB, pConsB);

    const pW = axW.to(s.world.C, s.world.G, 0.05);
    worldDot.position.copy(pW);
    gainRod.set(pAut, pW);
  }

  return { update, labels };
}
