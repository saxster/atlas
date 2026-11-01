// Chapter 9 pure model: driven Lorentzian resonance (Barton's pendulums), aeroelastic flutter growth, and longitudinal acoustic pressure/displacement phase.
export function drivenResonanceAmplitude(driveFreqHz = 1.5, natFreqHz = 1.5, dampingGamma = 0.22) {
  const df2 = driveFreqHz * driveFreqHz - natFreqHz * natFreqHz;
  const denom = Math.sqrt(df2 * df2 + Math.pow(2 * dampingGamma * driveFreqHz, 2));
  const amp = 1.0 / Math.max(0.05, denom);
  const phaseLagDeg = (Math.atan2(2 * dampingGamma * driveFreqHz, natFreqHz * natFreqHz - driveFreqHz * driveFreqHz) * 180) / Math.PI;
  return { amp, phaseLagDeg };
}

export function flutterGainRate(windSpeedMps = 19, criticalFlutterMps = 15) {
  const netGrowthPerSec = (windSpeedMps - criticalFlutterMps) * 0.08;
  return { netGrowthPerSec, unstable: windSpeedMps > criticalFlutterMps };
}

export function soundWaveRelation(freqHz = 343, soundSpeedMps = 343) {
  const wavelengthM = soundSpeedMps / Math.max(20, freqHz);
  const periodMs = (1000 / Math.max(20, freqHz));
  // Pressure crest lags displacement by 90 degrees (quarter wavelength)
  return { wavelengthM, periodMs, quarterWaveM: wavelengthM / 4 };
}
