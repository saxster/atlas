// 2D-to-3D Passive Solar Blueprint figure: starts as an overhead 3° telephoto blueprint cut at +1.20 m,
// dolly-zooms into 3D perspective as the walls rise to 2.80 m, and tests winter vs. summer solar angles.
import { buildWorld } from './world.js';
import * as M from './model.js';

const viewBlueprint = M.POSE_PLAN; // { target, az: 0, el: 89.4, fov: 3, dist: ~188 }
const viewRise = { target: [-0.2, 0.65, -0.1], az: -32, el: 34, fov: 22, dist: 14.8 };
const viewWinter = { target: [-0.5, 1.0, 0.2], az: -32, el: 24, fov: 20, dist: 15.2 };
const viewSummer = { target: [-0.5, 1.1, 0.3], az: -20, el: 22, fov: 20, dist: 15.2 };

export const FIGURE = {
  no: 6,
  title: 'From 2D blueprint to 3D solar room',
  question: 'How does a 2D architectural plan become a 3D room that welcomes winter sun and blocks summer heat?',
  bigIdea: 'the 2D floorplan and the 3D building are the exact same watertight solid: viewed from overhead at a 3° lens and sliced at y = 1.20 m it reads as a flat blueprint; opening the lens while raising the cut extrudes the 3D volume and proves how a 0.95 m south overhang admits 26° winter rays while blocking 73° summer sun.',
  cuts: ['solid', 'xray', 'section'],
  xrayKeys: ['plan'],
  cutKeys: ['plan', 'overhang'],
  cutOpenY: M.WALL_H,
  cutPlane: [0, -1, 0, M.CUT_MID],
  intro: {
    cam: viewBlueprint,
    lit: 'plan',
    look: { cutY: M.CUT_PLAN },
    fig: 'Sheet A-101 · Ground floor plan (cut at +1.20 m)',
  },
  lookKeys: ['cutY'],
  STEPS: [
    {
      label: 'Read the 2D blueprint (+1.20 m cut)',
      fig: 'Overhead 3° telephoto plan · watertight pochè walls',
      run: 1,
      play: 2.4,
      cam: viewBlueprint,
      lit: 'plan',
      look: { cutY: M.CUT_PLAN },
      hint: 'Viewed from above with a 3° telephoto lens and sliced at +1.20 m, the 3D model reads as a flat architect’s plan with black pochè walls, dimension chains, and door swing arc.',
    },
    {
      label: 'Extrude the 3D volume (log-FOV dolly zoom)',
      fig: '3° → 22° dolly-zoom · ¾ section cutaway (+1.85 m)',
      run: 1,
      play: 3.0,
      cam: viewRise,
      lit: 'interior',
      look: { cutY: M.CUT_MID },
      hint: 'Interpolating ln(tan(fov/2)) and ln(frameHeight) together lowers the camera into 3D perspective without a cut while the section plane rises to +1.85 m to reveal the interior.',
    },
    {
      label: 'Winter solstice sun (α = 26°)',
      fig: 'Low 26° winter sun reaches 3.6 m across the slab',
      run: 1,
      play: 2.6,
      cam: viewWinter,
      lit: 'solar',
      look: { cutY: M.CUT_FULL },
      hint: 'At α = 26°, winter sunlight slips under the 0.95 m eaves overhang, bathing the thermal-mass floor with 2.61 kW of passive solar heat.',
    },
    {
      label: 'Summer solstice shade (α = 26° → 73°)',
      fig: 'High 73° summer sun blocked 100% by the overhang',
      run: 1,
      play: 3.0,
      cam: viewSummer,
      lit: 'overhang',
      look: { cutY: M.CUT_FULL },
      hint: 'As solar altitude climbs to 73°, the overhang shadow y = H_o − D_o tan α drops below the 0.60 m window sill, cutting direct beam heat gain to 0 W.',
    },
  ],
  buildWorld,
  state: clock => M.at(clock),
  readout: s => `cut y = +${Math.min(M.WALL_H, s.cutY).toFixed(2)} m · α = ${s.alphaDeg.toFixed(0)}°\nsunlit ${s.sunlitSpan.toFixed(2)} m · ${(s.heatGainW / 1000).toFixed(2)} kW`,
  chips: [
    { label: 'Floor area', from: 1, value: s => `${s.totalArea.toFixed(1)} m²` },
    { label: 'Section cut y', from: 2, value: s => s.cutY >= M.WALL_H ? 'full 2.80 m' : `+${s.cutY.toFixed(2)} m` },
    { label: 'Sunlit floor reach', from: 3, value: s => `${s.floorReach.toFixed(2)} m` },
    { label: 'Direct solar gain', from: 3, value: s => `${(s.heatGainW / 1000).toFixed(2)} kW` },
  ],
  PLATES: {
    plan: {
      text: 'The 2D blueprint is not a separate drawing: it is the 3D watertight RectSolid sliced horizontally at y = 1.20 m. Because touching wall boxes share no internal faces, every back-facing pixel exposed by the cut is inside a wall and renders as solid black architectural pochè.',
      facts: s => [['Studio area', `${s.studioArea.toFixed(1)} m²`], ['Alcove area', `${s.alcoveArea.toFixed(1)} m²`], ['Total area', `${s.totalArea.toFixed(1)} m²`]],
    },
    interior: {
      text: 'Parametric 3D interior components built without external meshes: fronts() generates the 4-door credenza with recessed shadow-gap reveals, shell() extrudes the hollow stone basin, lathe() revolves the ceramic vessel, and drape() folds the alcove daybed.',
      facts: s => [['Door opening', `${Math.round(s.doorOpen * 100)}%`], ['Wall height', `${M.WALL_H.toFixed(2)} m`]],
    },
    overhang: {
      text: 'A passive-solar overhang of projection D_o = 0.95 m at height H_o = 2.55 m acts as a purely geometric seasonal switch: low-angle winter rays pass beneath it, while steep summer rays strike the eaves and leave the glazing in complete shade.',
      facts: s => [['Shadow height y', `${s.shadowEdgeY.toFixed(2)} m`], ['Unshaded window', `${s.litHeight.toFixed(2)} m`]],
    },
    solar: {
      text: 'Direct beam heat gain is proportional to the unshaded window height h_sun(α) and cos(α). Sweeping from winter (26°) to summer (73°) reduces direct beam insolation from 2.61 kW to zero.',
      facts: s => [['Solar altitude α', `${s.alphaDeg.toFixed(1)}°`], ['Direct heat gain', `${(s.heatGainW / 1000).toFixed(2)} kW`]],
    },
  },
};
