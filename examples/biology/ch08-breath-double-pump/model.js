// Chapter 8 pure model: Boyle's law thoracic ventilation, four-chambered double-pump cardiac pressures, and antagonistic muscle lever kinematics.
export function thoracicBoyleAccount(phaseRad = 0, tidalL = 0.5, restingVolL = 2.5) {
  const volL = restingVolL + 0.5 * tidalL * (1 - Math.cos(phaseRad));
  const pAlveolarMmHg = 760 * ((restingVolL + 0.25 * tidalL) / volL) - 760;
  const inspiring = Math.sin(phaseRad) > 0;
  return { volL, pAlveolarMmHg, inspiring };
}

export function doublePumpAccount(heartRateBpm = 72, strokeVolMl = 70, vsdShuntPct = 0) {
  const coLPerMin = (heartRateBpm * strokeVolMl) / 1000;
  const sysPeakMmHg = 120;
  const pulmPeakMmHg = 25 + vsdShuntPct * 0.45;
  const systemicO2SatPct = Math.max(72, 98 - vsdShuntPct * 0.22);
  return { heartRateBpm, strokeVolMl, coLPerMin, sysPeakMmHg, pulmPeakMmHg, wallRatioLvToRv: 3.0, systemicO2SatPct };
}

export function bicepLeverAccount(elbowDeg = 90, handLoadN = 40, rInsertionCm = 4.0, rLoadCm = 32.0) {
  const thRad = (elbowDeg * Math.PI) / 180;
  const mechanicalAdvantage = rInsertionCm / rLoadCm; // ~0.125 (speed lever)
  const bicepTensionN = (handLoadN * Math.sin(thRad)) / mechanicalAdvantage;
  return { elbowDeg, handLoadN, mechanicalAdvantage, bicepTensionN };
}
