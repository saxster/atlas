import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. At $28B claimed AUM and $57k/contract, Madoff would need ~491,228 contracts (> 2.04x entire global CBOE OEX open interest of 240,000!)
{
  const c = M.optionCapacityCheck({ claimedAUMBillions: 28, cboeOexOpenInterestContracts: 240000, contractNotionalUSD: 57000 });
  C.check('$28B claimed AUM requires > 200% of total global OEX option open interest (impossible market ceiling)',
    near(c.requiredContracts, 28e9 / 57000, 1e-6) &&
    c.shareOfWorldMarket > 2.0 &&
    c.impossible === true);
}

// 2. Small $5B fund stays below global OEX ceiling (~36.5% market share), illustrating why scaling reveals impossibility
{
  const small = M.optionCapacityCheck({ claimedAUMBillions: 5 });
  const huge = M.optionCapacityCheck({ claimedAUMBillions: 65 });
  C.check('small $5B sits below global OEX ceiling whereas $65B exceeds world market by > 4.7x',
    small.impossible === false &&
    huge.impossible === true &&
    huge.shareOfWorldMarket > 4.5);
}

// 3. Snapshot scales claimed AUM cleanly from $1B to target across DURATION
{
  const e = M.run({ claimedAUMBillions: 35 });
  const s0 = M.snapshot(e, 0);
  const s1 = M.snapshot(e, M.DURATION);
  C.check('snapshot scales AUM from $1B to $35B across run and crosses exchange ceiling',
    near(s0.aumVis, 1, 1e-12) &&
    near(s1.aumVis, 35, 1e-12) &&
    s0.impossible === false &&
    s1.impossible === true);
}

C.report();
