// Figure description for Thin-Lens Ray Diagram -> 3D Cutaway Optical Bench.
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
  no: 16,
  title: 'From 2D ray diagram to 3D optical bench',
  question: 'How does a flat 2D textbook ray diagram become a 3D glass lens that focuses and magnifies a real image?',
  bigIdea:
    'a 2D principal-ray diagram is a meridional slice through an axisymmetric 3D lens. Revolving the 2D cross-section around the optical axis turns the three textbook construction rays into a 3D light cone satisfying 1/f = 1/d_o + 1/d_i and M = −d_i / d_o.',
  cuts: ['solid', 'xray', 'section'],
  xrayKeys: ['bench'],
  cutKeys: ['bench'],
  cutOpenY: 2.35,
  cutPlane: [0, -1, 0, 1.10],
  intro: {
    cam: viewPlan,
    lit: 'rays',
    look: { cutY: 1.10 },
    fig: 'Overhead 3° principal-ray schematic (d_o = 2f = 2.60 m)',
  },
  lookKeys: ['cutY'],

  STEPS: [
    {
      label: 'Read the 2D principal-ray diagram (d_o = 2f)',
      fig: 'Overhead 3° telephoto ray schematic · d_o = d_i = 2.60 m',
      hint: 'Viewed from overhead with a 3° telephoto lens, the three principal rays from d_o = 2.60 m (2f) refract through the f = 1.30 m lens profile to meet at d_i = 2.60 m (|M| = 1.00×).',
      run: 1.0,
      play: 2.2,
      cam: viewPlan,
      lit: 'rays',
      look: { cutY: 1.10 },
    },
    {
      label: 'Revolve the 2D lens profile into 3D',
      fig: '3° → 26° dolly-zoom · 270° revolved biconvex lens & brass mount',
      hint: 'Log-FOV dolly-zoom lowers the camera into 3D perspective while sweeping the 2D biconvex cross-section and brass barrel through 270° around the optical axis.',
      run: 1.0,
      play: 3.0,
      cam: { target: [0.35, 0.85, 0.1], az: -24, el: 28, dist: 12.2, fov: 26 },
      lit: 'bench',
      look: { cutY: 2.50 },
    },
    {
      label: 'Slide object toward F (d_o = 2.60 m → 1.95 m)',
      fig: 'Object at 1.5f · real image magnified to |M| = 2.00× at 3f',
      hint: 'Moving the object to d_o = 1.5f = 1.95 m pushes the real image out to d_i = 3f = 3.90 m and doubles its size to |M| = d_i / d_o = 2.00×.',
      run: 1.0,
      play: 2.8,
      cam: { target: [0.65, 0.85, 0.1], az: -18, el: 24, dist: 12.8, fov: 26 },
      lit: 'rays',
      look: { cutY: 2.50 },
    },
  ],

  chips: [
    { label: 'Focal length f', from: 1, value: s => `${s.f.toFixed(2)} m` },
    { label: 'Object distance d_o', from: 2, value: s => `${s.doDist.toFixed(2)} m` },
    { label: 'Image distance d_i', from: 3, value: s => `${s.diDist.toFixed(2)} m` },
    { label: 'Magnification |M|', from: 3, value: s => `${s.absMag.toFixed(2)}×` },
  ],

  PLATES: {
    bench: {
      text: 'Revolving the 2D meridional lens profile around the x-axis creates a 3D biconvex glass lens of focal length f = 1.30 m inside a brass barrel mount.',
      facts: s => [
        ['Focal length f', `${s.f.toFixed(2)} m`],
        ['Optical power P', `${s.powerDiopters.toFixed(2)} D`],
      ],
    },
    rays: {
      text: 'The three textbook principal rays (parallel → +F, central undeviated, and −F → parallel) trace a 3D cone from the object tip to the inverted real image tip.',
      facts: s => [
        ['Object distance d_o', `${s.doDist.toFixed(2)} m`],
        ['Image distance d_i', `${s.diDist.toFixed(2)} m`],
        ['Magnification M', `${s.mag.toFixed(2)}×`],
      ],
    },
  },

  readout: s =>
    `d_o = ${s.doDist.toFixed(2)} m · d_i = ${s.diDist.toFixed(2)} m\nf = ${s.f.toFixed(2)} m · M = ${s.mag.toFixed(2)}×`,

  state: clock => M.at(clock),
  buildWorld,
};
