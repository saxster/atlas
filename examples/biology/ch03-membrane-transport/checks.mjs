import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const f0 = M.fickRelaxation(0, 0.4, 200);
const fInf = M.fickRelaxation(40, 0.4, 200);
check('Fick relaxation starts at 100% left and approaches 50/50 dynamic equilibrium', f0.nLeft === 200 && Math.abs(fInf.fracLeft - 0.5) < 1e-6);
const wpHypo = M.waterPotentialAccount(0.02, 0.4);
const wpHyper = M.waterPotentialAccount(0.45, 0.0);
check('Hypotonic external solution yields turgid plant cell and lysed RBC', wpHypo.plantState.startsWith('Turgid') && wpHypo.rbcState.startsWith('Lysed'));
check('Hypertonic external solution yields plasmolysed plant cell and crenated RBC', wpHyper.plantState.startsWith('Plasmolysed') && wpHyper.rbcState.startsWith('Crenated'));
const pump0 = M.activePumpFlux(0, 0.5, 10);
const pump5 = M.activePumpFlux(5, 0.5, 10);
check('Active transport ceases at 0 mM ATP and saturates above Km', pump0.vPump === 0 && !pump0.uphillPossible && pump5.vPump > 90 && pump5.uphillPossible);
const aqp = M.aquaporinSingleFileThroughput(2e5, 3e9, false);
check('Agre Aquaporin-1 BNID 103018 passes ~3e9 H2O/s per channel', aqp.ratePerChannel === 3e9 && Math.abs(aqp.cellMoleculesPerSec - 6e14) < 1e6);
const realWp = M.waterPotentialAccount(0.35, 0.1, 298, false);
const buggyWp = M.waterPotentialAccount(0.35, 0.1, 298, true);
const buggyPump = M.activePumpFlux(0, 0.5, 10, true);
check('Buggy-world counterfactual inverts osmotic water drive and allows ATP-free pumping myth', realWp.netPsiDrive < 0 && buggyWp.netPsiDrive > 0 && buggyPump.uphillPossible === true);

process.exit(bad ? 1 : 0);
