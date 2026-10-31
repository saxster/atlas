// node examples/economics/ppf/checks.mjs — independent proofs of reciprocal opportunity costs, world PPF concavity & kink dominance, and mutual gains from trade across all terms of trade p ∈ (1, 2).
import { checks, near, deriv } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Opportunity costs are exact reciprocals and slopes of each island's PPF match −OPP_COST_CLOTH
{
  const slopeA = -deriv(M.ppfGrainA, 25);
  const slopeB = -deriv(M.ppfGrainB, 30);
  C.check('opportunity costs are reciprocals and match −dG/dC on each island’s PPF (A: 2 G/C, B: 1 G/C)',
    near(M.OPP_COST_CLOTH_A * M.OPP_COST_GRAIN_A, 1.0, 1e-12) &&
    near(M.OPP_COST_CLOTH_B * M.OPP_COST_GRAIN_B, 1.0, 1e-12) &&
    near(slopeA, M.OPP_COST_CLOTH_A, 1e-8) &&
    near(slopeB, M.OPP_COST_CLOTH_B, 1e-8) &&
    M.OPP_COST_CLOTH_B < M.OPP_COST_CLOTH_A &&
    M.OPP_COST_GRAIN_A < M.OPP_COST_GRAIN_B);
}

// 2. Specialization at the world PPF kink (60 cloth, 100 grain) strictly dominates summed autarky (55 cloth, 80 grain) by +5 cloth and +20 grain
{
  const aut = M.stateAt(0, 0);
  const spec = M.stateAt(1, 0);
  const kinkG = M.worldPpfGrain(60);
  C.check('specialization at world kink (60C, 100G) yields +5 cloth and +20 grain over autarky (55C, 80G)',
    near(aut.world.C, 55, 1e-12) && near(aut.world.G, 80, 1e-12) &&
    near(spec.world.C, 60, 1e-12) && near(spec.world.G, 100, 1e-12) &&
    near(kinkG, 100, 1e-12));
}

// 3. At terms of trade p = 1.5 G/C (30C for 45G), A consumes (30C, 55G) > (25C, 50G) and B consumes (30C, 45G) > (30C, 30G)
{
  const tr = M.stateAt(1, 1, 1.5);
  C.check('trade at 1.5 G/C gives A (30C, 55G) and B (30C, 45G), strictly beating autarky in both goods',
    near(tr.consA.C, 30, 1e-12) && near(tr.consA.G, 55, 1e-12) &&
    near(tr.consB.C, 30, 1e-12) && near(tr.consB.G, 45, 1e-12) &&
    near(tr.consA.C + tr.consB.C, tr.world.C, 1e-12) &&
    near(tr.consA.G + tr.consB.G, tr.world.G, 1e-12));
}

// 4. For EVERY terms-of-trade price p strictly between B's opportunity cost (1.0) and A's opportunity cost (2.0), both islands consume strictly outside their solo PPFs
for (const p of [1.1, 1.25, 1.5, 1.75, 1.9]) {
  const tr = M.stateAt(1, 1, p);
  const maxSoloGA = M.ppfGrainA(tr.consA.C); // 100 − 2·30 = 40
  const maxSoloGB = M.ppfGrainB(tr.consB.C); // 60 − 1·30 = 30
  C.check(`at terms-of-trade p = ${p} G/C, both A (${tr.consA.G}G > ${maxSoloGA}G) and B (${tr.consB.G}G > ${maxSoloGB}G) lie strictly outside their solo PPFs`,
    tr.consA.G > maxSoloGA + 1e-9 && tr.consB.G > maxSoloGB + 1e-9);
}

C.report();
