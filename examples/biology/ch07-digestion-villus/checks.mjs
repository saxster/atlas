import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const rStom = M.regionalEnzymeRates(1.8);
const rMouth = M.regionalEnzymeRates(6.8);
const rDuod = M.regionalEnzymeRates(8.0);
check('Pepsin peaks at gastric pH 1.8 while amylase and lipase are inactivated', rStom.pepsin > 99 && rStom.amylase < 1 && rStom.trypsinLipase < 1);
check('Salivary amylase peaks at pH 6.8 and pancreatic trypsin/lipase peak at pH 8.0', rMouth.amylase > 99 && rDuod.trypsinLipase > 99);
const em1 = M.bileEmulsificationAccount(1, 120);
const em5 = M.bileEmulsificationAccount(5, 120);
check('Splitting lipid radius 5x yields 125 droplets and exactly 5x surface area & lipase rate', em5.dropletCount === 125 && em5.areaMultiplier === 5 && em5.lipaseRelativeRate === 5 * em1.lipaseRelativeRate);
const vil = M.villusAbsorptionFlux(20, 250);
check('Microvilli brush border multiplies both hepatic portal glucose and lacteal lipid uptake', vil.glucosePortalFlux === 36 && vil.lipidLactealFlux === 13);

process.exit(bad ? 1 : 0);
