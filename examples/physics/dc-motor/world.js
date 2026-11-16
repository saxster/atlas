import * as THREE from 'three';
import { part, box, cyl, arrow, setArrow, liveTube, shadeMat, V } from '@saxster/atlas/parts.js';
import { fieldLines, flowBeads } from '@saxster/atlas/prims.js';
import { contactShadow } from '@saxster/atlas/cad_kit.js';
import { rrange, TAU } from '@saxster/atlas/motion.js';
import { fluxSeeds } from './model.js';

export function buildWorld(E, params = {}) {
  const { scene, asm } = E;

  // 1. Grounded bench plinth + hand-placed corner bolts (toybox-scale-joy + bugged-sketchbook)
  const gBench = asm('bench', scene, { title: 'Optical & motor bench', sub: 'Sliding stator rail and bearing pedestals', noPick: true });
  part(gBench, box(4.6, 0.14, 2.7, 0.04), { pal: 'paper', tone: 'lo', pos: [0, -1.05, 0], name: 'Bench base' });
  part(gBench, box(3.8, 0.05, 0.24, 0.015), { pal: 'housing', tone: 'mid', pos: [0, -0.96, 0], name: 'Slideway rail' });
  // Bearing pedestals + central rotor axle + brush contact shoes in non-picked bench structure
  part(gBench, box(0.24, 0.96, 0.16, 0.02), { pal: 'housing', tone: 'mid', pos: [0, -0.52, -1.08], name: 'Rear bearing' });
  part(gBench, box(0.26, 0.62, 0.16, 0.02), { pal: 'housing', tone: 'mid', pos: [0, -0.68, 1.18], name: 'Front pedestal' });
  const shaftGeo = cyl(0.046, 2.55, 20); shaftGeo.rotateX(Math.PI / 2);
  part(gBench, shaftGeo, { pal: 'housing', tone: 'hi', pos: [0, 0, 0.08], name: 'Rotor shaft' });
  part(gBench, box(0.10, 0.09, 0.18, 0.01), { pal: 'ink', tone: 'hi', pos: [-0.24, 0, 0.92], name: 'Left brush shoe' });
  part(gBench, box(0.10, 0.09, 0.18, 0.01), { pal: 'ink', tone: 'hi', pos: [0.24, 0, 0.92], name: 'Right brush shoe' });
  for (let i = 0; i < 4; i++) {
    const bx = (i & 1 ? 1.95 : -1.95) + rrange(10 + i, -0.018, 0.018);
    const bz = (i & 2 ? 1.05 : -1.05) + rrange(20 + i, -0.018, 0.018);
    part(gBench, cyl(0.055, 0.04, 6), { pal: 'dark', tone: 'mid', pos: [bx, -0.96, bz], rot: [0, rrange(30 + i, -0.2, 0.2), 0], name: 'Bolt' });
  }
  contactShadow(gBench, { w: 2.1, d: 2.0, opacity: 0.18, y: -0.975 });

  // 2. Stator N & S permanent magnets on a 1D symmetric slide rail
  const gStator = asm('stator', scene, { title: 'Permanent stator poles', sub: 'Slide the North pole along the rail to narrow or widen the air gap' });
  const nPole = new THREE.Group();
  const sPole = new THREE.Group();
  gStator.add(nPole, sPole);
  part(nPole, box(0.56, 1.38, 1.36, 0.04), { pal: 'red', tone: 'mid', pos: [-0.28, 0, 0], name: 'North pole' });
  part(nPole, box(0.62, 0.16, 0.44, 0.02), { pal: 'housing', tone: 'mid', pos: [-0.28, -0.78, 0], name: 'North carriage' });
  part(sPole, box(0.56, 1.38, 1.36, 0.04), { pal: 'blue', tone: 'mid', pos: [0.28, 0, 0], name: 'South pole' });
  part(sPole, box(0.62, 0.16, 0.44, 0.02), { pal: 'housing', tone: 'mid', pos: [0.28, -0.78, 0], name: 'South carriage' });

  // 1D skew-line rail drag on North magnet: sliding it adjusts params.gap cleanly at any camera angle
  let railGap = +(params.gap ?? 1.15);
  const railDrag = E.draggable(nPole, {
    axis: { origin: [0, 0, 0], dir: [-1, 0, 0], min: 0.85, max: 1.85 },
    load: 0.28,
    onDrag: g => {
      railGap = g;
      params.gap = +g.toFixed(2);
      const slider = typeof document !== 'undefined' ? document.querySelector('input[data-key="gap"]') : null;
      if (slider) {
        slider.value = String(params.gap);
        if (slider.nextElementSibling) slider.nextElementSibling.textContent = `${params.gap.toFixed(2)}×`;
      }
    },
  });
  railDrag.set(railGap);

  // 3. Equal-flux magnetic field lines (N -> S along +X) seeded by quantileSeeds
  const gField = asm('field', scene, { title: 'Air-gap magnetic field B', sub: 'Equal-flux streamlines from North to South pole', noPick: true });
  const makeSeeds = g => fluxSeeds(g, 5).map(y => [-g + 0.02, y, 0]);
  const bLines = fieldLines(gField, (_x, y) => [1, -0.06 * y, 0], {
    seeds: makeSeeds(railGap),
    steps: 24,
    dt: (2 * railGap - 0.04) / 24,
    radius: 0.011,
    color: 'blue',
    conesEvery: 8,
    coneRadius: 0.036,
    coneLength: 0.10,
    name: 'Magnetic field',
  });

  // 4. Spinning rectangular copper coil + circulating carrier flowBeads
  const gCoil = asm('coil', scene, { title: 'Armature winding', sub: 'Lorentz forces F = I L × B push one arm up and the opposite arm down' });
  const rotor = new THREE.Group();
  gCoil.add(rotor);

  // Rectangular copper loop in local rotor coordinates sampled smoothly at 41 points for liveTube(40, ...)
  const rx = 0.54, zBack = -0.62, zFront = 0.54, zLead = 0.74;
  const loopCorners = [
    [-0.12, 0, zLead], [-0.12, 0, zFront + 0.08], [-rx, 0, zFront], [-rx, 0, zBack],
    [rx, 0, zBack], [rx, 0, zFront], [0.12, 0, zFront + 0.08], [0.12, 0, zLead],
  ];
  const samplePolyline = (pts, n) => {
    const lens = [0];
    for (let i = 1; i < pts.length; i++) {
      lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    }
    const tot = lens.at(-1) || 1;
    let seg = 0;
    return Array.from({ length: n + 1 }, (_, k) => {
      const d = (k / n) * tot;
      while (seg < pts.length - 2 && lens[seg + 1] < d) seg++;
      const span = Math.max(1e-9, lens[seg + 1] - lens[seg]);
      const u = (d - lens[seg]) / span;
      return V(
        pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * u,
        pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * u,
        pts[seg][2] + (pts[seg + 1][2] - pts[seg][2]) * u,
      );
    });
  };
  const coilGeo = liveTube(40, 0.038, 10);
  coilGeo.update(samplePolyline(loopCorners, 40));
  const coilMesh = part(rotor, coilGeo, { pal: 'ochre', tone: 'hi', name: 'Copper coil' });

  // Hold-to-stall probe on the spinning copper coil: holding/dragging locks ω = 0 so back-EMF vanishes and I = V/R!
  E.draggable(coilMesh, {
    autoMove: false,
    onStart: () => { params.stallTheta = rotor.rotation.z || 0; },
    onDrag: (_p, worldPt) => {
      if (worldPt) params.stallTheta = Math.atan2(worldPt.y, worldPt.x || 1e-4);
    },
    onEnd: () => { params.stallTheta = null; },
    onReset: () => { params.stallTheta = null; },
  });

  // Animated current flow beads riding around the spinning coil in world space
  const beads = flowBeads(gCoil, [[-rx, 0, zFront], [-rx, 0, zBack], [rx, 0, zBack], [rx, 0, zFront]], {
    count: 12, radius: 0.032, color: 'red', shape: 'cone', name: 'Current carriers',
  });

  // Lorentz force vectors on left (-rx) and right (+rx) coil arms
  const fLeft = arrow(gCoil, 'red', { r: 0.028, head: 0.15, headR: 0.075, name: 'Left Lorentz force' });
  const fRight = arrow(gCoil, 'red', { r: 0.028, head: 0.15, headR: 0.075, name: 'Right Lorentz force' });

  // 5. Flush-seam Split-Ring Commutator (distinct idOff ±0.05 so coplanar mating halves draw crisp ink seams!)
  const gComm = asm('commutator', scene, { title: 'Split-ring commutator', sub: 'Two insulated copper half-rings swap brush contact every 180°' });
  const commGroup = new THREE.Group();
  commGroup.position.set(0, 0, 0.92);
  gComm.add(commGroup);

  const coreGeo = cyl(0.14, 0.24, 24); coreGeo.rotateX(Math.PI / 2);
  part(commGroup, coreGeo, { pal: 'dark', tone: 'hi', idOff: 0, name: 'Insulator hub' });

  // Left and right copper commutator segments with narrow brush gap (arc = π - 0.24)
  const arcSpan = Math.PI - 0.24;
  const halfGeoA = new THREE.CylinderGeometry(0.19, 0.19, 0.22, 24, 1, false, -arcSpan / 2 + Math.PI / 2, arcSpan);
  halfGeoA.rotateX(Math.PI / 2);
  const halfGeoB = new THREE.CylinderGeometry(0.19, 0.19, 0.22, 24, 1, false, -arcSpan / 2 - Math.PI / 2, arcSpan);
  halfGeoB.rotateX(Math.PI / 2);
  const segA = part(commGroup, halfGeoA, { pal: 'red', tone: 'hi', idOff: -0.05, name: 'Commutator half A' });
  const segB = part(commGroup, halfGeoB, { pal: 'ochre', tone: 'hi', idOff: 0.05, name: 'Commutator half B' });

  // Solid slip-ring sleeve (shown only when params.commutator === 0 for comparison!)
  const slipGroup = new THREE.Group();
  slipGroup.position.set(0, 0, 0.92);
  gComm.add(slipGroup);
  const slipGeo1 = cyl(0.19, 0.095, 28); slipGeo1.rotateX(Math.PI / 2);
  const slipGeo2 = cyl(0.19, 0.095, 28); slipGeo2.rotateX(Math.PI / 2);
  part(slipGroup, slipGeo1, { pal: 'red', tone: 'hi', pos: [0, 0, -0.06], idOff: -0.04, name: 'Slip ring +' });
  part(slipGroup, slipGeo2, { pal: 'ochre', tone: 'hi', pos: [0, 0, 0.06], idOff: 0.04, name: 'Slip ring −' });

  // 6. Stationary spring-loaded carbon brushes
  const gBrushes = asm('brushes', scene, { title: 'Carbon brushes', sub: 'Stationary graphite blocks feeding DC current into the spinning ring' });
  part(gBrushes, box(0.16, 0.13, 0.24, 0.02), { pal: 'ink', tone: 'hi', pos: [-0.37, 0, 0.92], name: 'Left brush (+)' });
  part(gBrushes, box(0.16, 0.13, 0.24, 0.02), { pal: 'ink', tone: 'hi', pos: [0.37, 0, 0.92], name: 'Right brush (−)' });
  part(gBrushes, box(0.16, 0.06, 0.16, 0.01), { pal: 'red', tone: 'mid', pos: [-0.52, 0, 0.92], name: 'Positive terminal' });
  part(gBrushes, box(0.16, 0.06, 0.16, 0.01), { pal: 'blue', tone: 'mid', pos: [0.52, 0, 0.92], name: 'Negative terminal' });

  let lastGap = -1;
  const beadPhase = { v: 0 };

  function update(s) {
    const g = railDrag.active ? railGap : +(params.gap ?? 1.15);
    if (!railDrag.active) railGap = g;
    nPole.position.set(-g, 0, 0);
    sPole.position.set(g, 0, 0);

    if (Math.abs(g - lastGap) > 1e-3) {
      lastGap = g;
      // Rebuild equal-flux streamlines across updated air gap
      const seeds = makeSeeds(g);
      const span = Math.max(0.4, 2 * g - 0.06);
      bLines.update((_x, y) => {
        const speed = span / (24 * ((2 * 1.15 - 0.04) / 24));
        return [speed, -0.05 * y, 0];
      }, seeds);
    }

    const th = s.theta || 0;
    rotor.rotation.z = th;
    commGroup.rotation.z = th;
    const useSplit = +(params.commutator ?? 1) === 1;
    commGroup.visible = useSplit;
    slipGroup.visible = !useSplit;
    segA.visible = useSplit;
    segB.visible = useSplit;

    const c = Math.cos(th), sn = Math.sin(th);
    const armA = [-rx * c, -rx * sn, -0.03];
    const armB = [rx * c, rx * sn, -0.03];

    // Lorentz force on wire carrying I along Z in +X magnetic field:
    // When sw = +1, armA (-rx*c, -rx*sn) carries current into -Z -> F_y < 0 or > 0 producing +Z (CCW) torque!
    // Specifically for +CCW rotation (increasing θ): at θ=0, armB (+rx, 0) pushes +Y and armA (-rx, 0) pushes -Y.
    const sw = s.sw ?? 1;
    const fMag = Math.min(0.85, Math.abs(s.current || 0) * (s.B || 0.5) * 0.42);
    const dirY = sw * Math.sign(s.current || 0);
    setArrow(fRight, V(...armB), V(0, dirY * fMag, 0), fMag > 0.02 ? 1 : 0);
    setArrow(fLeft, V(...armA), V(0, -dirY * fMag, 0), fMag > 0.02 ? 1 : 0);

    // World-space closed coil path for flowBeads (reverses flow direction when sw flips!)
    const rotPt = (lx, lz) => [lx * c, lx * sn, lz];
    const worldLoop = [
      rotPt(-rx, zFront), rotPt(-rx, zBack),
      rotPt(rx, zBack), rotPt(rx, zFront), rotPt(-rx, zFront),
    ];
    // Deterministic phase from state time t so ?render window.seek(t) is 100% order-independent!
    beadPhase.v = (s.t || 0) * 0.85 * dirY;
    beads.update(beadPhase.v, {
      path: dirY >= 0 ? worldLoop : [...worldLoop].reverse(),
      visibleCount: Math.abs(s.current || 0) > 0.05 ? 12 : 0,
    });
  }

  const labels = [
    {
      cls: 'axis', html: '<b>N</b> · drag rail ↔',
      at: () => V(-(railGap + 0.28), 0.78, 0),
      normal: () => [0, 1, 0.25], lift: 0.06,
      on: () => true,
    },
    {
      cls: 'axis', html: '<b>S</b>',
      at: () => V(railGap + 0.28, 0.78, 0),
      normal: () => [0, 1, 0.25], lift: 0.06,
      on: () => true,
    },
    {
      cls: 'vec blue', html: '<b>B</b>',
      at: () => V(0, 0.72, -0.15),
      on: () => true,
    },
    {
      cls: 'board', html: 'split-ring commutator',
      anchor: () => V(0, -0.22, 0.96),
      at: () => V(0, -0.66, 1.10),
      leader: true,
      on: () => +(params.commutator ?? 1) === 1,
    },
  ];

  return { update, labels };
}
