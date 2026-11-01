// Chapter 9 pure model: Period 2/3 effective nuclear charge Zeff = Z - sigma,
// atomic radius & first ionization energy trends, and photon emission wavelength.
const PERIOD2 = [
  { z: 3,  sym: 'Li', sigma: 1.70, radiusPm: 152, ie1Kj: 520,  ie2Kj: 7298 },
  { z: 4,  sym: 'Be', sigma: 2.05, radiusPm: 112, ie1Kj: 899,  ie2Kj: 1757 },
  { z: 5,  sym: 'B',  sigma: 2.40, radiusPm: 85,  ie1Kj: 801,  ie2Kj: 2427 },
  { z: 6,  sym: 'C',  sigma: 2.75, radiusPm: 77,  ie1Kj: 1086, ie2Kj: 2353 },
  { z: 7,  sym: 'N',  sigma: 3.10, radiusPm: 70,  ie1Kj: 1402, ie2Kj: 2856 },
  { z: 8,  sym: 'O',  sigma: 3.45, radiusPm: 66,  ie1Kj: 1314, ie2Kj: 3388 },
  { z: 9,  sym: 'F',  sigma: 3.80, radiusPm: 64,  ie1Kj: 1681, ie2Kj: 3374 },
  { z: 10, sym: 'Ne', sigma: 4.15, radiusPm: 58,  ie1Kj: 2081, ie2Kj: 3952 },
];

export function period2TrendState(atomicNumberZ = 6) {
  const z = Math.max(3, Math.min(10, Math.round(atomicNumberZ)));
  const el = PERIOD2.find(x => x.z === z) || PERIOD2[3];
  const zEff = +(el.z - el.sigma).toFixed(2);
  const coreElectrons = 2;
  const valenceElectrons = el.z - 2;
  return { ...el, zEff, coreElectrons, valenceElectrons };
}

export function hydrogenLineSpectrum(nUpper = 3, nLower = 2) {
  const n2 = Math.max(2, Math.min(6, Math.round(nUpper)));
  const n1 = Math.max(1, Math.min(n2 - 1, Math.round(nLower)));
  // Rydberg formula: Delta E (eV) = 13.6 * (1/n1^2 - 1/n2^2)
  const deltaEeV = 13.6 * (1 / (n1 * n1) - 1 / (n2 * n2));
  const wavelengthNm = 1239.84 / deltaEeV;
  const band =
    wavelengthNm < 380 ? 'Ultraviolet (Lyman series)' :
    wavelengthNm <= 700 ? 'Visible (Balmer series)' :
    'Infrared (Paschen+ series)';
  return { nUpper: n2, nLower: n1, deltaEeV, wavelengthNm, band };
}
