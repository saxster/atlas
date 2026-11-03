// 2D-to-3D Passive Solar Blueprint world: watertight RectSolid walls + openings via extrudePlan,
// world-space 2D blueprint dimension chains, parametric 3D interior detailing (fronts, shell, lathe, drape),
// and live solar overhang ray + floor insolation patch.
import * as THREE from 'three';
import { part, box, arrow, setArrow, shadeMat, V } from '@saxster/atlas/parts.js';
import { extrudePlan, bevelBox, shell, lathe, drape, fronts, contactShadow } from '@saxster/atlas/cad_kit.js';
import * as M from './model.js';

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group();
  scene.add(root);

  // 1. Watertight architectural shell + 2D blueprint dimension sheet ("The drawing and the model are one")
  const gPlan = asm('plan', root, {
    title: '2D Blueprint & Watertight Shell',
    sub: 'RectSolid walls cut at +1.20 m with black pochè, rising to 2.80 m in 3D',
  });
  const plan = extrudePlan(gPlan, { ...M.PLAN, cutY: undefined }, { pal: 'paper', floorPal: 'board', poche: true });

  // 2. South solar eaves overhang above the glazing
  const gOverhang = asm('overhang', root, {
    title: 'South Solar Overhang',
    sub: `D = ${M.OVERHANG_D} m eaves projection at H = ${M.OVERHANG_Y} m`,
  });
  const eaves = part(gOverhang, bevelBox(3.4, 0.12, M.OVERHANG_D, 0.012), {
    pal: 'ink', tone: 'hi', pos: [-1.2, M.OVERHANG_Y, 2.0 + M.OVERHANG_D * 0.5], ex: [0, 0.55, 0.45], name: 'Solar eaves overhang',
  });

  // 3. Parametric 3D interior furnishings (built from cad_kit.js primitives)
  const gInterior = asm('interior', root, {
    title: 'Parametric 3D Interior & Thermal Mass',
    sub: 'built procedurally with fronts(), shell(), lathe(), and drape()',
  });
  // Storage credenza along the north wall with shadow-gap doors & bar pulls
  part(gInterior, bevelBox(2.2, 0.78, 0.48, 0.012), {
    pal: 'paper', tone: 'mid', pos: [-1.2, 0.39, -1.62], name: 'Credenza carcass',
  });
  fronts(gInterior, {
    w: 2.16, h: 0.72, d: 0.02, nx: 4, ny: 1, pull: 'bar',
    pal: 'paper', pullPal: 'ink', pos: [-1.2, 0.39, -1.37], name: 'Credenza doors',
  });
  contactShadow(gInterior, 2.35, 0.62, { pos: [-1.2, 0.005, -1.62], strength: 0.4 });

  // Turned ceramic vessel (lathe) & hollow carved stone basin (shell) on the credenza
  const vaseGeo = lathe([[0, 0], [0.08, 0.04], [0.13, 0.16], [0.07, 0.30], [0.09, 0.35]], { segs: 28 });
  part(gInterior, vaseGeo, { pal: 'red', tone: 'hi', pos: [-1.85, 0.78, -1.62], name: 'Lathe ceramic vessel' });
  const basinGeo = shell(0.52, 0.34, 0.14, { thickness: 0.035, radius: 0.06 });
  part(gInterior, basinGeo, { pal: 'base', tone: 'mid', pos: [-0.75, 0.85, -1.62], name: 'Hollow stone basin' });

  // Draped reading daybed in the Thermal Alcove
  const bedGeo = drape(1.3, 1.9, 0.42, { drop: 0.14, fold: 0.01 });
  part(gInterior, bedGeo, { pal: 'blue', tone: 'mid', pos: [2.1, 0.28, -0.6], name: 'Draped alcove daybed' });
  contactShadow(gInterior, 1.45, 2.05, { pos: [2.1, 0.005, -0.6], strength: 0.38 });

  // 4. Solar beam vectors & sunlit floor insolation patch
  const gSolar = asm('solar', root, {
    title: 'Solar Incidence & Floor Insolation',
    sub: '26° winter beam heats the slab; 73° summer beam is blocked by the overhang',
  });
  const sunRay = arrow(gSolar, 'amber', { r: 0.032, head: 0.16, headR: 0.085, name: 'Solar ray' });
  const sunPatch = part(gSolar, box(M.WIN_W, 0.016, 1.0, 0.002), {
    pal: 'amber', tone: 'lit', mat: shadeMat('amber', { opacity: 0.42 }), pos: [-1.2, 0.01, 0.5], name: 'Sunlit thermal floor',
  });

  let curState = M.at(0);
  const labels = [
    {
      cls: 'tag',
      leader: true,
      text: () => `Solar Studio · ${curState.studioArea.toFixed(1)} m²`,
      anchor: () => V(-1.5, 0.2, -0.65),
      at: () => (curState.clock < 2.0
        ? V(-1.85, 0.15 + 0.55 * curState.lift, -1.25)
        : null),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `Alcove · ${curState.alcoveArea.toFixed(1)} m²`,
      anchor: () => V(2.0, 0.4, 0.5),
      at: () => (curState.clock < 2.0
        ? V(2.3, 0.1 + 0.25 * curState.lift, 1.5)
        : null),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `0.95 m eaves overhang`,
      anchor: () => V(0.1, M.OVERHANG_Y + 0.04, 2.0 + M.OVERHANG_D * 0.5),
      at: () => (curState.clock >= 2.0 ? V(0.95, 1.65, 2.65) : null),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `Sun α = ${curState.alphaDeg.toFixed(0)}° (${(curState.heatGainW / 1000).toFixed(2)} kW)`,
      anchor: () => V(-1.2, M.OVERHANG_Y, 2.0 + M.OVERHANG_D),
      at: () => (curState.clock >= 2.0 ? V(-2.2, 0.95, 2.95) : null),
    },
  ];

  // 2D blueprint dimension chain numbers on the South and West sheet margins (shown during 2D blueprint & extrusion steps)
  for (const m of plan.sheet?.measurements || []) {
    labels.push({
      cls: 'axis',
      html: m.text,
      at: () => (curState.clock < 2.0 ? m.mid : null),
    });
  }

  function update(s) {
    curState = s;
    plan.setDoors(s.doorOpen);

    // Solar ray from the overhang lip toward the south window / studio floor (active in Steps 3 & 4)
    const showSolar = s.clock >= 2.0;
    sunRay.visible = showSolar;
    sunPatch.visible = s.sunlitSpan > 0.05;

    if (showSolar) {
      const rad = (s.alphaDeg * Math.PI) / 180;
      const lipZ = 2.0 + M.OVERHANG_D;
      const lipY = M.OVERHANG_Y;
      const from = V(-1.2, lipY + 1.1 * Math.sin(rad), lipZ + 1.1 * Math.cos(rad));
      const toY = Math.max(0.02, s.shadowEdgeY);
      const toZ = s.shadowEdgeY >= 0 ? 2.0 : 2.0 - s.floorReach;
      const to = V(-1.2, toY, toZ);
      setArrow(sunRay, from, to.clone().sub(from), 1);
    }

    if (s.sunlitSpan > 0.05) {
      const zStart = 2.0 - s.sillOffset;
      const zEnd = 2.0 - s.floorReach;
      sunPatch.scale.z = Math.max(0.05, s.sunlitSpan);
      sunPatch.position.set(-1.2, 0.012, 0.5 * (zStart + zEnd));
    }
  }

  return { update, labels };
}
