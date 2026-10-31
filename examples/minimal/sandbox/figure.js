// Sculpt the field: a minimal sandbox figure. Place +q or −q charges, drag them in 3D, or pick a preset.
import { buildWorld } from './world.js';
import * as M from './model.js';

export const FIGURE = {
  no: 4, title: 'Sculpt the electric field', question: 'What happens to the field when you place and drag your own charges?',
  bigIdea: 'every charge adds its own inverse-square arrow at every point in space. Dragging a charge bends the whole field at once by vector superposition.',
  PAGES: [{ cam: { target: [0, 0, 0], az: 0, el: 6, dist: 10.2 }, lit: 'field', fig: 'A 2D board of charges and their superposed electric field' }],
  narrowZoom: 1.15,
  params: { px: 0.0, py: 0.9 },
  initialItems: [
    { type: 'pos', q: 1, x: -1.2, y: 0.0 },
    { type: 'neg', q: -1, x: 1.2, y: 0.0 },
  ],
  presets: [
    { key: 'dipole', label: 'Dipole (+/−)', params: { px: 0.0, py: 0.9 }, items: [{ type: 'pos', q: 1, x: -1.2, y: 0 }, { type: 'neg', q: -1, x: 1.2, y: 0 }] },
    { key: 'like', label: 'Like pair (+/+)', params: { px: 0.0, py: 0.0 }, items: [{ type: 'pos', q: 1, x: -1.2, y: 0 }, { type: 'pos', q: 1, x: 1.2, y: 0 }] },
    { key: 'quad', label: 'Quadrupole', params: { px: 0.0, py: 0.6 }, items: [
      { type: 'pos', q: 1, x: -1.1, y: -0.8 }, { type: 'neg', q: -1, x: 1.1, y: -0.8 },
      { type: 'pos', q: 1, x: 1.1, y: 0.8 }, { type: 'neg', q: -1, x: -1.1, y: 0.8 },
    ] },
  ],
  palette: [
    { type: 'pos', label: 'Positive (+q)', make: i => ({ type: 'pos', q: 1, x: +(((i % 3) - 1) * 0.9).toFixed(2), y: +(0.6 * ((i % 2) ? 1 : -1)).toFixed(2) }) },
    { type: 'neg', label: 'Negative (−q)', make: i => ({ type: 'neg', q: -1, x: +(((i % 3) - 1) * 0.9).toFixed(2), y: +(0.6 * ((i % 2) ? -1 : 1)).toFixed(2) }) },
  ],
  itemLabel: (it, i) => `${it.q > 0 ? '+q' : '−q'} #${i + 1} (${it.x.toFixed(1)}, ${it.y.toFixed(1)})`,
  controls: [
    { key: 'px', label: 'Probe x', min: -2.5, max: 2.5, step: 0.1, fmt: v => v.toFixed(1) },
    { key: 'py', label: 'Probe y', min: -1.5, max: 1.5, step: 0.1, fmt: v => v.toFixed(1) },
  ],
  buildWorld: (E, p, items, hooks) => buildWorld(E, p, items, hooks),
  lookKeys: [],
  state: (clock, reduced, p, items) => {
    const eProbe = M.fieldAt(items, p.px, p.py);
    const vProbe = M.potentialAt(items, p.px, p.py);
    return { ...p, items, eProbe, eMag: Math.hypot(...eProbe), vProbe, netQ: M.netCharge(items), uPair: M.pairEnergy(items) };
  },
  readout: s => `probe (${s.px.toFixed(1)}, ${s.py.toFixed(1)})\n|E| ${s.eMag.toFixed(2)}   V ${s.vProbe.toFixed(2)}`,
  chips: [
    { label: 'Charges on board', value: s => `${s.items.length} (net ${s.netQ >= 0 ? '+' : ''}${s.netQ}q)` },
    { label: '|E| at probe', value: s => s.eMag.toFixed(2) },
    { label: 'Potential V at probe', value: s => s.vProbe.toFixed(2) },
    { label: 'Pair energy U', value: s => s.uPair.toFixed(2) },
  ],
  PLATES: {
    field: { text: 'Each red sphere (+q) pushes the test probe away; each blue sphere (−q) pulls it in. Drag any charge or the amber test probe directly on the board to feel how vector superposition reshapes the field.' },
  },
};
