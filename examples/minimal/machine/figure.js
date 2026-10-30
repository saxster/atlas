// Half-lives as a machine: four steps, to 1, 2, 3 and 5 half-lives.
import { buildWorld } from './world.js';
import * as M from './model.js';

const view = { target: [0, 0.9, -0.5], az: -12, el: 22, dist: 14.5 };
const exp = k => +M.expected(k).toFixed(2);
const step = (k, run, lit, hint) => ({ label: k === 1 ? 'One half-life' : `${k} half-lives`, fig: `After ${k === 1 ? 'one half-life' : `${k} half-lives`}`,
  run, play: 2.5 + run, real: run * M.HALF_LIFE_S, cam: view, lit, hint: `${hint} Expect ${exp(k)}, give or take ${M.sigma(k).toFixed(1)}.` });

export const FIGURE = {
  no: 2, title: 'Half-lives', question: 'How many nuclei are left after each half-life?',
  bigIdea: `each nucleus decays at random, but in every half-life about half of those left go. After k half-lives about N/2ᵏ remain: ${M.N} → ${exp(1)} → ${exp(2)} → ${exp(3)} … → ${exp(5)}.`,
  intro: { cam: view, lit: 'nuclei', fig: `${M.N} radioactive nuclei` },
  lookKeys: [],
  STEPS: [
    step(1, 1, 'nuclei', 'Each nucleus had an even chance of decaying.'),
    step(2, 1, 'graph', 'Half of those left went.'),
    step(3, 1, 'graph', 'Half again.'),
    step(5, 2, 'graph', 'Two more half-lives leave a quarter of what was there.'),
  ],
  buildWorld(E) { const W = buildWorld(E); return { update: s => W.update(s), labels: W.labels }; },
  state: clock => M.at(clock),
  readout: s => `${s.k.toFixed(2)} half-lives\n${s.left} of ${M.N} left`,
  chips: [
    { label: 'Half-lives', from: 1, value: s => s.k.toFixed(1) },
    { label: 'Nuclei left', from: 1, value: s => String(s.left) },
    { label: 'Expected N/2ᵏ', from: 1, value: s => s.expected.toFixed(1) },
  ],
  PLATES: {
    nuclei: { text: `Each nucleus has the same chance of decaying in any half-life, ½, however long it has already lasted. Which ones go is chance; how many go is close to half, every time. This run uses a fixed seed (${M.SEED}), so it decays the same nuclei on every visit.` },
    graph: { text: 'Ink is N/2ᵏ, what the halving rule expects. Red is what this run counted. The red steps scatter about the ink but never stray far: a few nuclei more or less than half each time.' },
  },
};
