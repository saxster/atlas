// "See the real specimen": an interactive 3D mesh or GLB/GLTF specimen viewer (loaded on demand, just like
// adapters/molecule.js), graded with auditDeliverable() before display.
// Accepts:
//   - a URL string to a .glb / .gltf asset,
//   - a builder function (THREE) => THREE.Object3D | { object, source? }, or
//   - a spec object { src?, object?, build?(THREE), source?, maxTris?, requireUV?, clampNonMetal? }.
// showSpecimen(el, spec, { background }) -> Promise<{ audit, source, destroy() }>
import * as THREE from 'three';
import { auditDeliverable } from '../engine/mesh-audit.js';

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

  const audit = auditDeliverable(root, {
    maxTris: cfg.maxTris ?? 50000,
    requireUV: !!cfg.requireUV,
    clampNonMetal: cfg.clampNonMetal ?? true,
  });

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:grab;touch-action:none';
  el.innerHTML = '';
  el.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setClearColor(background, 1);
  const scene = new THREE.Scene();

  // Center the specimen at the origin and measure its bounding sphere
  const holder = new THREE.Group();
  scene.add(holder);
  holder.add(root);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const sphere = box.isEmpty() ? new THREE.Sphere(new THREE.Vector3(), 1) : box.getBoundingSphere(new THREE.Sphere());
  root.position.sub(sphere.center);
  const radius = Math.max(sphere.radius, 0.01);

  // Three-point museum lighting
  scene.add(new THREE.HemisphereLight(0xfffcf5, 0xd8d4cc, 0.85));
  const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.35);
  keyLight.position.set(radius * 2.2, radius * 2.8, radius * 2.4);
  const fillLight = new THREE.DirectionalLight(0xdce6f7, 0.55);
  fillLight.position.set(-radius * 2.4, radius * 0.8, radius * 1.6);
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.45);
  rimLight.position.set(0, radius * 2.0, -radius * 2.5);
  scene.add(keyLight, fillLight, rimLight);

  const camera = new THREE.PerspectiveCamera(28, 1, radius * 0.02, radius * 40);
  let az = 0.45, elAng = 0.32, dist = radius / Math.sin(THREE.MathUtils.degToRad(14)) * 1.25;
  let spinning = true, dragging = false, lastX = 0, lastY = 0, raf = 0, lastT = performance.now();

  function placeCam() {
    camera.position.set(
      dist * Math.sin(az) * Math.cos(elAng),
      dist * Math.sin(elAng),
      dist * Math.cos(az) * Math.cos(elAng),
    );
    camera.lookAt(0, 0, 0);
  }

  function fit() {
    const w = el.clientWidth || 320, h = el.clientHeight || 240;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    placeCam();
    renderer.render(scene, camera);
  }
  const ro = new ResizeObserver(fit);
  ro.observe(el);
  fit();

  const onDown = e => {
    dragging = true; spinning = false;
    lastX = e.clientX; lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    az -= dx * 0.008;
    elAng = Math.max(-1.35, Math.min(1.35, elAng + dy * 0.008));
    placeCam();
    renderer.render(scene, camera);
  };
  const onUp = () => { dragging = false; canvas.style.cursor = 'grab'; };
  const onWheel = e => {
    e.preventDefault();
    spinning = false;
    dist = Math.max(radius * 0.8, Math.min(radius * 12, dist * (1 + Math.sign(e.deltaY) * 0.08)));
    placeCam();
    renderer.render(scene, camera);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function tick(now) {
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    if (spinning) {
      az += dt * 0.35;
      placeCam();
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return {
    audit,
    source: source || `${audit.tris.toLocaleString()} triangles`,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
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
