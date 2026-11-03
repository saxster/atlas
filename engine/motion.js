// Pure, stateless procedural motion, easing, closed-loop spring, and periodic noise helpers.
// Every function depends on time t (or phase u in [0, 1]) alone — no DOM, no Three.js, no frame-to-frame state —
// so model.js, world.js, checks.mjs, and out-of-order ?render seeks all compute identical values.

export const TAU = Math.PI * 2;
export const clamp01 = x => Math.min(Math.max(x, 0), 1);
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const fract = x => x - Math.floor(x);
export const mod = (x, m) => ((x % m) + m) % m;
export const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const smoothstep = smooth;
export const ease = u => (u = clamp01(u), u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);

// Phase 0..1 of a cycle of `period` seconds. When `period` divides a tour or loop length, the cycle closes cleanly.
export const phase = (t, period = 1, offset = 0) => fract((t + offset) / period);

// Windowed progress 0..1 inside a [0, 1] phase: 0 before a, ramps 0 -> 1 over [a, b], holds 1 after b.
// Optional easing function `fn` (e.g. `ease` or `eases.outCubic`) shapes the 0..1 ramp.
export const win = (p, a, b, fn = null) => {
  const u = clamp01((p - a) / (b - a));
  return fn ? fn(u) : u;
};

// Periodic time warp: surges and slows inside `period` while keeping warpTime(t + period) = warpTime(t) + period.
// Clamps amplitude so |a * TAU / period| <= 0.9 and time never runs backwards.
export function warpTime(t, period = 12, amp = 0.15) {
  const maxAmp = (0.9 * period) / TAU;
  const a = clamp(amp, -maxAmp, maxAmp);
  return t + a * Math.sin((TAU * t) / period);
}

// Closed-loop underdamped spring from 0 to 1 (zeta: 0.2 bouncy to 1.0 critical), pinned to 0 at u <= 0
// and smoothly blended to 1 at u >= 1 so periodic cycles close with zero seam jump.
export function spring(u, zeta = 0.35, freq = 3.2) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const z = clamp(zeta, 0.01, 0.9999);
  const w = TAU * freq;
  const wd = w * Math.sqrt(Math.max(1e-6, 1 - z * z));
  const v = 1 - Math.exp(-z * w * u) * (Math.cos(wd * u) + ((z * w) / wd) * Math.sin(wd * u));
  return lerp(v, 1, smooth(0.85, 1, u));
}

// Decaying sinusoidal after-shake that reaches exactly 0 by tau = end.
export function settleShake(tau, freq = 6, decay = 0.25, end = 1) {
  if (tau <= 0 || tau >= end) return 0;
  return Math.exp(-tau / decay) * Math.sin(TAU * freq * tau) * (1 - smooth(end * 0.7, end, tau));
}

// Volume-preserving squash and stretch scale [sx, sy, sz] for a vertical scale sy.
export function squashStretch(sy, power = 0.75) {
  const s = Math.max(0.05, sy);
  const lat = 1 / Math.pow(s, power);
  return [lat, s, lat];
}

// Complete easing family on [0, 1] -> [0, 1] (with overshoot for Back/Elastic/Spring).
export const eases = {
  linear: u => clamp01(u),
  inSine: u => 1 - Math.cos((clamp01(u) * Math.PI) / 2),
  outSine: u => Math.sin((clamp01(u) * Math.PI) / 2),
  inOutSine: u => -(Math.cos(Math.PI * clamp01(u)) - 1) / 2,
  inQuad: u => { const k = clamp01(u); return k * k; },
  outQuad: u => { const k = clamp01(u); return 1 - (1 - k) * (1 - k); },
  inOutQuad: u => { const k = clamp01(u); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; },
  inCubic: u => { const k = clamp01(u); return k * k * k; },
  outCubic: u => { const k = clamp01(u); return 1 - Math.pow(1 - k, 3); },
  inOutCubic: ease,
  inQuart: u => { const k = clamp01(u); return k * k * k * k; },
  outQuart: u => { const k = clamp01(u); return 1 - Math.pow(1 - k, 4); },
  inOutQuart: u => { const k = clamp01(u); return k < 0.5 ? 8 * k * k * k * k : 1 - Math.pow(-2 * k + 2, 4) / 2; },
  inQuint: u => { const k = clamp01(u); return k * k * k * k * k; },
  outQuint: u => { const k = clamp01(u); return 1 - Math.pow(1 - k, 5); },
  inOutQuint: u => { const k = clamp01(u); return k < 0.5 ? 16 * k * k * k * k * k : 1 - Math.pow(-2 * k + 2, 5) / 2; },
  inExpo: u => { const k = clamp01(u); return k === 0 ? 0 : Math.pow(2, 10 * k - 10); },
  outExpo: u => { const k = clamp01(u); return k === 1 ? 1 : 1 - Math.pow(2, -10 * k); },
  inOutExpo: u => {
    const k = clamp01(u);
    return k === 0 ? 0 : k === 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2;
  },
  inCirc: u => { const k = clamp01(u); return 1 - Math.sqrt(1 - k * k); },
  outCirc: u => { const k = clamp01(u); return Math.sqrt(1 - Math.pow(k - 1, 2)); },
  inOutCirc: u => {
    const k = clamp01(u);
    return k < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * k, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * k + 2, 2)) + 1) / 2;
  },
  inBack: (u, s = 1.70158) => { const k = clamp01(u); return (s + 1) * k * k * k - s * k * k; },
  outBack: (u, s = 1.70158) => { const k = clamp01(u); return 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); },
  inOutBack: (u, s = 1.70158 * 1.525) => {
    const k = clamp01(u);
    return k < 0.5
      ? (Math.pow(2 * k, 2) * ((s + 1) * 2 * k - s)) / 2
      : (Math.pow(2 * k - 2, 2) * ((s + 1) * (k * 2 - 2) + s) + 2) / 2;
  },
  outElastic: u => {
    const k = clamp01(u);
    return k === 0 ? 0 : k === 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (TAU / 3)) + 1;
  },
  outBounce: u => {
    let k = clamp01(u);
    const n1 = 7.5625, d1 = 2.75;
    if (k < 1 / d1) return n1 * k * k;
    if (k < 2 / d1) return n1 * (k -= 1.5 / d1) * k + 0.75;
    if (k < 2.5 / d1) return n1 * (k -= 2.25 / d1) * k + 0.9375;
    return n1 * (k -= 2.625 / d1) * k + 0.984375;
  },
  spring,
};

// Stateless deterministic hash and element randoms (never use Math.random or Date in a figure).
export const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
export const rand = (i, salt = 0) => hash(i * 12.9898 + salt * 78.233 + 0.5);
export const rrange = (i, a, b, salt = 0) => lerp(a, b, rand(i, salt));

// Smooth multi-octave noise on a circle that repeats seamlessly every `period` seconds in [-1, 1].
export function loopNoise(t, seed = 0, period = 12, octaves = 2) {
  let v = 0, amp = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    v += amp * Math.sin(TAU * (o + 1) * (t / period) + rand(seed + o, 1) * TAU);
    norm += amp;
    amp *= 0.5;
  }
  return norm > 0 ? v / norm : 0;
}

const DEG = Math.PI / 180;

// Signed/unsigned polygon area in the XZ plane. Accepts [[x, z], ...] or [x0, z0, x1, z1].
export function planArea(polyOrBox) {
  if (!Array.isArray(polyOrBox) || !polyOrBox.length) return 0;
  if (typeof polyOrBox[0] === 'number' && polyOrBox.length === 4) {
    return Math.abs((polyOrBox[2] - polyOrBox[0]) * (polyOrBox[3] - polyOrBox[1]));
  }
  let s = 0;
  const n = polyOrBox.length;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = polyOrBox[i];
    const [x1, z1] = polyOrBox[(i + 1) % n];
    s += x0 * z1 - x1 * z0;
  }
  return 0.5 * Math.abs(s);
}

// Bounding box, room areas, and centroid of a declarative 2D plan specification.
export function planBounds(spec = {}) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const includePt = (x, z) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  };
  const roomAreas = {};
  let totalArea = 0;

  for (const r of spec.rooms || []) {
    if (r.box) {
      const [x0, z0, x1, z1] = r.box;
      includePt(x0, z0); includePt(x1, z1);
      const a = planArea(r.box);
      if (r.key) roomAreas[r.key] = a;
      totalArea += a;
    } else if (r.poly) {
      for (const [x, z] of r.poly) includePt(x, z);
      const a = planArea(r.poly);
      if (r.key) roomAreas[r.key] = a;
      totalArea += a;
    }
  }
  for (const w of spec.walls || []) {
    const [x0, z0, x1, z1] = Array.isArray(w) ? w : [w.x0, w.z0, w.x1, w.z1];
    const th = (Array.isArray(w) ? w[4] : w.thickness) ?? spec.wallThickness ?? 0.2;
    includePt(Math.min(x0, x1) - th * 0.5, Math.min(z0, z1) - th * 0.5);
    includePt(Math.max(x0, x1) + th * 0.5, Math.max(z0, z1) + th * 0.5);
  }
  if (Array.isArray(spec.border) && spec.border.length >= 4) {
    includePt(spec.border[0], spec.border[1]);
    includePt(spec.border[2], spec.border[3]);
  }
  if (!Number.isFinite(minX)) { minX = -2; maxX = 2; minZ = -2; maxZ = 2; }
  const width = maxX - minX;
  const depth = maxZ - minZ;
  const cx = 0.5 * (minX + maxX);
  const cz = 0.5 * (minZ + maxZ);
  return { minX, maxX, minZ, maxZ, width, depth, center: [cx, 0, cz], roomAreas, totalArea };
}

// Computes a top-down telephoto camera pose so a 2D plan reads like a flat orthographic blueprint
// while remaining a single PerspectiveCamera that can smoothly dolly-zoom into 3D perspective.
export function planPose(boundsOrSpec, { fov = 3, el = 89.4, az = 0, aspect = 1.25, pad = 1.18, y = 0 } = {}) {
  const b = boundsOrSpec && typeof boundsOrSpec.width === 'number' ? boundsOrSpec : planBounds(boundsOrSpec);
  const tanHalf = Math.tan((fov * DEG) / 2);
  const frameHeight = Math.max(b.depth, b.width / Math.max(0.2, aspect)) * pad;
  const dist = frameHeight / (2 * tanHalf);
  const cx = b.center ? b.center[0] : (b.cx ?? 0);
  const cz = b.center ? b.center[2] : (b.cz ?? 0);
  return {
    target: [cx, y, cz],
    az,
    el,
    fov,
    dist,
    frameHeight,
  };
}

// Logarithmic FOV + logarithmic frame-height interpolation (the Casa Serra / Casa Larga dolly-zoom law).
// Keeps apparent subject size steady when transitioning between a 2-3 deg telephoto blueprint and a 20-55 deg perspective view.
export function logFovLerp(camA, camB, t, pullBack = 1) {
  const u = clamp01(t);
  const fovA = camA.fov ?? 18;
  const fovB = camB.fov ?? 18;
  const tanA = Math.tan((fovA * DEG) / 2);
  const tanB = Math.tan((fovB * DEG) / 2);
  const frameA = 2 * Math.max(0.01, camA.dist) * tanA;
  const frameB = 2 * Math.max(0.01, camB.dist) * tanB;

  const tanU = Math.exp(lerp(Math.log(tanA), Math.log(tanB), u));
  const frameU = Math.exp(lerp(Math.log(frameA), Math.log(frameB), u));
  const fov = (2 * Math.atan(tanU)) / DEG;
  const dist = (frameU / (2 * tanU)) * pullBack;

  const dAz = ((((camB.az - camA.az) % 360) + 540) % 360) - 180;
  const target = [
    lerp(camA.target[0], camB.target[0], u),
    lerp(camA.target[1], camB.target[1], u),
    lerp(camA.target[2], camB.target[2], u),
  ];
  const az = camA.az + dAz * u;
  const el = lerp(camA.el, camB.el, u);
  const near = Math.max(0.08, dist > 40 ? dist * 0.18 : 0.1);
  const far = Math.max(300, dist * 2.4 + 120);
  return { target, az, el, fov, dist, frameHeight: frameU, near, far };
}

// Fritsch-Carlson monotone cubic Hermite 1D interpolator over sorted (ts, ys).
// Zeroes tangents at local extrema/plateaus so camera and parameter tracks never overshoot.
function monotoneSpline1D(ts, ys) {
  const n = ts.length;
  if (n === 0) return () => 0;
  if (n === 1) return () => ys[0];
  const dx = new Array(n - 1);
  const dy = new Array(n - 1);
  const sec = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    dx[i] = Math.max(1e-9, ts[i + 1] - ts[i]);
    dy[i] = ys[i + 1] - ys[i];
    sec[i] = dy[i] / dx[i];
  }
  const m = new Array(n).fill(0);
  m[0] = sec[0];
  m[n - 1] = sec[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (sec[i - 1] * sec[i] <= 0) m[i] = 0;
    else m[i] = 0.5 * (sec[i - 1] + sec[i]);
  }
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(sec[i]) < 1e-12) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = m[i] / sec[i];
      const b = m[i + 1] / sec[i];
      const h = Math.hypot(a, b);
      if (h > 3) {
        const tau = 3 / h;
        m[i] = tau * a * sec[i];
        m[i + 1] = tau * b * sec[i];
      }
    }
  }
  return t => {
    if (t <= ts[0]) return ys[0];
    if (t >= ts[n - 1]) return ys[n - 1];
    let lo = 0, hi = n - 2;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (t < ts[mid]) hi = mid - 1;
      else if (t > ts[mid + 1]) lo = mid + 1;
      else { lo = mid; break; }
    }
    const i = lo;
    const h = dx[i];
    const s = (t - ts[i]) / h;
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;
    return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
  };
}

// Multi-keyframe Fritsch-Carlson monotone cubic spline rig (adapted from Casa Larga rig.js `glide`).
// Accepts keyframes `[{ t, target?, az?, el?, fov?, dist?, ...scalarProps }, ...]` and returns `t => pose`.
// Automatically unwraps `az` shortest-way and interpolates `(fov, dist)` in logarithmic telephoto space.
export function glide(keyframes = []) {
  const keys = [...keyframes].sort((a, b) => a.t - b.t);
  if (!keys.length) return () => ({});
  const ts = keys.map(k => k.t);
  const propNames = [...new Set(keys.flatMap(k => Object.keys(k)))].filter(k => k !== 't');

  // Unwrap azimuth angles so transitions take the shortest arc
  const unwrappedAz = [];
  if (propNames.includes('az')) {
    let cur = keys[0].az ?? 0;
    unwrappedAz.push(cur);
    for (let i = 1; i < keys.length; i++) {
      const raw = keys[i].az ?? cur;
      const d = ((((raw - cur) % 360) + 540) % 360) - 180;
      cur += d;
      unwrappedAz.push(cur);
    }
  }

  // Logarithmic fov/dist channels when both fov and dist are present
  const hasFovDist = propNames.includes('fov') && propNames.includes('dist');
  let logTanTrack = null, logFrameTrack = null;
  if (hasFovDist) {
    const logTans = keys.map(k => Math.log(Math.tan(((k.fov ?? 18) * DEG) / 2)));
    const logFrames = keys.map((k, i) => Math.log(2 * Math.max(0.01, k.dist ?? 10) * Math.exp(logTans[i])));
    logTanTrack = monotoneSpline1D(ts, logTans);
    logFrameTrack = monotoneSpline1D(ts, logFrames);
  }

  const tracks = {};
  for (const name of propNames) {
    if (hasFovDist && (name === 'fov' || name === 'dist')) continue;
    if (name === 'az') {
      tracks.az = monotoneSpline1D(ts, unwrappedAz);
      continue;
    }
    const sample = keys.find(k => k[name] !== undefined)?.[name];
    if (Array.isArray(sample)) {
      const dim = sample.length;
      const compTracks = Array.from({ length: dim }, (_, d) =>
        monotoneSpline1D(ts, keys.map(k => (k[name] ?? sample)[d])),
      );
      tracks[name] = t => compTracks.map(fn => fn(t));
    } else if (typeof sample === 'number') {
      tracks[name] = monotoneSpline1D(ts, keys.map(k => k[name] ?? sample));
    }
  }

  return t => {
    const out = { t };
    for (const [name, fn] of Object.entries(tracks)) out[name] = fn(t);
    if (hasFovDist) {
      const tanU = Math.exp(logTanTrack(t));
      const frameU = Math.exp(logFrameTrack(t));
      out.fov = (2 * Math.atan(tanU)) / DEG;
      out.dist = frameU / (2 * tanU);
    }
    return out;
  };
}

