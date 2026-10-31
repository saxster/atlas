// Parts kit: paper solids with facing-based shading, and helpers that build them.
// Every part carries a line tone (Anatomy: faint, lo, mid, hi, lit) and an explode vector.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const TONE = { faint: 0.2, lo: 0.4, mid: 0.6, hi: 0.8, lit: 1.0 };

const SHADE_V = `
  #include <clipping_planes_pars_vertex>
  varying vec3 vWN;
  void main() {
    vec3 n = normal;
    #ifdef USE_INSTANCING
      n = mat3(instanceMatrix) * n;
    #endif
    vWN = normalize(mat3(modelMatrix) * n);
    #include <begin_vertex>
    #include <project_vertex>
    #include <clipping_planes_vertex>
  }`;
const SHADE_F = `
  #include <clipping_planes_pars_fragment>
  uniform vec3 uTop; uniform vec3 uLight; uniform vec3 uDark; uniform float uOpacity; uniform float uLit;
  varying vec3 vWN;
  void main() {
    #include <clipping_planes_fragment>
    vec3 n = normalize(vWN);
    // sides: close tones by facing, continuous so curved parts never staircase
    float side = clamp(dot(normalize(vec3(-0.55, 0.0, 0.83)), normalize(vec3(n.x, 0.0, n.z) + 1e-5)) * 0.5 + 0.5, 0.0, 1.0);
    vec3 c = mix(uDark, uLight, side);
    c = mix(c, uTop, smoothstep(0.55, 0.95, n.y));
    c = mix(c, uDark * 0.97, smoothstep(-0.4, -0.95, n.y));
    c = mix(c, uTop, uLit * 0.35);
    gl_FragColor = vec4(c, uOpacity);
    #include <colorspace_fragment>
  }`;
export const PALETTE = {
  paper: ['#ffffff', '#f3f3f0', '#dadad6'],
  base: ['#f5f5f2', '#eaeae6', '#d2d2cd'],
  dark: ['#9c9ca2', '#86868c', '#6c6c72'],
  ink: ['#4a4a50', '#2c2c30', '#18181a'],
  red: ['#f07a7e', '#e5484d', '#b8343a'],
  blue: ['#8fb0f0', '#5b86d6', '#3d63a8'],          // velocity / system totals, where a chapter needs a second hue
  green: ['#7ec49e', '#3f8a63', '#2e604a'],
  ochre: ['#e3b857', '#c8962e', '#936022'],
  amber: ['#e3b857', '#c8962e', '#936022'],
  board: ['#fdfdfb', '#f7f7f4', '#ececE8'],
};
let before = null;                                  // the palette as it was before a theme replaced it
export const ATLAS_INKS = ['#d4d4d6', '#b4b4b8', '#8a8a8f', '#2c2c30', '#000000'];

// A host's theme (a book's sepia, light or dark) in place of the atlas's own paper: every palette is mixed from the
// sheet and ink colours, so paper is paper in each theme. theme: { sheet, ink, red?, blue?, green?, ochre? } as CSS
// hex; null puts the atlas palette back. Returns { sheet, ink, dark, inks } for the renderer. Call before the world
// is built (materials made earlier keep their colours). Chapters may add or recolour palettes as they load (a lit
// filament, a chapter's own blue); without a theme those stand untouched. Mixing as in kym_physics' spread/parts.js.
export function applyTheme(theme) {
  if (!theme) {
    if (before) { for (const k of Object.keys(PALETTE)) delete PALETTE[k]; Object.assign(PALETTE, before); before = null; cache.clear(); }
    return null;
  }
  if (!before) before = JSON.parse(JSON.stringify(PALETTE));
  cache.clear();
  const sheet = new THREE.Color(theme.sheet), ink = new THREE.Color(theme.ink);
  const dark = sheet.getHSL({}).l < 0.4;
  const mix = (a, b, u) => '#' + a.clone().lerp(b, u).getHexString();
  const tri = (c, spread = 1) => { const base = new THREE.Color(c); return [mix(base, sheet, 0.35 * spread), mix(base, ink, 0.02), mix(base, ink, 0.16 * spread)]; };
  const paperTop = dark ? sheet.clone().lerp(ink, 0.10) : sheet.clone().lerp(new THREE.Color('#ffffff'), 0.6);
  Object.assign(PALETTE, {
    paper: ['#' + paperTop.getHexString(), mix(sheet, ink, dark ? 0.06 : 0.04), mix(sheet, ink, dark ? 0.0 : 0.14)],
    base: [mix(sheet, ink, 0.03), mix(sheet, ink, 0.07), mix(sheet, ink, 0.17)],
    dark: [mix(sheet, ink, 0.45), mix(sheet, ink, 0.52), mix(sheet, ink, 0.60)],
    ink: [mix(sheet, ink, 0.75), mix(sheet, ink, 0.86), mix(sheet, ink, 0.95)],
    red: tri(theme.red || '#a94730'),
    blue: tri(theme.blue || '#356d83'),
    green: tri(theme.green || '#2e604a'),
    ochre: tri(theme.ochre || '#936022'),
    amber: tri(theme.ochre || '#936022'),
    board: [mix(sheet, ink, 0.0), mix(sheet, ink, 0.02), mix(sheet, ink, 0.06)],
  });
  return { sheet: '#' + sheet.getHexString(), ink: '#' + ink.getHexString(), dark, inks: [0.18, 0.32, 0.5, 0.82, 1].map(u => mix(sheet, ink, u)) };
}
// Chapters draw thin lines and outlines in greys chosen for white paper ('#e6e6e2' for a grid). Under a host theme a
// grey means "this much ink": its distance from the atlas's paper toward black becomes the same distance from the
// theme's sheet toward its ink, so a faint grid stays faint on dark paper. Coloured lines keep their hue.
const srgb = c => { const h = c.getHexString(); return [0, 2, 4].map(k => parseInt(h.slice(k, k + 2), 16) / 255); };
const ATLAS_PAPER = srgb(new THREE.Color('#fbfbfa'));
export function themeGrey(color, th) {
  const c = color.clone(), hsl = c.getHSL({}, THREE.SRGBColorSpace);
  if (!th || hsl.s > 0.18) return c;
  // in sRGB, where the chapter picked its grey: how far from the atlas's paper toward black
  const v = srgb(c), t = Math.min(Math.max(1 - (v[0] + v[1] + v[2]) / (ATLAS_PAPER[0] + ATLAS_PAPER[1] + ATLAS_PAPER[2]), 0), 1);
  const a = srgb(new THREE.Color(th.sheet)), b = srgb(new THREE.Color(th.ink));
  return new THREE.Color().setRGB(...a.map((x, k) => x + (b[k] - x) * t), THREE.SRGBColorSpace);
}
// every unlit line, point and flat material in the scene, re-inked for the theme (run once after the world is built)
export function themeScene(scene, th) {
  if (!th) return;
  const done = new Set();
  scene.traverse(o => {
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) if (!done.has(m) && m.color && !m.uniforms && (m.isLineBasicMaterial || m.isLineDashedMaterial || m.isPointsMaterial || m.isMeshBasicMaterial || m.isSpriteMaterial)) {
      done.add(m); m.color.copy(themeGrey(m.color, th));
    }
  });
}
const cache = new Map();
export function shadeMat(pal = 'paper', { opacity = 1 } = {}) {
  const key = pal + opacity;
  if (opacity === 1 && cache.has(key)) return cache.get(key);
  const [top, light, dark] = PALETTE[pal];
  const m = new THREE.ShaderMaterial({
    vertexShader: SHADE_V, fragmentShader: SHADE_F, transparent: opacity < 1, depthWrite: opacity >= 1,
    uniforms: { uTop: { value: new THREE.Color(top) }, uLight: { value: new THREE.Color(light) }, uDark: { value: new THREE.Color(dark) }, uOpacity: { value: opacity }, uLit: { value: 0 } },
  });
  if (opacity === 1) cache.set(key, m);
  return m;
}

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export function part(parent, geo, { tone = 'mid', pal = 'paper', pos = [0, 0, 0], rot, name, ex = [0, 0, 0], mat } = {}) {
  const m = new THREE.Mesh(geo, mat || shadeMat(pal));
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.userData = { tone: TONE[tone], baseTone: TONE[tone], part: name, home: m.position.clone(), ex: V(...ex) };
  parent.add(m);
  return m;
}
export const box = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2));
export const cyl = (r, h, seg = 32, r2 = r) => new THREE.CylinderGeometry(r2, r, h, seg);
export const xAxis = g => g.rotateZ(-Math.PI / 2);
export const zAxis = g => g.rotateX(Math.PI / 2);

// flat ink lines (ticks, grids); never part of the edge pass
export function lines(parent, coords, color = '#8a8a8f', opacity = 1) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
  l.userData = { noEdge: true };
  parent.add(l);
  return l;
}

// a solid arrow along +y, resized each frame with setArrow
export function arrow(parent, pal, { r = 0.035, head = 0.16, headR = 0.09, name, tone = 'hi' } = {}) {
  const g = new THREE.Group();
  // vectors are what the diagram is about: draw them over solids, as a free-body diagram does
  const mat = shadeMat(pal).clone(); mat.depthTest = false; mat.transparent = true;   // sorts after translucent solids
  const shaft = part(g, cyl(r, 1, 20), { pal, tone, name, mat });
  const tip = part(g, new THREE.ConeGeometry(headR, head, 28), { pal, tone, name, mat });
  shaft.renderOrder = tip.renderOrder = 10;
  g.userData.arrow = { shaft, tip, head };
  parent.add(g);
  return g;
}
const UP = V(0, 1, 0);
export function setArrow(a, from, vec, opacity = 1) {
  const len = vec.length(), { shaft, tip, head } = a.userData.arrow;
  a.visible = opacity > 0.01 && len > 0.02;
  if (!a.visible) return;
  const hl = Math.min(head, len * 0.5), sl = Math.max(len - hl, 0.001);
  a.position.copy(from);
  a.quaternion.setFromUnitVectors(UP, vec.clone().normalize());
  shaft.scale.set(1, sl, 1); shaft.position.y = sl / 2;
  tip.scale.set(1, hl / head, 1); tip.position.y = sl + hl / 2;
}

// a cylindrical strut/segment stretched between two points a and b via rod.set(a, b)
export function rod(parent, { r = 0.026, pal = 'ink', tone = 'hi', ex = [0, 0, 0], name } = {}) {
  const m = part(parent, cyl(r, 1, 14).translate(0, 0.5, 0), { pal, tone, ex, name });
  m.set = (a, b) => {
    const len = a.distanceTo(b);
    m.visible = len > 0.006;
    if (!m.visible) return;
    m.position.copy(a); m.userData.home.copy(a); m.scale.set(1, len, 1);
    m.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
  };
  return m;
}

// a tube whose path changes every frame: built once, then its vertices are rewritten in place
// (rebuilding a TubeGeometry per frame cost more than the rest of the frame). geo.update(pts)
// takes n + 1 points; the cross-section is carried along by parallel transport.
export function liveTube(n, radius, radial = 6) {
  const geo = new THREE.TubeGeometry(new THREE.LineCurve3(V(0, 0, 0), V(0, 1, 0)), n, radius, radial);
  const pos = geo.attributes.position.array, nor = geo.attributes.normal.array, T = V(), N = V(), B = V();
  const cs = Array.from({ length: radial + 1 }, (_, j) => -Math.cos(j / radial * Math.PI * 2)), sn = cs.map((_, j) => Math.sin(j / radial * Math.PI * 2));
  const bb = geo.boundingBox = new THREE.Box3(), bs = geo.boundingSphere = new THREE.Sphere();
  geo.update = pts => {
    bb.makeEmpty();
    for (let i = 0; i <= n; i++) {
      const p = pts[i];
      T.subVectors(pts[Math.min(i + 1, n)], pts[Math.max(i - 1, 0)]).normalize();
      if (i === 0) N.set(Math.abs(T.y) < 0.9 ? 0 : 1, Math.abs(T.y) < 0.9 ? 1 : 0, 0);
      N.addScaledVector(T, -N.dot(T)).normalize();
      B.crossVectors(T, N);
      bb.expandByPoint(p);
      for (let j = 0, k = i * (radial + 1) * 3; j <= radial; j++, k += 3) {
        const qx = N.x * cs[j] + B.x * sn[j], qy = N.y * cs[j] + B.y * sn[j], qz = N.z * cs[j] + B.z * sn[j];
        nor[k] = qx; nor[k + 1] = qy; nor[k + 2] = qz;
        pos[k] = p.x + radius * qx; pos[k + 1] = p.y + radius * qy; pos[k + 2] = p.z + radius * qz;
      }
    }
    geo.attributes.position.needsUpdate = geo.attributes.normal.needsUpdate = true;
    bb.expandByScalar(radius); bb.getBoundingSphere(bs);
  };
  return geo;
}

// ---------- mechanical CAD primitives: gears, racks, and deformable coil springs ----------

// Extruded involute/trapezoidal spur or helical gear geometry in the XY plane (axis along Z, thickness width).
// Specify either { r } (pitch radius) or { module } (pitch radius = 0.5 * module * teeth).
export function gearGeo(teeth = 16, { module: m, r, width = 0.14, helix = 0, bore = 0, pressureAngle = 20, bevel = true } = {}) {
  const rp = r ?? 0.5 * (m ?? 0.1) * teeth;
  const mod = (2 * rp) / teeth;
  const ra = rp + 0.95 * mod, rr = Math.max(bore + mod * 0.3, rp - 1.15 * mod);
  const sh = new THREE.Shape();
  const da = (Math.PI * 2) / teeth;
  const flank = Math.max(0.06, Math.min(0.24, Math.tan((pressureAngle * Math.PI) / 180) * 0.41));
  for (let i = 0; i < teeth; i++) {
    const a0 = i * da;
    const pts = [
      [rr, a0],
      [rr, a0 + da * 0.18],
      [ra, a0 + da * (0.18 + flank)],
      [ra, a0 + da * (0.76 - flank)],
      [rr, a0 + da * 0.76],
    ];
    pts.forEach(([rad, ang], k) => {
      const x = rad * Math.cos(ang), y = rad * Math.sin(ang);
      if (i === 0 && k === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
    });
  }
  sh.closePath();
  if (bore > 0) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, bore, 0, Math.PI * 2, true);
    sh.holes.push(hole);
  }
  const bev = bevel ? Math.min(mod * 0.14, width * 0.12) : 0;
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: width,
    bevelEnabled: bev > 0,
    bevelThickness: bev,
    bevelSize: bev * 0.85,
    bevelSegments: 1,
    curveSegments: 4,
  });
  g.translate(0, 0, -width / 2);
  if (helix) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const a = (p.getZ(i) / width) * helix;
      const x = p.getX(i), y = p.getY(i);
      p.setXY(i, x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a));
    }
  }
  g.computeVertexNormals();
  return g;
}

export function gear(parent, { teeth = 16, module: m, r, width = 0.14, helix = 0, bore = 0, pressureAngle = 20, pal = 'paper', tone = 'mid', pos = [0, 0, 0], rot, name, ex = [0, 0, 0], mat } = {}) {
  const rp = r ?? 0.5 * (m ?? 0.1) * teeth;
  const mesh = part(parent, gearGeo(teeth, { module: m, r: rp, width, helix, bore, pressureAngle }), { pal, tone, pos, rot, name, ex, mat });
  mesh.userData.rp = rp;
  mesh.userData.teeth = teeth;
  return mesh;
}

// Extruded linear gear rack along X (teeth on +Y face by default; rotateZ(Math.PI) for teeth on -Y), extruded by width along Z.
export function rackGeo(teeth = 12, { module: m = 0.1, pitch, width = 0.14, height = 0.18, bevel = true } = {}) {
  const p = pitch ?? Math.PI * m;
  const mod = p / Math.PI;
  const len = teeth * p;
  const yBase = -height / 2, yRoot = height / 2 - 1.1 * mod, yTip = height / 2 + 0.9 * mod;
  const sh = new THREE.Shape();
  sh.moveTo(-len / 2, yBase);
  sh.lineTo(-len / 2, yRoot);
  for (let i = 0; i < teeth; i++) {
    const x0 = -len / 2 + i * p;
    sh.lineTo(x0 + p * 0.18, yRoot);
    sh.lineTo(x0 + p * 0.33, yTip);
    sh.lineTo(x0 + p * 0.61, yTip);
    sh.lineTo(x0 + p * 0.76, yRoot);
  }
  sh.lineTo(len / 2, yRoot);
  sh.lineTo(len / 2, yBase);
  sh.closePath();
  const bev = bevel ? Math.min(mod * 0.14, width * 0.12) : 0;
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: width,
    bevelEnabled: bev > 0,
    bevelThickness: bev,
    bevelSize: bev * 0.85,
    bevelSegments: 1,
  });
  g.translate(0, 0, -width / 2);
  g.computeVertexNormals();
  return g;
}

export function rack(parent, { teeth = 12, module: m = 0.1, pitch, width = 0.14, height = 0.18, pal = 'paper', tone = 'mid', pos = [0, 0, 0], rot, name, ex = [0, 0, 0], mat } = {}) {
  const p = pitch ?? Math.PI * m;
  const mesh = part(parent, rackGeo(teeth, { module: m, pitch: p, width, height }), { pal, tone, pos, rot, name, ex, mat });
  mesh.userData.pitch = p;
  mesh.userData.length = teeth * p;
  return mesh;
}

// Deformable helical coil spring built on liveTube: spring.set(a, b) stretches and compresses the coil between two 3D
// endpoints in place every frame without allocating new geometry.
export function spring(parent, { r = 0.09, wire = 0.016, turns = 7, segs = 96, radial = 6, pal = 'dark', tone = 'hi', name, ex = [0, 0, 0], from = [0, 0, 0], to = [0, 1, 0] } = {}) {
  const geo = liveTube(segs, wire, radial);
  const mesh = part(parent, geo, { pal, tone, name, ex });
  const pts = Array.from({ length: segs + 1 }, () => V());
  const A = V(), B = V(), T = V(), U = V(), W = V();
  mesh.set = (a, b, rOverride = r) => {
    A.copy(a.isVector3 ? a : V(...a));
    B.copy(b.isVector3 ? b : V(...b));
    T.subVectors(B, A);
    const len = T.length();
    mesh.visible = len > 1e-4;
    if (!mesh.visible) return;
    T.divideScalar(len);
    U.set(Math.abs(T.y) < 0.9 ? 0 : 1, Math.abs(T.y) < 0.9 ? 1 : 0, 0);
    U.addScaledVector(T, -U.dot(T)).normalize();
    W.crossVectors(T, U);
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      // taper the end coils over the first and last 8% so the spring lands cleanly on its mounts
      const env = Math.sin(Math.min(1, u / 0.08, (1 - u) / 0.08) * (Math.PI / 2));
      const ang = u * turns * Math.PI * 2;
      const rad = rOverride * env;
      const c = Math.cos(ang) * rad, s = Math.sin(ang) * rad;
      pts[i].copy(A).addScaledVector(T, u * len).addScaledVector(U, c).addScaledVector(W, s);
    }
    geo.update(pts);
  };
  mesh.set(from, to);
  return mesh;
}
