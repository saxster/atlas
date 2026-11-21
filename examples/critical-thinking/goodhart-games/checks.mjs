import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Goodhart divergence: high quota pressure + low audit inflates proxy accounts while trust drops
{
  const low = M.goodhartDivergence({ quotaPressure: 0.20, auditStrength: 0.80 });
  const high = M.goodhartDivergence({ quotaPressure: 0.85, auditStrength: 0.10 });
  C.check('high quota pressure + weak audit breaks Goodhart metric (proxy surges, trust drops)',
    high.proxyAccountsPerCustomer > low.proxyAccountsPerCustomer + 2.0 &&
    high.genuineCustomerTrust < low.genuineCustomerTrust - 0.35 &&
    high.goodhartBroken === true &&
    low.goodhartBroken === false);
}

// 2. Strategic game distinctions: Prisoner's Dilemma has dominant Defect; Assurance has two equilibria (C,C) and (D,D)
{
  const pd = M.gameMatrix(0);
  const ass = M.gameMatrix(1);
  C.check('Prisoner’s Dilemma yields single mutual-defect equilibrium while Assurance yields two equilibria',
    pd.equilibria.length === 1 &&
    ass.equilibria.length === 2 &&
    pd.payoffs[0][0][0] === 4 &&
    ass.payoffs[0][0][0] === 5);
}

// 3. Snapshot evolves smoothly across DURATION
{
  const e = M.run({ quotaPressure: 0.80, auditStrength: 0.15, gameKind: 0 });
  const s0 = M.snapshot(e, 0);
  const s1 = M.snapshot(e, M.DURATION);
  C.check('snapshot tracks diverging proxy metric vs declining genuine customer trust across run',
    near(s0.accountsVis, 2.0, 1e-12) &&
    near(s0.trustVis, 1.0, 1e-12) &&
    s1.accountsVis > s0.accountsVis + 1.5 &&
    s1.trustVis < s0.trustVis - 0.2);
}

C.report();
