// The figure: a 3D cell chamber divided at x = 0 by a lipid-bilayer membrane with open protein channel pores.
// Molecules jiggle by thermal motion and slip through the pores in both directions.
import * as THREE from 'three';
import { PALETTE, part, box, cyl, xAxis, lines, V } from '@saxster/atlas/parts.js';
import { particles, vector } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.lipid = ['#f3d88c', '#dfb44b', '#b88c28'];   // warm gold lipid bilayer
PALETTE.pore = ['#9ec5ea', '#5b88c0', '#3d6396'];    // channel protein barrels
PALETTE.teal = ['#5ab882', '#2e8b57', '#1e5e3a'];    // molecules inside the cell (x > 0)

export function buildWorld(E, params) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  const L = M.L, H = M.H, W = M.W;

  // floor and chamber outline
  part(root, box(2 * L + 0.16, 0.06, W + 0.16, 0.02), {
    tone: 'lo', pal: 'board', pos: [0, -H / 2 - 0.04, 0], name: 'Chamber floor',
  });
  const rim = [];
  for (const y of [-H / 2, H / 2]) for (const z of [-W / 2, W / 2]) rim.push(-L, y, z, L, y, z);
  for (const x of [-L, L]) for (const z of [-W / 2, W / 2]) rim.push(x, -H / 2, z, x, H / 2, z);
  lines(root, rim, '#d4d4d0');

  // lipid membrane + open protein channels at x = 0
  const gm = asm('membrane', root, {
    title: 'The cell membrane & channels',
    sub: `${params.channels} open protein pores let molecules slip through either way`,
  });
  gm.userData.focus = () => ({ target: [0, 0, 0], radius: 1.5 });
  const ch = params.channels, span = H * 0.82, segH = Math.max(0.05, (span / ch) - 0.13);
  for (let j = 0; j < ch; j++) {
    const py = M.poreY(ch, j);
    part(gm, xAxis(cyl(0.10, 0.22, 24)), {
      tone: 'hi', pal: 'pore', pos: [0, py, 0], name: 'Channel pore', ex: [0, 0, 0.35],
    });
    part(gm, box(0.12, segH * 0.72, W * 0.88, 0.02), {
      tone: 'mid', pal: 'lipid', pos: [0, py + (span / ch) * 0.5, 0], name: 'Lipid bilayer', ex: [0, 0.18, 0],
    });
  }

  // molecules: red on the outside (x <= 0), green on the inside (x > 0)
  const gp = asm('molecules', root, {
    title: 'Diffusing molecules',
    sub: 'each molecule jiggles at random; net flow comes only from there being more on one side',
  });
  gp.userData.focus = () => ({ target: [0, 0, 0], radius: 2.2 });
  const outBalls = particles(gp, params.n, { radius: 0.048, color: 'red', name: 'Outside molecules' });
  const inBalls = particles(gp, params.n, { radius: 0.048, color: 'teal', name: 'Inside molecules' });

  // two-way flux arrows above and below the membrane
  const fluxIn = vector(root, [-0.55, H / 2 + 0.22, 0], [0.55, H / 2 + 0.22, 0], { color: 'red', name: 'Inward flux' });
  const fluxOut = vector(root, [0.55, -H / 2 - 0.24, 0], [-0.55, -H / 2 - 0.24, 0], { color: 'teal', name: 'Outward flux' });

  let snap = { outside: params.n, inside: 0, inFlow: 0, outFlow: 0 };
  label('board', () => `Outside: ${snap.outside}`, () => V(-L * 0.68, H / 2 + 0.28, 0));
  label('board', () => `Inside: ${snap.inside}`, () => V(L * 0.85, H / 2 + 0.28, 0));
  label('mark', `${ch} open channels`, () => V(0, -H / 2 - 0.44, 0.2));

  function update(s) {
    snap = s.snap;
    let nOut = 0, nIn = 0;
    for (let i = 0; i < snap.pos.length; i++) {
      const p = snap.pos[i];
      if (p.x <= 0) outBalls.set(nOut++, [p.x, p.y, p.z]);
      else inBalls.set(nIn++, [p.x, p.y, p.z]);
    }
    outBalls.show(nOut);
    inBalls.show(nIn);

    const inSpan = Math.min(0.75, 0.08 + snap.inFlow * 0.018);
    const outSpan = Math.min(0.75, 0.08 + snap.outFlow * 0.018);
    fluxIn.set([-inSpan, H / 2 + 0.20, 0], [inSpan, H / 2 + 0.20, 0]);
    fluxIn.object.visible = snap.inFlow > 0;
    fluxOut.set([outSpan, -H / 2 - 0.22, 0], [-outSpan, -H / 2 - 0.22, 0]);
    fluxOut.object.visible = snap.outFlow > 0;
  }

  return { update, labels };
}
