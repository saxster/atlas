// Ch 10 pure model: Circle sector comb rearrangement A = pi*r^2, doubled trapezium, and Cavalieri hemisphere.
export function circleSectorComb(r = 1.2, sectors = 24) {
  const circumference = 2 * Math.PI * r;
  const halfCirc = Math.PI * r;
  const exactArea = Math.PI * r * r;
  const dTheta = (2 * Math.PI) / sectors;
  const combBase = (sectors / 2) * (2 * r * Math.sin(dTheta / 2));
  const combHeight = r * Math.cos(dTheta / 2);
  return { r, sectors, circumference, halfCirc, exactArea, combBase, combHeight };
}

export function trapeziumDouble(a = 1.2, b = 2.2, h = 1.0) {
  const paraBase = a + b;
  const paraArea = paraBase * h;
  const trapArea = 0.5 * paraArea;
  return { a, b, h, paraBase, paraArea, trapArea };
}

export function hemisphereVolume(r = 1.2) {
  return (2 / 3) * Math.PI * Math.pow(r, 3);
}
