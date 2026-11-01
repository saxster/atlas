// Chapter 8 pure model: Joule mechanical equivalent of heat, intensive T vs extensive Q, latent-heat plateaus, and matka evaporative cooling.
export const C_WATER_J_KG_K = 4184;
export const LF_ICE_J_KG = 334000;
export const LV_STEAM_J_KG = 2260000;

export function jouleCalorimeterRise(leadMassKg = 12, dropHeightM = 2.0, dropsCount = 20, waterMassKg = 1.5, g = 9.8) {
  const workJoules = 2 * leadMassKg * g * dropHeightM * dropsCount;
  const deltaTK = workJoules / (Math.max(0.1, waterMassKg) * C_WATER_J_KG_K);
  return { workJoules, deltaTK };
}

export function matkaEvaporativeCooling(initialTempC = 32, evapFraction = 0.015) {
  const f = Math.max(0, Math.min(0.08, evapFraction));
  // Latent heat extracted by evaporating fraction f cools remaining (1 - f) water:
  const deltaTC = (f * LV_STEAM_J_KG) / ((1 - f) * C_WATER_J_KG_K);
  const finalTempC = initialTempC - deltaTC;
  return { deltaTC, finalTempC };
}

export function waterPhaseState(addedHeatKjPerKg = 500) {
  // Starting from ice at -20 C (c_ice = 2.1 kJ/kg K)
  const q = Math.max(0, addedHeatKjPerKg);
  if (q < 42) return { phase: 'Solid ice warming', tempC: -20 + q / 2.1 };
  if (q < 42 + 334) return { phase: 'Melting plateau (0 °C ice + water)', tempC: 0 };
  if (q < 376 + 418.4) return { phase: 'Liquid water warming', tempC: (q - 376) / 4.184 };
  if (q < 794.4 + 2260) return { phase: 'Boiling plateau (100 °C water + steam)', tempC: 100 };
  return { phase: 'Superheated steam', tempC: 100 + (q - 3054.4) / 2.0 };
}
