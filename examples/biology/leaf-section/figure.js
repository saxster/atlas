// Figure description for 2D Leaf Histology Slide -> 3D Living Leaf Cutaway.
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
  no: 7,
  title: 'From 2D histology slide to 3D living leaf',
  question: 'How does a flat 2D microscope cross-section of a leaf organize 3D light capture and CO₂ diffusion?',
  bigIdea:
    'a 2D histological slide is a thin slice through a 3D solar bioreactor. Extruding the 220 µm cross-section reveals why column-packed palisade cells sit on top to capture 83.5% of photons (I = I₀e⁻ᵘᶻ) while spongy air spaces and guard-cell stomata sit below to feed CO₂ (J = g_s(C_a − C_i)).',
  cuts: ['solid', 'xray', 'section'],
  xrayKeys: ['leaf'],
  cutKeys: ['leaf'],
  cutOpenY: 2.30,
  cutPlane: [0, -1, 0, 1.55],
  intro: {
    cam: viewPlan,
    lit: 'leaf',
    look: { cutY: 1.55 },
    fig: 'Overhead 3° histology slide · +155 µm horizontal section',
  },
  lookKeys: ['cutY'],

  STEPS: [
    {
      label: 'Read the 2D histological section (+155 µm cut)',
      fig: 'Overhead 3° microscope plan · pochè palisade cells & vein',
      hint: 'Viewed from overhead with a 3° telephoto lens and sliced horizontally, the leaf block reads as a flat 2D biology diagram with black pochè palisade cell sections, stomatal pore, and vascular vein.',
      run: 1.0,
      play: 2.2,
      cam: viewPlan,
      lit: 'leaf',
      look: { cutY: 1.55 },
    },
    {
      label: 'Extrude the 220 µm 3D tissue block',
      fig: '3° → 26° dolly-zoom · palisade columns & vascular bundle',
      hint: 'Log-FOV dolly-zoom lowers the camera into 3D perspective while raising the section plane to reveal the 80 µm palisade chlorenchyma columns, 90 µm spongy air labyrinth, and xylem/phloem bundle.',
      run: 1.0,
      play: 3.0,
      cam: { target: [-0.05, 0.95, 0.15], az: -26, el: 28, dist: 9.6, fov: 26 },
      lit: 'leaf',
      look: { cutY: 2.35 },
    },
    {
      label: 'Open stoma (w = 2 → 12 µm) & measure CO₂ flux',
      fig: 'Guard cells open to 12 µm · J_CO₂ = 19.2 µmol/m²s',
      hint: 'Opening the guard-cell pore to w = 12 µm raises stomatal conductance to g_s = 0.16 mol/m²s, driving J_CO₂ = 19.2 µmol/m²s upward while the palisade layer absorbs 83.5% of PAR light.',
      run: 1.0,
      play: 2.8,
      cam: { target: [-0.05, 0.95, 0.15], az: -18, el: 24, dist: 9.4, fov: 26 },
      lit: 'flux',
      look: { cutY: 2.35 },
    },
  ],

  chips: [
    { label: 'Leaf thickness', from: 1, value: s => `${s.totalThickUm} µm` },
    { label: 'Palisade PAR capture', from: 2, value: s => `${s.absorbedPct.toFixed(1)}%` },
    { label: 'Stomatal pore w', from: 3, value: s => `${s.apertureUm.toFixed(1)} µm` },
    { label: 'CO₂ assimilation J', from: 3, value: s => `${s.flux.toFixed(1)} µmol/m²s` },
  ],

  PLATES: {
    leaf: {
      text: 'Extruding the 2D histological slide into a 3D tissue block separates vertical photon harvesting in the upper palisade columns from 3D gas diffusion in the lower spongy air labyrinth.',
      facts: s => [
        ['Total leaf thickness', `${s.totalThickUm} µm`],
        ['Palisade PAR capture', `${s.absorbedPct.toFixed(1)}%`],
      ],
    },
    flux: {
      text: 'Guard-cell turgor opens the stomatal pore from w = 2 µm to 12 µm, increasing stomatal conductance g_s and driving Fickian CO₂ assimilation J = g_s(C_a − C_i).',
      facts: s => [
        ['Stomatal pore w', `${s.apertureUm.toFixed(1)} µm`],
        ['Conductance g_s', `${s.gs.toFixed(3)} mol/m²s`],
        ['Net CO₂ flux J', `${s.flux.toFixed(1)} µmol/m²s`],
      ],
    },
  },

  readout: s =>
    `leaf = ${s.totalThickUm} µm · PAR = ${s.absorbedPct.toFixed(1)}%\nw = ${s.apertureUm.toFixed(1)} µm · J = ${s.flux.toFixed(1)} µmol/m²s`,

  state: clock => M.at(clock),
  buildWorld,
};
