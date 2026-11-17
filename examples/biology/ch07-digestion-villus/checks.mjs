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
check('Splitting lipid radius 5x yields 125 droplets and exactly 5x surface area', em5.dropletCount === 125 && em5.areaMultiplier === 5 && em1.areaMultiplier === 1);
// the same fat, counted a second way: droplets x one droplet's volume and area against the one drop's
const vol = r => 4 / 3 * Math.PI * r ** 3, area = r => 4 * Math.PI * r ** 2;
check('Volume is conserved and total area is n x 4 pi r^2 over 4 pi R0^2', Math.abs(em5.dropletCount * vol(em5.dropletRadiusUm) / vol(120) - 1) < 1e-12 && Math.abs(em5.dropletCount * area(em5.dropletRadiusUm) / area(120) - em5.areaMultiplier) < 1e-12);
const vil = M.villusAbsorptionFlux(20, 250);
check('Microvilli brush border multiplies both hepatic portal glucose and lacteal lipid uptake', vil.glucosePortalFlux === 36 && vil.lipidLactealFlux === 13);
const muc = M.mucosalSurfaceAmplification(0.33, 3, 4.5, 6.7);
check('Helander & Fandriks (2014) BNID 111560: gut mucosal area ~32 m^2 (~30 m^2 small intestine + ~2 m^2 colon)', muc.smallIntestineM2 > 29 && muc.smallIntestineM2 < 31 && muc.totalMucosalM2 > 31 && muc.totalMucosalM2 < 33);
const realEnz = M.regionalEnzymeRates(1.8, false);
const buggyEnz = M.regionalEnzymeRates(1.8, true);
const emBuggy = M.bileEmulsificationAccount(5, 120, true);
check('Buggy-world counterfactual flattens regional pH specificity and suppresses bile emulsification', realEnz.amylase < 5 && buggyEnz.amylase === 85 && emBuggy.areaMultiplier === 1);

process.exit(bad ? 1 : 0);
