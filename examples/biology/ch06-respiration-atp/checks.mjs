import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const fullO2 = M.aerobicRelayAccount(100, 60);
const zeroO2 = M.aerobicRelayAccount(0, 60);
check('With oxygen the oxygen-linked relay runs, at a rate set by activity only (0.5 + 60/200 = 0.8)', fullO2.chainActive && Math.abs(fullO2.animationRate - (0.5 + 60 / 200)) < 1e-12 && Math.abs(M.aerobicRelayAccount(30, 60).animationRate - fullO2.animationRate) < 1e-12);
check('Without oxygen the relay stalls (rate 0) while glycolysis still gives its 2 ATP', !zeroO2.chainActive && zeroO2.animationRate === 0 && zeroO2.glycolysisAtp === 2 && fullO2.glycolysisAtp === 2);
const wild = M.aerobicRelayAccount(250, 'x');
check('Controls are clamped to 0-100 and a non-number falls back to its default', wild.o2Pct === 100 && wild.demandLevel === 50 && M.aerobicRelayAccount(-5, 60).o2Pct === 0);
const rqYeast = M.respiratoryQuotientLedger('anaerobic_yeast', 1);
check('Yeast fermentation releases 2 CO2 and takes no O2, so its RQ is undefined (null), not infinite', rqYeast.o2In === 0 && rqYeast.co2Out === 2 && rqYeast.rq === null);
const rqGluc = M.respiratoryQuotientLedger('glucose', 1);
const rqFat = M.respiratoryQuotientLedger('palmitate', 1);
check('Respiratory quotient RQ = CO2/O2 is 1.00 for glucose and ~0.70 for fatty acid', rqGluc.rq === 1.0 && Math.abs(rqFat.rq - 16 / 23) < 1e-9);
const fat10 = M.fatOxidationMassLedger(10);
check('Meerman & Brown (2014): 10 kg fat + ~29.02 kg O2 === ~28.14 kg CO2 + ~10.88 kg H2O (~84.2% fat mass exhaled)', Math.abs((fat10.fatKg + fat10.o2InKg) - (fat10.co2OutKg + fat10.h2oOutKg)) < 1e-9 && Math.abs(fat10.fatMassToCo2Frac - 724 / 860) < 1e-9);
const realRel = M.aerobicRelayAccount(0, 60, false);
const buggyRel = M.aerobicRelayAccount(0, 60, true);
check('Buggy-world counterfactual keeps mitochondrial relay active at 0% O2', realRel.chainActive === false && realRel.animationRate === 0 && buggyRel.chainActive === true && buggyRel.animationRate > 0.5);

process.exit(bad ? 1 : 0);
