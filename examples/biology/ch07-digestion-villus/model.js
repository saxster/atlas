// Chapter 7 pure model: regional pH enzyme profiles, bile emulsification surface area gain, peristalsis, and villus absorption routing.
export function regionalEnzymeRates(ph = 1.8) {
  const gauss = (center, width) => Math.exp(-Math.pow((ph - center) / width, 2)) * 100;
  const amylase = gauss(6.8, 1.1);
  const pepsin = gauss(1.8, 0.95);
  const trypsinLipase = gauss(8.0, 1.15);
  return { ph, amylase, pepsin, trypsinLipase };
}

export function bileEmulsificationAccount(splitFactor = 4, r0Um = 120) {
  const k = Math.max(1, Math.min(10, Math.round(splitFactor)));
  const dropletRadiusUm = r0Um / k;
  const dropletCount = k * k * k;
  const areaMultiplier = k; // total volume constant => total area scales as R0 / r = k
  return { splitFactor: k, dropletRadiusUm, dropletCount, areaMultiplier };
}

export function villusAbsorptionFlux(microvilliFold = 20, portalFlowMlMin = 250) {
  const brushBorderGain = Math.max(1, microvilliFold);
  const glucosePortalFlux = 1.8 * brushBorderGain * (portalFlowMlMin / 250);
  const lipidLactealFlux = 0.65 * brushBorderGain;
  return { brushBorderGain, glucosePortalFlux, lipidLactealFlux };
}
