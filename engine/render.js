// Engine: paper shading + ink edges from a normal/depth pass, multi-voice art-direction mediums
// ('paper-ink', 'ciechanow', 'pencil-wash', 'moebius', 'risograph'), assemblies that can be hovered,
// lit and pulled apart, and a camera placed by target/azimuth/elevation/distance.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { TONE, ATLAS_INKS, applyTheme } from './parts.js';

export const MEDIUMS = ['paper-ink', 'ciechanow', 'pencil-wash', 'moebius', 'risograph'];
const MEDIUM_ID = Object.fromEntries(MEDIUMS.map((m, i) => [m, i]));

const toKeySet = keys => {
  if (!keys) return new Set();
  if (keys instanceof Set) return keys;
  if (Array.isArray(keys)) return new Set(keys.filter(Boolean));
  return new Set(String(keys).split(',').map(s => s.trim()).filter(Boolean));
};

// Assembly controller: manages named 3D subsystems (ASM), lit/hover tones (single or multi-target),
// section clipping planes (setCutaway), translucent housing ghosting (setXray), subsystem isolation (setIsolate),
// and spring-damped exploded views. Pure Three.js scene-graph logic (no WebGL context required).
export function createAssemblyController(ASM = {}) {
  let isolatedSet = new Set();
  const meshesOf = g => { const out = []; g.traverse(o => { if (o.isMesh && o.userData.part !== undefined) out.push(o); }); return out; };
  function asm(key, parent, meta) {
    const g = new THREE.Group();
    g.userData = { asm: key, ...meta, explode: 0, target: 0, vel: 0 };
    ASM[key] = g; if (parent) parent.add(g);
    return g;
  }
  const ensureOwnMat = m => {
    if (!m.userData._ownMat && m.material?.clone) {
      m.userData._baseMat = m.material;
      m.material = m.material.clone();
      m.userData._ownMat = true;
    }
    return m.material;
  };
  const syncMeshAppearance = m => {
    const on = !!m.userData.lit;
    const dim = !!m.userData._isolatedDim;
    const xr = m.userData._xray || 0;
    m.userData.tone = on ? TONE.lit : (dim || xr > 0.05) ? TONE.faint : m.userData.baseTone;
    if (dim || xr > 0 || m.userData._ownMat) {
      const mat = ensureOwnMat(m);
      const op = dim ? 0.14 : (1 - 0.78 * xr);
      mat.transparent = op < 0.995;
      mat.depthWrite = op >= 0.5 && !dim;
      if (mat.uniforms?.uOpacity) mat.uniforms.uOpacity.value = op;
      else mat.opacity = op;
    }
  };
  function setLit(keyOrKeys, partName) {
    const litSet = toKeySet(keyOrKeys);
    for (const [k, g] of Object.entries(ASM)) for (const m of meshesOf(g)) {
      m.userData.lit = litSet.has(k) && (!partName || m.userData.part === partName) ? 1 : 0;
      syncMeshAppearance(m);
    }
  }
  const toPlane = p => p?.isPlane ? p : Array.isArray(p) ? new THREE.Plane(new THREE.Vector3(p[0], p[1], p[2]).normalize(), p[3] ?? 0) : null;
  function setCutaway(planes, asmKeys = null, opts = {}) {
    const list = (Array.isArray(planes) && typeof planes[0] !== 'number' ? planes : planes ? [planes] : []).map(toPlane).filter(Boolean);
    const groups = asmKeys ? asmKeys.map(k => ASM[k]).filter(Boolean) : Object.values(ASM);
    for (const g of groups) {
      if (!asmKeys && g.userData.noCut) continue;
      for (const m of meshesOf(g)) {
        if (m.userData.noCut) continue;
        const mat = ensureOwnMat(m);
        const isTrans = !!mat.transparent;
        mat.clipping = list.length > 0;
        mat.clippingPlanes = list.length ? list : null;
        mat.side = list.length && !isTrans ? THREE.DoubleSide : THREE.FrontSide;
        if (mat.uniforms?.uHasPoche) {
          const usePoche = list.length > 0 && !isTrans && (m.userData.poche ?? !!opts.poche);
          mat.uniforms.uHasPoche.value = usePoche ? 1 : 0;
        }
        mat.needsUpdate = true;
      }
      g.traverse(o => {
        if (!(o.isLine || o.isLineSegments)) return;
        for (let p = o; p && p !== g; p = p.parent) if (p.userData?.noCut) return;
        const mat = ensureOwnMat(o);
        mat.clipping = list.length > 0;
        mat.clippingPlanes = list.length ? list : null;
        mat.needsUpdate = true;
      });
    }
  }
  function setXray(amount = 0, asmKeys = null) {
    const k = Math.max(0, Math.min(1, amount));
    const defaultKeys = Object.entries(ASM).filter(([, g]) => g.userData.xray || g.userData.housing).map(([key]) => key);
    const keys = asmKeys || (defaultKeys.length ? defaultKeys : Object.keys(ASM).slice(0, 1));
    for (const key of keys) {
      const g = ASM[key]; if (!g) continue;
      for (const m of meshesOf(g)) {
        m.userData._xray = k;
        syncMeshAppearance(m);
      }
    }
  }
  function setIsolate(keyOrKeys = null) {
    isolatedSet = toKeySet(keyOrKeys);
    const active = isolatedSet.size > 0;
    for (const [k, g] of Object.entries(ASM)) {
      const dim = active && !isolatedSet.has(k) ? 1 : 0;
      for (const m of meshesOf(g)) {
        m.userData._isolatedDim = dim;
        syncMeshAppearance(m);
      }
    }
  }
  function applyEx(o, k) {
    const u = o.userData, p = u._postEx;
    if (!p) { u.home.copy(o.position); u._postEx = o.position.clone(); }
    else { if (o.position.x !== p.x) u.home.x = o.position.x; if (o.position.y !== p.y) u.home.y = o.position.y; if (o.position.z !== p.z) u.home.z = o.position.z; }
    o.position.copy(u.home).addScaledVector(u.ex, k); u._postEx.copy(o.position);
  }
  function resetExplode() {
    for (const g of Object.values(ASM)) g.traverse(o => { if (o !== g && o.userData.home && o.userData.ex?.lengthSq() > 0) applyEx(o, 0); });
  }
  function setExplode(amount = 0, asmKeys = null, immediate = false) {
    const k = Math.max(0, amount);
    const groups = asmKeys ? asmKeys.map(key => ASM[key]).filter(Boolean) : Object.values(ASM);
    for (const g of groups) {
      g.userData.target = k;
      if (immediate) {
        g.userData.explode = k;
        g.userData.vel = 0;
        g.traverse(o => { if (o !== g && o.userData.home && o.userData.ex && o.userData.ex.lengthSq() > 0) applyEx(o, k); });
      }
    }
  }
  function stepExplode(dt) {
    for (const g of Object.values(ASM)) {
      const u = g.userData;
      u.vel += (-(u.explode - u.target) * 90 - u.vel * 2 * Math.sqrt(90)) * dt;
      u.explode += u.vel * dt;
      if (Math.abs(u.explode - u.target) < 1e-4 && Math.abs(u.vel) < 1e-4) { u.explode = u.target; u.vel = 0; }
      const e = Math.max(u.explode, 0);
      g.traverse(o => { if (o !== g && o.userData.home && o.userData.ex && o.userData.ex.lengthSq() > 0) applyEx(o, e); });
    }
  }
  return { ASM, meshesOf, asm, setLit, setCutaway, setXray, setIsolate, resetExplode, setExplode, stepExplode };
}

// theme: a host book's colours ({ sheet, ink, red?, blue?, … }, see parts.js applyTheme); without one, the atlas's paper
export function createEngine(canvas, { fov = 18, near = 0.1, far = 400, bg = '#fbfbfa', theme = null, medium = 'paper-ink', retainContext = false } = {}) {
  const th = applyTheme(theme);
  const bgLinear = new THREE.Color(th ? th.sheet : bg).convertSRGBToLinear();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.resetState();
  renderer.setClearColor(bgLinear);
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  const { ASM, meshesOf, asm, setLit, setCutaway, setXray, setIsolate, resetExplode, setExplode, stepExplode } = createAssemblyController({});

  // ---------- normal pass: view normal in rgb (+ Moebius specular island), tone + sub-bucket part ID in alpha ----------
  const nmats = new Map();
  const specIslandU = { value: 0 };
  const normalMat = (tonePlusId, clipPlanes = null) => {
    const cKey = clipPlanes?.length ? clipPlanes.map(p => `${p.normal.x},${p.normal.y},${p.normal.z},${p.constant}`).join('|') : '';
    const key = `${tonePlusId.toFixed(4)}:${cKey}`;
    if (!nmats.has(key)) nmats.set(key, new THREE.ShaderMaterial({
      clipping: !!clipPlanes?.length,
      clippingPlanes: clipPlanes,
      side: clipPlanes?.length ? THREE.DoubleSide : THREE.FrontSide,
      uniforms: { uTone: { value: tonePlusId }, uSpecIsland: specIslandU },
      vertexShader: `
        #include <clipping_planes_pars_vertex>
        varying vec3 vN; void main(){
        vec3 n = normal;
        #ifdef USE_INSTANCING
          n = mat3(instanceMatrix) * n;
        #endif
        vN = normalize(normalMatrix * n);
        #include <begin_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>
      }`,
      fragmentShader: `
        #include <clipping_planes_pars_fragment>
        uniform float uTone; uniform float uSpecIsland; varying vec3 vN;
        void main(){
          #include <clipping_planes_fragment>
          vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
          vec3 outN = n * 0.5 + 0.5;
          if (uSpecIsland > 0.5 && uTone > 0.3) {
            vec3 lDir = normalize(vec3(0.52, 0.72, 0.45));
            vec3 hVec = normalize(lDir + vec3(0.0, 0.0, 1.0));
            float spec = pow(max(0.0, dot(n, hVec)), 420.0);
            if (spec >= 0.25) outN = vec3(1.0);
          }
          gl_FragColor = vec4(outN, uTone);
        }`,
    }));
    return nmats.get(key);
  };
  // NearestFilter is critical so dpr=2 fractional pixel offsets never bilinearly average n.a across silhouettes!
  const normalRT = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthTexture: new THREE.DepthTexture(1, 1),
  });
  const colorRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, colorRT);
  composer.addPass(new RenderPass(scene, camera));
  const edges = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null }, tNormal: { value: null }, tDepth: { value: null },
      uRes: { value: new THREE.Vector2() }, uPx: { value: 1 }, cameraNear: { value: near }, cameraFar: { value: far },
      uInk: { value: (th ? th.inks : ATLAS_INKS).map(c => new THREE.Color(c)) },
      uMedium: { value: 0 }, uBoil: { value: 0 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `
      #include <packing>
      uniform sampler2D tDiffuse, tNormal, tDepth;
      uniform vec2 uRes; uniform float uPx, cameraNear, cameraFar, uMedium, uBoil;
      uniform vec3 uInk[5];
      varying vec2 vUv;

      float hash21(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }
      float vnoise(vec2 x) {
        vec2 i = floor(x), f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
                   mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      vec2 wob(vec2 fp, float seed, float amp) {
        vec2 q = fp / max(1.0, uPx * 58.0) + seed * 13.7;
        return (vec2(vnoise(q), vnoise(q + 5.2)) - 0.5) * 2.0 * amp * uPx / uRes;
      }
      float vz(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar); }
      vec3 ink(float tone){ int i = int(clamp(floor(tone * 5. - 0.5), 0., 4.)); return uInk[i]; }

      vec2 edgeSample(vec2 uv, float pxScale) {
        vec4 n0 = texture2D(tNormal, uv); float z0 = vz(uv);
        float e = 0.; float tone = 0.;
        for (int k = 0; k < 2; k++) {
          vec2 o = (k == 0 ? vec2(uPx * pxScale, 0.) : vec2(0., uPx * pxScale)) / uRes;
          vec4 n1 = texture2D(tNormal, uv + o); float z1 = vz(uv + o);
          bool a0 = n0.a > 0.02, a1 = n1.a > 0.02;
          float ek = 0.;
          if (a0 != a1) ek = 1.;
          else if (a0) {
            float crease = smoothstep(0.12, 0.3, 1. - dot(n0.rgb * 2. - 1., n1.rgb * 2. - 1.));
            float gap = smoothstep(0.004, 0.012, abs(z0 - z1) / max(0.001, min(z0, z1)));
            float id0 = fract(n0.a * 5.0 - 0.5), id1 = fract(n1.a * 5.0 - 0.5);
            float seam = smoothstep(0.015, 0.035, abs(id0 - id1)) * 0.86;
            ek = max(max(crease, gap), seam);
          }
          if (ek > e) { e = ek; tone = (a0 && (z0 <= z1 || !a1)) ? n0.a : n1.a; }
        }
        return vec2(e, tone);
      }

      mat2 rot2(float deg) { float a = radians(deg), s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
      vec4 rgb2cmyk(vec3 rgb) {
        float k = min(1.0 - rgb.r, min(1.0 - rgb.g, 1.0 - rgb.b));
        float invK = 1.0 - k;
        vec3 cmy = invK > 1e-4 ? (1.0 - rgb - k) / invK : vec3(0.0);
        return clamp(vec4(cmy, k), 0.0, 1.0);
      }
      float risoDot(vec2 uv, float deg, float cov, float cellPx) {
        vec2 gUv = rot2(deg) * (uv * uRes) / cellPx;
        vec2 d2 = fract(gUv) - 0.5;
        float d = length(d2);
        float r = 0.56 * sqrt(clamp(cov, 0.0, 1.0));
        float aa = max(0.06, fwidth(d));
        return 1.0 - smoothstep(r - aa, r + aa, d);
      }
      vec2 cellCenterUV(vec2 uv, float deg, float cellPx) {
        vec2 cc = floor(rot2(deg) * (uv * uRes) / cellPx) + 0.5;
        return clamp((rot2(-deg) * cc * cellPx) / uRes, vec2(0.001), vec2(0.999));
      }

      void main(){
        vec2 fp = vUv * uRes;
        vec4 nCenter = texture2D(tNormal, vUv);
        bool fg = nCenter.a > 0.02;

        if (uMedium > 1.5 && uMedium < 2.5) {
          // Medium 2: 'pencil-wash' (thebuggeddev/electric-motor coloured-pencil + misregistered watercolour wash)
          vec2 washUv = clamp(vUv + vec2(2.4, -1.7) * uPx / uRes + wob(fp, uBoil + 1.7, 0.8), vec2(0.001), vec2(0.999));
          vec3 col = mix(texture2D(tDiffuse, vUv).rgb, texture2D(tDiffuse, washUv).rgb, 0.72);
          float grain = (vnoise(fp / max(1.0, uPx * 2.2)) - 0.5) * 0.032;
          col = clamp(col + grain, 0.0, 1.0);
          vec2 es1 = edgeSample(vUv + wob(fp, uBoil, 1.35), 1.05);
          vec2 es2 = edgeSample(vUv + wob(fp, uBoil + 3.3, 2.1) + vec2(0.65, -0.45) * uPx / uRes, 0.8);
          float press = 0.72 + 0.36 * vnoise(fp / max(1.0, uPx * 36.0) + uBoil);
          float e = clamp(max(es1.x, es2.x * 0.58) * press, 0.0, 1.0);
          float tone = es1.x >= es2.x * 0.58 ? es1.y : es2.y;
          gl_FragColor = vec4(mix(col, ink(tone), e * 0.92), 1.);
          return;
        }

        if (uMedium > 2.5 && uMedium < 3.5) {
          // Medium 3: 'moebius' (Maxime Heckel ligne-claire ink wiggle + 3-tier diffuse-compensated cross-hatching)
          vec2 disp = vec2(hash21(floor(fp)) * sin(fp.y * 0.08), hash21(floor(fp + 9.1)) * cos(fp.x * 0.08)) * (1.15 * uPx) / uRes;
          vec3 col = texture2D(tDiffuse, vUv).rgb;
          if (fg) {
            vec3 nView = normalize(nCenter.rgb * 2.0 - 1.0);
            float kDiff = max(0.0, dot(nView, normalize(vec3(0.52, 0.72, 0.45))));
            float lum = dot(col, vec3(0.2126, 0.7152, 0.0722)) + 0.52 * kDiff;
            vec2 hp = (vUv + disp) * uRes / max(1.0, uPx);
            float h = 0.0;
            if (lum <= 0.78 && mod(hp.x + hp.y, 7.5) <= 1.05) h = 0.55;
            if (lum <= 0.56 && mod(hp.x - hp.y, 7.5) <= 1.05) h = 0.72;
            if (lum <= 0.36 && mod(hp.y, 6.5) <= 1.05) h = 0.85;
            col = mix(col, uInk[3], h);
          }
          vec2 es = edgeSample(vUv + disp, 1.15);
          gl_FragColor = vec4(mix(col, ink(es.y), es.x * 0.96), 1.);
          return;
        }

        if (uMedium > 3.5) {
          // Medium 4: 'risograph' (rotated-grid CMYK cell-center halftone screen under crisp keyline ink)
          vec3 col = texture2D(tDiffuse, vUv).rgb;
          if (fg) {
            float cell = max(3.0, 3.8 * uPx);
            float cC = max(0.0, rgb2cmyk(texture2D(tDiffuse, cellCenterUV(vUv, 15.0, cell)).rgb).x - 0.08);
            float cM = max(0.0, rgb2cmyk(texture2D(tDiffuse, cellCenterUV(vUv, 75.0, cell)).rgb).y - 0.08);
            float cY = max(0.0, rgb2cmyk(texture2D(tDiffuse, cellCenterUV(vUv, 0.0, cell)).rgb).z - 0.08);
            float cK = max(0.0, rgb2cmyk(texture2D(tDiffuse, cellCenterUV(vUv, 45.0, cell)).rgb).w - 0.16);
            vec3 paper = vec3(0.968, 0.952, 0.912);
            paper.r *= (1.0 - 0.86 * risoDot(vUv, 15.0, cC, cell));
            paper.g *= (1.0 - 0.84 * risoDot(vUv, 75.0, cM, cell));
            paper.b *= (1.0 - 0.86 * risoDot(vUv, 0.0, cY, cell));
            paper *= (1.0 - 0.78 * risoDot(vUv, 45.0, cK, cell));
            col = mix(col, paper, 0.58);
          }
          vec2 es = edgeSample(vUv, 1.0);
          gl_FragColor = vec4(mix(col, ink(es.y), es.x * 0.96), 1.);
          return;
        }

        // Medium 0 ('paper-ink') & Medium 1 ('ciechanow' self-hue CAD edges)
        vec3 base = texture2D(tDiffuse, vUv).rgb;
        vec2 es = edgeSample(vUv, 1.0);
        vec3 edgeCol = ink(es.y);
        if (uMedium > 0.5 && uMedium < 1.5) {
          edgeCol = mix(base * 0.48, edgeCol, 0.28);
        }
        gl_FragColor = vec4(mix(base, edgeCol, es.x * 0.95), 1.);
      }`,
  });
  edges.material.extensions = { ...(edges.material.extensions || {}), derivatives: true };
  // ShaderPass clones its uniforms (textures too), so bind the live targets after creating it
  edges.uniforms.tNormal.value = normalRT.texture; edges.uniforms.tDepth.value = normalRT.depthTexture;
  composer.addPass(edges);
  composer.addPass(new OutputPass());

  const MEDIUM_BG = {
    'paper-ink': bg,
    ciechanow: '#f8f8f8',
    'pencil-wash': '#faf7ef',
    moebius: '#f6f4ee',
    risograph: '#f7f2e7',
  };
  let curMedium = MEDIUMS.includes(medium) ? medium : 'paper-ink';
  function setMedium(nextMedium, { boil = 0 } = {}) {
    const mName = MEDIUMS.includes(nextMedium) ? nextMedium : 'paper-ink';
    curMedium = mName;
    if (!th) {
      renderer.setClearColor(new THREE.Color(MEDIUM_BG[mName] || bg).convertSRGBToLinear());
    }
    const id = MEDIUM_ID[mName] ?? 0;
    edges.uniforms.uMedium.value = id;
    edges.uniforms.uBoil.value = boil;
    specIslandU.value = mName === 'moebius' ? 1 : 0;
    const isCiech = mName === 'ciechanow' ? 1 : 0;
    scene.traverse(o => {
      if (!o.isMesh || !o.material?.uniforms) return;
      const u = o.material.uniforms;
      if (u.uHeadlight) u.uHeadlight.value = isCiech;
      if (u.uPocheMode && o.userData?.poche !== 'hatch') u.uPocheMode.value = isCiech;
    });
  }
  setMedium(curMedium);

  let dprCap = 2, size = [1, 1];
  const setDprCap = c => { dprCap = c; resize(...size); };
  function resize(w, h) {
    size = [w, h];
    const dpr = Math.min(devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr); composer.setSize(w, h);
    normalRT.setSize(w * dpr, h * dpr);
    edges.uniforms.uRes.value.set(w * dpr, h * dpr);
    edges.uniforms.uPx.value = Math.max(1, dpr * 0.75);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  const swap = [];
  function render() {
    scene.traverse(o => {
      if (o.isMesh && o.material.uniforms && o.material.uniforms.uLit && !o.onBeforeRender.__lit) {
        o.onBeforeRender = (r, s, c, g, mat) => { if (mat.uniforms && mat.uniforms.uLit) { mat.uniforms.uLit.value = o.userData.lit || 0; mat.uniformsNeedUpdate = true; } };
        o.onBeforeRender.__lit = true;
      }
      if (curMedium === 'ciechanow' && o.isMesh && o.material?.uniforms?.uHeadlight) {
        o.material.uniforms.uHeadlight.value = 1;
      }
    });
    swap.length = 0;
    scene.traverse(o => {
      if (!o.visible) return;
      if (o.isLine || o.isLineSegments || o.isPoints || o.isSprite || o.userData.noEdge) { swap.push([o, null]); o.visible = false; return; }
      if (o.isMesh) {
        swap.push([o, o.material]);
        const t = (o.userData.tone ?? TONE.mid) + (o.userData.idOff ?? 0);
        o.material = normalMat(t, o.material?.clippingPlanes);
      }
    });
    renderer.setRenderTarget(normalRT); renderer.setClearColor(0x000000, 0); renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.setClearColor(bgLinear, 1);
    for (const [o, m] of swap) { if (m) o.material = m; else o.visible = true; }
    composer.render();
  }

  // Parallel off-thread shader warm-up (compileAsync) so the first interactive frame never stalls on integrated GPUs
  async function warm() {
    if (typeof renderer.compileAsync === 'function') {
      try { await renderer.compileAsync(scene, camera); } catch {}
    }
  }

  // ---------- picking ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const PAD = 24, corner = new THREE.Vector3(), bb = new THREE.Box3();
  const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  function pick(x, y, w, h, exclude = []) {
    ndc.set((x / w) * 2 - 1, -(y / h) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const groups = Object.entries(ASM).filter(([k, g]) => !exclude.includes(k) && shown(g) && !g.userData.noPick);
    const targets = groups.flatMap(([, g]) => meshesOf(g).filter(shown));
    for (const hit of ray.intersectObjects(targets, false)) {
      let o = hit.object;
      while (o && !o.userData.asm) o = o.parent;
      if (o) return o.userData.asm;
    }
    let best = null, bestArea = Infinity;
    for (const [k, g] of groups) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const m of meshesOf(g)) {
        if (!shown(m)) continue;
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        bb.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);
        for (let i = 0; i < 8; i++) {
          corner.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).project(camera);
          if (corner.z > 1) continue;
          const sx = (corner.x * 0.5 + 0.5) * w, sy = (-corner.y * 0.5 + 0.5) * h;
          x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
        }
      }
      if (x0 > x1) continue;
      const area = (x1 - x0) * (y1 - y0);
      if (x >= x0 - PAD && x <= x1 + PAD && y >= y0 - PAD && y <= y1 + PAD && area < bestArea && area < w * h * 0.5) { best = k; bestArea = area; }
    }
    return best;
  }

  function placeCamera({ target, az, el, dist, fov: camFov }) {
    const nextFov = camFov ?? camera.fov;
    const nPlane = Math.max(0.08, dist > 40 ? dist * 0.15 : near);
    const fPlane = Math.max(far, dist * 2.5);
    if (Math.abs(camera.fov - nextFov) > 1e-4 || Math.abs(camera.near - nPlane) > 1e-3 || Math.abs(camera.far - fPlane) > 1e-2) {
      camera.fov = nextFov;
      camera.near = nPlane;
      camera.far = fPlane;
      camera.updateProjectionMatrix();
      edges.uniforms.cameraNear.value = nPlane;
      edges.uniforms.cameraFar.value = fPlane;
    }
    const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
    camera.position.set(target[0] + dist * Math.sin(a) * Math.cos(e), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(a) * Math.cos(e));
    camera.lookAt(...target);
    camera.updateMatrixWorld();
  }
  // a camera distance that frames a sphere of radius r
  const distFor = r => r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(1, camera.aspect) * 1.15;

  const v = new THREE.Vector3();
  function toScreen(p, w, h) { v.copy(p).project(camera); return [(v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h, v.z < 1]; }

  function dispose() {
    scene.traverse(o => { if (o.isInstancedMesh) o.dispose(); if (o.geometry) o.geometry.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => x.dispose()); });
    for (const m of nmats.values()) m.dispose();
    normalRT.dispose(); colorRT.dispose(); composer.dispose?.();
    renderer.setRenderTarget(null); renderer.dispose();
    if (!retainContext && !renderer.getContext().isContextLost()) renderer.forceContextLoss();
  }

  return {
    THREE, renderer, scene, camera, ASM, asm, resize, setDprCap, render, setLit, setCutaway, setXray, setIsolate,
    resetExplode, setExplode, warm, pick, stepExplode, placeCamera, distFor, toScreen, theme: th,
    setMedium, get medium() { return curMedium; }, dispose,
  };
}
