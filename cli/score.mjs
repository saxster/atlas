// node cli/score.mjs <timeline.json> [<silent.mp4> <out.mp4>] — a soundtrack made by code, timed to the figure.
// A quiet lo-fi bed (four warm chords, a soft kick and brushed hats, a little vinyl hiss), a bell at every page turn
// or step start, and a soft pluck at each designed event (a coin landing, a column growing), pitched from the chord
// underneath. Seeded, so the same timeline gives the same sound. Then ffmpeg's loudnorm, two passes, to −14 LUFS
// integrated and −1 dBTP, and a measuring pass to prove it. With a video, the audio is muxed in (video copied).
// Without one it writes <timeline>.wav. Needs ffmpeg on PATH.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rng } from '../engine/rng.js';

const [timelineFile, silentVideo, outVideo] = process.argv.slice(2);
if (!timelineFile) { console.log('usage: node tools/score.mjs <timeline.json> [<silent.mp4> <out.mp4>]'); process.exit(2); }
const T = JSON.parse(fs.readFileSync(timelineFile, 'utf8'));
const SR = 48000, N = Math.ceil((T.duration + 0.05) * SR);
const L = new Float32Array(N), Rt = new Float32Array(N);
const rand = rng(20261030);
const hz = m => 440 * 2 ** ((m - 69) / 12);
const add = (i, l, r = l) => { if (i >= 0 && i < N) { L[i] += l; Rt[i] += r; } };

// ---------- the bed: 72 bpm, a chord every two bars ----------
const BEAT = 60 / 72, BAR = 4 * BEAT, CHORD = 2 * BAR;
const CHORDS = [[53, 57, 60, 64, 67], [50, 53, 57, 60, 64], [46, 53, 57, 62, 65], [48, 55, 57, 62, 64]];   // Fmaj9 Dm9 B♭maj9 C6/9
const chordAt = t => CHORDS[Math.floor(t / CHORD) % CHORDS.length];
for (let c = 0; c * CHORD < T.duration; c++) {
  const start = c * CHORD, notes = CHORDS[c % CHORDS.length];
  const a = 1.6, len = CHORD + 1.8;   // slow swell in, ring over the next chord
  notes.forEach((m, k) => {
    const f = hz(m), det = 1 + (k - 2) * 0.0012, pan = 0.5 + (k - 2) * 0.12;
    for (let j = 0; j < len * SR; j++) {
      const t = j / SR, env = Math.min(1, t / a) * Math.min(1, Math.max(0, (len - t) / 1.8));
      const ph = 2 * Math.PI * f * det * t, v = (Math.sin(ph) + 0.18 * Math.sin(2 * ph + 0.3) + 0.05 * Math.sin(3 * ph)) * env * 0.035;
      add(Math.round((start + t) * SR), v * (1 - pan) * 2, v * pan * 2);
    }
  });
  // the root an octave down, for warmth
  const f = hz(notes[0] - 12);
  for (let j = 0; j < len * SR; j++) {
    const t = j / SR, env = Math.min(1, t / a) * Math.min(1, Math.max(0, (len - t) / 1.8));
    add(Math.round((start + t) * SR), Math.sin(2 * Math.PI * f * t) * env * 0.05);
  }
}
// kick on 1 and 3, hats on the off-beats, all soft
for (let b = 0; b * BEAT < T.duration; b++) {
  const at = Math.round(b * BEAT * SR);
  if (b % 2 === 0) for (let j = 0; j < 0.35 * SR; j++) {
    const t = j / SR, f = 48 + 60 * Math.exp(-t * 30);
    add(at + j, Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9) * 0.16);
  }
  const off = at + Math.round(BEAT * SR / 2);
  for (let j = 0; j < 0.05 * SR; j++) { const v = (rand.next() * 2 - 1) * Math.exp(-j / SR * 90) * 0.022; add(off + j, v * 0.8, v * 1.2); }
}
// vinyl hiss and the odd crackle
for (let i = 0; i < N; i++) {
  const h = (rand.next() * 2 - 1) * 0.0025; add(i, h, h);
  if (rand.next() < 0.00004) { const v = (rand.next() * 2 - 1) * 0.05; add(i, v, v * 0.6); }
}

// ---------- the figure: a bell at each page or step, a pluck at each event ----------
const bell = (t0, gain) => {
  const notes = chordAt(t0), f = hz(notes[notes.length - 1] + 12);
  for (let j = 0; j < 2.2 * SR; j++) {
    const t = j / SR, e = Math.exp(-t * 2.2);
    add(Math.round((t0 + t) * SR), (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 4)) * e * gain);
  }
};
const pluck = (t0, k, gain) => {
  const notes = chordAt(t0), f = hz(notes[k % notes.length] + 24), pan = 0.3 + 0.4 * ((k * 0.618) % 1);
  for (let j = 0; j < 0.5 * SR; j++) {
    const t = j / SR, e = Math.exp(-t * 11) * Math.min(1, t * 400);
    const v = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * e * gain;
    add(Math.round((t0 + t) * SR), v * (1 - pan) * 2, v * pan * 2);
  }
};
const starts = new Set(T.starts.map(t => Math.round(t * 100)));
T.starts.forEach(t => bell(t + 0.02, 0.07));
// events: one sound per 60 ms at most; dense runs (a coin a month) play softer, so they read as a texture
const ev = [...new Set(T.events.map(t => Math.round(t * 100) / 100))].filter(t => t >= 0 && t < T.duration && !starts.has(Math.round(t * 100))).sort((a, b) => a - b);
let last = -1;
ev.forEach((t, k) => {
  if (t - last < 0.06) return;
  const gap = Math.min(t - last, (ev[k + 1] ?? Infinity) - t); last = t;
  pluck(t, k, gap < 0.3 ? 0.03 : 0.06);
});

// fade in and out
for (let i = 0; i < N; i++) { const t = i / SR, g = Math.min(1, t / 1.0) * Math.min(1, Math.max(0, (T.duration - t) / 2.0)); L[i] *= g; Rt[i] *= g; }

// ---------- write, normalise, measure ----------
const raw = timelineFile.replace(/\.timeline\.json$/, '') + '.raw.wav', wav = timelineFile.replace(/\.timeline\.json$/, '') + '.wav';
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
const s16 = v => Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
for (let i = 0; i < N; i++) { buf.writeInt16LE(s16(L[i]), 44 + i * 4); buf.writeInt16LE(s16(Rt[i]), 46 + i * 4); }
fs.writeFileSync(raw, buf);

const ff = a => execFileSync('ffmpeg', ['-hide_banner', '-nostats', ...a], { stdio: ['ignore', 'pipe', 'pipe'] });
// pass 1: measure
const p1 = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${raw}" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1`]).toString();
const m = JSON.parse(p1.slice(p1.lastIndexOf('{'), p1.lastIndexOf('}') + 1));
// pass 2: correct, linearly where it can
ff(['-y', '-i', raw, '-af', `loudnorm=I=-14:TP=-1:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`, '-c:a', 'pcm_s16le', wav]);
fs.unlinkSync(raw);
// measure what came out
const p3 = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${wav}" -af ebur128=peak=true -f null - 2>&1`]).toString();
const I = +p3.match(/Integrated loudness:\s+I:\s+(-?[\d.]+)/)[1], TP = +p3.match(/True peak:\s+Peak:\s+(-?[\d.]+)/)[1];
const ok = Math.abs(I + 14) <= 1 && TP <= -0.9;
console.log(ok ? 'PASS' : 'FAIL', `loudness ${I} LUFS (target −14 ±1), true peak ${TP} dBTP (limit −1)`);

if (silentVideo && outVideo) {
  ff(['-y', '-i', silentVideo, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', outVideo]);
  fs.unlinkSync(silentVideo); fs.unlinkSync(wav);
}
process.exit(ok ? 0 : 1);
