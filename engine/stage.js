// The stage: one chapter's world drawn on a canvas and posed by a page position s (2.5 is halfway from page 2 to
// page 3), with everything the reader does to the figure itself: hover lights a thing, a click or tap breaks it down,
// drag turns the camera, shift-drag pans. The book (book.js) puts pages, text and controls around it; a textbook's
// widget (adapters/kym-live.js) mounts it alone. The caller owns time: it calls step() once per frame.
import { createEngine } from './render.js';
import { themeScene } from './parts.js';

export const clamp01 = x => Math.min(Math.max(x, 0), 1);
export const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const ease = u => (u = clamp01(u), u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
export const lerp = (a, b, u) => a + (b - a) * u;

export function mountShareButton(anchorEl, shareUrl, cls = 'again sharebtn', syncUrl = null) {
  if (!anchorEl) return null;
  const shareB = document.createElement('button');
  shareB.type = 'button';
  shareB.className = cls;
  shareB.id = 'share';
  shareB.textContent = 'Copy link';
  anchorEl.after(shareB);
  shareB.onclick = () => {
    const url = shareUrl();
    if (syncUrl) syncUrl();
    else history.replaceState(null, '', url);
    navigator.clipboard?.writeText(url).catch(() => {});
    shareB.textContent = 'Copied link';
    setTimeout(() => { shareB.textContent = 'Copy link'; }, 1400);
  };
  return shareB;
}

// draggable(target, { axes?, plane?, constrain?, onDrag?, onStart?, onEnd?, onReset?, anchor?, pad?, autoMove? })
// Makes any 3D mesh, vector, arrow or group directly grabbable on the canvas.
// - axes: optional prims.axes instance; when given, constrain/onDrag work in data coordinates [x, y, z].
// - plane: 'xy' (default), 'xz', 'yz', 'camera', [nx, ny, nz] normal, or THREE.Plane.
// - constrain(pt): maps raw [x, y, z] to constrained [x, y, z] (e.g. snapping to a curve y = f(x)).
// - onDrag(pt, worldPt): called as the reader drags the handle in 3D.
export function draggable(target, opts = {}) {
  const obj = target?.object || target;
  if (!obj) throw new Error('draggable: missing target mesh or object');
  const spec = {
    obj,
    target,
    axes: opts.axes || null,
    plane: opts.plane || null,
    constrain: opts.constrain || null,
    onDrag: opts.onDrag || null,
    onStart: opts.onStart || null,
    onEnd: opts.onEnd || null,
    onReset: opts.onReset || null,
    anchor: opts.anchor || null,
    pad: opts.pad ?? 28,
    autoMove: opts.autoMove ?? true,
    active: false,
    value: null,
    get() {
      return spec.value;
    },
    set(pt) {
      return spec.project(pt);
    },
    project(pt, worldPt = null) {
      let p = Array.isArray(pt) ? [...pt] : pt?.isVector3 ? [pt.x, pt.y, pt.z] : pt;
      if (spec.constrain) p = spec.constrain(p);
      spec.value = p;
      if (spec.autoMove && !obj.userData?.arrow && Array.isArray(p)) {
        if (spec.axes?.to) {
          const lp = spec.axes.to(p[0], p[1], p[2] ?? 0);
          obj.position?.copy(lp);
          if (obj.userData?.home) obj.userData.home.copy(lp);
        } else if (obj.position) {
          obj.position.set(p[0], p[1], p[2] ?? 0);
          if (obj.userData?.home) obj.userData.home.copy(obj.position);
        }
      }
      if (spec.onDrag) spec.onDrag(p, worldPt);
      return p;
    },
    reset() {
      spec.value = null;
      spec.active = false;
      if (spec.onReset) spec.onReset();
    },
  };
  obj.userData = obj.userData || {};
  obj.userData.draggable = spec;
  return spec;
}

// chapter: { PAGES, buildWorld(E), lookKeys, state(clock, reduced), forceLook?(selected, look), clock0? }
// opts: { reduced, touch, theme (see parts.js applyTheme), dprCap }
// hooks (assign after creating): onHover(key | null), onSelect(key | null), onPointerDown(), onDrag(spec, pt)
export function createStage(canvas, labelsEl, chapter, { reduced = false, touch = false, theme = null, dprCap } = {}) {
  const { PAGES } = chapter;
  const N = PAGES.length;
  const E = createEngine(canvas, { fov: 18, near: 0.2, far: 300, theme });
  E.draggable = draggable;
  const W = chapter.buildWorld(E);
  themeScene(E.scene, E.theme);                 // a host theme: the chapter's greys become this paper's ink
  const hooks = { onHover() {}, onSelect() {}, onPointerDown() {}, onDrag() {} };
  const off = [];                                // listeners to remove on destroy
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); off.push(() => el.removeEventListener(ev, fn, opt)); };

  // the canvas's box, read once per resize: reading it every frame forced a layout after each DOM write.
  // Its size is the layout size, so the book zooming open (cover.js) cannot shrink the canvas; cover.js refits after.
  let rect;
  const fit = () => { const b = canvas.getBoundingClientRect(); rect = { left: b.left, top: b.top, width: canvas.clientWidth || 1, height: canvas.clientHeight || 1 }; E.resize(rect.width, rect.height); };
  on(window, 'resize', fit);
  const ro = new ResizeObserver(fit); ro.observe(canvas); fit();
  // the box moves when the page around it scrolls (a textbook widget): re-read it, once, after a scroll
  let moved = false;
  on(window, 'scroll', () => { moved = true; }, { passive: true, capture: true });
  const box = () => { if (moved) { moved = false; const b = canvas.getBoundingClientRect(); rect.left = b.left; rect.top = b.top; } return rect; };
  if (dprCap) E.setDprCap(dprCap);

  // ---------- labels anchored to the scene ----------
  const labels = (W.labels || []).map(L => {
    const el = document.createElement('div'); el.className = 'lbl ' + L.cls; el.innerHTML = L.html; labelsEl.appendChild(el);
    return { el, at: L.at, text: L.text, last: L.html };   // text: optional () => html for live values
  });
  function placeLabels(w, h) {
    const shown = [];
    for (const L of labels) {
      const p = L.at();
      if (!p) { L.el.style.opacity = 0; continue; }
      const [x, y, front] = E.toScreen(p, w, h);
      const on = front && x > 8 && x < w - 8 && y > 8 && y < h - 8;
      L.el.style.opacity = on ? 1 : 0;
      L.el.style.left = `${x}px`; L.el.style.top = `${y}px`;
      if (L.text) { const h = L.text(); if (h !== L.last) { L.el.innerHTML = h; L.last = h; } }
      if (on) shown.push([L, x]);
    }
    // a label whose anchor is near an edge slides in, so its words stay inside the figure (one layout read for all)
    if (!shown.length) return;
    const left = labelsEl.getBoundingClientRect().left, boxes = shown.map(([L]) => L.el.getBoundingClientRect());
    shown.forEach(([L, x], i) => {
      const over = boxes[i].right - left - (w - 6), under = 6 - (boxes[i].left - left);
      if (over > 0) L.el.style.left = `${x - over}px`; else if (under > 0) L.el.style.left = `${x + under}px`;
    });
  }

  // ---------- hover / click / direct 3D drag ----------
  let hovered = null, hoveredDrag = null, selected = null, pageLit = PAGES[0].lit;
  const relight = () => E.setLit(hovered || selected || pageLit);
  const dRay = new E.THREE.Raycaster(), dNdc = new E.THREE.Vector2(), dHit = new E.THREE.Vector3();
  function liveDraggables() {
    const out = [];
    E.scene.traverseVisible(o => { if (o.userData?.draggable) out.push(o.userData.draggable); });
    return out;
  }
  function handleWorldPos(d) {
    if (d.anchor) return d.anchor();
    E.scene.updateMatrixWorld(true);
    if (d.obj.userData?.arrow?.tip) return d.obj.userData.arrow.tip.getWorldPosition(new E.THREE.Vector3());
    return d.obj.getWorldPosition(new E.THREE.Vector3());
  }
  function pickDraggable(clientX, clientY) {
    const r = box(), x = clientX - r.left, y = clientY - r.top, w = r.width, h = r.height;
    let best = null, bestDist = Infinity;
    for (const d of liveDraggables()) {
      const wp = handleWorldPos(d);
      if (!wp) continue;
      const [sx, sy, front] = E.toScreen(wp, w, h);
      if (!front || sx < -32 || sx > w + 32 || sy < -32 || sy > h + 32) continue;
      const dist = Math.hypot(x - sx, y - sy);
      if (dist <= d.pad && dist < bestDist) { best = d; bestDist = dist; }
    }
    return best;
  }
  function makeDragPlane(d, wp0) {
    if (d.plane?.isPlane) return d.plane.clone();
    let n;
    if (d.plane === 'xz') n = new E.THREE.Vector3(0, 1, 0);
    else if (d.plane === 'yz') n = new E.THREE.Vector3(1, 0, 0);
    else if (d.plane === 'camera') n = E.camera.getWorldDirection(new E.THREE.Vector3()).negate();
    else if (Array.isArray(d.plane)) n = new E.THREE.Vector3(...d.plane).normalize();
    else if (d.axes?.z && d.plane !== 'xy') n = new E.THREE.Vector3(0, 1, 0);
    else n = new E.THREE.Vector3(0, 0, 1);
    return new E.THREE.Plane().setFromNormalAndCoplanarPoint(n, wp0);
  }
  function rayToPlane(clientX, clientY, plane) {
    const r = box(), x = clientX - r.left, y = clientY - r.top;
    dNdc.set((x / r.width) * 2 - 1, -(y / r.height) * 2 + 1);
    dRay.setFromCamera(dNdc, E.camera);
    return dRay.ray.intersectPlane(plane, dHit) ? dHit.clone() : null;
  }

  // hover is re-checked every frame at the pointer's last spot, so moving things light up as they
  // pass under a still cursor and a click lands on whatever is lit at that moment
  // Hover is latched: once something lights up it stays lit (and time stays stopped) until the
  // pointer moves LATCH px from where it caught it, so a moving thing can't slip out from under it.
  let pointer = null, anchor = null, timeRate = 1;
  const LATCH = 40;
  function hoverAt(fromMove) {
    if (!pointer || (drag && drag.moved)) return;
    const dHit = pickDraggable(pointer.x, pointer.y);
    if (dHit !== hoveredDrag) {
      hoveredDrag = dHit;
      canvas.classList.toggle('draggable-hover', !!dHit);
      if (dHit) timeRate = 0;
    }
    if (hovered && anchor && Math.hypot(pointer.x - anchor.x, pointer.y - anchor.y) < LATCH) return;
    if (!fromMove && hovered) return;            // per-frame checks only catch new things passing under
    const r = box();
    const k = E.pick(pointer.x - r.left, pointer.y - r.top, r.width, r.height);
    if (k) anchor = { ...pointer };
    if (k !== hovered) {
      hovered = k; relight();
      if (k) timeRate = 0;                       // stop at once, so it stays where it was caught
      canvas.classList.toggle('pointing', !!(k || hoveredDrag));
      hooks.onHover(k);
    } else {
      canvas.classList.toggle('pointing', !!(hovered || hoveredDrag));
    }
  }
  function select(k) {
    if (k && !E.ASM[k]) return;
    selected = k;
    for (const [key, g] of Object.entries(E.ASM)) g.userData.target = key === k ? 1 : 0;
    relight();
    hooks.onSelect(k);
  }
  // drag turns the camera around the subject; shift- or right-drag pans; a still click selects; grabbing a handle drags it in 3D
  const orbit = { az: 0, el: 0, pan: new E.THREE.Vector3() };
  const lookAt = new E.THREE.Vector3();
  let drag = null;
  on(canvas, 'contextmenu', e => e.preventDefault());
  on(canvas, 'pointerdown', e => {
    hooks.onPointerDown();
    const pan = e.shiftKey || e.button === 2, scrub = e.altKey;
    const item = !pan && !scrub && e.button === 0 ? pickDraggable(e.clientX, e.clientY) : null;
    drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, pan, scrub, item, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  on(canvas, 'pointerup', e => {
    if (drag?.item && drag.moved) {
      drag.item.active = false;
      drag.item.onEnd?.(drag.item.value);
    } else if (drag && !drag.moved && e.button === 0) {
      // a finger has no hover: a tap picks whatever is under it
      const r = box();
      const k = e.pointerType === 'mouse' ? hovered : E.pick(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
      select(k && k !== selected ? k : null);
    }
    drag = null; canvas.classList.remove('dragging');
  });
  on(canvas, 'dblclick', () => {
    orbit.az = 0; orbit.el = 0; orbit.pan.set(0, 0, 0);
    for (const d of liveDraggables()) d.reset();
  });
  on(canvas, 'pointermove', e => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      if (!drag.moved && drag.item) {
        const wp0 = handleWorldPos(drag.item);
        drag.plane = makeDragPlane(drag.item, wp0);
        const hit0 = rayToPlane(drag.x0, drag.y0, drag.plane);
        drag.offset = hit0 ? wp0.clone().sub(hit0) : new E.THREE.Vector3();
        drag.item.active = true;
        drag.item.onStart?.();
      }
      drag.moved = true; drag.x = e.clientX; drag.y = e.clientY;
      canvas.classList.add('dragging');
      if (drag.item) {
        timeRate = 0;
        const hit = rayToPlane(e.clientX, e.clientY, drag.plane);
        if (hit) {
          const worldPt = hit.add(drag.offset);
          let pt;
          if (drag.item.axes?.fromWorld) pt = drag.item.axes.fromWorld(worldPt);
          else if (drag.item.obj.parent) {
            drag.item.obj.parent.updateWorldMatrix(true, false);
            pt = drag.item.obj.parent.worldToLocal(worldPt.clone()).toArray();
          } else pt = worldPt.toArray();
          const val = drag.item.project(pt, worldPt);
          hooks.onDrag(drag.item, val);
        }
      } else if (drag.scrub) {
        clock = Math.max(0, clock + dx * 0.025);
        scrubbed = clock;
        timeRate = 0;
      } else if (drag.pan) {
        // world units per screen pixel at the target's depth, so the scene follows the cursor
        const cam = E.camera, k = 2 * Math.tan(E.THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.distanceTo(lookAt) / rect.height;
        const right = new E.THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new E.THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
        orbit.pan.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
      } else { orbit.az -= dx * 0.35; orbit.el += dy * 0.25; }
      return;
    }
    pointer = { x: e.clientX, y: e.clientY };
    hoverAt(true);
  });
  on(canvas, 'pointerleave', () => { pointer = null; anchor = null; hoveredDrag = null; if (hovered) { hovered = null; relight(); hooks.onHover(null); } canvas.classList.remove('pointing', 'draggable-hover'); });

  // a breakdown's camera: the assembly's own view, or a sphere around its visible parts
  function focusOf(k) {
    const g = E.ASM[k];
    // an assembly may name its own breakdown view: userData.focus = () => ({ target: [x, y, z], radius })
    if (g.userData.focus) { const f = g.userData.focus(); return { target: f.target, dist: Math.max(E.distFor(f.radius), g.userData.minDist ?? 2) }; }
    const bb = new E.THREE.Box3();
    g.updateMatrixWorld(true);
    const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };   // hidden parents too
    g.traverse(o => { if (o.isMesh && o.userData.part !== undefined && shown(o)) bb.expandByObject(o); });
    const s = bb.getBoundingSphere(new E.THREE.Sphere());
    return { target: s.center.toArray(), dist: Math.max(E.distFor(Math.max(s.radius, g.userData.minRadius ?? 1.2)), g.userData.minDist ?? 8) };   // a scene may allow a closer zoom
  }

  // ---------- one frame ----------
  // s: the page position; litPage: whose lit thing is lit (the page whose text shows); running: time may advance
  // (false while paused or still); clockAt: set the clock outright (a recorded tour) instead of advancing it.
  let clock = chapter.clock0 || 0, scrubbed = null, lastClockAt, focusAmt = 0, lastFocus = null, orbitPage = 0, orbitHome = false;
  // blend: 'turn' eases each page's camera and look in over the second part of the scroll (a book's page turn);
  // 'linear' follows s as it is, for a caller that already eases s (a machine's step).
  function step({ now, dt, s, litPage = Math.round(s), running = true, narrow = false, narrowZoom = 1, clockAt, blend = 'turn' }) {
    s = Math.min(Math.max(s, 0), N - 1);
    const i = Math.min(Math.floor(s), N - 1), f = s - i, j = Math.min(i + 1, N - 1);
    if (PAGES[litPage].lit !== pageLit) { pageLit = PAGES[litPage].lit; relight(); }

    // camera: the scroll path, blended toward the opened thing
    const u = blend === 'linear' ? f : ease(smooth(0.3, 1, f));
    const A = PAGES[i].cam, B = PAGES[j].cam;
    let cam = { target: A.target.map((v, k) => lerp(v, B.target[k], u)), az: lerp(A.az, B.az, u), el: lerp(A.el, B.el, u), dist: lerp(A.dist, B.dist, u) };
    // a canvas narrower than the cameras were framed for pulls back; a page may say its own (a close-up in a wide figure)
    const fa = k => PAGES[k].frameAspect ?? chapter.frameAspect ?? 1.25;
    cam.dist *= Math.max(1, lerp(fa(i), fa(j), u) / E.camera.aspect);
    if (narrow) cam.dist *= narrowZoom;
    if (!reduced && !drag && running) cam.az += Math.sin(now / 5200) * 1.2;
    const page = Math.round(s);
    if (page !== orbitPage) { orbitPage = page; orbitHome = true; }
    if (drag && drag.moved) orbitHome = false;
    if (orbitHome) { const k = Math.exp(-dt * 3); orbit.az *= k; orbit.el *= k; orbit.pan.multiplyScalar(k); }
    focusAmt += ((selected ? 1 : 0) - focusAmt) * (1 - Math.exp(-dt * 4));
    if (selected) lastFocus = focusOf(selected);
    if (focusAmt > 0.001 && lastFocus) {
      const F = lastFocus;
      cam = { target: cam.target.map((v, k) => lerp(v, F.target[k], focusAmt)), az: cam.az, el: lerp(cam.el, Math.max(cam.el, 6), focusAmt), dist: lerp(cam.dist, F.dist, focusAmt) };
    }
    cam.az += orbit.az;
    cam.el = Math.min(Math.max(cam.el + orbit.el, -4), 85);
    cam.target = cam.target.map((v, k) => v + orbit.pan.getComponent(k));
    lookAt.fromArray(cam.target);
    E.placeCamera(cam);

    // time eases to a stop while something is pointed at, open, or being scrubbed/dragged, so moving things can be caught and read
    timeRate = selected || hovered || hoveredDrag || !running || drag?.scrub || drag?.item ? 0 : timeRate + (1 - timeRate) * (1 - Math.exp(-dt * 4));
    if (clockAt !== undefined) {
      if (clockAt !== lastClockAt) { lastClockAt = clockAt; if (!drag?.scrub) scrubbed = null; }
      clock = scrubbed ?? clockAt;
    } else if (!reduced) clock += dt * timeRate;
    const state = chapter.state(clock, reduced);
    const LA = PAGES[i].look, LB = PAGES[j].look, look = {};
    for (const key of chapter.lookKeys) look[key] = lerp(LA[key] || 0, LB[key] || 0, u);
    if (chapter.forceLook) chapter.forceLook(selected, look);
    W.update(state, look);
    E.stepExplode(dt);

    hoverAt(false);
    E.render();
    placeLabels(rect.width, rect.height);
    return state;
  }

  // for tools/labels.mjs: every label on screen, its box, and whether a solid stands between it and the camera
  const ray = new E.THREE.Raycaster(), anchorV = new E.THREE.Vector3();
  function labelReport() {
    const solids = [];
    // arrows draw over solids and glass shows through: neither hides a label
    E.scene.traverse(o => { if (o.isMesh && o.visible && o.userData.part !== undefined && o.material.depthTest !== false && !o.material.transparent) solids.push(o); });
    const cb = canvas.getBoundingClientRect();
    // a vector's label rides its arrow, which is drawn over the solids as in a free-body diagram: never hidden
    return labels.filter(L => +L.el.style.opacity > 0).map(L => {
      const p = L.at(), r = L.el.getBoundingClientRect();
      anchorV.copy(p); const d = E.camera.position.distanceTo(anchorV);
      ray.set(E.camera.position, anchorV.clone().sub(E.camera.position).normalize()); ray.far = d * 0.97;
      const hit = ray.intersectObjects(solids, false).find(h => { for (let o = h.object; o; o = o.parent) if (!o.visible) return false; return true; });
      return { text: L.el.textContent, box: [r.left - cb.left, r.top - cb.top, r.width, r.height], hiddenBy: hit && !L.el.classList.contains('vec') ? (hit.object.userData.part || 'a solid') : null };
    });
  }

  function destroy() {
    for (const f of off) f();
    ro.disconnect();
    for (const L of labels) L.el.remove();
    E.dispose();
  }

  return {
    E, W, N, hooks, step, select, relight, labelReport, destroy, fit, draggable,
    get selected() { return selected; }, get hovered() { return hovered; }, get dragging() { return !!drag; },
    get clock() { return clock; }, set clock(c) { clock = c; },
  };
}
