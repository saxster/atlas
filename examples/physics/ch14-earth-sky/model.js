// Chapter 14 pure model: Earth diurnal rotation (15 deg/h), solar noon altitude & insolation from 23.4 deg axial tilt, and 5.14 deg lunar orbital node eclipse condition.
export function solarNoonAltitude(latitudeDeg = 19.07, axialTiltDeg = 23.44, orbitSeasonDeg = 90) {
  // orbitSeasonDeg = 90 is June solstice, 270 is December solstice, 0/180 is equinox
  const decDeg = axialTiltDeg * Math.sin((orbitSeasonDeg * Math.PI) / 180);
  const zenithAngleDeg = Math.abs(latitudeDeg - decDeg);
  const noonAltDeg = Math.max(0, 90 - zenithAngleDeg);
  const insolationFactor = Math.sin((noonAltDeg * Math.PI) / 180);
  return { decDeg, noonAltDeg, insolationFactor };
}

export function lunarEclipseAlignment(nodeOffsetDeg = 0, lunarInclinationDeg = 5.14, earthMoonDistRadii = 60) {
  const radInc = (lunarInclinationDeg * Math.PI) / 180;
  const radNode = (nodeOffsetDeg * Math.PI) / 180;
  const verticalMissEarthRadii = earthMoonDistRadii * Math.sin(radInc) * Math.sin(radNode);
  const eclipseOccurs = Math.abs(verticalMissEarthRadii) < 1.35; // Earth umbra + Moon radius threshold
  return { verticalMissEarthRadii, eclipseOccurs };
}
