// Figure E.3 as a machine: five steps from solo opportunity costs on Island A and Highland B,
// through self-sufficient Autarky (55C, 80G), to specialization at the World PPF kink (60C, 100G) and mutually beneficial trade.
import { buildWorld } from './world.js';
import * as M from './model.js';

const whole = { target: [-0.35, 1.12, 0], az: -8, el: 7, dist: 17.2 };
const closeA = { target: [-2.4, 1.12, 0], az: -8, el: 7, dist: 13.8 };
const closeB = { target: [-0.1, 1.12, 0], az: -8, el: 7, dist: 13.8 };
const closeW = { target: [2.2, 1.12, 0], az: -8, el: 7, dist: 14.2 };

export const FIGURE = {
  no: 'E.3',
  title: 'Why trade helps even when one side is better at everything',
  question: 'If one island is more productive at farming AND no worse at weaving, how can both islands end up richer by trading?',
  bigIdea: 'gains from trade come from comparative advantage (lower opportunity cost), not absolute advantage. Island A gives up 2 tons of grain per bale of cloth while Highland B gives up only 1 ton. When B weaves all 60 cloth and A grows all 100 grain, world output jumps by +5 cloth and +20 grain — and trading at 1.5 grain per cloth pushes both islands outside their own production frontiers.',
  intro: { cam: closeA, lit: 'islandA', fig: 'Island A’s Production Possibility Frontier', look: {} },
  lookKeys: [],
  frameAspect: 1.55,
  narrowZoom: 1.2,
  STEPS: [
    {
      label: 'Island A’s frontier: 1 cloth costs 2 grain',
      fig: 'Max 100 grain or 50 cloth (slope = −2)',
      run: 0, play: 2.8,
      hint: 'Island A can harvest 100 tons of grain or weave 50 bales of cloth. Every bale of cloth woven sacrifices 2 tons of grain (opportunity cost = 2 G/C).',
      cam: closeA, lit: 'islandA', look: {},
    },
    {
      label: 'Highland B’s frontier: 1 cloth costs only 1 grain',
      fig: 'Max 60 grain or 60 cloth (slope = −1)',
      run: 10, play: 2.8,
      hint: 'Highland B makes at most 60 grain or 60 cloth. Though B has no absolute advantage in either good, its opportunity cost of cloth is only 1 ton of grain (< 2 on A).',
      cam: closeB, lit: 'islandB', look: {},
    },
    {
      label: 'Going it alone (Autarky: 55 cloth + 80 grain)',
      fig: 'Splitting time 50/50 leaves the world inside its frontier',
      run: 10, play: 3.0,
      hint: 'Without trade, each island spends half its labour on each good: A makes (25C, 50G) and B makes (30C, 30G). World output (55C, 80G) sits well inside the joint World PPF.',
      cam: whole, lit: 'world', look: {},
    },
    {
      label: 'Specialization at the world kink (60 cloth + 100 grain)',
      fig: 'A grows 100G, B weaves 60C → +5 cloth & +20 grain free',
      run: 40, play: 3.5,
      hint: 'As Island A shifts 100% into grain (100G) and Highland B shifts 100% into cloth (60C), world output climbs to the kink of the joint PPF: +5 more cloth and +20 more grain with the exact same labour!',
      cam: closeW, lit: 'world', look: {},
    },
    {
      label: 'Trading 30 cloth for 45 grain (1.5 G per C)',
      fig: 'Both islands consume strictly outside their own PPFs',
      run: 40, play: 3.6,
      hint: 'Trading 30 cloth for 45 grain (1.5 G/C, between B’s cost 1.0 and A’s cost 2.0) leaves A with (30C, 55G) and B with (30C, 45G) — green points unreachable by either island alone.',
      cam: whole, lit: 'islandA', look: {},
    },
  ],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: s => W.update(s), labels: W.labels };
  },
  state: clock => {
    // clock ∈ [0, 20]: u = 0, v = 0 (autarky baseline)
    // clock ∈ [20, 60]: u ramps 0 → 1 (specialization toward the world kink)
    // clock ∈ [60, 100]: u = 1, v ramps 0 → 1 (trade along price = 1.5 G/C)
    const u = Math.max(0, Math.min(1, (clock - 20) / 40));
    const v = Math.max(0, Math.min(1, (clock - 60) / 40));
    return M.stateAt(u, v);
  },
  readout: s => `Island A: (${s.consA.C.toFixed(0)}C, ${s.consA.G.toFixed(0)}G) · Highland B: (${s.consB.C.toFixed(0)}C, ${s.consB.G.toFixed(0)}G)\nWorld total: ${s.world.C.toFixed(0)} cloth, ${s.world.G.toFixed(0)} grain`,
  chips: [
    { label: 'Opportunity cost of 1 cloth', from: 1, value: () => `A: 2.0 G · B: 1.0 G` },
    { label: 'Island A bundle (cloth, grain)', from: 1, value: s => `${s.consA.C.toFixed(0)} C, ${s.consA.G.toFixed(0)} G` },
    { label: 'Highland B bundle (cloth, grain)', from: 2, value: s => `${s.consB.C.toFixed(0)} C, ${s.consB.G.toFixed(0)} G` },
    { label: 'World total output', from: 3, value: s => `${s.world.C.toFixed(0)} C, ${s.world.G.toFixed(0)} G` },
    { label: 'Specialization surplus vs. autarky', from: 4, value: s => `+${(s.world.C - 55).toFixed(0)} C, +${(s.world.G - 80).toFixed(0)} G` },
    { label: 'Trade gain vs. autarky', from: 5, value: () => `A: +5C +5G · B: +0C +15G` },
  ],
  PLATES: {
    islandA: {
      text: 'David Ricardo (1817) showed that even if one economy is more productive at everything, it cannot have a lower opportunity cost in everything — because opportunity costs are reciprocals. Island A’s cost of cloth is 2 grain/cloth, so its cost of grain is 1/2 = 0.5 cloth/grain.',
      facts: s => [
        ['Island A max output', '50 cloth or 100 grain'],
        ['opportunity cost of cloth', '2.0 grain / bale'],
        ['A’s bundle now', `${s.consA.C.toFixed(0)} cloth, ${s.consA.G.toFixed(0)} grain`],
      ],
    },
    islandB: {
      text: 'Highland B sacrifices 1 ton of grain per bale of cloth (vs. 2 on A). Selling cloth for 1.5 tons of grain lets B earn 1.5 tons of grain for work that would only grow 1 ton at home.',
      facts: s => [
        ['Highland B max output', '60 cloth or 60 grain'],
        ['opportunity cost of cloth', '1.0 grain / bale'],
        ['B’s bundle now', `${s.consB.C.toFixed(0)} cloth, ${s.consB.G.toFixed(0)} grain`],
      ],
    },
    world: {
      text: 'Ordering producers from lowest to highest opportunity cost makes the joint World PPF bow outward with a kink at (60 cloth, 100 grain). Autarky (55 cloth, 80 grain) is inefficient because high-cost weavers on A are making cloth while lower-cost weavers on B are growing grain.',
      facts: s => [
        ['autarky world output', '55 cloth, 80 grain'],
        ['specialized kink output', '60 cloth, 100 grain'],
        ['current world output', `${s.world.C.toFixed(0)} cloth, ${s.world.G.toFixed(0)} grain`],
      ],
    },
  },
};
