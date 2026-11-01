// Chapter 2 pure model: Morse covalent potential energy well, NaCl lattice & Born-Haber ledger,
// diamond vs graphite coordination, and electronegativity / molecular dipole moments.

export function morseBondPotential(rPm = 74, DeKj = 436, r0Pm = 74, aInvPm = 0.0193) {
  const r = Math.max(40, Math.min(240, rPm));
  const expTerm = Math.exp(-aInvPm * (r - r0Pm));
  // Shifted so separated atoms (r -> infinity) have V = 0, minimum at r = r0 has V = -DeKj
  const energyKj = DeKj * (Math.pow(1 - expTerm, 2) - 1);
  const regime =
    r < r0Pm - 8 ? 'Short-range nuclear/core repulsion' :
    Math.abs(r - r0Pm) <= 8 ? 'Potential minimum (equilibrium bond length)' :
    r < 170 ? 'Net electrostatic attraction' :
    'Nearly separated atoms';
  return { rPm: r, r0Pm, energyKj, DeKj, regime };
}

export function naclBornHaber(step = 3) {
  const s = Math.max(0, Math.min(3, Math.round(step)));
  // 0: Na(s) + 1/2 Cl2(g) -> 0 kJ/mol
  // 1: Atomization + Ionization of Na -> +496 kJ/mol
  // 2: Electron affinity of Cl -> +147 kJ/mol
  // 3: Lattice formation of NaCl(s) -> -640 kJ/mol (lattice enthalpy -787 kJ/mol)
  const levels = [0, 496, 147, -640];
  const labels = [
    'Separated elements',
    'Electron removed from Na (+496 kJ/mol)',
    'Electron captured by Cl (−349 kJ/mol)',
    '3D NaCl lattice assembled (−787 kJ/mol)',
  ];
  return { step: s, levelKj: levels[s], label: labels[s], coordination: 6 };
}

export function bondPolarityState(deltaEn = 1.24, geometry = 'bent') {
  const dEn = Math.max(0, Math.min(3.2, deltaEn));
  const bondClassification =
    dEn < 0.4 ? 'Non-polar covalent' :
    dEn < 1.8 ? 'Polar covalent' :
    'Ionic character dominant';
  // Symmetry cancellation: linear CO2 or tetrahedral CCl4 cancels equal bond dipoles
  const cancelsBySymmetry = geometry === 'linear-sym' || geometry === 'tetra-sym';
  const netDipoleDebye = cancelsBySymmetry ? 0 : +(dEn * 1.48).toFixed(2);
  return { deltaEn: dEn, geometry, bondClassification, cancelsBySymmetry, netDipoleDebye };
}
