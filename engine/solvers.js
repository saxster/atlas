// Subject-free, pure mathematical solvers for model.js and checks.mjs (zero DOM, zero three.js imports):
//   - solveNetwork: G_min-regularized linear conservation-network solver (MNA / hydraulic / thermal / flow graphs)
//   - quantileSeeds: inverse-CDF 1D / radial equal-flux seed placement over non-negative weight functions
//   - traceAxisymmetricRays: 3D conic/aspheric/toric surface ray intersection + vector Snell refraction along +X

// Partial-pivoting Gaussian elimination on dense N x N linear system A * x = b.
export function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col, maxAbs = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r][col]);
      if (v > maxAbs) { maxAbs = v; piv = r; }
    }
    if (maxAbs < 1e-15) throw new Error(`solveLinear: singular matrix at column ${col}`);
    if (piv !== col) { const tmp = M[col]; M[col] = M[piv]; M[piv] = tmp; }
    const diag = M[col][col];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / diag;
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

// Solves a conserved potential/flow network with reference node 0 (V[0] = 0) and nodes 1..nodeCount.
// Supported branch specs (flow convention: positive flow moves from `from` -> `to`):
//   - { type: 'conductance' | 'R', from, to, G?, R? }                 -> flow = G * (V[from] - V[to])
//   - { type: 'flow' | 'I', from, to, flow?, I? }                     -> fixed flow from `from` to `to`
//   - { type: 'source' | 'V', from, to, diff?, V?, Rint = 0 }         -> enforces V[from] - V[to] - Rint * flow = diff
//   - { type: 'storage' | 'C', from, to, cap, prevDiff = 0, dt = 1 }  -> Backward-Euler companion: flow = (cap/dt) * ((V[from]-V[to]) - prevDiff)
export function solveNetwork(nodeCount, branches, { gmin = 1e-9 } = {}) {
  if (!Number.isInteger(nodeCount) || nodeCount < 1) throw new Error('solveNetwork: nodeCount must be >= 1');
  const srcList = [];
  branches.forEach((br, idx) => {
    const t = br.type || (br.V !== undefined || br.diff !== undefined ? 'source' : br.I !== undefined || br.flow !== undefined ? 'flow' : 'conductance');
    if (t === 'source' || t === 'V') srcList.push({ br, idx });
  });

  const m = srcList.length;
  const dim = nodeCount + m;
  const A = Array.from({ length: dim }, () => new Array(dim).fill(0));
  const rhs = new Float64Array(dim);

  // Diagonal G_min regularization keeps floating subgraphs well-conditioned
  for (let i = 0; i < nodeCount; i++) A[i][i] = gmin;

  const stampG = (n1, n2, g) => {
    if (n1 > 0) A[n1 - 1][n1 - 1] += g;
    if (n2 > 0) A[n2 - 1][n2 - 1] += g;
    if (n1 > 0 && n2 > 0) {
      A[n1 - 1][n2 - 1] -= g;
      A[n2 - 1][n1 - 1] -= g;
    }
  };
  const stampI = (n1, n2, cur) => {
    if (n1 > 0) rhs[n1 - 1] -= cur;
    if (n2 > 0) rhs[n2 - 1] += cur;
  };

  let sIdx = 0;
  const srcRowOf = new Map();
  for (let k = 0; k < branches.length; k++) {
    const br = branches[k];
    const n1 = br.from | 0, n2 = br.to | 0;
    const t = br.type || (br.V !== undefined || br.diff !== undefined ? 'source' : br.I !== undefined || br.flow !== undefined ? 'flow' : 'conductance');
    if (t === 'conductance' || t === 'R') {
      const g = br.G !== undefined ? br.G : 1 / Math.max(1e-12, br.R);
      stampG(n1, n2, g);
    } else if (t === 'flow' || t === 'I') {
      const f = br.flow ?? br.I ?? 0;
      stampI(n1, n2, f);
    } else if (t === 'storage' || t === 'C') {
      const dt = Math.max(1e-12, br.dt ?? 1);
      const geq = (br.cap ?? br.C ?? 0) / dt;
      const prev = br.prevDiff ?? 0;
      stampG(n1, n2, geq);
      stampI(n1, n2, -geq * prev);
    } else if (t === 'source' || t === 'V') {
      const row = nodeCount + sIdx;
      srcRowOf.set(k, row);
      if (n1 > 0) { A[n1 - 1][row] += 1; A[row][n1 - 1] += 1; }
      if (n2 > 0) { A[n2 - 1][row] -= 1; A[row][n2 - 1] -= 1; }
      A[row][row] -= (br.Rint ?? 0);
      rhs[row] = br.diff ?? br.V ?? 0;
      sIdx++;
    } else {
      throw new Error(`solveNetwork: unknown branch type "${t}"`);
    }
  }

  const sol = solveLinear(A, rhs);
  const potentials = new Float64Array(nodeCount + 1);
  for (let i = 1; i <= nodeCount; i++) potentials[i] = sol[i - 1];

  const flows = new Array(branches.length);
  const powers = new Array(branches.length);
  const nodeNet = new Float64Array(nodeCount + 1);

  for (let k = 0; k < branches.length; k++) {
    const br = branches[k];
    const n1 = br.from | 0, n2 = br.to | 0;
    const dv = potentials[n1] - potentials[n2];
    const t = br.type || (br.V !== undefined || br.diff !== undefined ? 'source' : br.I !== undefined || br.flow !== undefined ? 'flow' : 'conductance');
    let f = 0;
    if (t === 'conductance' || t === 'R') {
      const g = br.G !== undefined ? br.G : 1 / Math.max(1e-12, br.R);
      f = g * dv;
    } else if (t === 'flow' || t === 'I') {
      f = br.flow ?? br.I ?? 0;
    } else if (t === 'storage' || t === 'C') {
      const geq = (br.cap ?? br.C ?? 0) / Math.max(1e-12, br.dt ?? 1);
      f = geq * (dv - (br.prevDiff ?? 0));
    } else if (t === 'source' || t === 'V') {
      f = sol[srcRowOf.get(k)];
    }
    flows[k] = f;
    powers[k] = dv * f; // > 0 means branch absorbs energy; < 0 means branch supplies energy
    nodeNet[n1] += f;
    nodeNet[n2] -= f;
  }

  let maxKclResidual = 0;
  for (let i = 1; i <= nodeCount; i++) {
    const leak = gmin * potentials[i];
    maxKclResidual = Math.max(maxKclResidual, Math.abs(nodeNet[i] + leak));
  }
  return { potentials, flows, powers, maxKclResidual };
}

// Inverse-CDF midpoint quantile placer over a non-negative 1D density w(r) >= 0 on [r0, r1].
// Places `count` samples so each interval carries 1/count of the total integral ∫ w(r) dr
// (e.g. w(r) = 2 * Math.PI * r * Math.abs(Bz(r)) for equal-flux streamline seeding).
export function quantileSeeds(weightFn, [r0, r1], count, { samples = 256 } = {}) {
  if (count <= 0) return [];
  const n = Math.max(16, samples | 0);
  const rs = new Float64Array(n + 1);
  const cdf = new Float64Array(n + 1);
  const dr = (r1 - r0) / n;
  let prevW = Math.max(0, weightFn(r0));
  rs[0] = r0;
  cdf[0] = 0;
  for (let i = 1; i <= n; i++) {
    const r = r0 + i * dr;
    const w = Math.max(0, weightFn(r));
    rs[i] = r;
    cdf[i] = cdf[i - 1] + 0.5 * (prevW + w) * dr;
    prevW = w;
  }
  const total = cdf[n];
  if (total <= 1e-15) {
    return Array.from({ length: count }, (_, k) => r0 + ((k + 0.5) / count) * (r1 - r0));
  }
  const out = new Array(count);
  let j = 0;
  for (let k = 0; k < count; k++) {
    const target = ((k + 0.5) / count) * total;
    while (j < n - 1 && cdf[j + 1] < target) j++;
    const span = cdf[j + 1] - cdf[j];
    const u = span > 1e-18 ? (target - cdf[j]) / span : 0.5;
    out[k] = rs[j] + u * (rs[j + 1] - rs[j]);
  }
  return out;
}

// Conic + 4th-order aspheric/toric sag x = x0 + sag(y, z) along the +X optical axis (matches cad_kit.js revolveSection).
// R > 0: center of curvature to the +X side (convex facing -X); R = 0 or Infinity: flat plane.
export function opticSag(surf, y, z) {
  const c = (!surf.R || !Number.isFinite(surf.R)) ? 0 : 1 / surf.R;
  const zs = surf.zScale ?? 1;
  const rho2 = y * y + (zs * z) * (zs * z);
  const k = surf.k ?? 0;
  const disc = Math.max(1e-8, 1 - (1 + k) * c * c * rho2);
  const conic = (c * rho2) / (1 + Math.sqrt(disc));
  const a4 = surf.a4 ?? 0;
  const raw = conic + a4 * rho2 * rho2;
  const cap = surf.maxSag;
  return cap ? cap * Math.tanh(raw / cap) : raw;
}

function opticNormal(surf, y, z) {
  const eps = 1e-5;
  const dsy = (opticSag(surf, y + eps, z) - opticSag(surf, y - eps, z)) / (2 * eps);
  const dsz = (opticSag(surf, y, z + eps) - opticSag(surf, y, z - eps)) / (2 * eps);
  // Implicit surface F(x, y, z) = x - x0 - sag(y, z) = 0 -> grad F = (1, -dsy, -dsz)
  const len = Math.hypot(1, dsy, dsz);
  return [1 / len, -dsy / len, -dsz / len];
}

// Traces 3D rays [{ origin: [x,y,z], dir: [dx,dy,dz], wavelengthNm? }] through ordered +X surfaces:
//   [{ x0, R, k?, a4?, zScale?, aperture = 1, n1 = 1, n2 = 1.5, reflect = false }, ...]
// Returns [{ points: [[x,y,z], ...], dir: [dx,dy,dz], tir: boolean, clipped: boolean, virtualBack?: [x,y,z] }]
export function traceAxisymmetricRays(surfaces, rays, { xEnd = null, virtualBackLen = 2.5 } = {}) {
  return rays.map(ray => {
    let [ox, oy, oz] = ray.origin;
    const dLen = Math.hypot(ray.dir[0], ray.dir[1], ray.dir[2]) || 1;
    let [dx, dy, dz] = [ray.dir[0] / dLen, ray.dir[1] / dLen, ray.dir[2] / dLen];
    const points = [[ox, oy, oz]];
    let tir = false, clipped = false;

    for (const surf of surfaces) {
      if (Math.abs(dx) < 1e-8) { clipped = true; break; }
      let t = (surf.x0 - ox) / dx;
      for (let it = 0; it < 14; it++) {
        const px = ox + t * dx, py = oy + t * dy, pz = oz + t * dz;
        const f = px - (surf.x0 + opticSag(surf, py, pz));
        if (Math.abs(f) < 1e-11) break;
        const [nx, ny, nz] = opticNormal(surf, py, pz);
        const dfdt = dx * nx + dy * ny + dz * nz;
        if (Math.abs(dfdt) < 1e-9) break;
        t -= f / dfdt;
      }
      if (t < 1e-7) { clipped = true; break; }
      const hx = ox + t * dx, hy = oy + t * dy, hz = oz + t * dz;
      const ap = surf.aperture ?? Infinity;
      if (Math.hypot(hy, hz) > ap) {
        points.push([hx, hy, hz]);
        clipped = true;
        break;
      }
      points.push([hx, hy, hz]);
      let [nx, ny, nz] = opticNormal(surf, hy, hz);
      // Orient normal against incoming ray so cosI = -dot(d, n) >= 0
      let cosI = -(dx * nx + dy * ny + dz * nz);
      if (cosI < 0) { nx = -nx; ny = -ny; nz = -nz; cosI = -cosI; }

      if (surf.reflect) {
        dx += 2 * cosI * nx; dy += 2 * cosI * ny; dz += 2 * cosI * nz;
      } else {
        const eta = (surf.n1 ?? 1) / (surf.n2 ?? 1.5);
        const sin2T = eta * eta * Math.max(0, 1 - cosI * cosI);
        if (sin2T > 1) {
          // Total internal reflection
          tir = true;
          dx += 2 * cosI * nx; dy += 2 * cosI * ny; dz += 2 * cosI * nz;
        } else {
          const cosT = Math.sqrt(1 - sin2T);
          const kRef = eta * cosI - cosT;
          dx = eta * dx + kRef * nx;
          dy = eta * dy + kRef * ny;
          dz = eta * dz + kRef * nz;
        }
      }
      const nrm = Math.hypot(dx, dy, dz) || 1;
      dx /= nrm; dy /= nrm; dz /= nrm;
      ox = hx; oy = hy; oz = hz;
    }

    let virtualBack = null;
    if (!clipped) {
      // Backward virtual extension from the final surface exit point (for diverging virtual images)
      virtualBack = [ox - dx * virtualBackLen, oy - dy * virtualBackLen, oz - dz * virtualBackLen];
      if (xEnd !== null && Math.abs(dx) > 1e-6) {
        const tEnd = (xEnd - ox) / dx;
        if (tEnd > 0) points.push([ox + tEnd * dx, oy + tEnd * dy, oz + tEnd * dz]);
      }
    }
    return { points, exitOrigin: [ox, oy, oz], dir: [dx, dy, dz], tir, clipped, virtualBack };
  });
}
