// "See the real specimen": an interactive 3D mesh or GLB/GLTF museum specimen stage (loaded on demand, just like
// adapters/molecule.js), graded with auditDeliverable() before display.
// Upgraded with demand-driven 0%-idle GPU loop, proportional paper plinth + radial contact shadow,
// live 1-2-5 metric ScaleBar (lengthMm), Textured | Paper & Ink wireframe mode, and camera-preserving variants.
import * as THREE from 'three';
import { auditDeliverable } from '../engine/mesh-audit.js';

export { auditDeliverable };

const SCALE_STEPS_MM = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

function formatScaleMm(mm) {
  if (mm < 1) return `${Math.round(mm * 1000)} µm`;
  if (mm >= 1000) return `${+(mm / 1000).toFixed(2)} m`;
  if (mm >= 10 && mm % 10 === 0) return `${mm / 10} cm`;
  return `${mm} mm`;
}

async function loadGLTF(url) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  return new Promise((ok, fail) => {
    new GLTFLoader().load(url, gltf => ok(gltf.scene || gltf.scenes?.[0]), undefined, err => fail(err || new Error(`Failed to load ${url}`)));
  });
}

export async function showSpecimen(el, spec, { background = '#fbfbfa' } = {}) {
  const cfg = typeof spec === 'string'
    ? { src: spec }
    : typeof spec === 'function'
      ? { build: spec }
      : { ...(spec || {}) };

  let root = null;
  let source = cfg.source || '';
  if (cfg.build) {
    const built = await cfg.build(THREE);
    root = built?.isObject3D ? built : built?.object;
    if (built?.source && !source) source = built.source;
  } else if (cfg.object?.isObject3D) {
    root = cfg.object.clone(true);
    root.traverse(o => {
      if (o.geometry) o.geometry = o.geometry.clone();
      if (o.material) o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone();
    });
  } else if (cfg.src) {
    root = await loadGLTF(cfg.src);
    if (!source) source = cfg.src.split('/').pop();
  }
  if (!root) throw new Error('showSpecimen: no 3D specimen object or GLB source provided');

  el.style.position = el.style.position || 'relative';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:grab;touch-action:none';
  el.innerHTML = '';
  el.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setClearColor(background, 1);
  const maxAniso = renderer.capabilities?.getMaxAnisotropy?.() || 1;

  const audit = auditDeliverable(root, {
    maxTris: cfg.maxTris ?? 50000,
    requireUV: !!cfg.requireUV,
    clampNonMetal: cfg.clampNonMetal ?? true,
    calmPBR: cfg.calmPBR ?? true,
    maxAnisotropy: maxAniso,
  });

  const scene = new THREE.Scene();
  const holder = new THREE.Group();
  scene.add(holder);
  holder.add(root);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const boxSize = box.getSize(new THREE.Vector3());
  const maxBoxEdge = Math.max(boxSize.x, boxSize.y, boxSize.z, 0.01);
  const sphere = box.isEmpty() ? new THREE.Sphere(new THREE.Vector3(), 1) : box.getBoundingSphere(new THREE.Sphere());
  root.position.sub(sphere.center);
  const radius = Math.max(sphere.radius, 0.01);

  // Proportional museum paper plinth + inline radial contact shadow (inspired by thebuggeddev/seed & relic)
  const bgCol = new THREE.Color(background);
  const isDark = bgCol.getHSL({ h: 0, s: 0, l: 0 }).l < 0.4;
  const plinthCol = bgCol.clone().lerp(new THREE.Color(isDark ? '#ffffff' : '#868078'), 0.14);
  const inkHex = isDark ? '#e6e2d8' : '#2a2623';
  const minRelY = box.isEmpty() ? -radius * 0.6 : (box.min.y - sphere.center.y);
  const lift = radius * 0.08;
  const plinthH = radius * 0.14;
  const plinthR = Math.max(radius * 0.68, Math.hypot(boxSize.x, boxSize.z) * 0.36);
  if (cfg.plinth !== false) {
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(plinthR, plinthR * 1.06, plinthH, 48),
      new THREE.MeshStandardMaterial({ color: plinthCol, roughness: 0.85, metalness: 0 }),
    );
    plinth.position.y = minRelY - lift - plinthH * 0.5;
    scene.add(plinth);
    const shadowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2,
      uniforms: { uCol: { value: new THREE.Color(inkHex) }, uAlpha: { value: isDark ? 0.38 : 0.22 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform vec3 uCol; uniform float uAlpha; void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.2) * uAlpha; gl_FragColor = vec4(uCol, a); }',
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(plinthR * 1.7, plinthR * 1.7), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = minRelY - lift + 0.002;
    scene.add(shadow);
  }

  // Three-point museum lighting
  scene.add(new THREE.HemisphereLight(0xfffcf5, 0xd8d4cc, 0.85));
  const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.35);
  keyLight.position.set(radius * 2.2, radius * 2.8, radius * 2.4);
  const fillLight = new THREE.DirectionalLight(0xdce6f7, 0.55);
  fillLight.position.set(-radius * 2.4, radius * 0.8, radius * 1.6);
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.45);
  rimLight.position.set(0, radius * 2.0, -radius * 2.5);
  scene.add(keyLight, fillLight, rimLight);

  // Textured | Paper & Ink wireframe mode (inspired by thebuggeddev/empire)
  const savedMats = new Map();
  const wireOverlays = [];
  const plasterMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x26262a : 0xf4efe4,
    roughness: 0.95,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const wireMat = new THREE.MeshBasicMaterial({
    color: isDark ? 0xc8c2b6 : 0x5c4033,
    wireframe: true,
    transparent: true,
    opacity: 0.42,
  });
  let inkMode = false;
  function setInkMode(on) {
    if (on === inkMode) return;
    inkMode = on;
    if (on) {
      root.traverse(o => {
        if (!o.isMesh || o.userData?._isWireOverlay) return;
        savedMats.set(o, o.material);
        o.material = plasterMat;
        const w = new THREE.Mesh(o.geometry, wireMat);
        w.userData._isWireOverlay = true;
        o.add(w);
        wireOverlays.push(w);
      });
    } else {
      for (const w of wireOverlays) w.parent?.remove(w);
      wireOverlays.length = 0;
      for (const [o, m] of savedMats.entries()) o.material = m;
      savedMats.clear();
    }
    drawOnce();
  }

  // Optional HUD overlay: Textured | Paper & Ink toggle + live metric ScaleBar
  const hud = document.createElement('div');
  hud.style.cssText = 'position:absolute;inset:10px 12px;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;font:500 11px/1 var(--mono,monospace);color:var(--hi,#26262a)';
  const modePill = document.createElement('button');
  modePill.type = 'button';
  modePill.textContent = 'Paper & Ink';
  modePill.setAttribute('aria-pressed', 'false');
  modePill.style.cssText = 'align-self:flex-end;pointer-events:auto;border:1px solid var(--faint,#d4d4d6);background:var(--card,#fbfbfa);color:inherit;font:inherit;padding:5px 9px;border-radius:999px;cursor:pointer';
  modePill.onclick = () => {
    setInkMode(!inkMode);
    modePill.setAttribute('aria-pressed', String(inkMode));
    modePill.textContent = inkMode ? 'Textured' : 'Paper & Ink';
  };
  hud.appendChild(modePill);

  let scaleLine = null, scaleTxt = null;
  if (cfg.lengthMm > 0) {
    const sb = document.createElement('div');
    sb.style.cssText = 'align-self:flex-start;display:flex;flex-direction:column;gap:3px;background:rgba(251,251,250,0.82);padding:4px 7px;border-radius:5px';
    scaleTxt = document.createElement('span');
    scaleLine = document.createElement('div');
    scaleLine.style.cssText = 'height:2px;background:currentColor;border-left:1.5px solid currentColor;border-right:1.5px solid currentColor;width:64px';
    sb.append(scaleTxt, scaleLine);
    hud.appendChild(sb);
  }
  el.appendChild(hud);

  const camera = new THREE.PerspectiveCamera(28, 1, radius * 0.02, radius * 40);
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let az = 0.45, elAng = 0.28, dist = (radius / Math.sin(THREE.MathUtils.degToRad(14))) * 1.32;
  let spinning = !reduced, dragging = false, pointerId = null, lastX = 0, lastY = 0, lastMoveT = 0, velAz = 0, raf = 0, lastT = performance.now();

  function updateScaleBar() {
    if (!scaleLine || !cfg.lengthMm) return;
    const h = el.clientHeight || 240;
    const worldSpanY = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const pxPerWorld = h / Math.max(1e-6, worldSpanY);
    const worldPerMm = maxBoxEdge / cfg.lengthMm;
    const pxPerMm = worldPerMm * pxPerWorld;
    let chosen = SCALE_STEPS_MM[0];
    for (const st of SCALE_STEPS_MM) {
      const px = st * pxPerMm;
      chosen = st;
      if (px >= 44 && px <= 128) break;
      if (px > 128) break;
    }
    const barPx = Math.max(24, Math.min(148, chosen * pxPerMm));
    scaleLine.style.width = `${barPx.toFixed(1)}px`;
    scaleTxt.textContent = formatScaleMm(chosen);
  }

  function placeCam() {
    camera.position.set(
      dist * Math.sin(az) * Math.cos(elAng),
      dist * Math.sin(elAng),
      dist * Math.cos(az) * Math.cos(elAng),
    );
    camera.lookAt(0, 0, 0);
    updateScaleBar();
  }

  function drawOnce() {
    placeCam();
    renderer.render(scene, camera);
  }

  function fit() {
    const w = el.clientWidth || 320, h = el.clientHeight || 240;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    drawOnce();
  }
  const ro = new ResizeObserver(fit);
  ro.observe(el);
  fit();

  const onDown = e => {
    if (dragging) return;
    dragging = true;
    pointerId = e.pointerId;
    velAz = 0;
    if (spinning || raf) { spinning = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    lastX = e.clientX; lastY = e.clientY; lastMoveT = performance.now();
    canvas.style.cursor = 'grabbing';
    try { canvas.setPointerCapture?.(e.pointerId); } catch {}
  };
  const onMove = e => {
    if (!dragging || (pointerId !== null && e.pointerId !== pointerId)) return;
    const now = performance.now();
    const dtMove = Math.max(0.004, (now - lastMoveT) / 1000);
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY; lastMoveT = now;
    const dAz = -dx * 0.008;
    az += dAz;
    elAng = Math.max(-1.35, Math.min(1.35, elAng + dy * 0.008));
    velAz = velAz * 0.35 + (dAz / dtMove) * 0.65;
    drawOnce();
  };
  const finishDrag = (e, cancelled = false) => {
    if (!dragging || (pointerId !== null && e?.pointerId !== undefined && e.pointerId !== pointerId)) return;
    dragging = false;
    pointerId = null;
    canvas.style.cursor = 'grab';
    if (cancelled || reduced || performance.now() - lastMoveT > 80) {
      velAz = 0;
    } else if (Math.abs(velAz) > 0.02 && !raf) {
      lastT = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  const onUp = e => finishDrag(e, false);
  const onCancel = e => finishDrag(e, true);
  const onWheel = e => {
    e.preventDefault();
    velAz = 0;
    if (spinning || raf) { spinning = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    dist = Math.max(radius * 0.8, Math.min(radius * 12, dist * (1 + Math.sign(e.deltaY) * 0.08)));
    drawOnce();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('lostpointercapture', onCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function tick(now) {
    if (!spinning && Math.abs(velAz) < 1e-3) { velAz = 0; raf = 0; return; }
    const dt = Math.min(Math.max((now - lastT) / 1000, 0), 0.05);
    lastT = now;
    if (spinning) {
      az += dt * 0.35;
    } else {
      az += velAz * dt;
      velAz *= Math.exp(-dt * 5.0);
    }
    drawOnce();
    raf = requestAnimationFrame(tick);
  }
  if (spinning) raf = requestAnimationFrame(tick);

  return {
    audit,
    source: source || `${audit.tris.toLocaleString()} triangles`,
    setInkMode,
    destroy() {
      spinning = false;
      velAz = 0;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('lostpointercapture', onCancel);
      canvas.removeEventListener('wheel', onWheel);
      setInkMode(false);
      plasterMat.dispose();
      wireMat.dispose();
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose?.());
      });
      renderer.dispose();
      renderer.forceContextLoss();
      el.innerHTML = '';
    },
  };
}
