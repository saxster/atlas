// 2D-to-3D CAD, Blueprint & Realistic Procedural Modeling Kit for Atlas.
// Bridges 2D technical drawings/floorplans and 3D models ("The drawing and the model are one"):
//   - RectSolid: watertight axis-aligned boolean CSG (add/sub) with metric UVs and merged non-coplanar edges
//   - extrudePlan / buildSheet / dimChain / swingArc: declarative 2D plan + dimension sheet -> 3D architecture
//   - planArea / planBounds / planPose / logFovLerp / glide: pure geometric & telephoto log-FOV math (from motion.js)
//   - uvMetres / bevelBox / shell / lathe / drape / fronts / batchGeos / branchTree: parametric 3D detailing primitives
//   - procTex / tweakMat / createRevealController / inkAware / contactShadow: procedural textures & ink-to-PBR sweeps
import * as THREE from 'three';
import { part, box, cyl, lines, shadeMat, PALETTE, TONE, V, applyClipPlanes } from './parts.js';
import {
  lerp, clamp01, smoothstep,
  planArea, planBounds, planPose, logFovLerp, glide,
} from './motion.js';
import { rng } from './rng.js';

export { planArea, planBounds, planPose, logFovLerp, glide };

const R4 = v => Math.round(v * 1e4) / 1e4;
const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// 2. RectSolid: Watertight Axis-Aligned Solid Modeler + True Edge Extractor
// ---------------------------------------------------------------------------

export class RectSolid {
  constructor() {
    this.ops = [];
  }

  add(x0, y0, z0, x1, y1, z1) {
    this.ops.push([
      1,
      R4(Math.min(x0, x1)), R4(Math.min(y0, y1)), R4(Math.min(z0, z1)),
      R4(Math.max(x0, x1)), R4(Math.max(y0, y1)), R4(Math.max(z0, z1)),
    ]);
    return this;
  }

  sub(x0, y0, z0, x1, y1, z1) {
    this.ops.push([
      0,
      R4(Math.min(x0, x1)), R4(Math.min(y0, y1)), R4(Math.min(z0, z1)),
      R4(Math.max(x0, x1)), R4(Math.max(y0, y1)), R4(Math.max(z0, z1)),
    ]);
    return this;
  }

  // Plan-coordinate helpers where north `n` maps to `z = -n`
  addPlan(x0, n0, x1, n1, y0, y1) {
    return this.add(x0, y0, -n0, x1, y1, -n1);
  }

  subPlan(x0, n0, x1, n1, y0, y1) {
    return this.sub(x0, y0, -n0, x1, y1, -n1);
  }

  build(faceKey = () => 'default', edgeKey = () => 'default') {
    if (!this.ops.length) {
      return { geos: {}, edges: {}, stats: { cells: 0, faces: 0, segments: 0 } };
    }
    const uniq = arr => [...new Set(arr)].sort((a, b) => a - b);
    const xs = uniq(this.ops.flatMap(o => [o[1], o[4]]));
    const ys = uniq(this.ops.flatMap(o => [o[2], o[5]]));
    const zs = uniq(this.ops.flatMap(o => [o[3], o[6]]));
    const ix = new Map(xs.map((v, i) => [v, i]));
    const iy = new Map(ys.map((v, i) => [v, i]));
    const iz = new Map(zs.map((v, i) => [v, i]));
    const nx = xs.length - 1, ny = ys.length - 1, nz = zs.length - 1;
    const occ = new Uint8Array(Math.max(1, nx * ny * nz));
    const id = (i, j, k) => i + nx * (j + ny * k);

    for (const o of this.ops) {
      const i0 = ix.get(o[1]), i1 = ix.get(o[4]);
      const j0 = iy.get(o[2]), j1 = iy.get(o[5]);
      const k0 = iz.get(o[3]), k1 = iz.get(o[6]);
      for (let k = k0; k < k1; k++) {
        for (let j = j0; j < j1; j++) {
          for (let i = i0; i < i1; i++) occ[id(i, j, k)] = o[0];
        }
      }
    }
    const at = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz ? 0 : occ[id(i, j, k)]);

    // Watertight boundary faces with world-planar UVs in metres
    const buckets = {};
    const bucket = key => (buckets[key] ??= { p: [], n: [], uv: [], idx: [] });
    const quad = (key, a, b, c, d, n) => {
      const B = bucket(key);
      const base = B.p.length / 3;
      for (const v of [a, b, c, d]) {
        B.p.push(v[0], v[1], v[2]);
        B.n.push(n[0], n[1], n[2]);
        if (n[0] !== 0) B.uv.push(v[2], v[1]);
        else if (n[1] !== 0) B.uv.push(v[0], v[2]);
        else B.uv.push(v[0], v[1]);
      }
      B.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };

    let faceCount = 0;
    for (let k = 0; k < nz; k++) {
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          if (!occ[id(i, j, k)]) continue;
          const x0 = xs[i], x1 = xs[i + 1], y0 = ys[j], y1 = ys[j + 1], z0 = zs[k], z1 = zs[k + 1];
          const cx = (x0 + x1) * 0.5, cy = (y0 + y1) * 0.5, cz = (z0 + z1) * 0.5;
          if (!at(i + 1, j, k)) { quad(faceKey(x1, cy, cz, 1, 0, 0), [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]); faceCount++; }
          if (!at(i - 1, j, k)) { quad(faceKey(x0, cy, cz, -1, 0, 0), [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]); faceCount++; }
          if (!at(i, j + 1, k)) { quad(faceKey(cx, y1, cz, 0, 1, 0), [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]); faceCount++; }
          if (!at(i, j - 1, k)) { quad(faceKey(cx, y0, cz, 0, -1, 0), [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]); faceCount++; }
          if (!at(i, j, k + 1)) { quad(faceKey(cx, cy, z1, 0, 0, 1), [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]); faceCount++; }
          if (!at(i, j, k - 1)) { quad(faceKey(cx, cy, z0, 0, 0, -1), [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]); faceCount++; }
        }
      }
    }

    const geos = {};
    for (const key of Object.keys(buckets)) {
      const B = buckets[key];
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
      g.setIndex(B.idx);
      geos[key] = g;
    }

    // True non-coplanar edges: walk grid lines along all 3 axes and merge collinear runs
    const edges = {};
    let segmentCount = 0;
    const pushEdge = (key, a, b) => {
      (edges[key] ??= []).push(a[0], a[1], a[2], b[0], b[1], b[2]);
      segmentCount++;
    };
    const axes = [
      { n: [nx, ny, nz], c: [xs, ys, zs], perm: [0, 1, 2] },
      { n: [ny, nz, nx], c: [ys, zs, xs], perm: [1, 2, 0] },
      { n: [nz, nx, ny], c: [zs, xs, ys], perm: [2, 0, 1] },
    ];
    const OFF = 0.05;
    for (const A of axes) {
      const [na, nb, nc] = A.n;
      const [ca, cb, cc] = A.c;
      const P = A.perm;
      const cell = (a, b, c) => {
        const v = [0, 0, 0];
        v[P[0]] = a; v[P[1]] = b; v[P[2]] = c;
        return at(v[0], v[1], v[2]);
      };
      const point = (a, b, c) => {
        const v = [0, 0, 0];
        v[P[0]] = a; v[P[1]] = b; v[P[2]] = c;
        return v;
      };
      for (let b = 0; b <= nb; b++) {
        for (let c = 0; c <= nc; c++) {
          let runStart = -1, runSig = '', runKey = '';
          const flush = endA => {
            if (runStart < 0) return;
            pushEdge(runKey, point(ca[runStart], cb[b], cc[c]), point(ca[endA], cb[b], cc[c]));
            runStart = -1;
          };
          for (let a = 0; a < na; a++) {
            const f00 = cell(a, b - 1, c - 1), f10 = cell(a, b, c - 1), f01 = cell(a, b - 1, c), f11 = cell(a, b, c);
            const sum = f00 + f10 + f01 + f11;
            const diag = sum === 2 && f00 === f11;
            if (sum === 1 || sum === 3 || diag) {
              let db = 0, dc = 0;
              if (!f00) { db -= 1; dc -= 1; }
              if (!f10) { db += 1; dc -= 1; }
              if (!f01) { db -= 1; dc += 1; }
              if (!f11) { db += 1; dc += 1; }
              const len = Math.hypot(db, dc) || 1;
              const mid = point((ca[a] + ca[a + 1]) * 0.5, cb[b], cc[c]);
              const air = point((ca[a] + ca[a + 1]) * 0.5, cb[b] + (db / len) * OFF, cc[c] + (dc / len) * OFF);
              const key = edgeKey(mid[0], mid[1], mid[2], air[0], air[1], air[2]);
              const sig = `${f00}${f10}${f01}${f11}`;
              if (runStart >= 0 && (sig !== runSig || key !== runKey)) flush(a);
              if (runStart < 0) { runStart = a; runSig = sig; runKey = key; }
            } else {
              flush(a);
            }
          }
          flush(na);
        }
      }
    }

    return { geos, edges, stats: { cells: nx * ny * nz, faces: faceCount, segments: segmentCount } };
  }
}

// ---------------------------------------------------------------------------
// 3. Parametric 3D Detailing Primitives (uvMetres, bevelBox, shell, lathe, drape, fronts)
// ---------------------------------------------------------------------------

// Recomputes UVs in physical metres based on dominant vertex normal axis (no aspect-ratio stretching).
export function uvMetres(geo, scale = 1) {
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (ny >= nx && ny >= nz) {
      uv[i * 2] = x * scale;
      uv[i * 2 + 1] = z * scale;
    } else if (nx >= nz) {
      uv[i * 2] = z * scale;
      uv[i * 2 + 1] = y * scale;
    } else {
      uv[i * 2] = x * scale;
      uv[i * 2 + 1] = y * scale;
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

// Subdivided box with smooth bevelled edges and rounded catchlight normals (adapted from Casa Serra FX.bevelBox).
export function bevelBox(w, h, d, bevel = 0.015, segs = [4, 4, 4]) {
  const [sx, sy, sz] = Array.isArray(segs) ? segs : [segs, segs, segs];
  const g = new THREE.BoxGeometry(w, h, d, sx, sy, sz);
  const b = Math.min(bevel, w * 0.35, h * 0.35, d * 0.35);
  if (b <= 0) return uvMetres(g);
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const hx = Math.max(1e-5, w * 0.5 - b);
  const hy = Math.max(1e-5, h * 0.5 - b);
  const hz = Math.max(1e-5, d * 0.5 - b);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const cx = Math.max(-hx, Math.min(hx, x));
    const cy = Math.max(-hy, Math.min(hy, y));
    const cz = Math.max(-hz, Math.min(hz, z));
    let dx = x - cx, dy = y - cy, dz = z - cz;
    const len = Math.hypot(dx, dy, dz);
    if (len > 1e-6) {
      dx /= len; dy /= len; dz /= len;
      p.setXYZ(i, cx + dx * b, cy + dy * b, cz + dz * b);
      n.setXYZ(i, dx, dy, dz);
    }
  }
  return uvMetres(g);
}

function roundedRectPath(PathCtor, w, d, r) {
  const s = new PathCtor();
  const hw = w * 0.5, hd = d * 0.5;
  const rr = Math.max(0, Math.min(r, hw - 1e-4, hd - 1e-4));
  s.moveTo(-hw + rr, -hd);
  s.lineTo(hw - rr, -hd);
  if (rr > 0) s.quadraticCurveTo(hw, -hd, hw, -hd + rr);
  s.lineTo(hw, hd - rr);
  if (rr > 0) s.quadraticCurveTo(hw, hd, hw - rr, hd);
  s.lineTo(-hw + rr, hd);
  if (rr > 0) s.quadraticCurveTo(-hw, hd, -hw, hd - rr);
  s.lineTo(-hw, -hd + rr);
  if (rr > 0) s.quadraticCurveTo(-hw, -hd, -hw + rr, -hd);
  return s;
}

function mergeBufferGeos(geos) {
  const nonIndexed = geos.map(g => (g.index ? g.toNonIndexed() : g));
  let totalVerts = 0;
  for (const g of nonIndexed) totalVerts += g.attributes.position.count;
  const pos = new Float32Array(totalVerts * 3);
  const nor = new Float32Array(totalVerts * 3);
  const uv = new Float32Array(totalVerts * 2);
  let vOff = 0;
  for (const g of nonIndexed) {
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position.array;
    const n = g.attributes.normal.array;
    pos.set(p, vOff * 3);
    nor.set(n, vOff * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, vOff * 2);
    vOff += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}

// Hollow rounded-rectangle extrusion with an interior cavity and closed bottom floor (for basins, tubs, vessels, and instrument housings).
// Centered in X and Z, with Y running from -h/2 to +h/2 so it drops into `part()` just like `box()`.
export function shell(w, d, h, { thickness = 0.04, bottom = thickness, radius = 0.06, curveSegments = 16 } = {}) {
  const t = Math.min(thickness, w * 0.4, d * 0.4);
  const b = Math.max(0, Math.min(bottom, h * 0.6));
  const wallH = Math.max(1e-4, h - b);
  const outer = roundedRectPath(THREE.Shape, w, d, radius);
  const hole = roundedRectPath(THREE.Path, w - 2 * t, d - 2 * t, Math.max(0.005, radius - t));
  outer.holes.push(hole);
  const rimGeo = new THREE.ExtrudeGeometry(outer, { depth: wallH, bevelEnabled: false, curveSegments });
  rimGeo.rotateX(-Math.PI / 2);
  rimGeo.translate(0, -h * 0.5 + b, 0);
  if (b <= 1e-5) {
    rimGeo.computeVertexNormals();
    return uvMetres(rimGeo);
  }
  const baseShape = roundedRectPath(THREE.Shape, w, d, radius);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, { depth: b, bevelEnabled: false, curveSegments });
  baseGeo.rotateX(-Math.PI / 2);
  baseGeo.translate(0, -h * 0.5, 0);
  const merged = mergeBufferGeos([rimGeo, baseGeo]);
  merged.computeVertexNormals();
  return uvMetres(merged);
}

// Revolves a 2D profile `[[r0, y0], [r1, y1], ...]` around the Y axis (for vases, bowls, nozzles, lenses, bells).
export function lathe(points, { segs = 32, spline = true, samples = 28 } = {}) {
  const vecs = points.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y));
  const prof = spline && vecs.length >= 3
    ? new THREE.SplineCurve(vecs).getPoints(samples)
    : vecs;
  const geo = new THREE.LatheGeometry(prof, segs);
  geo.computeVertexNormals();
  return uvMetres(geo);
}

// Vertex-displaced draped cloth/sheet/membrane geometry with natural corner folds and top micro-ripple.
export function drape(w, d, h, { drop = 0.18, radius = 0.04, fold = 0.012, segs = [24, 8, 24] } = {}) {
  const [sx, sy, sz] = Array.isArray(segs) ? segs : [24, 8, 24];
  const g = new THREE.BoxGeometry(w, h, d, sx, sy, sz);
  const p = g.attributes.position;
  const hx = Math.max(1e-4, w * 0.5 - radius);
  const hz = Math.max(1e-4, d * 0.5 - radius);
  const topY = h * 0.5;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const cx = Math.max(-hx, Math.min(hx, x));
    const cz = Math.max(-hz, Math.min(hz, z));
    const dx = x - cx, dz = z - cz;
    const dist = Math.hypot(dx, dz);
    if (dist > 1e-5) {
      x = cx + (dx / dist) * radius;
      z = cz + (dz / dist) * radius;
    }
    if (y > topY - 0.01) {
      y += Math.sin(x * 7) * Math.cos(z * 6) * 0.004;
    } else {
      const u = clamp01((topY - y) / Math.max(1e-4, h));
      y = topY - u * (h + drop);
      const flare = Math.pow(u, 1.5);
      const ang = Math.atan2(z, x);
      const pleat = Math.sin(ang * 7) * fold * flare + Math.sin(ang * 13 + 1.2) * (fold * 0.45) * flare;
      const rOut = Math.hypot(x, z) || 1;
      x += (x / rOut) * (pleat + 0.012 * flare);
      z += (z / rOut) * (pleat + 0.012 * flare);
    }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return uvMetres(g);
}

// Automatic cabinet/panel/drawer grid with recessed shadow-gap reveal and hardware pulls ('bar', 'knob', 'edge', 'none').
export function fronts(parent, {
  w = 1.2, h = 0.8, d = 0.02, nx = 2, ny = 1, gap = 0.006,
  pal = 'paper', revealPal = 'ink', pullPal = 'ink', pull = 'bar',
  pos = [0, 0, 0], rot = null, mat = null, pullMat = null, name = 'Panel front',
} = {}) {
  const g = new THREE.Group();
  g.position.set(...pos);
  if (rot) g.rotation.set(...rot);
  parent.add(g);

  // Dark shadow-gap backing plate behind the panel seams
  part(g, box(w - gap, h - gap, d * 0.4, 0.002), {
    pal: revealPal, tone: 'lo', pos: [0, 0, -d * 0.25], name: `${name} reveal`,
  });

  const cw = w / nx, ch = h / ny;
  const panels = [];
  const pulls = [];
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      const px = -w * 0.5 + (ix + 0.5) * cw;
      const py = -h * 0.5 + (iy + 0.5) * ch;
      const panel = part(g, bevelBox(cw - gap, ch - gap, d, 0.003, [2, 2, 2]), {
        pal, tone: 'mid', mat, pos: [px, py, 0], name,
      });
      panels.push(panel);

      if (pull === 'bar') {
        const isDrawer = ny > 1;
        const hx = isDrawer ? px : px + (ix < nx / 2 ? 1 : -1) * (cw * 0.36);
        const hy = isDrawer ? py + ch * 0.22 : py + ch * 0.08;
        const barGeo = isDrawer
          ? box(Math.min(0.14, cw * 0.35), 0.012, 0.022, 0.003)
          : box(0.012, Math.min(0.14, ch * 0.3), 0.022, 0.003);
        pulls.push(part(g, barGeo, { pal: pullPal, tone: 'hi', mat: pullMat, pos: [hx, hy, d * 0.5 + 0.01], name: `${name} pull` }));
      } else if (pull === 'knob') {
        const hx = nx > 1 ? px + (ix < nx / 2 ? 1 : -1) * (cw * 0.36) : px;
        const hy = py + ch * 0.22;
        const kGeo = cyl(0.012, 0.02, 16);
        kGeo.rotateX(Math.PI / 2);
        pulls.push(part(g, kGeo, { pal: pullPal, tone: 'hi', mat: pullMat, pos: [hx, hy, d * 0.5 + 0.01], name: `${name} knob` }));
      } else if (pull === 'edge') {
        const edgeGeo = box(cw * 0.5, 0.008, d + 0.014, 0.002);
        pulls.push(part(g, edgeGeo, { pal: pullPal, tone: 'hi', mat: pullMat, pos: [px, py + ch * 0.5 - gap, 0.005], name: `${name} edge pull` }));
      }
    }
  }
  return { group: g, panels, pulls };
}

// Static geometry merger (adapted from Casa Serra FX.Batch) that merges an array of
// `{ geo, pos?: [x,y,z], rot?: [rx,ry,rz], scale?: [sx,sy,sz] | number, whole?: boolean }`
// into a single BufferGeometry while encoding each item's world center `[cx, cz, whole ? 1 : 0]`
// into the `aCenter` (vec3) vertex attribute for whole-object reveal shaders.
export function batchGeos(items = []) {
  if (!items.length) return new THREE.BufferGeometry();
  const prepared = [];
  let totalVerts = 0;
  const mat4 = new THREE.Matrix4();
  const posV = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const sclV = new THREE.Vector3();
  const euler = new THREE.Euler();

  for (const it of items) {
    const src = it.geo.index ? it.geo.toNonIndexed() : it.geo.clone();
    if (!src.attributes.normal) src.computeVertexNormals();
    if (it.matrix) {
      mat4.copy(it.matrix);
    } else {
      posV.set(...(it.pos || [0, 0, 0]));
      if (it.rot) euler.set(...it.rot); else euler.set(0, 0, 0);
      quat.setFromEuler(euler);
      const sc = it.scale ?? 1;
      if (Array.isArray(sc)) sclV.set(...sc); else sclV.set(sc, sc, sc);
      mat4.compose(posV, quat, sclV);
    }
    src.applyMatrix4(mat4);
    src.computeBoundingBox();
    const c = src.boundingBox.getCenter(new THREE.Vector3());
    prepared.push({ geo: src, center: [c.x, c.z, it.whole !== false ? 1 : 0] });
    totalVerts += src.attributes.position.count;
  }

  const pos = new Float32Array(totalVerts * 3);
  const nor = new Float32Array(totalVerts * 3);
  const uv = new Float32Array(totalVerts * 2);
  const ctr = new Float32Array(totalVerts * 3);
  let vOff = 0;
  for (const { geo, center } of prepared) {
    const count = geo.attributes.position.count;
    pos.set(geo.attributes.position.array, vOff * 3);
    nor.set(geo.attributes.normal.array, vOff * 3);
    if (geo.attributes.uv) uv.set(geo.attributes.uv.array, vOff * 2);
    for (let i = 0; i < count; i++) {
      ctr[(vOff + i) * 3] = center[0];
      ctr[(vOff + i) * 3 + 1] = center[1];
      ctr[(vOff + i) * 3 + 2] = center[2];
    }
    vOff += count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setAttribute('aCenter', new THREE.BufferAttribute(ctr, 3));
  return out;
}

// Procedural Frenet-frame organic tree (adapted from Casa Serra's olive tree generator)
// with tapered trunk, child branches, organic foliage clusters, and optional 2D plan crown ring.
export function branchTree(parent, {
  height = 2.6, radius = 0.13, branches = 4, seed = 11,
  pos = [0, 0, 0], trunkPal = 'ochre', crownPal = 'green', crownRing = true, name = 'Tree',
} = {}) {
  const rnd = rng(seed).next;
  const group = new THREE.Group();
  group.position.set(...pos);
  parent.add(group);

  function tubeAlong(pts, r0, r1, segs = 12, radSegs = 8) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => V(...p)));
    const frames = curve.computeFrenetFrames(segs, false);
    const vCount = (segs + 1) * (radSegs + 1);
    const pArr = new Float32Array(vCount * 3);
    const nArr = new Float32Array(vCount * 3);
    const uvArr = new Float32Array(vCount * 2);
    const idx = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const pt = curve.getPointAt(u);
      const r = lerp(r0, r1, Math.pow(u, 0.8));
      const N = frames.normals[i], B = frames.binormals[i];
      for (let j = 0; j <= radSegs; j++) {
        const v = j / radSegs;
        const a = v * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        const nx = ca * N.x + sa * B.x;
        const ny = ca * N.y + sa * B.y;
        const nz = ca * N.z + sa * B.z;
        const k = i * (radSegs + 1) + j;
        pArr[k * 3] = pt.x + r * nx;
        pArr[k * 3 + 1] = pt.y + r * ny;
        pArr[k * 3 + 2] = pt.z + r * nz;
        nArr[k * 3] = nx; nArr[k * 3 + 1] = ny; nArr[k * 3 + 2] = nz;
        uvArr[k * 2] = v; uvArr[k * 2 + 1] = u * height;
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < radSegs; j++) {
        const a = i * (radSegs + 1) + j;
        const b = (i + 1) * (radSegs + 1) + j;
        idx.push(a, b, b + 1, a, b + 1, a + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nArr, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
    g.setIndex(idx);
    return g;
  }

  const trunkTopY = height * 0.56;
  const trunkPts = [
    [0, 0, 0],
    [(rnd() - 0.5) * 0.14, trunkTopY * 0.45, (rnd() - 0.5) * 0.14],
    [(rnd() - 0.5) * 0.18, trunkTopY, (rnd() - 0.5) * 0.18],
  ];
  const woodGeos = [tubeAlong(trunkPts, radius, radius * 0.55, 10, 8)];
  const crownGeos = [];
  const fork = trunkPts[2];

  for (let b = 0; b < branches; b++) {
    const az = (b / branches) * Math.PI * 2 + (rnd() - 0.5) * 0.45;
    const spread = height * (0.28 + rnd() * 0.12);
    const tip = [
      fork[0] + Math.cos(az) * spread,
      fork[1] + height * (0.28 + rnd() * 0.14),
      fork[2] + Math.sin(az) * spread,
    ];
    const mid = [
      lerp(fork[0], tip[0], 0.5),
      lerp(fork[1], tip[1], 0.55) + 0.08,
      lerp(fork[2], tip[2], 0.5),
    ];
    woodGeos.push(tubeAlong([fork, mid, tip], radius * 0.52, radius * 0.18, 8, 6));

    const puff = new THREE.IcosahedronGeometry(height * (0.22 + rnd() * 0.06), 2);
    puff.scale(1.25, 0.68, 1.15);
    const pp = puff.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const vx = pp.getX(i), vy = pp.getY(i), vz = pp.getZ(i);
      const n = 1 + 0.12 * Math.sin(vx * 9 + b) * Math.cos(vz * 8 - b);
      pp.setXYZ(i, vx * n + tip[0], vy * n + tip[1], vz * n + tip[2]);
    }
    puff.computeVertexNormals();
    crownGeos.push(puff);
  }

  const trunkMesh = part(group, mergeBufferGeos(woodGeos), {
    pal: trunkPal, tone: 'mid', name: `${name} trunk`,
  });
  const crownMesh = part(group, mergeBufferGeos(crownGeos), {
    pal: crownPal, tone: 'hi', name: `${name} canopy`,
  });

  let ring = null;
  if (crownRing) {
    ring = lines(group, swingArc(0, 0, height * 0.46, 0, 360, 0.005, 28), PALETTE.ink[1], 0.65);
    ring.userData.noCut = true;
  }
  return { group, trunkMesh, crownMesh, ring };
}

// ---------------------------------------------------------------------------
// 4. 2D Blueprint Sheet & Declarative Floorplan Compiler (swingArc, dimChain, buildSheet, extrudePlan)
// ---------------------------------------------------------------------------

// Generates 3D line-segment coordinates for a horizontal circular arc in the XZ plane (door swings, tree crowns).
export function swingArc(cx, cz, r, a0Deg = 0, a1Deg = 90, y = 0.004, segs = 18) {
  const coords = [];
  for (let i = 0; i < segs; i++) {
    const t0 = (a0Deg + ((a1Deg - a0Deg) * i) / segs) * DEG;
    const t1 = (a0Deg + ((a1Deg - a0Deg) * (i + 1)) / segs) * DEG;
    coords.push(
      cx + Math.cos(t0) * r, y, cz + Math.sin(t0) * r,
      cx + Math.cos(t1) * r, y, cz + Math.sin(t1) * r,
    );
  }
  return coords;
}

// Generates 3D line-segment coordinates for a sliding-door track + directional slide arrow in the XZ plane.
export function slideArrow(x0, z0, x1, z1, y = 0.004, headSize = 0.14) {
  const dx = x1 - x0, dz = z1 - z0;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len, uz = dz / len;
  const px = -uz, pz = ux;
  const mx = 0.5 * (x0 + x1), mz = 0.5 * (z0 + z1);
  const tipX = mx + ux * len * 0.22, tipZ = mz + uz * len * 0.22;
  const tailX = mx - ux * len * 0.22, tailZ = mz - uz * len * 0.22;
  const off = 0.14;
  const ax0 = tailX + px * off, az0 = tailZ + pz * off;
  const ax1 = tipX + px * off, az1 = tipZ + pz * off;
  const hs = Math.min(headSize, len * 0.18);
  const hw = hs * 0.5;
  return [
    x0, y, z0, x1, y, z1,
    ax0, y, az0, ax1, y, az1,
    ax1, y, az1, ax1 - ux * hs + px * hw, y, az1 - uz * hs + pz * hw,
    ax1, y, az1, ax1 - ux * hs - px * hw, y, az1 - uz * hs - pz * hw,
  ];
}

// Builds an architectural/scientific dimension chain on the XZ datum plane with 45-deg slash ticks and extension lines.
export function dimChain(parent, {
  along = 'x', at = 0, ticks = [], from = undefined, side = 1,
  y = 0.004, color = '#2c2c30', witnessColor = '#b4b4b8', tickSize = 0.16, minSpan = 0.25,
  unit = 'm', decimals = 2, scale = 1, fmt = null,
} = {}) {
  const group = new THREE.Group();
  parent.add(group);
  if (ticks.length < 2) return { group, measurements: [] };

  const sorted = [...ticks].sort((a, b) => a - b);
  const a0 = sorted[0], a1 = sorted[sorted.length - 1];
  const mainSegs = [];
  const witnessSegs = [];
  const measurements = [];
  const T = tickSize;
  const formatSpan = span => {
    if (typeof fmt === 'function') return fmt(span);
    const val = (span * scale).toFixed(decimals);
    return unit ? `${val} ${unit}` : val;
  };

  if (along === 'z') {
    mainSegs.push(at, y, a0 - T * 1.5, at, y, a1 + T * 1.5);
    for (const t of sorted) {
      mainSegs.push(at - T, y, t - T, at + T, y, t + T);
      if (from !== undefined) witnessSegs.push(from, y, t, at + side * T * 1.4, y, t);
    }
    for (let i = 0; i < sorted.length - 1; i++) {
      const span = sorted[i + 1] - sorted[i];
      if (span < minSpan) continue;
      const midZ = 0.5 * (sorted[i] + sorted[i + 1]);
      measurements.push({
        span,
        text: formatSpan(span),
        mid: V(at + side * (T * 2.2), y, midZ),
      });
    }
  } else {
    mainSegs.push(a0 - T * 1.5, y, at, a1 + T * 1.5, y, at);
    for (const t of sorted) {
      mainSegs.push(t - T, y, at - T, t + T, y, at + T);
      if (from !== undefined) witnessSegs.push(t, y, from, t, y, at + side * T * 1.4);
    }
    for (let i = 0; i < sorted.length - 1; i++) {
      const span = sorted[i + 1] - sorted[i];
      if (span < minSpan) continue;
      const midX = 0.5 * (sorted[i] + sorted[i + 1]);
      measurements.push({
        span,
        text: formatSpan(span),
        mid: V(midX, y, at + side * (T * 2.2)),
      });
    }
  }

  lines(group, mainSegs, color, 0.9);
  if (witnessSegs.length) lines(group, witnessSegs, witnessColor, 0.7);
  return { group, measurements };
}

// Builds a complete 2D technical/textbook drawing sheet on the XZ datum plane
// (dimension chains, curves, vectors/arrows, circles/arcs, crosshairs, swing arcs, slide tracks, hatch grids, border).
export function buildSheet(parent, {
  dims = [], doors = [], slides = [], grids = [], border = null,
  curves = [], vectors = [], circles = [], crosshairs = [],
  y = 0.004, color = '#2c2c30', faintColor = '#c4c4be',
} = {}) {
  const group = new THREE.Group();
  group.userData.noCut = true;
  parent.add(group);
  const measurements = [];

  for (const d of dims) {
    const res = dimChain(group, { y, color, ...d });
    measurements.push(...res.measurements);
  }

  const arcCoords = [];
  for (const d of doors) {
    const r = d.width ?? d.r ?? 0.9;
    const a0 = d.a0 ?? 0;
    const a1 = d.a1 ?? 90;
    arcCoords.push(...swingArc(d.x, d.z, r, a0, a1, y));
    const rad = a1 * DEG;
    arcCoords.push(d.x, y, d.z, d.x + Math.cos(rad) * r, y, d.z + Math.sin(rad) * r);
  }
  for (const sl of slides) {
    const x0 = sl.x0 ?? sl.x ?? 0, z0 = sl.z0 ?? sl.z ?? 0;
    const x1 = sl.x1 ?? x0 + (sl.width ?? 1.8), z1 = sl.z1 ?? z0;
    arcCoords.push(...slideArrow(x0, z0, x1, z1, y));
  }
  for (const c of circles) {
    arcCoords.push(...swingArc(c.x ?? 0, c.z ?? 0, c.r ?? 1, c.a0 ?? 0, c.a1 ?? 360, y, c.segs ?? 48));
  }
  if (arcCoords.length) lines(group, arcCoords, color, 0.75);

  // 2D textbook curves / polylines on the datum plane
  for (const cv of curves) {
    const pts = cv.points || [];
    if (pts.length < 2) continue;
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      segs.push(pts[i][0], y, pts[i][1], pts[i + 1][0], y, pts[i + 1][1]);
    }
    if (cv.closed && pts.length > 2) {
      segs.push(pts[pts.length - 1][0], y, pts[pts.length - 1][1], pts[0][0], y, pts[0][1]);
    }
    lines(group, segs, cv.color || color, cv.opacity ?? 0.85);
  }

  // 2D textbook vectors / optical rays with arrowheads on the datum plane
  for (const vec of vectors) {
    const [x0, z0] = vec.from || [0, 0];
    const [x1, z1] = vec.to || [1, 0];
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len, uz = dz / len;
    const px = -uz, pz = ux;
    const hs = vec.headSize ?? 0.16;
    const hw = hs * 0.5;
    const segs = [
      x0, y, z0, x1, y, z1,
      x1, y, z1, x1 - ux * hs + px * hw, y, z1 - uz * hs + pz * hw,
      x1, y, z1, x1 - ux * hs - px * hw, y, z1 - uz * hs - pz * hw,
    ];
    lines(group, segs, vec.color || color, vec.opacity ?? 0.9);
  }

  // 2D crosshairs (focal points F, 2F, equilibrium bundles, lattice nodes)
  if (crosshairs.length) {
    const chSegs = [];
    for (const ch of crosshairs) {
      const cx = ch.x ?? 0, cz = ch.z ?? 0, s = ch.size ?? 0.14;
      chSegs.push(cx - s, y, cz, cx + s, y, cz, cx, y, cz - s, cx, y, cz + s);
    }
    lines(group, chSegs, color, 0.85);
  }

  const gridCoords = [];
  for (const gr of grids) {
    const [x0, z0, x1, z1] = gr.box;
    const step = gr.step ?? 1.0;
    for (let x = x0 + step; x < x1 - 1e-3; x += step) gridCoords.push(x, y, z0, x, y, z1);
    for (let z = z0 + step; z < z1 - 1e-3; z += step) gridCoords.push(x0, y, z, x1, y, z);
  }
  if (gridCoords.length) lines(group, gridCoords, faintColor, 0.55);

  if (border) {
    const [bx0, bz0, bx1, bz1] = border;
    const bCoords = [];
    for (const inset of [0, 0.14]) {
      const x0 = bx0 + inset, z0 = bz0 + inset, x1 = bx1 - inset, z1 = bz1 - inset;
      bCoords.push(
        x0, y, z0, x1, y, z0,
        x1, y, z0, x1, y, z1,
        x1, y, z1, x0, y, z1,
        x0, y, z1, x0, y, z0,
      );
    }
    lines(group, bCoords, color, 0.85);
  }

  return { group, measurements };
}

// Compiles a declarative 2D floorplan/diagram specification into a watertight 3D architectural model
// plus a synchronized 2D blueprint annotation sheet on the ground plane.
export function extrudePlan(parent, spec = {}, {
  wallThickness = spec.wallThickness ?? 0.2,
  wallHeight = spec.wallHeight ?? 2.8,
  slabThickness = spec.slabThickness ?? 0.12,
  pal = 'paper',
  floorPal = 'board',
  framePal = 'ink',
  poche = true,
  sheet = true,
} = {}) {
  const root = new THREE.Group();
  parent.add(root);

  const S = new RectSolid();
  const bounds = planBounds(spec);

  // 1. Add walls to RectSolid
  for (const w of spec.walls || []) {
    const isArr = Array.isArray(w);
    const x0 = isArr ? w[0] : w.x0;
    const z0 = isArr ? w[1] : w.z0;
    const x1 = isArr ? w[2] : w.x1;
    const z1 = isArr ? w[3] : w.z1;
    const th = (isArr ? w[4] : w.thickness) ?? wallThickness;
    const h = (isArr ? w[5] : w.height) ?? (w.type === 'low' ? 1.1 : wallHeight);
    const y0 = w.y0 ?? 0;
    const half = th * 0.5;
    S.add(
      Math.min(x0, x1) - half, y0, Math.min(z0, z1) - half,
      Math.max(x0, x1) + half, y0 + h, Math.max(z0, z1) + half,
    );
  }

  // 2. Subtract window openings (leaving sill below and lintel above) and build 3D frames + panes
  const windowsGroup = new THREE.Group();
  root.add(windowsGroup);
  const windows = [];
  for (const win of spec.windows || []) {
    const sill = win.sill ?? 0.9;
    const lintel = win.lintel ?? 2.3;
    const th = win.thickness ?? wallThickness * 1.2;
    const isHoriz = Math.abs(win.x1 - win.x0) >= Math.abs(win.z1 - win.z0);
    const x0 = Math.min(win.x0, win.x1) - (isHoriz ? 0 : th * 0.6);
    const x1 = Math.max(win.x0, win.x1) + (isHoriz ? 0 : th * 0.6);
    const z0 = Math.min(win.z0, win.z1) - (isHoriz ? th * 0.6 : 0);
    const z1 = Math.max(win.z0, win.z1) + (isHoriz ? th * 0.6 : 0);
    S.sub(x0, sill, z0, x1, lintel, z1);

    const cx = 0.5 * (win.x0 + win.x1);
    const cz = 0.5 * (win.z0 + win.z1);
    const cy = 0.5 * (sill + lintel);
    const span = Math.hypot(win.x1 - win.x0, win.z1 - win.z0);
    const wh = lintel - sill;
    const wg = new THREE.Group();
    wg.position.set(cx, cy, cz);
    if (!isHoriz) wg.rotation.y = Math.PI / 2;
    windowsGroup.add(wg);

    // Outer frame + glass pane + optional vertical mullions
    const frameDepth = Math.min(wallThickness * 0.65, 0.12);
    const glassMat = shadeMat('blue', { opacity: 0.24 });
    const pane = part(wg, box(span - 0.04, wh - 0.04, 0.02, 0.002), {
      pal: 'blue', tone: 'faint', mat: glassMat, name: win.name || 'Window pane',
    });
    const mullions = win.mullions ?? Math.max(1, Math.round(span / 1.1));
    for (let m = 0; m <= mullions; m++) {
      const mx = -span * 0.5 + (m / mullions) * span;
      part(wg, box(0.03, wh, frameDepth, 0.003), {
        pal: framePal, tone: 'mid', pos: [mx, 0, 0], name: 'Window mullion',
      });
    }
    part(wg, box(span, 0.035, frameDepth + 0.02, 0.003), { pal: framePal, tone: 'mid', pos: [0, -wh * 0.5 + 0.017, 0], name: 'Window sill bar' });
    part(wg, box(span, 0.03, frameDepth, 0.003), { pal: framePal, tone: 'mid', pos: [0, wh * 0.5 - 0.015, 0], name: 'Window head bar' });
    windows.push({ group: wg, pane });
  }

  // 3. Subtract door openings (leaving lintel above) and build hinged 3D door leaves + swing arcs
  const doorsGroup = new THREE.Group();
  root.add(doorsGroup);
  const doors = [];
  const sheetDoors = [];
  for (const d of spec.doors || []) {
    const w = d.width ?? 0.9;
    const h = d.height ?? 2.2;
    const th = d.thickness ?? wallThickness * 1.25;
    const axis = d.axis || 'x'; // 'x' = opening runs along X from d.x to d.x + dir*w
    const dir = d.dir ?? 1;
    const swing = d.swing ?? 1; // +1 or -1 perpendicular to wall
    const openAngle = d.openAngle ?? 70; // degrees when fully open

    if (axis === 'x') {
      const xA = Math.min(d.x, d.x + dir * w);
      const xB = Math.max(d.x, d.x + dir * w);
      S.sub(xA, 0, d.z - th * 0.6, xB, h, d.z + th * 0.6);
    } else {
      const zA = Math.min(d.z, d.z + dir * w);
      const zB = Math.max(d.z, d.z + dir * w);
      S.sub(d.x - th * 0.6, 0, zA, d.x + th * 0.6, h, zB);
    }

    const pivot = new THREE.Group();
    pivot.position.set(d.x, 0, d.z);
    doorsGroup.add(pivot);

    const leafThickness = 0.04;
    const leafGeo = axis === 'x'
      ? bevelBox(w, h - 0.02, leafThickness, 0.004)
      : bevelBox(leafThickness, h - 0.02, w, 0.004);
    const leafPos = axis === 'x'
      ? [dir * w * 0.5, h * 0.5, 0]
      : [0, h * 0.5, dir * w * 0.5];
    const leaf = part(pivot, leafGeo, {
      pal: d.pal || 'ochre', tone: 'hi', pos: leafPos, name: d.name || 'Door leaf',
    });

    // Lever handle on both sides of the door leaf
    const handlePos = axis === 'x'
      ? [dir * (w - 0.1), 1.0, 0]
      : [0, 1.0, dir * (w - 0.1)];
    const handleGeo = axis === 'x' ? box(0.11, 0.02, 0.12, 0.004) : box(0.12, 0.02, 0.11, 0.004);
    part(pivot, handleGeo, { pal: framePal, tone: 'hi', pos: handlePos, name: 'Door handle' });

    const closedYaw = 0;
    const maxYaw = -swing * dir * openAngle * DEG;
    const setOpen = frac => {
      pivot.rotation.y = lerp(closedYaw, maxYaw, clamp01(frac));
    };
    setOpen(d.open ?? 0.65);

    const a0 = axis === 'x' ? (dir > 0 ? 0 : 180) : (dir > 0 ? 90 : 270);
    const a1 = a0 + swing * dir * openAngle;
    sheetDoors.push({ x: d.x, z: d.z, width: w, a0, a1 });
    doors.push({ pivot, leaf, setOpen, spec: d });
  }

  // 3b. Subtract sliding door openings and build multi-panel sliding glass doors (adapted from floorplan-3d)
  const slidesGroup = new THREE.Group();
  root.add(slidesGroup);
  const slides = [];
  const sheetSlides = [];
  for (const sl of spec.slides || []) {
    const x0 = sl.x0 ?? sl.x ?? 0, z0 = sl.z0 ?? sl.z ?? 0;
    const x1 = sl.x1 ?? (x0 + (sl.width ?? 1.8)), z1 = sl.z1 ?? z0;
    const h = sl.height ?? 2.25;
    const th = sl.thickness ?? wallThickness * 1.25;
    const isHoriz = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
    const sx0 = Math.min(x0, x1) - (isHoriz ? 0 : th * 0.6);
    const sx1 = Math.max(x0, x1) + (isHoriz ? 0 : th * 0.6);
    const sz0 = Math.min(z0, z1) - (isHoriz ? th * 0.6 : 0);
    const sz1 = Math.max(z0, z1) + (isHoriz ? th * 0.6 : 0);
    S.sub(sx0, 0, sz0, sx1, h, sz1);

    const span = Math.hypot(x1 - x0, z1 - z0);
    const panelW = span * 0.52;
    const sg = new THREE.Group();
    sg.position.set(0.5 * (x0 + x1), h * 0.5, 0.5 * (z0 + z1));
    if (!isHoriz) sg.rotation.y = Math.PI / 2;
    slidesGroup.add(sg);

    const gMat = shadeMat('blue', { opacity: 0.26 });
    const fixedPanel = part(sg, box(panelW, h - 0.04, 0.025, 0.003), {
      pal: 'blue', tone: 'faint', mat: gMat, pos: [-span * 0.24, 0, -0.018], name: sl.name || 'Sliding door fixed panel',
    });
    const movingPanel = part(sg, box(panelW, h - 0.04, 0.025, 0.003), {
      pal: 'blue', tone: 'faint', mat: gMat, pos: [span * 0.24, 0, 0.018], name: sl.name || 'Sliding door moving panel',
    });
    const setSlide = frac => {
      movingPanel.position.x = lerp(span * 0.24, -span * 0.22, clamp01(frac));
    };
    setSlide(sl.open ?? 0.4);
    sheetSlides.push({ x0, z0, x1, z1 });
    slides.push({ group: sg, fixedPanel, movingPanel, setSlide, spec: sl });
  }

  // 4. Build the watertight wall shell and its true corner ink lines
  const built = S.build(() => 'walls', () => 'walls');
  const wallGeo = built.geos.walls || new THREE.BufferGeometry();
  const wallMat = shadeMat(pal, { poche });
  const wallsMesh = part(root, wallGeo, {
    pal, tone: 'hi', mat: wallMat, poche, name: 'Walls',
  });
  const wallEdges = built.edges.walls?.length
    ? lines(root, built.edges.walls, PALETTE.ink[1], 0.9)
    : null;

  // 5. Build room floor slabs (marked noCut so horizontal section cuts never clip the floor)
  const floorsGroup = new THREE.Group();
  floorsGroup.userData.noCut = true;
  root.add(floorsGroup);
  const floors = [];
  for (const r of spec.rooms || []) {
    let fMesh;
    if (r.box) {
      const [x0, z0, x1, z1] = r.box;
      const fw = Math.abs(x1 - x0), fd = Math.abs(z1 - z0);
      fMesh = part(floorsGroup, box(fw, slabThickness, fd, 0.004), {
        pal: r.pal || floorPal,
        tone: 'lo',
        mat: r.mat || null,
        pos: [0.5 * (x0 + x1), -slabThickness * 0.5, 0.5 * (z0 + z1)],
        name: r.name || r.key || 'Room floor',
      });
    } else if (r.poly && r.poly.length >= 3) {
      const sh = new THREE.Shape();
      r.poly.forEach(([x, z], i) => { if (i === 0) sh.moveTo(x, -z); else sh.lineTo(x, -z); });
      sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: slabThickness, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      g.translate(0, -slabThickness, 0);
      uvMetres(g);
      fMesh = part(floorsGroup, g, {
        pal: r.pal || floorPal,
        tone: 'lo',
        mat: r.mat || null,
        name: r.name || r.key || 'Room floor',
      });
    }
    if (fMesh) {
      fMesh.userData.noCut = true;
      floors.push(fMesh);
    }
  }

  // 6. Optional 2D blueprint annotation sheet on the ground datum plane
  let sheetObj = null;
  if (sheet) {
    const sheetSpec = typeof sheet === 'object' ? sheet : {};
    sheetObj = buildSheet(root, {
      dims: spec.dims || sheetSpec.dims || [],
      doors: [...sheetDoors, ...(sheetSpec.doors || [])],
      slides: [...sheetSlides, ...(sheetSpec.slides || [])],
      grids: spec.grids || sheetSpec.grids || [],
      border: spec.border || sheetSpec.border || null,
      y: sheetSpec.y ?? 0.004,
    });
  }

  // 7. Dynamic section-cut and vertical extrusion controllers
  const cutPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), spec.cutY ?? 10);
  function setCutY(y) {
    const active = y !== null && y !== undefined && y <= wallHeight + 0.05;
    if (active) cutPlane.constant = y;
    applyClipPlanes(root, active ? [cutPlane] : [], { poche });
  }
  if (spec.cutY !== undefined) setCutY(spec.cutY);

  function setDoors(openFrac) {
    for (const d of doors) d.setOpen(openFrac);
    for (const sl of slides) sl.setSlide(openFrac);
  }

  function setSlides(openFrac) {
    for (const sl of slides) sl.setSlide(openFrac);
  }

  function setGrow(wallScaleY = 1, detailScaleY = wallScaleY) {
    const wy = Math.max(0.001, wallScaleY);
    const dy = Math.max(0.001, detailScaleY);
    wallsMesh.scale.y = wy;
    if (wallEdges) wallEdges.scale.y = wy;
    windowsGroup.scale.y = wy;
    doorsGroup.scale.y = dy;
    slidesGroup.scale.y = dy;
  }

  return {
    root,
    solid: S,
    built,
    wallsMesh,
    wallEdges,
    floors,
    windows,
    doors,
    slides,
    sheet: sheetObj,
    bounds,
    setCutY,
    setDoors,
    setSlides,
    setGrow,
  };
}

// ---------------------------------------------------------------------------
// 5. Procedural PBR Textures & Ink-to-PBR Spatial Reveal Shader System
// ---------------------------------------------------------------------------

// Generates deterministic procedural textures ('wood', 'marble', 'tile', 'terrazzo', 'brushed', 'linen', 'painting').
// Uses THREE.DataTexture so it runs identically in headless Node (selftest.mjs) and browsers with zero external assets.
export function procTex(kind = 'wood', {
  width = 256, height = 256, seed = 7, repeat = [1, 1], rot = 0,
  base = null, accent = null,
} = {}) {
  const rnd = rng(seed).next;
  const data = new Uint8Array(width * height * 4);
  const setPx = (x, y, r, g, b) => {
    const idx = ((y & (height - 1)) * width + (x & (width - 1))) * 4;
    data[idx] = Math.max(0, Math.min(255, r | 0));
    data[idx + 1] = Math.max(0, Math.min(255, g | 0));
    data[idx + 2] = Math.max(0, Math.min(255, b | 0));
    data[idx + 3] = 255;
  };

  if (kind === 'wood') {
    const [br, bg, bb] = base || [184, 138, 92];
    const planks = 6;
    const pw = width / planks;
    const offsets = Array.from({ length: planks }, () => rnd() * height);
    const tones = Array.from({ length: planks }, () => (rnd() - 0.5) * 18);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pi = Math.min(planks - 1, Math.floor(x / pw));
        const seamX = (x % pw) < 1.5;
        const seamY = Math.abs(((y + offsets[pi]) % (height * 0.5)) - 1) < 1.2;
        const grain = Math.sin((y + offsets[pi]) * 0.14 + Math.sin(x * 0.35) * 2.2) * 7;
        const d = (seamX || seamY) ? -28 : tones[pi] + grain;
        setPx(x, y, br + d, bg + d * 0.82, bb + d * 0.65);
      }
    }
  } else if (kind === 'marble') {
    const [br, bg, bb] = base || [236, 233, 226];
    const [ar, ag, ab] = accent || [168, 162, 154];
    const phaseX = rnd() * 6.28, phaseY = rnd() * 6.28;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width, v = y / height;
        const turb = Math.sin(u * 6.28 + phaseX + 1.8 * Math.sin(v * 6.28 + phaseY))
          + 0.5 * Math.sin((u + v) * 12.56 + 0.8 * Math.cos(u * 18.8));
        const vein = Math.pow(Math.max(0, 1 - Math.abs(turb) * 1.6), 3);
        setPx(x, y, lerp(br, ar, vein), lerp(bg, ag, vein), lerp(bb, ab, vein));
      }
    }
  } else if (kind === 'tile') {
    const [br, bg, bb] = base || [232, 230, 224];
    const [gr, gg, gb] = accent || [175, 173, 168];
    const cells = 4;
    const cw = width / cells, ch = height / cells;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isGrout = (x % cw) < 2 || (y % ch) < 2;
        const n = (rnd() - 0.5) * 6;
        if (isGrout) setPx(x, y, gr, gg, gb);
        else setPx(x, y, br + n, bg + n, bb + n);
      }
    }
  } else if (kind === 'terrazzo') {
    const [br, bg, bb] = base || [234, 229, 220];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) setPx(x, y, br, bg, bb);
    }
    const palette = [
      [182, 142, 108], [130, 140, 136], [202, 188, 168], [96, 86, 78], [198, 118, 92],
    ];
    for (let c = 0; c < 180; c++) {
      const cx = Math.floor(rnd() * width), cy = Math.floor(rnd() * height);
      const rx = 2 + Math.floor(rnd() * 5), ry = 2 + Math.floor(rnd() * 5);
      const [cr, cg, cb] = palette[c % palette.length];
      for (let dy = -ry; dy <= ry; dy++) {
        for (let dx = -rx; dx <= rx; dx++) {
          if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) setPx(cx + dx, cy + dy, cr, cg, cb);
        }
      }
    }
  } else if (kind === 'brushed') {
    const [br, bg, bb] = base || [196, 198, 202];
    for (let y = 0; y < height; y++) {
      const streak = (rnd() - 0.5) * 16;
      for (let x = 0; x < width; x++) {
        const fine = Math.sin(x * 0.25 + y * 1.7) * 4 + streak;
        setPx(x, y, br + fine, bg + fine, bb + fine);
      }
    }
  } else {
    // 'linen' or 'painting'
    const [br, bg, bb] = base || [226, 219, 206];
    for (let y = 0; y < height; y++) {
      const horizon = kind === 'painting' && Math.abs(y - height * 0.48) < 3 ? -55 : (kind === 'painting' && y > height * 0.48 ? -32 : 0);
      for (let x = 0; x < width; x++) {
        const weave = (Math.sin(x * 1.5) + Math.sin(y * 1.5)) * 4 + horizon;
        setPx(x, y, br + weave, bg + weave * 0.9, bb + weave * 0.8);
      }
    }
  }

  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.rotation = rot;
  tex.needsUpdate = true;
  return tex;
}

// World-space 3D macro value-noise de-tiling shader injection (adapted from Casa Serra FX.tweak).
// Modulates diffuse albedo and roughness at two low spatial frequencies in world coordinates so
// repeating procedural textures never look tiled across large walls or floors.
export function tweakMat(material, { macro = 0.08, scale = 0.7, rough = 0.06 } = {}) {
  const own = {
    uMacroAmp: { value: macro },
    uMacroScale: { value: scale },
    uMacroRough: { value: rough },
  };
  material.userData.tweak = own;
  const NOISE_GLSL = `
    varying vec3 vMacroPos;
    uniform float uMacroAmp;
    uniform float uMacroScale;
    uniform float uMacroRough;
    float hash31(vec3 p) {
      p = fract(p * 0.1031);
      p += dot(p, p.yzx + 33.33);
      return fract((p.x + p.y) * p.z);
    }
    float vnoise3(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
            mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
            mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y),
        f.z
      );
    }
  `;
  const prevCompile = material.onBeforeCompile;
  material.onBeforeCompile = sh => {
    if (prevCompile) prevCompile(sh);
    Object.assign(sh.uniforms, own);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMacroPos;')
      .replace('#include <fog_vertex>', '#include <fog_vertex>\nvMacroPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + NOISE_GLSL)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          float n1 = vnoise3(vMacroPos * uMacroScale);
          float n2 = vnoise3(vMacroPos * (uMacroScale * 2.3) + 7.1);
          float m = (n1 * 0.65 + n2 * 0.35) - 0.5;
          diffuseColor.rgb *= (1.0 + m * uMacroAmp * 2.0);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        {
          float nr = vnoise3(vMacroPos * (uMacroScale * 1.7) + 3.7) - 0.5;
          roughnessFactor = clamp(roughnessFactor + nr * uMacroRough * 2.0, 0.04, 1.0);
        }`);
  };
  material.customProgramCacheKey = () => `tweak_${macro}_${scale}_${rough}`;
  return material;
}

// Spatial Paper-to-PBR Reveal Controller (adapted from Casa Larga's room-by-room material sweep).
// Each zone `{ key, box: [x0, z0, x1, z1], dir: [dx, dz], ceil: 3.2 }` sweeps independently from 0 (ink drawing) to 1 (PBR material).
export function createRevealController(zones = [], {
  paper = '#fbfbfa', ink = '#18181a', soft = 0.9, cutY = 10, inkTone = 0.045,
} = {}) {
  const list = zones.length ? zones : [{ key: 'main', box: [-50, -50, 50, 50], dir: [0, -1], ceil: 20 }];
  const IDLE = -1e4;
  const CUT = new THREE.Plane(new THREE.Vector3(0, -1, 0), cutY);

  const SW = list.map(z => {
    const [x0, z0, x1, z1] = z.box;
    const dx = z.dir?.[0] ?? 0, dz = z.dir?.[1] ?? -1;
    const ox = dx > 0 ? x0 : dx < 0 ? x1 : 0.5 * (x0 + x1);
    const oz = dz > 0 ? z0 : dz < 0 ? z1 : 0.5 * (z0 + z1);
    const len = Math.abs(dx) * Math.abs(x1 - x0) + Math.abs(dz) * Math.abs(z1 - z0);
    return { ox, oz, dx, dz, len };
  });

  const uniforms = {
    uPaper: { value: new THREE.Color(paper) },
    uInkCol: { value: new THREE.Color(ink) },
    uRoomBox: { value: list.map(z => new THREE.Vector4(Math.min(z.box[0], z.box[2]), Math.min(z.box[1], z.box[3]), Math.max(z.box[0], z.box[2]), Math.max(z.box[1], z.box[3]))) },
    uRoomSweep: { value: SW.map(s => new THREE.Vector4(s.ox, s.oz, s.dx, s.dz)) },
    uRoomState: { value: list.map(z => new THREE.Vector2(IDLE, z.ceil ?? 4.0)) },
    uSoft: { value: soft },
    uInkTone: { value: inkTone },
  };

  const sweepPlanes = {};
  list.forEach((z, i) => {
    sweepPlanes[z.key] = new THREE.Plane(new THREE.Vector3(SW[i].dx, 0, SW[i].dz), 1e4);
  });

  function setReveal(key, t) {
    const i = list.findIndex(z => z.key === key);
    if (i < 0) return;
    const u = clamp01(t);
    const s = SW[i];
    const front = u <= 0 ? IDLE : -0.4 + u * (s.len + soft + 0.8);
    uniforms.uRoomState.value[i].x = front;
    sweepPlanes[key].constant = -(s.ox * s.dx + s.oz * s.dz + front);
  }

  function setCutY(y) {
    CUT.constant = y;
  }

  return { zones: list, uniforms, cutPlane: CUT, sweepPlanes, setReveal, setCutY };
}

// Augments any MeshStandardMaterial or MeshPhysicalMaterial so it blends between flat architectural paper-and-ink
// (with solid ink backface pochè on clipped walls) and full PBR shading with analytical room ambient occlusion.
export function inkAware(material, ctrl, {
  backInk = true, glass = false, sat = 1, contrast = 1, tint = [1, 1, 1], mean = [0.5, 0.5, 0.5], ao = 0.25,
} = {}) {
  const NZ = ctrl.zones.length;
  material.side = THREE.DoubleSide;
  material.clippingPlanes = [ctrl.cutPlane];
  material.polygonOffset = !glass;
  material.polygonOffsetFactor = 1;
  material.polygonOffsetUnits = 1;

  const own = {
    uBackInk: { value: backInk ? 1 : 0 },
    uGlass: { value: glass ? 1 : 0 },
    uSat: { value: sat },
    uContrast: { value: contrast },
    uTint: { value: new THREE.Vector3(...tint) },
    uMean: { value: new THREE.Vector3(...mean) },
    uAO: { value: ao },
  };
  material.userData.ink = own;

  const DECL = `
    #define NR ${NZ}
    varying vec3 vWp;
    varying vec3 vWn;
    uniform vec3 uPaper;
    uniform vec3 uInkCol;
    uniform vec4 uRoomBox[NR];
    uniform vec4 uRoomSweep[NR];
    uniform vec2 uRoomState[NR];
    uniform float uSoft;
    uniform float uInkTone;
    uniform float uBackInk;
    uniform float uGlass;
    uniform float uSat;
    uniform float uContrast;
    uniform vec3 uTint;
    uniform vec3 uMean;
    uniform float uAO;
    int roomOf(vec3 q) {
      for (int i = 0; i < NR; i++) {
        vec4 b = uRoomBox[i];
        if (q.x > b.x && q.x < b.z && q.z > b.y && q.z < b.w && q.y < uRoomState[i].y + 0.1) return i;
      }
      return -1;
    }
    float inkOf(vec3 q, int r) {
      if (r < 0) return 1.0;
      vec4 s = uRoomSweep[r];
      float d = dot(q.xz - s.xy, s.zw);
      float f = uRoomState[r].x;
      return smoothstep(f - uSoft, f, d);
    }
    float roomAO(vec3 p, vec3 nn, int r) {
      if (r < 0) return 1.0;
      vec4 b = uRoomBox[r];
      float top = uRoomState[r].y;
      float R = 1.1;
      float occ = 0.0;
      occ += (1.0 - abs(nn.x)) * (exp(-max(p.x - b.x - 0.1, 0.0) / R) + exp(-max(b.z - 0.1 - p.x, 0.0) / R));
      occ += (1.0 - abs(nn.z)) * (exp(-max(p.z - b.y - 0.1, 0.0) / R) + exp(-max(b.w - 0.1 - p.z, 0.0) / R));
      occ += (1.0 - abs(nn.y)) * (exp(-max(p.y, 0.0) / R) + exp(-max(top - p.y, 0.0) / R));
      return clamp(1.0 - uAO * occ, 0.3, 1.0);
    }
  `;

  const prevCompile = material.onBeforeCompile;
  const prevCacheKey = typeof material.customProgramCacheKey === 'function' ? material.customProgramCacheKey() : '';
  material.onBeforeCompile = (sh, renderer) => {
    if (typeof prevCompile === 'function') prevCompile(sh, renderer);
    Object.assign(sh.uniforms, ctrl.uniforms, own);
    if (!sh.vertexShader.includes('varying vec3 vWp;')) {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWp;\nvarying vec3 vWn;')
        .replace('#include <fog_vertex>', '#include <fog_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWn = normalize(mat3(modelMatrix) * objectNormal);');
    }
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + DECL)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 c = uMean + (diffuseColor.rgb - uMean) * uContrast;
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          diffuseColor.rgb = max(mix(vec3(l), c, uSat), 0.0) * uTint;
        }`)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        {
          vec3 nnA = normalize(vWn) * (gl_FrontFacing ? 1.0 : -1.0);
          vec3 qA = vWp + nnA * 0.03;
          float rao = roomAO(vWp, nnA, roomOf(qA));
          reflectedLight.indirectDiffuse *= rao;
          reflectedLight.indirectSpecular *= rao;
          reflectedLight.directDiffuse *= mix(1.0, rao, 0.35);
        }`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        {
          vec3 nnI = normalize(vWn) * (gl_FrontFacing ? 1.0 : -1.0);
          vec3 qI = vWp + nnI * 0.03;
          float ink = inkOf(qI, roomOf(qI));
          if (uGlass > 0.5) {
            gl_FragColor.a *= (1.0 - ink);
          } else if (uBackInk > 0.5 && !gl_FrontFacing) {
            gl_FragColor.rgb = uInkCol;
          } else {
            vec3 wash = uPaper * (1.0 - uInkTone * (abs(nnI.x) + 0.55 * abs(nnI.z)));
            gl_FragColor.rgb = mix(gl_FragColor.rgb, wash, ink);
          }
        }`);
  };
  material.customProgramCacheKey = () => `${prevCacheKey ? prevCacheKey + '_' : ''}ink_${NZ}_${backInk ? 1 : 0}_${glass ? 1 : 0}`;
  return material;
}

// Soft analytical contact-shadow plane placed under furniture or apparatus on the floor.
export function contactShadow(parent, w, d, {
  pos = [0, 0.005, 0], strength = 0.45, color = '#18181a',
} = {}) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uStrength: { value: strength },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uStrength;
      void main() {
        vec2 e = smoothstep(vec2(0.0), vec2(0.5), vUv) * smoothstep(vec2(0.0), vec2(0.5), 1.0 - vUv);
        float a = e.x * e.y;
        gl_FragColor = vec4(uColor, a * a * uStrength);
      }
    `,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(...pos);
  m.userData = { noEdge: true };
  m.renderOrder = 2;
  parent.add(m);
  return m;
}

// ---------------------------------------------------------------------------
// 6. Universal STEM & Economics 2D-Diagram-to-3D Model Compilers
//    - revolveSection: 2D axisymmetric cross-section -> 3D cutaway solid of revolution (Physics, Chemistry, Biology, Maths)
//    - extrudeCrossSections: 2D base region + slice rule -> 3D Cavalieri cross-section solid (Maths, Economics, Statistics)
//    - extrudeLayers: 2D stratified/histological cross-section -> 3D multi-layer cutaway block (Biology, Physics, Chemistry)
//    - extrudeContours: 2D contour/isoquant map + constraint line -> 3D terraced & smooth surface (Economics, Maths, Chemistry)
// ---------------------------------------------------------------------------

// Shared triangle + face-normal emitter for procedural watertight meshes (revolveSection, extrudeContours).
function pushTriWithNormal(pos, nor, a, b, c) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz);
  if (len < 1e-9) return;
  nx /= len; ny /= len; nz /= len;
  pos.push(...a, ...b, ...c);
  nor.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
}

// Compiles a 2D axisymmetric cross-section profile [[s0, r0], [s1, r1], ...] along axis ('x' or 'y')
// into a 3D cutaway solid of revolution with watertight meridian caps, true edges, and a 2D datum sheet.
export function revolveSection(parent, spec = {}, {
  axis = spec.axis || 'x',
  segs = spec.segs ?? 36,
  maxAngle = spec.maxAngle ?? Math.PI * 1.5,
  pal = spec.pal || 'blue',
  tone = spec.tone || 'hi',
  opacity = spec.opacity ?? 1,
  poche = spec.poche ?? true,
  sheet = spec.sheet ?? true,
  yCenter = spec.yCenter ?? 0,
} = {}) {
  const root = new THREE.Group();
  parent.add(root);

  const outer = spec.profile || spec.outer || [[-0.5, 0], [-0.4, 1.0], [0, 1.2], [0.4, 1.0], [0.5, 0]];
  const rawInner = spec.innerProfile || spec.inner || spec.rInner || null;
  const inner = typeof rawInner === 'number'
    ? [[outer[0][0], rawInner], [outer[outer.length - 1][0], rawInner]]
    : rawInner;
  // Build closed 2D cross-section loop [(s, r), ...] in the positive-r half-plane
  const loop = inner
    ? [...outer, ...[...inner].reverse()]
    : (outer[0][1] === 0 && outer[outer.length - 1][1] === 0
      ? outer
      : [[outer[0][0], 0], ...outer, [outer[outer.length - 1][0], 0]]);

  function buildRevolvedGeo(sweepAngle) {
    const phiMax = Math.max(0.08, Math.min(Math.PI * 2, sweepAngle));
    const fullTurn = phiMax >= Math.PI * 2 - 1e-3;
    const nPhi = Math.max(6, Math.round((phiMax / (Math.PI * 2)) * segs));
    const nPts = loop.length;
    const pos = [];
    const nor = [];

    const to3D = (s, r, phi) => {
      const c = Math.cos(phi), sn = Math.sin(phi);
      return axis === 'x'
        ? [s, yCenter + r * sn, r * c]
        : [r * c, yCenter + s, r * sn];
    };

    const pushTri = (a, b, c) => pushTriWithNormal(pos, nor, a, b, c);

    // Revolving ribbon quads around the axis
    for (let i = 0; i < nPts; i++) {
      const [s0, r0] = loop[i];
      const [s1, r1] = loop[(i + 1) % nPts];
      if (r0 < 1e-5 && r1 < 1e-5) continue;
      for (let j = 0; j < nPhi; j++) {
        const p0 = (j / nPhi) * phiMax;
        const p1 = ((j + 1) / nPhi) * phiMax;
        const A = to3D(s0, r0, p0);
        const B = to3D(s1, r1, p0);
        const C = to3D(s1, r1, p1);
        const D = to3D(s0, r0, p1);
        if (axis === 'x') {
          pushTri(A, C, B);
          pushTri(A, D, C);
        } else {
          pushTri(A, B, C);
          pushTri(A, C, D);
        }
      }
    }

    // Meridian cutaway end-caps when sweepAngle < 2π
    if (!fullTurn && loop.length >= 3) {
      const shape2D = loop.map(([s, r]) => new THREE.Vector2(s, r));
      const tris = THREE.ShapeUtils.triangulateShape(shape2D, []);
      for (const [i0, i1, i2] of tris) {
        const a0 = to3D(loop[i0][0], loop[i0][1], 0);
        const b0 = to3D(loop[i1][0], loop[i1][1], 0);
        const c0 = to3D(loop[i2][0], loop[i2][1], 0);
        pushTri(a0, b0, c0);
        const a1 = to3D(loop[i0][0], loop[i0][1], phiMax);
        const b1 = to3D(loop[i1][0], loop[i1][1], phiMax);
        const c1 = to3D(loop[i2][0], loop[i2][1], phiMax);
        pushTri(a1, c1, b1);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    return uvMetres(g, 1);
  }

  const mat = opacity < 1 ? shadeMat(pal, { opacity }) : undefined;
  const mesh = part(root, buildRevolvedGeo(maxAngle), {
    pal, tone, mat, poche: opacity >= 1 ? poche : false, name: spec.name || 'Revolved solid',
  });

  // 2D cross-section outline on the XZ datum sheet (mirrored across centerline r = ±r)
  let sheetObj = null;
  if (sheet) {
    const upperCurve = outer.map(([s, r]) => (axis === 'x' ? [s, r] : [r, s]));
    const lowerCurve = outer.map(([s, r]) => (axis === 'x' ? [s, -r] : [-r, s]));
    const curves = [
      { points: upperCurve, closed: false },
      { points: lowerCurve, closed: false },
      ...(spec.curves || []),
    ];
    sheetObj = buildSheet(root, {
      dims: spec.dims || [],
      curves,
      vectors: spec.vectors || [],
      circles: spec.circles || [],
      crosshairs: spec.crosshairs || [],
      grids: spec.grids || [],
      border: spec.border || null,
    });
  }

  function setSweep(frac) {
    const u = clamp01(frac);
    // Scale vertically so u = 0 is a flat 2D cross-section on the datum sheet and u = 1 is the full 3D revolution
    mesh.scale.y = lerp(0.015, 1.0, u);
  }

  return { root, mesh, sheet: sheetObj, setSweep };
}

// Compiles a 2D base region [x0, x1] bounded by zLo(x) and zHi(x) into N 3D cross-sectional slices
// ('semicircle', 'square', 'triangle', 'rect') perpendicular to the X axis (Cavalieri / Riemann volume compiler).
export function extrudeCrossSections(parent, spec = {}, {
  xRange = spec.xRange || [-2, 2],
  zLo = spec.zLo || spec.zLow || (x => -Math.sqrt(Math.max(0, 4 - x * x))),
  zHi = spec.zHi || spec.zHigh || (x => Math.sqrt(Math.max(0, 4 - x * x))),
  count = spec.count ?? spec.slices ?? 20,
  shape = spec.shape || 'semicircle',
  heightScale = spec.heightScale ?? spec.ratio ?? 1,
  pal = spec.pal || 'blue',
  highlightPal = spec.highlightPal || 'red',
  poche = spec.poche ?? true,
  sheet = spec.sheet ?? true,
} = {}) {
  const root = new THREE.Group();
  parent.add(root);

  const [x0, x1] = xRange;
  const dx = (x1 - x0) / count;
  const slabThick = dx * 0.84;
  const slicesGroup = new THREE.Group();
  root.add(slicesGroup);

  function buildSliceGeo(spanZ, thickX) {
    const halfZ = Math.max(0.02, spanZ * 0.5);
    const sh = new THREE.Shape();
    if (shape === 'semicircle') {
      sh.absarc(0, 0, halfZ, 0, Math.PI, false);
      sh.closePath();
    } else if (shape === 'triangle') {
      const h = spanZ * (Math.sqrt(3) / 2) * heightScale;
      sh.moveTo(-halfZ, 0);
      sh.lineTo(halfZ, 0);
      sh.lineTo(0, h);
      sh.closePath();
    } else {
      const h = (shape === 'square' ? spanZ : spanZ * 0.5) * heightScale;
      sh.moveTo(-halfZ, 0);
      sh.lineTo(halfZ, 0);
      sh.lineTo(halfZ, h);
      sh.lineTo(-halfZ, h);
      sh.closePath();
    }
    const g = new THREE.ExtrudeGeometry(sh, { depth: thickX, bevelEnabled: false, curveSegments: 18 });
    // ExtrudeGeometry extrudes along +Z with shape in XY; rotate so extrusion is along X [-thick/2, +thick/2] and shape spans Z and +Y
    g.translate(0, 0, -thickX * 0.5);
    g.rotateY(Math.PI / 2);
    g.computeVertexNormals();
    return uvMetres(g, 1);
  }

  const baseMat = shadeMat(pal);
  const hiMat = shadeMat(highlightPal);
  const slices = [];
  for (let i = 0; i < count; i++) {
    const xm = x0 + (i + 0.5) * dx;
    const zlo = zLo(xm), zhi = zHi(xm);
    const span = Math.max(0.04, zhi - zlo);
    const zm = 0.5 * (zlo + zhi);
    const geo = buildSliceGeo(span, slabThick);
    const isHi = i === (spec.highlightIdx ?? spec.highlightIndex ?? Math.floor(count * 0.6));
    const m = part(slicesGroup, geo, {
      pal: isHi ? highlightPal : pal,
      tone: isHi ? 'lit' : 'mid',
      mat: isHi ? hiMat : baseMat,
      pos: [xm, 0, zm],
      poche,
      name: isHi ? 'Highlighted cross-section dV = A(x) dx' : 'Cross-section slice',
    });
    slices.push({ mesh: m, x: xm, zLo: zlo, zHi: zhi, span });
  }

  // 2D textbook base curves + highlighted strip on the XZ datum sheet
  let sheetObj = null;
  if (sheet) {
    const N = 64;
    const hiPts = [], loPts = [];
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      hiPts.push([x, zHi(x)]);
      loPts.push([x, zLo(x)]);
    }
    sheetObj = buildSheet(root, {
      dims: spec.dims || [],
      curves: [
        { points: hiPts, color: '#18181a' },
        { points: loPts, color: '#18181a' },
        ...(spec.curves || []),
      ],
      vectors: spec.vectors || [],
      circles: spec.circles || [],
      crosshairs: spec.crosshairs || [],
      grids: spec.grids || [],
      border: spec.border || null,
    });
  }

  function setLift(frac) {
    slicesGroup.scale.y = lerp(0.008, 1.0, clamp01(frac));
  }

  function setHighlight(idx) {
    for (let i = 0; i < slices.length; i++) {
      const hi = i === idx;
      slices[i].mesh.material = hi ? hiMat : baseMat;
      slices[i].mesh.userData.tone = TONE[hi ? 'lit' : 'mid'];
    }
  }

  return { root, slicesGroup, slices, sheet: sheetObj, setLift, setHighlight };
}

// Compiles a 2D stratified/histological/device cross-section diagram into a 3D multi-layer cutaway block
// with embedded columnar/tubular structures and a 2D datum sheet.
export function extrudeLayers(parent, spec = {}, {
  width = spec.width ?? 4.8,
  depth = spec.depth ?? 3.2,
  poche = spec.poche ?? true,
  sheet = spec.sheet ?? true,
} = {}) {
  const root = new THREE.Group();
  parent.add(root);

  const layersGroup = new THREE.Group();
  root.add(layersGroup);
  const halfW = width * 0.5;
  const halfD = depth * 0.5;

  const layerMeshes = [];
  for (const lay of spec.layers || []) {
    const S = new RectSolid();
    const lx0 = lay.x0 ?? -halfW, lx1 = lay.x1 ?? halfW;
    const ly0 = lay.y0 ?? lay.z0 ?? 0, ly1 = lay.y1 ?? lay.z1 ?? 1;
    const lz0 = (lay.y0 !== undefined ? lay.z0 : undefined) ?? -halfD;
    const lz1 = (lay.y1 !== undefined ? lay.z1 : undefined) ?? halfD;
    S.add(lx0, ly0, lz0, lx1, ly1, lz1);
    if (lay.gapX !== undefined && lay.gapWidth) {
      const gx0 = lay.gapX - lay.gapWidth * 0.5;
      const gx1 = lay.gapX + lay.gapWidth * 0.5;
      S.sub(gx0, ly0 - 0.02, -halfD * 0.65, gx1, ly1 + 0.02, halfD * 0.65);
    }
    const cuts = lay.cutouts || (lay.cutOut ? [lay.cutOut] : []);
    for (const sub of cuts) {
      S.sub(sub[0], ly0 - 0.02, sub[1], sub[2], ly1 + 0.02, sub[3]);
    }
    const built = S.build(() => 'layer', () => 'layer');
    const m = part(layersGroup, built.geos.layer, {
      pal: lay.pal || lay.key || 'paper',
      tone: lay.tone || 'hi',
      poche,
      name: lay.name || lay.key || 'Stratum layer',
    });
    const ed = built.edges.layer ? lines(layersGroup, built.edges.layer, PALETTE.ink[1], 0.85) : null;
    layerMeshes.push({ mesh: m, edges: ed, spec: lay });
  }

  // Optional packed columnar cells/pillars (e.g. palisade mesophyll or electrode pillars)
  const columnsGroup = new THREE.Group();
  layersGroup.add(columnsGroup);
  for (const col of spec.columns || []) {
    const nx = col.nx ?? 8, nz = col.nz ?? 4;
    const r = col.r ?? 0.22;
    const h = (col.y1 ?? 2.0) - (col.y0 ?? 1.2);
    const cy = 0.5 * ((col.y0 ?? 1.2) + (col.y1 ?? 2.0));
    const g = cyl(r, h, 16);
    for (let ix = 0; ix < nx; ix++) {
      for (let iz = 0; iz < nz; iz++) {
        const cx = lerp(-halfW + r * 1.4, halfW - r * 1.4, nx > 1 ? ix / (nx - 1) : 0.5);
        const cz = lerp(-halfD + r * 1.4, halfD - r * 1.4, nz > 1 ? iz / (nz - 1) : 0.5);
        part(columnsGroup, g, {
          pal: col.pal || 'green',
          tone: col.tone || 'hi',
          pos: [cx, cy, cz],
          poche,
          name: col.name || 'Columnar unit',
        });
      }
    }
  }

  // Optional horizontal vascular / cooling / field tubes running through the block
  const tubesGroup = new THREE.Group();
  layersGroup.add(tubesGroup);
  for (const tb of spec.tubes || []) {
    const g = cyl(tb.r ?? 0.22, depth * 0.96, 18);
    g.rotateX(Math.PI / 2);
    part(tubesGroup, g, {
      pal: tb.pal || 'blue',
      tone: tb.tone || 'hi',
      pos: [tb.x ?? 0, tb.y ?? 1.0, 0],
      poche,
      name: tb.name || 'Vascular bundle',
    });
  }

  let sheetObj = null;
  if (sheet) {
    sheetObj = buildSheet(root, {
      dims: spec.dims || [],
      curves: spec.curves || [],
      vectors: spec.vectors || [],
      circles: spec.circles || [],
      crosshairs: spec.crosshairs || [],
      grids: spec.grids || [],
      border: spec.border || null,
    });
  }

  function setDepth(frac) {
    layersGroup.scale.z = lerp(0.04, 1.0, clamp01(frac));
  }

  return { root, layersGroup, layerMeshes, columnsGroup, tubesGroup, sheet: sheetObj, setDepth };
}

// Compiles a 2D contour / isoquant / level-set map z = fn(x, z) + optional linear constraint wall
// into a 2D datum contour plot that rises into a 3D terraced & smooth surface (Economics, Maths, Chemistry, Physics).
export function extrudeContours(parent, spec = {}, {
  xRange = spec.xRange || [-2.5, 2.5],
  zRange = spec.zRange || [-2.5, 2.5],
  fn = spec.fn || spec.heightFn || ((x, z) => Math.max(0, 2.2 - 0.35 * (x * x + z * z))),
  res = spec.res ?? spec.nx ?? spec.nz ?? 40,
  pal = spec.pal || 'blue',
  constraintPal = spec.constraintPal || 'red',
  poche = spec.poche ?? true,
  sheet = spec.sheet ?? true,
} = {}) {
  const root = new THREE.Group();
  parent.add(root);

  const [x0, x1] = xRange;
  const [z0, z1] = zRange;
  const surfaceGroup = new THREE.Group();
  root.add(surfaceGroup);

  // Build watertight 3D solid block under y = fn(x, z) above y = 0 so horizontal section cuts (look.cutY)
  // expose black pochè level sets matching the 2D contour map!
  const nx = spec.nx ?? res, nz = spec.nz ?? res;
  const pos = [];
  const nor = [];

  const ptTop = (ix, iz) => {
    const x = lerp(x0, x1, ix / nx);
    const z = lerp(z0, z1, iz / nz);
    return [x, Math.max(0.02, fn(x, z)), z];
  };
  const ptBot = (ix, iz) => [lerp(x0, x1, ix / nx), 0, lerp(z0, z1, iz / nz)];
  const pushTri = (a, b, c) => pushTriWithNormal(pos, nor, a, b, c);

  for (let ix = 0; ix < nx; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      const A = ptTop(ix, iz), B = ptTop(ix + 1, iz), C = ptTop(ix + 1, iz + 1), D = ptTop(ix, iz + 1);
      pushTri(A, D, C);
      pushTri(A, C, B);
      const a = ptBot(ix, iz), b = ptBot(ix + 1, iz), c = ptBot(ix + 1, iz + 1), d = ptBot(ix, iz + 1);
      pushTri(a, c, d);
      pushTri(a, b, c);
    }
  }
  // 4 vertical perimeter skirt walls for watertight solid pochè
  for (let ix = 0; ix < nx; ix++) {
    pushTri(ptBot(ix, 0), ptTop(ix, 0), ptTop(ix + 1, 0));
    pushTri(ptBot(ix, 0), ptTop(ix + 1, 0), ptBot(ix + 1, 0));
    pushTri(ptBot(ix, nz), ptTop(ix + 1, nz), ptTop(ix, nz));
    pushTri(ptBot(ix, nz), ptBot(ix + 1, nz), ptTop(ix + 1, nz));
  }
  for (let iz = 0; iz < nz; iz++) {
    pushTri(ptBot(0, iz), ptTop(0, iz + 1), ptTop(0, iz));
    pushTri(ptBot(0, iz), ptBot(0, iz + 1), ptTop(0, iz + 1));
    pushTri(ptBot(nx, iz), ptTop(nx, iz), ptTop(nx, iz + 1));
    pushTri(ptBot(nx, iz), ptTop(nx, iz + 1), ptBot(nx, iz + 1));
  }

  const surfGeo = new THREE.BufferGeometry();
  surfGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  surfGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  uvMetres(surfGeo, 1);

  const surfaceMesh = part(surfaceGroup, surfGeo, {
    pal, tone: 'mid', poche, name: spec.name || '3D contour surface',
  });

  // Optional 3D vertical constraint wall (e.g. budget/isocost plane rK + wL = C)
  let constraintMesh = null;
  if (spec.constraint) {
    const { x0: cx0, z0: cz0, x1: cx1, z1: cz1, height: ch = 2.4, thickness = 0.06 } = spec.constraint;
    const len = Math.hypot(cx1 - cx0, cz1 - cz0);
    const yaw = -Math.atan2(cz1 - cz0, cx1 - cx0);
    const wg = box(len, ch, thickness, 0.004);
    constraintMesh = part(surfaceGroup, wg, {
      pal: constraintPal,
      tone: 'hi',
      pos: [0.5 * (cx0 + cx1), ch * 0.5, 0.5 * (cz0 + cz1)],
      rot: [0, yaw, 0],
      mat: shadeMat(constraintPal, { opacity: 0.42 }),
      name: spec.constraint.name || 'Constraint wall',
    });
  }

  let sheetObj = null;
  if (sheet) {
    sheetObj = buildSheet(root, {
      dims: spec.dims || [],
      curves: spec.curves || [],
      vectors: spec.vectors || [],
      circles: spec.circles || [],
      crosshairs: spec.crosshairs || [],
      grids: spec.grids || [],
      border: spec.border || null,
    });
  }

  function setElevation(frac) {
    const u = clamp01(frac);
    surfaceGroup.scale.y = lerp(0.004, 1.0, u);
    surfaceGroup.position.y = lerp(-0.025, 0.0, u);
  }

  return { root, surfaceGroup, surfaceMesh, constraintMesh, sheet: sheetObj, setElevation };
}

