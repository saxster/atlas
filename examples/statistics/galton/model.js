// A Galton board: balls fall through rows of pegs, going right with probability p at each peg. Pure functions of
// (rows, p, n balls, seed, time). The slot a ball lands in is its number of rights: Binomial(rows, p).
// Every ball, count, chip and chart value in the figure comes from here; the same seed always makes the same pile.
import { rng, binomial } from './rand.js';

export const DX = 0.36, ROW_DY = 0.3;            // peg spacing across and down, world units
export const R = 0.045, PER_LAYER = 4;           // ball radius; balls side by side in a slot
export const RELEASE = 6, FALL0 = 0.25, ROW_T = 0.11, DROP = 0.35;   // seconds: release span, to the first peg, per row, into the pile

// the slots are tall enough for the tallest pile the theory expects, with room for chance (×1.25, plus a layer)
export const pileH = (rows, p, n) => (1.25 * n * Math.max(...Array.from({ length: rows + 1 }, (_, k) => pmf(rows, p, k))) / PER_LAYER + 1) * 2 * R;
export const top = (rows, p, n) => pileH(rows, p, n) + 0.35 + rows * ROW_DY;   // the height of the first peg
export const slotX = (rows, s) => (s - rows / 2) * DX;

// the experiment: every ball's path (1 = right) and slot, and its place in its slot's pile, in release order
export function run({ rows, p, n, seed }) {
  const g = rng(seed), paths = [], slot = [], place = [], counts = Array(rows + 1).fill(0);
  for (let i = 0; i < n; i++) {
    const path = Array.from({ length: rows }, () => g.next() < p ? 1 : 0);
    const s = path.reduce((a, b) => a + b, 0);
    paths.push(path); slot.push(s); place.push(counts[s]++);
  }
  return { rows, p, n, seed, paths, slot, place, counts, top: top(rows, p, n) };
}
export const releaseAt = (e, i) => i * RELEASE / e.n;
export const flight = rows => FALL0 + rows * ROW_T + DROP;
export const duration = ({ rows }) => RELEASE + flight(rows);

// where ball i is at time t (null: not dropped yet)
export function ballAt(e, i, t) {
  const tau = t - releaseAt(e, i), T = e.top;
  if (tau < 0) return null;
  const restY = R + Math.floor(e.place[i] / PER_LAYER) * 2 * R, restX = slotX(e.rows, e.slot[i]) + ((e.place[i] % PER_LAYER) - (PER_LAYER - 1) / 2) * 2 * R;
  if (tau < FALL0) return { x: 0, y: T + 0.35 - 0.35 * (tau / FALL0) ** 2, landed: false };
  const k = Math.floor((tau - FALL0) / ROW_T);
  if (k < e.rows) {
    // between peg row k and row k + 1: drift sideways to the next gap while falling a row (a parabolic hop)
    const u = (tau - FALL0 - k * ROW_T) / ROW_T, rights = e.paths[i].slice(0, k).reduce((a, b) => a + b, 0);
    const x0 = (rights - k / 2) * DX, x1 = (rights + e.paths[i][k] - (k + 1) / 2) * DX;
    return { x: x0 + (x1 - x0) * u, y: T - k * ROW_DY - ROW_DY * u * u + 0.06 * Math.sin(Math.PI * u), landed: false };
  }
  const u = Math.min((tau - FALL0 - e.rows * ROW_T) / DROP, 1), y0 = T - e.rows * ROW_DY, x0 = slotX(e.rows, e.slot[i]);
  return { x: x0 + (restX - x0) * u, y: y0 + (restY - y0) * u * u, landed: u >= 1 };
}

// the pile so far: landed counts per slot, and their statistics
export function pileAt(e, t) {
  const counts = Array(e.rows + 1).fill(0);
  let landed = 0, sum = 0, sum2 = 0;
  for (let i = 0; i < e.n; i++) if (t - releaseAt(e, i) >= flight(e.rows)) { counts[e.slot[i]]++; landed++; sum += e.slot[i]; sum2 += e.slot[i] ** 2; }
  const mean = landed ? sum / landed : 0, variance = landed > 1 ? (sum2 - landed * mean * mean) / (landed - 1) : 0;
  return { counts, landed, mean, variance };
}

// the theory the pile approaches
export const pmf = (rows, p, k) => binomial(rows, k) * p ** k * (1 - p) ** (rows - k);
export const expected = (rows, p, n) => Array.from({ length: rows + 1 }, (_, k) => n * pmf(rows, p, k));
export const theoryMean = (rows, p) => rows * p, theoryVar = (rows, p) => rows * p * (1 - p);
export const normalPdf = (x, mu, s) => Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
export const mode = (rows, p) => Math.min(rows, Math.floor((rows + 1) * p));   // the most likely slot
