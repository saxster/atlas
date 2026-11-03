// Figure description for 2D Isoquant-Isocost Chart -> 3D Cobb-Douglas Production Mountain.
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
  no: 5,
  title: 'From 2D isoquant map to 3D production mountain',
  question: 'Why does a firm maximise output where the 2D isoquant curve is tangent to the budget line?',
  bigIdea:
    'a 2D isoquant is a horizontal contour slice through the 3D production mountain Q(L, K) = 10 L⁰·⁵ K⁰·⁵, and the budget line is a vertical wall wL + rK = ₹120. The highest contour the budget wall can touch is Q* = 60 at (L* = 6, K* = 6), where MRTS = MP_L / MP_K = w / r = 1.00.',
  cuts: ['solid', 'xray', 'section'],
  xrayKeys: ['mountain'],
  cutKeys: ['mountain'],
  cutOpenY: 2.35,
  cutPlane: [0, -1, 0, 1.20],
  intro: {
    cam: viewPlan,
    lit: 'optimum',
    look: { cutY: 2.40 },
    fig: 'Overhead 3° isoquant & isocost chart · tangency at (6, 6)',
  },
  lookKeys: ['cutY'],

  STEPS: [
    {
      label: 'Read the 2D isoquant & isocost chart',
      fig: 'Overhead 3° contour map · isoquants Q ∈ {35, 60, 85}',
      hint: 'Viewed from overhead with a 3° telephoto lens, the figure is a flat 2D microeconomics diagram showing isoquants Q ∈ {35, 60, 85}, the red isocost line 10L + 10K = ₹120, and tangency at (6, 6).',
      run: 1.0,
      play: 2.2,
      cam: viewPlan,
      lit: 'optimum',
      look: { cutY: 2.40 },
    },
    {
      label: 'Extrude the 3D production mountain & budget wall',
      fig: '3° → 26° dolly-zoom · Q(L, K) surface & vertical budget wall',
      hint: 'Log-FOV dolly-zoom lowers the camera into 3D perspective as Q(L, K) = 10 L⁰·⁵ K⁰·⁵ rises into a 3D surface intersected by the vertical red budget plane.',
      run: 1.0,
      play: 3.0,
      cam: { target: [-0.05, 0.65, 0.1], az: -28, el: 30, dist: 9.2, fov: 26 },
      lit: 'mountain',
      look: { cutY: 2.40 },
    },
    {
      label: 'Slice horizontally at Q* = 60 (MRTS = w/r)',
      fig: 'Horizontal section cut at Q* = 60 · pochè tangency contour',
      hint: 'Slicing the 3D mountain horizontally at Q* = 60 inks the interior in black pochè, proving that the 2D isoquant is the horizontal section cut touching the vertical budget wall at (6, 6).',
      run: 1.0,
      play: 2.8,
      cam: { target: [-0.05, 0.60, 0.1], az: -20, el: 28, dist: 9.0, fov: 26 },
      lit: 'mountain',
      look: { cutY: 1.20 },
    },
  ],

  chips: [
    { label: 'Budget C = wL + rK', from: 1, value: s => `₹${s.budgetC.toFixed(0)}` },
    { label: 'Optimal inputs (L*, K*)', from: 2, value: s => `(${s.lStar.toFixed(1)}, ${s.kStar.toFixed(1)})` },
    { label: 'Max output Q*', from: 3, value: s => `${s.qStar.toFixed(1)} units` },
    { label: 'Tangency MRTS = w/r', from: 3, value: s => `${s.mrtsStar.toFixed(2)}` },
  ],

  PLATES: {
    mountain: {
      text: 'The 3D surface Q(L, K) = 10 L⁰·⁵ K⁰·⁵ rises over the (L, K) input plane while the linear budget constraint 10L + 10K = ₹120 rises as a vertical plane slicing through the mountain.',
      facts: s => [
        ['Total budget C', `₹${s.budgetC.toFixed(0)}`],
        ['Peak output Q*', `${s.qStar.toFixed(1)} units`],
      ],
    },
    optimum: {
      text: 'At the peak of the budget ridge (L* = 6, K* = 6), the horizontal isoquant contour Q* = 60 is tangent to the vertical budget wall: MRTS = MP_L / MP_K = K/L = w/r = 1.00.',
      facts: s => [
        ['Optimal labor L*', `${s.lStar.toFixed(1)} units`],
        ['Optimal capital K*', `${s.kStar.toFixed(1)} units`],
        ['MRTS = w/r', `${s.mrtsStar.toFixed(2)}`],
      ],
    },
  },

  readout: s =>
    `(L*, K*) = (${s.lStar.toFixed(1)}, ${s.kStar.toFixed(1)}) · Q* = ${s.qStar.toFixed(0)}\nMRTS = ${s.mrtsStar.toFixed(2)} · C = ₹${s.budgetC.toFixed(0)}`,

  state: clock => M.at(clock),
  buildWorld,
};
