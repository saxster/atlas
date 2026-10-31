// Fig. M.1: The 2×2 Matrix Sandbox. Type any 2×2 matrix, drag Aî and Aĵ in 3D, or drop probe vectors onto the grid.
import { buildWorld } from './world.js';
import * as M from './model.js';

const fmt = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);

export const FIGURE = {
  no: 'M.1',
  title: 'The 2×2 matrix sandbox',
  question: 'What happens to the grid, area, and eigenvectors when you sculpt your own 2×2 matrix?',
  bigIdea: 'the first column (a, c) is where î lands; the second column (b, d) is where ĵ lands. Their parallelogram has signed area det(A) = ad − bc, and any line that maps onto itself is an eigenvector axis.',
  PAGES: [{ cam: { target: [0, 0, 0], az: 0, el: 4, dist: 10.6 }, lit: 'sandbox', fig: 'Interactive 2×2 matrix grid, parallelogram and eigenvectors' }],
  narrowZoom: 1.15,
  params: { a: 1.5, b: 0.5, c: 0.5, d: 1.25 },
  matrix: {
    title: 'Matrix A = [[a, b], [c, d]]',
    keys: ['a', 'b', 'c', 'd'],
    labels: ['a', 'b', 'c', 'd'],
    step: 0.05,
  },
  initialItems: [
    { type: 'probe', x: 1.2, y: 1.2 },
  ],
  presets: [
    { key: 'stretch', label: 'Symmetric stretch', params: { a: 1.5, b: 0.5, c: 0.5, d: 1.25 } },
    { key: 'shear', label: 'Horizontal shear', params: { a: 1.0, b: 1.2, c: 0.0, d: 1.0 } },
    { key: 'rot90', label: '90° Rotation', params: { a: 0.0, b: -1.0, c: 1.0, d: 0.0 } },
    { key: 'reflect', label: 'Reflection (det < 0)', params: { a: 0.0, b: 1.0, c: 1.0, d: 0.0 } },
    { key: 'singular', label: 'Singular (det = 0)', params: { a: 1.2, b: 0.6, c: 0.8, d: 0.4 } },
  ],
  palette: [
    { type: 'probe', label: 'Probe vector u', make: i => ({ type: 'probe', x: +(0.8 * ((i % 2) ? -1 : 1)).toFixed(2), y: +(0.6 + 0.3 * (i % 3)).toFixed(2) }) },
  ],
  itemLabel: (it, i) => `u_${i + 1} = (${fmt(it.x, 1)}, ${fmt(it.y, 1)}) → A u_${i + 1}`,
  controls: [
    { key: 'a', label: 'a (Aî_x)', min: -2.0, max: 2.0, step: 0.05, fmt: v => fmt(v) },
    { key: 'b', label: 'b (Aĵ_x)', min: -2.0, max: 2.0, step: 0.05, fmt: v => fmt(v) },
    { key: 'c', label: 'c (Aî_y)', min: -2.0, max: 2.0, step: 0.05, fmt: v => fmt(v) },
    { key: 'd', label: 'd (Aĵ_y)', min: -2.0, max: 2.0, step: 0.05, fmt: v => fmt(v) },
  ],
  buildWorld: (E, p, items, hooks) => buildWorld(E, p, items, hooks),
  lookKeys: [],
  state: (clock, reduced, p, items) => {
    const det = M.det(p), tr = M.trace(p), eig = M.eigenInfo(p);
    return { ...p, items, det, tr, eig };
  },
  readout: s => `A = [[${fmt(s.a)}, ${fmt(s.b)}], [${fmt(s.c)}, ${fmt(s.d)}]]\ndet(A) = ${fmt(s.det, 3)}   trace(A) = ${fmt(s.tr, 2)}`,
  chips: [
    { label: 'Determinant ad − bc', value: s => `${fmt(s.det, 3)} (${Math.abs(s.det) < 1e-3 ? 'collapsed' : s.det < 0 ? 'flipped' : 'oriented'})` },
    { label: 'Trace a + d', value: s => fmt(s.tr, 2) },
    { label: 'Eigenvalues λ₁, λ₂', value: s => s.eig.real ? `${fmt(s.eig.l1, 2)}, ${fmt(s.eig.l2, 2)}` : `${fmt(s.eig.l1, 2)} ± ${fmt(s.eig.im, 2)}i` },
    { label: 'Probe vectors', value: s => `${s.items.length} active` },
  ],
  PLATES: {
    sandbox: {
      text: 'Grab the red tip of Aî or the blue tip of Aĵ directly on the 3D board, or type numbers into the 2×2 matrix bracket. Green lines show real eigenvector axes (where Av stays parallel to v); when you pick a rotation, the green lines vanish because the eigenvalues become complex.',
    },
  },
};
