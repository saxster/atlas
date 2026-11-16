// Multi-sensory procedural WebAudio synthesis kit for @saxster/atlas (zero external audio files).
// Consolidates playTone across phys_kit/bio_kit/chem_kit and adds tactile micro-cues inspired by
// Josh Comeau (rising-pitch boops), Nicky Case (directional stereo clicks), Bruno Simon (velocity knocks),
// and thebuggeddev/electric-motor (continuous resonant motor/field hum + muted-by-default sound pill).
// Safe to import in headless Node (selftest.mjs): touches window/document/AudioContext only when called.

function connectOut(ctx, node, pan = 0) {
  if (pan && typeof ctx.createStereoPanner === 'function') {
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
    node.connect(p);
    p.connect(ctx.destination);
  } else {
    node.connect(ctx.destination);
  }
}

function readyCtx(ctx) {
  if (!ctx || ctx.state === 'closed') return false;
  if (ctx.state === 'suspended') ctx.resume?.().catch?.(() => {});
  return true;
}

// Gentle pitched tone with optional exponential pitch slide and stereo pan.
export function playTone(ctx, { freq = 220, dur = 0.07, type = 'sine', gain = 0.04, slideTo = null, pan = 0 } = {}) {
  if (!readyCtx(ctx)) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(40, Math.min(3200, freq)), now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, Math.min(3200, slideTo)), now + dur);
  g.gain.setValueAtTime(Math.max(0.0001, gain), now);
  g.gain.exponentialRampToValueAtTime(0.0005, now + dur);
  osc.connect(g);
  connectOut(ctx, g, pan);
  osc.start(now);
  osc.stop(now + dur + 0.015);
}

// Josh Comeau style playful spring boop: consecutive steps/streaks ascend by semitones (2^(streak/12)).
export function playBoop(ctx, { streak = 0, baseFreq = 330, dur = 0.075, gain = 0.045, pan = 0 } = {}) {
  const semi = Math.max(0, Math.min(12, streak));
  const f0 = baseFreq * (2 ** (semi / 12));
  playTone(ctx, { freq: f0 * 0.92, slideTo: f0 * 1.12, dur, type: 'triangle', gain, pan });
}

// Directional detent / brush commutator click: crisp filtered noise burst + subtle up/down pitch chirp.
let noiseCache = new WeakMap();
function getClickBuffer(ctx) {
  if (noiseCache.has(ctx)) return noiseCache.get(ctx);
  const len = Math.max(64, Math.floor(ctx.sampleRate * 0.028));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let s = 0x5eed1234;
  for (let i = 0; i < len; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const white = (s / 0xffffffff) * 2 - 1;
    const env = (1 - i / len) ** 3;
    d[i] = white * env;
  }
  noiseCache.set(ctx, buf);
  return buf;
}

export function playClick(ctx, { dir = 1, pan = 0, gain = 0.08 } = {}) {
  if (!readyCtx(ctx)) return;
  const now = ctx.currentTime;
  if (typeof ctx.createBufferSource === 'function' && typeof ctx.createBiquadFilter === 'function') {
    const src = ctx.createBufferSource();
    src.buffer = getClickBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(dir >= 0 ? 2350 : 1650, now);
    bp.Q.setValueAtTime(2.2, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    src.connect(bp);
    bp.connect(g);
    connectOut(ctx, g, pan);
    src.start(now);
  }
  playTone(ctx, { freq: dir >= 0 ? 480 : 380, slideTo: dir >= 0 ? 640 : 270, dur: 0.032, type: 'sine', gain: gain * 0.35, pan });
}

// Bruno Simon velocity-gated tabletop knock with quadratic perceptual loudness and 60ms cooldown.
let lastKnockAt = 0;
export function playKnock(ctx, { velocity = 1, minV = 0.15, maxV = 4, jitter = 0, gain = 0.09, pan = 0 } = {}) {
  if (!readyCtx(ctx) || velocity < minV) return;
  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (nowMs - lastKnockAt < 60) return;
  lastKnockAt = nowMs;
  const norm = Math.max(0.15, Math.min(1, (velocity - minV) / Math.max(1e-6, maxV - minV)));
  const vol = gain * norm * norm;
  const rate = 1 + Math.max(-0.2, Math.min(0.25, jitter));
  const f = 195 * rate;
  playTone(ctx, { freq: f, slideTo: f * 0.62, dur: 0.055, type: 'triangle', gain: vol, pan });
  playTone(ctx, { freq: f * 1.58, dur: 0.032, type: 'sine', gain: vol * 0.45, pan });
}

// Continuous speed-coupled resonant hum (inspired by thebuggeddev/electric-motor sound.ts).
export function createHum(ctx, { baseFreq = 55, maxBoost = 75, maxGain = 0.06 } = {}) {
  if (!readyCtx(ctx) || typeof ctx.createBiquadFilter !== 'function') {
    return { update() {}, stop() {} };
  }
  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc1.type = 'sawtooth';
  osc2.type = 'triangle';
  osc1.frequency.setValueAtTime(baseFreq, now);
  osc2.frequency.setValueAtTime(baseFreq * 2, now);
  lp.type = 'lowpass';
  lp.Q.setValueAtTime(2.0, now);
  lp.frequency.setValueAtTime(280, now);
  g.gain.setValueAtTime(0.0001, now);
  osc1.connect(lp);
  osc2.connect(lp);
  lp.connect(g);
  g.connect(ctx.destination);
  osc1.start(now);
  osc2.start(now);
  let stopped = false;
  return {
    update(speedNorm = 0) {
      if (stopped || !readyCtx(ctx)) return;
      const a = Math.max(0, Math.min(1, Math.abs(speedNorm)));
      const t = ctx.currentTime;
      const f = baseFreq + maxBoost * a;
      osc1.frequency.setTargetAtTime(f, t, 0.08);
      osc2.frequency.setTargetAtTime(f * 2, t, 0.08);
      lp.frequency.setTargetAtTime(280 + 880 * a, t, 0.08);
      g.gain.setTargetAtTime(a < 0.01 ? 0.0001 : maxGain * (0.2 + 0.8 * a), t, 0.1);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      try {
        const t = ctx.currentTime;
        g.gain.setTargetAtTime(0.0001, t, 0.04);
        osc1.stop(t + 0.15);
        osc2.stop(t + 0.15);
      } catch {}
    },
  };
}

// Muted-by-default Sound toggle pill for standalone figures (never plays in ?render or without explicit click).
export function mountSoundToggle(anchorEl, { onToggle = null, place = 'after', label = 'Sound' } = {}) {
  if (!anchorEl || typeof document === 'undefined') return null;
  if (typeof location !== 'undefined' && /[?&]render\b/.test(location.search)) return null;
  let on = false, ctx = null;
  const wrap = document.createElement('button');
  wrap.type = 'button';
  wrap.className = 'playbtn soundtoggle';
  wrap.setAttribute('aria-pressed', 'false');
  const sync = () => {
    wrap.textContent = on ? `${label}: On` : label;
    wrap.setAttribute('aria-pressed', String(on));
  };
  sync();
  if (place === 'before') anchorEl.before(wrap);
  else anchorEl.after(wrap);
  wrap.onclick = () => {
    on = !on;
    if (on && !ctx && typeof window !== 'undefined') {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) { try { ctx = new Ctor(); } catch {} }
    }
    if (on && ctx) {
      readyCtx(ctx);
      playBoop(ctx, { streak: 2, gain: 0.03 });
    } else if (!on && ctx) {
      ctx.suspend?.().catch?.(() => {});
    }
    sync();
    onToggle?.(on, ctx);
  };
  return {
    el: wrap,
    get on() { return on; },
    get ctx() { return ctx; },
    destroy() {
      on = false;
      try { ctx?.close?.(); } catch {}
      wrap.remove();
    },
  };
}
