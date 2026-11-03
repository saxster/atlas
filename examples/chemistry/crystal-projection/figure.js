// Figure description for 2D (001) Unit-Cell Plan -> 3D Rock-Salt (NaCl) Crystal & Bragg Diffraction.
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
  no: 4,
  title: 'From 2D unit-cell plan to 3D NaCl crystal',
  question: 'How does a flat 2D crystallographic (001) projection encode the 3D rock-salt lattice and its X-ray diffraction planes?',
  bigIdea:
    'a 2D (001) crystal projection is the basal section cut of the 3D unit cell. Raising the section plane from z = 0 through z = ½ to z = 1 extrudes the 4 Na⁺ and 4 Cl⁻ ions of rock-salt (a₀ = 5.64 Å, ρ = 2.165 g/cm³) and reveals the d₂₀₀ = 2.82 Å Bragg planes.',
  cuts: ['solid', 'xray', 'section'],
  xrayKeys: ['crystal'],
  cutKeys: ['crystal'],
  cutOpenY: 2.75,
  cutPlane: [0, -1, 0, 0.45],
  intro: {
    cam: viewPlan,
    lit: 'crystal',
    look: { cutY: 0.45 },
    fig: 'Overhead 3° (001) crystal plan · z = 0 basal section cut',
  },
  lookKeys: ['cutY'],

  STEPS: [
    {
      label: 'Read the 2D (001) basal plan (z = 0 cut)',
      fig: 'Overhead 3° crystallographic plan · a₀ = 5.64 Å',
      hint: 'Viewed from overhead with a 3° telephoto lens and sliced at z = 0, the 3D NaCl lattice reads as a flat 2D unit-cell plan of side a₀ = 5.64 Å with Cl⁻ corners/centre and Na⁺ edge-centres.',
      run: 1.0,
      play: 2.2,
      cam: viewPlan,
      lit: 'crystal',
      look: { cutY: 0.45 },
    },
    {
      label: 'Extrude z = 0, ½, 1 layers into 3D FCC lattice',
      fig: '3° → 28° dolly-zoom · full 3×3×3 NaCl unit cell (Z = 4)',
      hint: 'Log-FOV dolly-zoom lowers the camera into 3D perspective while raising the section plane to uncover the z = ½ and z = 1 layers (Z = 4 NaCl units per cell, ρ = 2.165 g/cm³).',
      run: 1.0,
      play: 3.0,
      cam: { target: [-0.05, 1.15, 0.1], az: -28, el: 28, dist: 8.6, fov: 28 },
      lit: 'crystal',
      look: { cutY: 2.85 },
    },
    {
      label: 'Measure (200) Bragg planes (2d sin θ = λ)',
      fig: '(200) half-cell planes · d₂₀₀ = 2.82 Å, θ = 15.87°',
      hint: 'Half-cell sheets at d₂₀₀ = a₀/2 = 2.82 Å reflect Cu Kα X-rays (λ = 1.542 Å) constructively at the Bragg angle θ = 15.87°.',
      run: 1.0,
      play: 2.8,
      cam: { target: [-0.05, 1.15, 0.1], az: -20, el: 22, dist: 8.4, fov: 28 },
      lit: 'bragg',
      look: { cutY: 2.85 },
    },
  ],

  chips: [
    { label: 'Lattice constant a₀', from: 1, value: s => `${s.a0.toFixed(2)} Å` },
    { label: 'Crystal density ρ', from: 2, value: s => `${s.density.toFixed(3)} g/cm³` },
    { label: '(200) spacing d₂₀₀', from: 3, value: s => `${s.d200.toFixed(2)} Å` },
    { label: 'Bragg angle θ₂₀₀', from: 3, value: s => `${s.thetaDeg.toFixed(2)}°` },
  ],

  PLATES: {
    crystal: {
      text: 'Rock-salt (NaCl) consists of two interpenetrating face-centered cubic (FCC) lattices offset by a₀/2 = 2.82 Å, giving Z = 4 formula units per unit cell.',
      facts: s => [
        ['Lattice constant a₀', `${s.a0.toFixed(2)} Å`],
        ['Unit cell volume a₀³', `${s.volA3.toFixed(2)} Å³`],
        ['Bulk density ρ', `${s.density.toFixed(3)} g/cm³`],
      ],
    },
    bragg: {
      text: 'Because adjacent (200) atomic layers lie half a unit cell apart (d₂₀₀ = a₀/2 = 2.82 Å), Cu Kα X-rays (λ = 1.542 Å) diffract constructively at θ = arcsin(λ / 2d₂₀₀) = 15.87°.',
      facts: s => [
        ['Interplanar spacing d₂₀₀', `${s.d200.toFixed(2)} Å`],
        ['Bragg angle θ₂₀₀', `${s.thetaDeg.toFixed(2)}°`],
      ],
    },
  },

  readout: s =>
    `a₀ = ${s.a0.toFixed(2)} Å · d₂₀₀ = ${s.d200.toFixed(2)} Å\nρ = ${s.density.toFixed(2)} g/cm³ · θ = ${s.thetaDeg.toFixed(1)}°`,

  state: clock => M.at(clock),
  buildWorld,
};
