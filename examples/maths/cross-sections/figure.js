// Figure description for Solids of Known Cross-Section (2D base circle -> 3D semicircular dome).
import * as M from './model.js';
import { buildWorld } from './world.js';

const viewPlan = {
  target: [M.POSE_PLAN.target[0], 0.0, M.POSE_PLAN.target[2]],
  az: 0,
  el: 89.4,
  dist: M.POSE_PLAN.dist,
  fov: M.POSE_PLAN.fov,
};

export const FIGURE = {
  no: 2,
  title: 'From 2D base circle to 3D cross-section dome',
  question: 'How does a flat 2D circle on a page define a 3D solid when every vertical chord grows a semicircle?',
  bigIdea:
    'a 2D base region and a cross-section rule completely determine a 3D volume. Viewed from overhead at a 3° lens, each slice is a flat chord of width 2√(R² − x²); extruding semicircles of area A(x) = ½π(R² − x²) perpendicular to the x-axis builds a hemisphere of volume ∫ A(x) dx = ⅔πR³ = 16.76 m³.',
  cuts: ['solid', 'xray', 'section'],
  xrayKeys: ['dome'],
  cutKeys: ['dome'],
  cutOpenY: 2.15,
  cutPlane: [0, -1, 0, 1.00],
  intro: {
    cam: viewPlan,
    lit: 'chord',
    look: { cutY: 2.20 },
    fig: 'Overhead 3° base circle · chord strip 2√(R² − x²)',
  },
  lookKeys: ['cutY'],

  STEPS: [
    {
      label: 'Read the 2D base circle (x² + z² ≤ R²)',
      fig: 'Overhead 3° telephoto plan · base chord at x = 0.60 m',
      hint: 'Viewed from overhead with a 3° telephoto lens, the figure is a flat 2D textbook circle of radius R = 2.00 m with a highlighted vertical chord of length 2√(R² − x²) at x = 0.60 m.',
      run: 1.0,
      play: 2.2,
      cam: viewPlan,
      lit: 'chord',
      look: { cutY: 2.20 },
    },
    {
      label: 'Extrude semicircular cross-sections into 3D',
      fig: '3° → 26° dolly-zoom · 20 Cavalieri semicircular arches',
      hint: 'Lowering the camera via log-FOV dolly-zoom while lifting 20 semicircular arches perpendicular to the x-axis turns each 2D chord into a 3D slice of area A(x) = ½π(R² − x²).',
      run: 1.0,
      play: 3.0,
      cam: { target: [-0.1, 0.55, 0.15], az: -28, el: 32, dist: 9.8, fov: 26 },
      lit: 'dome',
      look: { cutY: 2.20 },
    },
    {
      label: 'Slice at y = +1.00 m & integrate ∫ A(x) dx',
      fig: 'Horizontal section cut at y = +1.00 m · pochè slice caps',
      hint: 'A horizontal section cut at y = +1.00 m inks the cut arches in black pochè, confirming that summing A(x) dx from −R to +R yields V = ⅔πR³ = 16.76 m³.',
      run: 1.0,
      play: 2.8,
      cam: { target: [-0.1, 0.5, 0.15], az: -22, el: 28, dist: 9.4, fov: 28 },
      lit: 'dome',
      look: { cutY: 1.00 },
    },
  ],

  chips: [
    { label: 'Base circle area πR²', from: 1, value: s => `${s.baseArea.toFixed(2)} m²` },
    { label: 'Slice area A(0.60 m)', from: 2, value: s => `${s.sliceArea.toFixed(2)} m²` },
    { label: 'Section cut y', from: 3, value: s => `+${s.cutY.toFixed(2)} m` },
    { label: 'Volume ∫ A(x) dx', from: 3, value: s => `${s.totalVolume.toFixed(2)} m³` },
  ],

  PLATES: {
    dome: {
      text: 'By Cavalieri’s principle, the 3D volume depends only on the cross-sectional area function A(x) = ½π(R² − x²) integrated across x ∈ [−R, R].',
      facts: s => [
        ['Radius R', `${M.R.toFixed(2)} m`],
        ['Slice area A(x*)', `${s.sliceArea.toFixed(2)} m²`],
        ['Exact volume ⅔πR³', `${s.totalVolume.toFixed(2)} m³`],
      ],
    },
    chord: {
      text: 'On the 2D textbook diagram, the chord at x* = 0.60 m has half-length r(x*) = √(R² − x*²) = 1.91 m, which becomes the radius of the semicircular arch in 3D.',
      facts: s => [
        ['Slice x*', `${s.sliceX.toFixed(2)} m`],
        ['Chord radius r(x*)', `${s.sliceRadius.toFixed(2)} m`],
      ],
    },
  },

  readout: s =>
    `x* = ${s.sliceX.toFixed(2)} m · A(x*) = ${s.sliceArea.toFixed(2)} m²\ncut y = +${s.cutY.toFixed(2)} m · V = ${s.totalVolume.toFixed(2)} m³`,

  state: clock => M.at(clock),
  buildWorld,
};
