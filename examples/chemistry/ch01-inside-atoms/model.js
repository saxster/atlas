// Chapter 1 pure model: Rutherford Coulomb scattering angle, nucleon/ion accounting,
// isotope abundance weighted average, and shell occupancy / effective nuclear attraction.
const ELEMENTS = [
  null,
  { symbol: 'H', name: 'Hydrogen' },
  { symbol: 'He', name: 'Helium' },
  { symbol: 'Li', name: 'Lithium' },
  { symbol: 'Be', name: 'Beryllium' },
  { symbol: 'B', name: 'Boron' },
  { symbol: 'C', name: 'Carbon' },
  { symbol: 'N', name: 'Nitrogen' },
  { symbol: 'O', name: 'Oxygen' },
  { symbol: 'F', name: 'Fluorine' },
  { symbol: 'Ne', name: 'Neon' },
  { symbol: 'Na', name: 'Sodium' },
  { symbol: 'Mg', name: 'Magnesium' },
  { symbol: 'Al', name: 'Aluminium' },
  { symbol: 'Si', name: 'Silicon' },
  { symbol: 'P', name: 'Phosphorus' },
  { symbol: 'S', name: 'Sulfur' },
  { symbol: 'Cl', name: 'Chlorine' },
  { symbol: 'Ar', name: 'Argon' },
];

export function rutherfordScattering(impactParamFm = 15, alphaEnergyMeV = 5.0, targetZ = 79) {
  const b = Math.max(1, Math.min(200, impactParamFm));
  const E = Math.max(1, Math.min(20, alphaEnergyMeV));
  // Characteristic Coulomb length b0 = (Z_alpha * Z_target * e^2) / (4 pi eps0 * 2 E) = 1.44 * targetZ / E
  const b0 = (1.44 * targetZ) / E;
  // tan(theta / 2) = b0 / b
  const thetaRad = 2 * Math.atan2(b0, b);
  const thetaDeg = (thetaRad * 180) / Math.PI;
  const closestApproachFm = b0 * (1 + Math.sqrt(1 + (b / b0) * (b / b0)));
  const regime = thetaDeg > 90 ? 'Back-scattered (>90°)' : thetaDeg > 15 ? 'Deflected (15°–90°)' : 'Nearly straight (<15°)';
  return { impactParamFm: b, alphaEnergyMeV: E, thetaDeg, closestApproachFm, regime };
}

export function atomIdentity(protons = 6, neutrons = 6, electrons = 6) {
  const Z = Math.max(1, Math.min(18, Math.round(protons)));
  const N = Math.max(0, Math.min(22, Math.round(neutrons)));
  const e = Math.max(0, Math.min(20, Math.round(electrons)));
  const A = Z + N;
  const charge = Z - e;
  const el = ELEMENTS[Z] || { symbol: `Z${Z}`, name: `Element ${Z}` };
  // Shell occupancy up to n = 3 (2, 8, 8)
  const s1 = Math.min(2, e);
  const s2 = Math.min(8, Math.max(0, e - 2));
  const s3 = Math.max(0, e - 10);
  const chargeStr = charge === 0 ? '0' : charge > 0 ? `+${charge}` : `${charge}`;
  return { Z, N, e, A, charge, chargeStr, symbol: el.symbol, name: el.name, shells: [s1, s2, s3] };
}

export function chlorineIsotopeMix(frac35Pct = 75.76) {
  const p35 = Math.max(0, Math.min(100, frac35Pct)) / 100;
  const p37 = 1 - p35;
  const m35 = 34.9689;
  const m37 = 36.9659;
  const avgMass = p35 * m35 + p37 * m37;
  return { frac35Pct: p35 * 100, frac37Pct: p37 * 100, avgMass };
}
