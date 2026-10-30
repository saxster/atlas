// The figure: twenty columns, one per year of saving. Each column is the pot at that year's end: white is the money
// paid in, red on top is the interest. A chute above drops each month's ₹1,000 coin into the growing column. Asked for
// (look.simple), the red splits: red is what simple interest would have paid, amber above it is interest earned on
// interest. Blue columns are the saver who starts 10 years late.
import * as THREE from 'three';
import { part, cyl, lines, shadeMat, PALETTE, V } from '@saxster/atlas/parts.js';
import * as M from './model.js';

export const UNIT = 3.0 / M.pot(M.MONTHS);       // world units per rupee: the final pot stands 3.0 tall
export const STEP = 0.42, W = 0.30;              // column spacing and width
export const colX = y => (y - 10.5) * STEP;      // year 1 … 20, centred on x = 0
PALETTE.amber = ['#f3d68e', '#e4b552', '#bf9030'];

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at) => labels.push({ cls, html, at });

  // the board and its year ticks
  part(root, new THREE.BoxGeometry(20 * STEP + 0.6, 0.06, 1.3), { tone: 'lo', pal: 'board', pos: [0, -0.03, 0], name: 'Board' });
  const grid = [];
  for (let k = 1; k <= 6; k++) { const y = k * 1e5 * UNIT; grid.push(colX(1) - 0.3, y, -0.5, colX(20) + 0.3, y, -0.5); }
  const gridLines = lines(root, grid, '#ececE8');
  // the lakh scale only once there is something to read on it: in the coin-by-coin year the pot is a sliver
  let scaleOn = true;
  for (const y of [1, 5, 10, 15, 20]) label('tick', `year ${y}`, () => V(colX(y) + 0.12, 0.02, 0.62));
  for (const k of [2, 4, 6]) label('axis', `₹${k} lakh`, () => scaleOn ? V(colX(1) - 0.32, k * 1e5 * UNIT, -0.5) : null);

  // the columns: one white block (paid in) and one red block (interest) per year, scaled each frame
  const g = asm('stack', root, { title: 'The pot, year by year', sub: 'white: what you paid in · red: interest' });
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const cols = Array.from({ length: M.YEARS }, (_, i) => {
    const x = colX(i + 1);
    const dep = part(g, unitBox, { tone: 'mid', pal: 'paper', pos: [x, 0, 0], name: 'Paid in' });
    const int = part(g, unitBox, { tone: 'mid', pal: 'red', pos: [x, 0, 0], name: 'Interest', ex: [0, 0.5, 0] });
    const ioi = part(g, unitBox, { tone: 'mid', pal: 'amber', pos: [x, 0, 0], name: 'Interest on interest', ex: [0, 0.8, 0] });
    return { dep, int, ioi };
  });
  const gl = asm('late', root, { title: 'Starting ten years later', sub: 'the same ₹1,000 a month, from year 11' });
  // in front of the columns, narrower: the late saver's pots are short enough not to hide them
  const lates = Array.from({ length: M.YEARS }, (_, i) => part(gl, unitBox, { tone: 'mid', pal: 'blue', pos: [colX(i + 1), 0, 0.36], name: 'Late saver' }));

  // the chute and this month's coin
  const gc = asm('coin', root, { title: 'This month’s ₹1,000', sub: 'in at the end of every month, after the interest' });
  const chute = part(gc, new THREE.BoxGeometry(0.36, 0.18, 0.36), { tone: 'hi', pal: 'dark', name: 'Chute' });
  const coin = part(gc, cyl(0.11, 0.025, 28), { tone: 'hi', pal: 'amber', name: 'Coin' });
  coin.rotation.x = 0.35;
  label('mark', '₹1,000', () => coin.visible ? coin.position.clone().add(V(0.22, 0.05, 0)) : null);
  const colTop = c => c.dep.scale.y + (c.int.visible ? c.int.scale.y : 0);
  label('board', 'interest', () => cols[19].int.visible && cols[19].int.scale.y > 0.2 ? V(colX(20) + 0.2, cols[19].dep.scale.y + cols[19].int.scale.y / 2, 0) : null);
  label('board', 'interest on<br>interest', () => cols[19].ioi.visible && cols[19].ioi.scale.y > 0.2 ? V(colX(20) + 0.2, colTop(cols[19]) + cols[19].ioi.scale.y / 2, 0) : null);
  label('board', 'paid in', () => cols[19].dep.visible && cols[19].dep.scale.y > 0.2 ? V(colX(20) + 0.2, cols[19].dep.scale.y / 2, 0) : null);

  const set = (o, h, y0 = 0) => { o.visible = h > 1e-4; if (!o.visible) return; o.scale.set(W, h, W); o.userData.home.set(o.position.x, y0 + h / 2, o.position.z); o.position.y = y0 + h / 2; };
  function update(s, look) {
    for (let i = 0; i < M.YEARS; i++) {
      const y = i + 1, upto = Math.min(s.whole, 12 * y), started = s.whole > 12 * (y - 1) || (s.m > 12 * (y - 1) && s.f > 0);
      const dep = started ? M.deposited(upto) * UNIT : 0, int = started ? M.interest(upto) * UNIT : 0;
      // asked for, the interest splits at what simple interest would have paid; the rest is interest on interest
      const simpleInt = started ? (M.simplePot(upto) - M.deposited(upto)) * UNIT : 0, k = Math.min(1, Math.max(0, look.simple || 0));
      const red = int - k * (int - simpleInt);
      set(cols[i].dep, dep); set(cols[i].int, red, dep); set(cols[i].ioi, int - red, dep + red);
      const lt = M.latePot(upto) * UNIT; set(lates[i], started && look.late > 0.01 ? lt * Math.min(1, look.late) : 0);
      lates[i].scale.x = lates[i].scale.z = W * 0.62;
    }
    // the coin falls through the month into the column it is joining
    const yNow = Math.min(Math.floor(s.whole / 12) + 1, M.YEARS), top = M.pot(s.whole) * UNIT, cx = colX(yNow);
    // the chute belongs to the coin-by-coin year, low over the first column so the opening view is close in
    chute.position.set(cx, 1.3, 0); chute.visible = look.coin > 0.5;
    coin.visible = look.coin > 0.5 && s.m < M.MONTHS && s.f > 0;
    coin.position.set(cx, 1.2 - (1.2 - top - 0.02) * Math.min(1, (s.f / 0.85) ** 2), 0);
    scaleOn = gridLines.visible = s.whole > 12 || look.coin < 0.5;
  }
  return { update, labels, cols };
}
