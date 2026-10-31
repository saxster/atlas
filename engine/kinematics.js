// Pure kinematics & constraint solver for mechanical figures: forward analytical solvers (circle intersection,
// slider-crank, four-bar, gear trains, rack-and-pinion, open differential), a declarative constraint graph solver
// (topological sort for sequential chains + iterative relaxation for closed loops), and inverse kinematics (analytical
// 2-link IK, FABRIK, and Jacobian Transpose / Damped Least Squares with joint limits). No DOM, no three.js: runs in
// plain Node so checks.mjs can prove every mechanism before anything is drawn.

// ---------- 1. Analytical forward kinematics ----------

// Intersection of two circles: centre p0 = [x0, y0] with radius r0, and p1 = [x1, y1] with radius r1.
// branch: +1 or -1 selects one of the two intersection points (left/right of the directed line p0 -> p1),
// or a comparator function (a, b) => chosen point. Clamps smoothly when circles are slightly out of reach.
export function circleIntersect(p0, r0, p1, r1, branch = 1) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  const d = Math.hypot(dx, dy) || 1e-12;
  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r0 * r0 - a * a));
  const mx = p0[0] + (a * dx) / d, my = p0[1] + (a * dy) / d;
  const ox = (h * dy) / d, oy = -(h * dx) / d;
  const ptPos = [mx + ox, my + oy], ptNeg = [mx - ox, my - oy];
  if (typeof branch === 'function') return branch(ptPos, ptNeg);
  return branch >= 0 ? ptPos : ptNeg;
}

// Exact slider-crank kinematics (crank angle theta in radians, crank radius r, connecting-rod length L, pin offset e = 0).
// Returns piston displacement s along +x from crank axle, ds/dtheta (v), d²s/dtheta² (a), rod angle phi, pin [x, y], piston [s, e].
export function sliderCrank(theta, r, L, offset = 0) {
  const c = Math.cos(theta), sn = Math.sin(theta);
  const u = r * sn - offset;
  const q2 = Math.max(1e-12, L * L - u * u), q = Math.sqrt(q2);
  const s = r * c + q;
  // ds/dtheta and d²s/dtheta² (multiply by omega and omega² for time derivatives)
  const du = r * c, d2u = -r * sn;
  const dq = -(u * du) / q;
  const d2q = -(du * du + u * d2u + dq * dq) / q;
  const v = -r * sn + dq;
  const a = -r * c + d2q;
  const phi = Math.asin(Math.max(-1, Math.min(1, u / L)));
  return { s, v, a, phi, pin: [r * c, r * sn], piston: [s, offset] };
}

// Planar four-bar linkage: ground O=[0,0] to C=[d,0], crank OA of length a at angle theta, coupler AB of length b,
// follower CB of length c. Returns joint points { O, A, B, C } and angles { couplerAngle, followerAngle, transmissionAngle }.
export function fourBar(a, b, c, d, theta, branch = 1) {
  const O = [0, 0], C = [d, 0];
  const A = [a * Math.cos(theta), a * Math.sin(theta)];
  const B = circleIntersect(A, b, C, c, branch);
  const couplerAngle = Math.atan2(B[1] - A[1], B[0] - A[0]);
  const followerAngle = Math.atan2(B[1] - C[1], B[0] - C[0]);
  const diag2 = (A[0] - C[0]) ** 2 + (A[1] - C[1]) ** 2;
  const cosMu = Math.max(-1, Math.min(1, (b * b + c * c - diag2) / (2 * b * c)));
  return { O, A, B, C, couplerAngle, followerAngle, transmissionAngle: Math.acos(cosMu) };
}

// Gear pair or gear train: driven angle from drive angle, tooth counts, and optional intermediate idlers.
// Fourth argument may be idlerCount (number) or { idlers = 0, internal = false, module }.
// Each mesh reverses sign unless an internal ring gear (internal: true) is used.
export function gearRatio(driveAngle, teethDrive, teethDriven, opts = 0) {
  const idlers = typeof opts === 'number' ? opts : (opts?.idlers ?? 0);
  const internal = typeof opts === 'object' && opts !== null ? !!opts.internal : false;
  const m = typeof opts === 'object' && opts !== null ? opts.module : undefined;
  const sign = internal ? 1 : (idlers % 2 === 0 ? -1 : 1);
  const ratio = teethDrive / teethDriven;
  const angle = sign * driveAngle * ratio;
  const out = { angle, angle2: angle, ratio: sign * ratio };
  if (m !== undefined) {
    out.r1 = 0.5 * m * teethDrive;
    out.r2 = 0.5 * m * teethDriven;
    out.centerDist = internal ? Math.abs(out.r2 - out.r1) : out.r1 + out.r2;
  }
  return out;
}

// Rack and pinion: module m and tooth count z give pitch radius rp = m * z / 2 and tooth pitch = pi * m.
// Accepts either positional rackPinion(stroke, module = 1, teeth = 20) or options { module, teeth, stroke, angle }.
export function rackPinion(arg1 = {}, moduleArg = 1, teethArg = 20) {
  if (typeof arg1 === 'number') {
    const stroke = arg1, m = moduleArg, teeth = teethArg;
    const rp = 0.5 * m * teeth, pitch = Math.PI * m, angle = stroke / rp;
    return { rp, pitch, stroke, travel: stroke, angle, omegaFromStroke: s => s / rp };
  }
  const { module: m = 1, teeth = 20, stroke, angle } = arg1 || {};
  const rp = 0.5 * m * teeth;
  const pitch = Math.PI * m;
  if (stroke !== undefined) {
    return { rp, pitch, stroke, travel: stroke, angle: stroke / rp, omegaFromStroke: s => s / rp };
  }
  const ang = angle ?? 0;
  const st = ang * rp;
  return { rp, pitch, stroke: st, travel: st, angle: ang, omegaFromStroke: s => s / rp };
}

// Open differential constraint: ring-cage angle/speed equals the average of left and right axle angles/speeds:
// left + right = 2 * ring. Accepts either positional differential(ringAngle, leftAngle, rightAngle) or { ring, left, right, ratio }.
export function differential(arg1 = {}, leftAngle, rightAngle) {
  const isObj = typeof arg1 === 'object' && arg1 !== null;
  const ringIn = isObj ? arg1.ring : arg1;
  const leftIn = isObj ? arg1.left : leftAngle;
  const rightIn = isObj ? arg1.right : rightAngle;
  const ratio = isObj ? (arg1.ratio ?? 1) : 1;
  let ring = ringIn, left = leftIn, right = rightIn;
  if (ring !== undefined && ring !== null && left !== undefined && left !== null && (right === undefined || right === null)) {
    right = 2 * ring - left;
  } else if (ring !== undefined && ring !== null && right !== undefined && right !== null && (left === undefined || left === null)) {
    left = 2 * ring - right;
  } else if (left !== undefined && left !== null && right !== undefined && right !== null && (ring === undefined || ring === null)) {
    ring = 0.5 * (left + right);
  } else {
    ring = ring ?? 0; left = left ?? 0; right = right ?? 0;
  }
  return { ring, carrier: ring, left, right, input: ring * ratio };
}

// ---------- 2. Declarative Constraint Graph Solver ----------

// Built-in declarative constraint factories: each expands to { id, inputs, outputs, solve(state), residual?(state) }.
function normalizeConstraint(c, idx) {
  const id = c.id || `c${idx}`;
  if (typeof c.solve === 'function') return { id, inputs: c.inputs || [], outputs: c.outputs || [], solve: c.solve, residual: c.residual };
  switch (c.type) {
    case 'revolute': {
      const inp = c.drivenBy || c.input, out = c.output || `${id}.angle`, scale = c.scale ?? 1, offset = c.offset ?? 0;
      return { id, inputs: [inp], outputs: [out], solve(s) { s[out] = s[inp] * scale + offset; } };
    }
    case 'prismatic': {
      const inp = c.drivenBy || c.input, out = c.output || `${id}.pos`, scale = c.scale ?? 1, offset = c.offset ?? 0;
      return { id, inputs: [inp], outputs: [out], solve(s) { s[out] = s[inp] * scale + offset; } };
    }
    case 'gear': {
      const inp = c.drive.includes('.') ? c.drive : `${c.drive}.angle`;
      const out = c.driven.includes('.') ? c.driven : `${c.driven}.angle`;
      const ratio = c.ratio !== undefined ? c.ratio : gearRatio(1, c.teethDrive, c.teethDriven, { idlers: c.idlers ?? 0, internal: !!c.internal }).ratio;
      return { id, inputs: [inp], outputs: [out], solve(s) { s[out] = s[inp] * ratio + (c.offset ?? 0); } };
    }
    case 'rack-pinion':
    case 'rackPinion': {
      const teeth = c.teeth ?? 20;
      const m = c.rp !== undefined ? (2 * c.rp) / teeth : (c.module ?? 1);
      if (c.stroke && !c.angle) {
        const inp = c.stroke, out = c.output || `${id}.angle`;
        return { id, inputs: [inp], outputs: [out], solve(s) { s[out] = rackPinion({ module: m, teeth, stroke: s[inp] }).angle; } };
      }
      const inp = c.angle || c.drive, out = c.output || `${id}.stroke`;
      return { id, inputs: [inp], outputs: [out], solve(s) { s[out] = rackPinion({ module: m, teeth, angle: s[inp] }).stroke; } };
    }
    case 'slider-crank':
    case 'sliderCrank': {
      const inp = c.crank.includes('.') ? c.crank : (c.crankAngle || `${c.crank}.angle`);
      const outPos = c.output || `${id}.pos`, outVel = `${id}.vel`, outRod = `${id}.rodAngle`, outPin = `${id}.pin`;
      const r = c.radius ?? c.r, L = c.rodLength ?? c.L, off = c.offset ?? 0;
      return {
        id, inputs: [inp], outputs: [outPos, outVel, outRod, outPin],
        solve(s) {
          const res = sliderCrank(s[inp], r, L, off);
          s[outPos] = res.s; s[outVel] = res.v; s[outRod] = res.phi; s[outPin] = res.pin;
        },
      };
    }
    case 'circle-intersect':
    case 'circleIntersect': {
      const p0 = c.p0, p1 = c.p1, out = c.output || id, r0 = c.r0, r1 = c.r1, branch = c.branch ?? 1;
      const inps = [typeof p0 === 'string' ? p0 : null, typeof p1 === 'string' ? p1 : null].filter(Boolean);
      return {
        id, inputs: inps, outputs: [out],
        solve(s) {
          const a = typeof p0 === 'string' ? s[p0] : p0;
          const b = typeof p1 === 'string' ? s[p1] : p1;
          s[out] = circleIntersect(a, r0, b, r1, branch);
        },
      };
    }
    case 'four-bar':
    case 'fourBar': {
      const inp = c.crankAngle || c.input, out = c.output || id;
      return {
        id, inputs: [inp], outputs: [out, `${out}.A`, `${out}.B`, `${out}.couplerAngle`, `${out}.followerAngle`],
        solve(s) {
          const fb = fourBar(c.a, c.b, c.c, c.d, s[inp], c.branch ?? 1);
          s[out] = fb; s[`${out}.A`] = fb.A; s[`${out}.B`] = fb.B;
          s[`${out}.couplerAngle`] = fb.couplerAngle; s[`${out}.followerAngle`] = fb.followerAngle;
        },
      };
    }
    case 'differential': {
      const ring = c.ring, left = c.left, right = c.right, out = c.output || `${id}.right`;
      const inps = [ring, left, right].filter(Boolean);
      return {
        id, inputs: inps, outputs: [out],
        solve(s) {
          const d = differential({ ring: ring ? s[ring] : undefined, left: left ? s[left] : undefined, right: right ? s[right] : undefined });
          s[out] = right === undefined ? d.right : left === undefined ? d.left : d.ring;
        },
      };
    }
    case 'distance': {
      // Closed-loop / relaxation constraint: enforces |s[b] - s[a]| = length by projecting s[a] and/or s[b]
      const a = c.a, b = c.b, len = c.length, fixedA = !!c.fixedA, fixedB = !!c.fixedB;
      return {
        id, relax: true, inputs: [a, b], outputs: [fixedA ? b : fixedB ? a : b],
        solve(s) {
          const pa = s[a], pb = s[b];
          if (!pa || !pb) return;
          const dx = pb[0] - pa[0], dy = pb[1] - pa[1], dz = (pb[2] ?? 0) - (pa[2] ?? 0);
          const d = Math.hypot(dx, dy, dz) || 1e-12, err = (d - len) / d;
          const dim = pb.length === 3 || pa.length === 3 ? 3 : 2;
          if (fixedA && !fixedB) {
            s[b] = dim === 3 ? [pb[0] - dx * err, pb[1] - dy * err, pb[2] - dz * err] : [pb[0] - dx * err, pb[1] - dy * err];
          } else if (fixedB && !fixedA) {
            s[a] = dim === 3 ? [pa[0] + dx * err, pa[1] + dy * err, pa[2] + dz * err] : [pa[0] + dx * err, pa[1] + dy * err];
          } else if (!fixedA && !fixedB) {
            s[a] = dim === 3 ? [pa[0] + 0.5 * dx * err, pa[1] + 0.5 * dy * err, pa[2] + 0.5 * dz * err] : [pa[0] + 0.5 * dx * err, pa[1] + 0.5 * dy * err];
            s[b] = dim === 3 ? [pb[0] - 0.5 * dx * err, pb[1] - 0.5 * dy * err, pb[2] - 0.5 * dz * err] : [pb[0] - 0.5 * dx * err, pb[1] - 0.5 * dy * err];
          }
        },
        residual(s) {
          const pa = s[a], pb = s[b];
          if (!pa || !pb) return 0;
          return Math.abs(Math.hypot(pb[0] - pa[0], pb[1] - pa[1], (pb[2] ?? 0) - (pa[2] ?? 0)) - len);
        },
      };
    }
    default:
      throw new Error(`kinematics: unknown constraint type '${c.type}'`);
  }
}

// Topological sort with cycle separation: returns { sequential, loops } so acyclic chains run in 1 exact pass
// and cyclic closed-loop constraints run iterative relaxation afterward.
export function createSolver(defs, { iterations = 24, tol = 1e-9 } = {}) {
  const nodes = defs.map(normalizeConstraint);
  const producerOf = new Map();
  for (const n of nodes) for (const out of n.outputs) if (!producerOf.has(out)) producerOf.set(out, n);

  const deps = new Map(nodes.map(n => [n, new Set()]));
  for (const n of nodes) {
    for (const inp of n.inputs) {
      const prod = producerOf.get(inp);
      if (prod && prod !== n) deps.get(n).add(prod);
    }
  }

  const sequential = [], remaining = new Set(nodes.filter(n => !n.relax && !n.residual));
  let progress = true;
  while (progress && remaining.size) {
    progress = false;
    for (const n of [...remaining]) {
      const unresolved = [...deps.get(n)].some(d => remaining.has(d));
      if (!unresolved) {
        sequential.push(n);
        remaining.delete(n);
        progress = true;
      }
    }
  }
  const loops = [...remaining, ...nodes.filter(n => n.relax || n.residual)];
  const hasResidual = loops.some(c => typeof c.residual === 'function');
  const maxResidual = state => {
    let maxRes = 0;
    for (const c of nodes) if (c.residual) maxRes = Math.max(maxRes, c.residual(state));
    return maxRes;
  };

  return {
    sequential,
    loops,
    maxResidual,
    solve(inputs = {}) {
      const state = { ...inputs };
      for (const c of sequential) c.solve(state);
      if (loops.length) {
        for (let iter = 0; iter < iterations; iter++) {
          for (const c of loops) c.solve(state);
          if (hasResidual) {
            let maxRes = 0;
            for (const c of loops) if (c.residual) maxRes = Math.max(maxRes, c.residual(state));
            if (maxRes <= tol) break;
          }
        }
      }
      return state;
    },
  };
}

// ---------- 3. Inverse Kinematics (Analytical 2-Link, FABRIK, and Jacobian Transpose / DLS) ----------

// Exact 2-link planar arm/leg IK from base = [bx, by] to target = [tx, ty] with link lengths L1, L2.
// elbow: +1 (elbow-up / one side) or -1 (elbow-down / other side). Clamps gracefully when target is out of reach.
export function twoLinkIK(base, target, L1, L2, elbow = 1) {
  const dx = target[0] - base[0], dy = target[1] - base[1];
  const rawD = Math.hypot(dx, dy);
  const minD = Math.abs(L1 - L2) + 1e-9, maxD = L1 + L2 - 1e-9;
  const reachable = rawD >= Math.abs(L1 - L2) - 1e-6 && rawD <= L1 + L2 + 1e-6;
  const d = Math.max(minD, Math.min(maxD, rawD || 1e-9));
  const ux = rawD > 1e-12 ? dx / rawD : 1, uy = rawD > 1e-12 ? dy / rawD : 0;
  const endPt = [base[0] + ux * d, base[1] + uy * d];
  const elbowPt = circleIntersect(base, L1, endPt, L2, elbow);
  const th1 = Math.atan2(elbowPt[1] - base[1], elbowPt[0] - base[0]);
  const th2 = Math.atan2(endPt[1] - elbowPt[1], endPt[0] - elbowPt[0]) - th1;
  return { th1, th2, elbowPt, endPt, reachable };
}

// FABRIK (Forward And Backward Reaching Inverse Kinematics) for 2D or 3D serial chains.
// joints: array of [x, y] or [x, y, z] initial points; lengths: array of N-1 link lengths (inferred from joints if null).
// baseFixed: when true (default), pins joints[0] at its starting position; when false, allows the base to translate freely.
// Returns { joints, angles, error, iterations } with exact link lengths preserved at every step.
export function fabrik(joints, lengths, target, { iterations = 15, tol = 1e-6, baseFixed = true } = {}) {
  const dim = (joints[0]?.length === 3 || target.length === 3) ? 3 : 2;
  const toVec = p => dim === 3 ? [p[0], p[1], p[2] ?? 0] : [p[0], p[1]];
  const pts = joints.map(toVec);
  const tgt = toVec(target);
  const n = pts.length;
  const lens = lengths ? [...lengths] : Array.from({ length: n - 1 }, (_, i) =>
    Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1], dim === 3 ? pts[i + 1][2] - pts[i][2] : 0));
  const base = [...pts[0]];
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], dim === 3 ? b[2] - a[2] : 0);
  const place = (from, toward, L) => {
    const d = dist(from, toward) || 1e-12, u = L / d;
    return dim === 3
      ? [from[0] + (toward[0] - from[0]) * u, from[1] + (toward[1] - from[1]) * u, from[2] + (toward[2] - from[2]) * u]
      : [from[0] + (toward[0] - from[0]) * u, from[1] + (toward[1] - from[1]) * u];
  };

  const totalLen = lens.reduce((a, b) => a + b, 0);
  let iter = 0;
  if (!baseFixed) {
    iter = 1;
    pts[n - 1] = [...tgt];
    for (let i = n - 2; i >= 0; i--) pts[i] = place(pts[i + 1], pts[i], lens[i]);
  } else if (dist(base, tgt) >= totalLen) {
    // Target is at or beyond full reach: stretch straight toward target
    for (let i = 0; i < n - 1; i++) pts[i + 1] = place(pts[i], tgt, lens[i]);
  } else {
    for (; iter < iterations; iter++) {
      if (dist(pts[n - 1], tgt) <= tol) break;
      // Forward reaching: tip to base
      pts[n - 1] = [...tgt];
      for (let i = n - 2; i >= 0; i--) pts[i] = place(pts[i + 1], pts[i], lens[i]);
      // Backward reaching: base to tip
      pts[0] = [...base];
      for (let i = 0; i < n - 1; i++) pts[i + 1] = place(pts[i], pts[i + 1], lens[i]);
    }
  }
  const angles = Array.from({ length: n - 1 }, (_, i) => Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]));
  return { joints: pts, angles, error: dist(pts[n - 1], tgt), iterations: iter };
}

// General Jacobian IK (supports both 'transpose' and 'dls' Damped Least Squares / Levenberg-Marquardt).
// fk(angles) -> [x, y] or [x, y, z] end-effector position.
// limits: optional array of [min, max] per joint angle.
// Returns { angles, endEffector, error, iterations }.
export function jacobianIK({
  angles: initAngles,
  fk,
  target,
  method = 'dls',
  step = 0.8,
  damping = 0.08,
  maxDelta = 0.35,
  limits = null,
  iterations = 40,
  tol = 1e-5,
} = {}) {
  const angles = [...initAngles];
  const m = angles.length;
  const clampLimits = () => {
    if (!limits) return;
    for (let j = 0; j < m; j++) if (limits[j]) angles[j] = Math.max(limits[j][0], Math.min(limits[j][1], angles[j]));
  };
  clampLimits();
  const h = 1e-6;
  let cur = fk(angles);
  const dim = cur.length;
  let iter = 0, errNorm = 0;

  for (; iter < iterations; iter++) {
    cur = fk(angles);
    const e = Array.from({ length: dim }, (_, d) => (target[d] ?? 0) - cur[d]);
    errNorm = Math.hypot(...e);
    if (errNorm <= tol) break;

    // Build Jacobian J (dim × m): column j is ∂fk/∂theta_j
    const J = Array.from({ length: dim }, () => new Float64Array(m));
    for (let j = 0; j < m; j++) {
      const orig = angles[j];
      angles[j] = orig + h; const fp = fk(angles);
      angles[j] = orig - h; const fm = fk(angles);
      angles[j] = orig;
      for (let d = 0; d < dim; d++) J[d][j] = (fp[d] - fm[d]) / (2 * h);
    }

    // J^T * e (m-vector)
    const JTe = new Float64Array(m);
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let d = 0; d < dim; d++) s += J[d][j] * e[d];
      JTe[j] = s;
    }

    let dTheta;
    if (method === 'transpose') {
      // Adaptive step size alpha = <e, J J^T e> / <J J^T e, J J^T e> scaled by step
      const JJTe = new Float64Array(dim);
      for (let d = 0; d < dim; d++) {
        let s = 0;
        for (let j = 0; j < m; j++) s += J[d][j] * JTe[j];
        JJTe[d] = s;
      }
      let num = 0, den = 0;
      for (let d = 0; d < dim; d++) { num += e[d] * JJTe[d]; den += JJTe[d] * JJTe[d]; }
      const alpha = den > 1e-18 ? step * (num / den) : step * 0.1;
      dTheta = Array.from({ length: m }, (_, j) => alpha * JTe[j]);
    } else {
      // Damped Least Squares: solve (J J^T + lambda^2 I) y = e in task space (dim <= 3), then dTheta = J^T y
      const lam2 = damping * damping;
      const A = Array.from({ length: dim }, (_, r) =>
        Array.from({ length: dim + 1 }, (__, c) => {
          if (c === dim) return e[r];
          let s = r === c ? lam2 : 0;
          for (let j = 0; j < m; j++) s += J[r][j] * J[c][j];
          return s;
        }));
      // Gaussian elimination with partial pivoting on small dim × dim system (2×2 or 3×3)
      for (let i = 0; i < dim; i++) {
        let piv = i;
        for (let r = i + 1; r < dim; r++) if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r;
        [A[i], A[piv]] = [A[piv], A[i]];
        const div = A[i][i] || 1e-12;
        for (let c = i; c <= dim; c++) A[i][c] /= div;
        for (let r = 0; r < dim; r++) if (r !== i) {
          const f = A[r][i];
          for (let c = i; c <= dim; c++) A[r][c] -= f * A[i][c];
        }
      }
      const y = A.map(row => row[dim]);
      dTheta = Array.from({ length: m }, (_, j) => {
        let s = 0;
        for (let d = 0; d < dim; d++) s += J[d][j] * y[d];
        return step * s;
      });
    }

    for (let j = 0; j < m; j++) {
      const delta = Math.max(-maxDelta, Math.min(maxDelta, dTheta[j]));
      angles[j] += delta;
    }
    clampLimits();
  }
  cur = fk(angles);
  errNorm = Math.hypot(...Array.from({ length: dim }, (_, d) => (target[d] ?? 0) - cur[d]));
  return { angles, endEffector: cur, error: errNorm, iterations: iter };
}
