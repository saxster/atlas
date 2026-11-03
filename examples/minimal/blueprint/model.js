// 2D-to-3D Passive Solar Blueprint model: pure geometry and solar-overhang trigonometry (zero DOM, zero Three.js).
// Proves that the 2D floorplan dimensions and the 3D passive-solar section obey exact area and shadow invariants.
import { planBounds, planPose, lerp, smoothstep } from '@saxster/atlas/motion.js';

export const CUT_PLAN = 1.2;        // standard architectural plan cut height (+1.20 m)
export const CUT_MID = 1.85;        // ¾ section cutaway height (+1.85 m)
export const WALL_H = 2.8;          // full 3D wall extrusion height (m)
export const CUT_FULL = 2.85;       // uncut full-height plane above the 2.80 m walls
export const WALL_TH = 0.2;         // exterior wall thickness (m)
export const WIN_SILL = 0.6;        // south window sill height (m)
export const WIN_LINTEL = 2.4;      // south window lintel height (m)
export const WIN_W = 2.6;           // south window width (m)
export const OVERHANG_Y = 2.55;     // south eaves overhang height (m)
export const OVERHANG_D = 0.95;     // south eaves horizontal projection depth (m)
export const SOLAR_FLUX = 750;      // clear-sky direct normal irradiance factor (W/m²)

export const ALPHA_WINTER = 26;     // winter solstice noon solar altitude (deg)
export const ALPHA_SUMMER = 73;     // summer solstice noon solar altitude (deg)

export const PLAN = {
  wallThickness: WALL_TH,
  wallHeight: WALL_H,
  slabThickness: 0.14,
  cutY: CUT_PLAN,
  rooms: [
    { key: 'studio', name: 'Solar Studio', box: [-3.2, -2.0, 0.8, 2.0] },
    { key: 'alcove', name: 'Thermal Alcove', poly: [[0.8, -2.0], [3.2, -2.0], [3.2, 2.0], [0.8, 2.0]] },
  ],
  walls: [
    [-3.2, -2.0, 3.2, -2.0, WALL_TH, WALL_H], // north wall
    [-3.2, 2.0, 3.2, 2.0, WALL_TH, WALL_H],   // south glazed wall
    [-3.2, -2.0, -3.2, 2.0, WALL_TH, WALL_H], // west wall
    [3.2, -2.0, 3.2, 2.0, WALL_TH, WALL_H],   // east wall
    [0.8, -2.0, 0.8, 2.0, 0.16, WALL_H],      // interior partition wall
  ],
  windows: [
    { x0: -2.5, z0: 2.0, x1: 0.1, z1: 2.0, sill: WIN_SILL, lintel: WIN_LINTEL, mullions: 2, name: 'South solar glazing' },
  ],
  doors: [
    { x: 0.8, z: -0.4, width: 0.9, height: 2.15, axis: 'z', dir: 1, swing: 1, openAngle: 75, name: 'Alcove oak door' },
  ],
  dims: [
    { along: 'x', at: 2.65, ticks: [-3.2, 0.8, 3.2], from: 2.15, side: 1 },
    { along: 'z', at: -3.85, ticks: [-2.0, 2.0], from: -3.35, side: -1 },
  ],
  grids: [
    { box: [-3.2, -2.0, 0.8, 2.0], step: 1.0 },
  ],
  border: [-4.45, -2.6, 3.9, 3.25],
};

export const BOUNDS = planBounds(PLAN);
export const POSE_PLAN = planPose(BOUNDS, { fov: 3, el: 89.4, az: 0, aspect: 1.25, pad: 1.22 });

// Analytical passive-solar geometry for a given solar altitude angle `alphaDeg` (deg).
export function solarAt(alphaDeg) {
  const rad = (alphaDeg * Math.PI) / 180;
  const tanA = Math.tan(rad);
  // Vertical height on the south wall where the overhang's shadow edge lands:
  const shadowEdgeY = OVERHANG_Y - OVERHANG_D * tanA;
  // Unshaded vertical aperture of the window [WIN_SILL, WIN_LINTEL]:
  const litTopY = Math.max(WIN_SILL, Math.min(WIN_LINTEL, shadowEdgeY));
  const litHeight = Math.max(0, litTopY - WIN_SILL);
  // How far the sunlit band reaches across the studio floor (z = 2.0 northwards toward z = -2.0):
  const floorReach = litHeight > 0 ? Math.min(4.0, litTopY / tanA) : 0;
  const sillOffset = litHeight > 0 ? Math.min(4.0, WIN_SILL / tanA) : 0;
  const sunlitSpan = Math.max(0, floorReach - sillOffset);
  // Direct solar heat gain through the unshaded window aperture (W):
  const heatGainW = SOLAR_FLUX * WIN_W * litHeight * Math.cos(rad);
  return {
    alphaDeg,
    shadowEdgeY,
    litTopY,
    litHeight,
    floorReach,
    sillOffset,
    sunlitSpan,
    heatGainW,
  };
}

// Clock runs 0 -> 4 across the 4 machine steps:
//   0..1: 2D blueprint inspection (cutY = 1.20 m, door opening 0.35 -> 0.50)
//   1..2: 3D extrusion & ¾ interior cutaway (cutY = 1.20 -> 1.85 m, door opens to 1.0)
//   2..3: Full 2.80 m wall rise & Winter solstice low sun (alpha = 26 deg, deep floor insolation)
//   3..4: Sweep from Winter (26 deg) to Summer solstice high sun (73 deg, overhang blocks beam)
export function at(clock = 0) {
  const c = Math.max(0, Math.min(4, clock));
  const riseMid = smoothstep(1.0, 1.0 + 1.6 / 3.0, c);
  const riseFull = smoothstep(2.0, 2.0 + 1.6 / 2.6, c);
  const cutY = c <= 2
    ? lerp(CUT_PLAN, CUT_MID, riseMid)
    : lerp(CUT_MID, CUT_FULL, riseFull);
  const lift = (cutY - CUT_PLAN) / (CUT_FULL - CUT_PLAN);
  const doorOpen = c <= 1 ? 0.35 + 0.15 * c : lerp(0.5, 1.0, riseMid);
  const seasonU = smoothstep(3.0, 3.0 + 1.6 / 3.0, c);
  const alphaDeg = lerp(ALPHA_WINTER, ALPHA_SUMMER, seasonU);
  const solar = solarAt(alphaDeg);

  return {
    clock: c,
    lift,
    cutY,
    doorOpen,
    seasonU,
    studioArea: BOUNDS.roomAreas.studio,
    alcoveArea: BOUNDS.roomAreas.alcove,
    totalArea: BOUNDS.totalArea,
    ...solar,
  };
}
