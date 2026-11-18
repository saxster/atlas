// Independent verification of examples/ink-ui/model.js before drawing any scene or UI.
import { checks, near } from '../../engine/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Category counts partition the 42-item menu
const catSum = M.CATEGORY_COUNTS.Hot + M.CATEGORY_COUNTS.Iced + M.CATEGORY_COUNTS.Tea;
C.check('filter categories (Hot + Iced + Tea) partition All = 42 items',
  catSum === M.TOTAL_MENU_ITEMS && M.filterCount('All').count === 42);

// 2. Search queries return expected counts
C.check('searchMenu: empty query returns 42 items, "flat white" returns 3 results',
  M.searchMenu('').count === 42 && M.searchMenu('flat white').badge === '3 results');

// 3. Bill splitting conservation across 2..6 people
const splitsOk = [2, 3, 4, 5, 6].every(n => {
  const s = M.splitBill(48.00, n);
  return near(s.conservedTotal, 48.00, 1e-9);
});
C.check('splitBill: $48.00 split across 2..6 people conserves exact cent total ($24, $16, $12)',
  splitsOk && M.splitBill(48, 2).share === 24 && M.splitBill(48, 3).share === 16 && M.splitBill(48, 4).share === 12);

// 4. Tray checklist subset sum across all 8 boolean masks
let trayOk = true;
for (let mask = 0; mask < 8; mask++) {
  const slots = [Boolean(mask & 1), Boolean(mask & 2), Boolean(mask & 4)];
  const expected = (slots[0] ? 4.80 : 0) + (slots[1] ? 3.60 : 0) + (slots[2] ? 0.60 : 0);
  if (!near(M.trayTotal(slots).total, expected, 1e-9)) trayOk = false;
}
C.check('trayTotal: all 8 coaster combinations match independent subset sum ($0.00 to $9.00)',
  trayOk && M.trayTotal([true, true, false]).badge === '$8.40' && M.trayTotal([true, true, true]).badge === '$9.00');

// 5. Oven thermal curve endpoints & monotonicity
const t0 = M.ovenState(0), tMid = M.ovenState(0.5), t1 = M.ovenState(1);
C.check('ovenState: smooth thermal curve climbs monotonically from 20°C to 120°C to 220°C',
  t0.tempC === 20 && tMid.tempC === 120 && t1.tempC === 220 && t1.status === 'Fresh out');

// 6. Countdown timer formatting & ready state
C.check('timerReadout: formats 45s as 00:45 and 0s as Ready ✓ · 00:00',
  M.timerReadout(45).badge === '00:45' && M.timerReadout(0).ready && M.timerReadout(0).badge === 'Ready ✓ · 00:00');

// 7. Tip calculator math
const tip18 = M.tipSummary(48, 18), tip25 = M.tipSummary(48, 25);
C.check('tipSummary: 18% of $48 is $8.64 (6 coins) and 25% is $12.00',
  near(tip18.tipAmount, 8.64, 1e-9) && tip18.coins === 6 && near(tip25.tipAmount, 12.00, 1e-9));

// 8. Monthly bar chart delta calculations
const dec = M.monthSpendSummary(5), oct = M.monthSpendSummary(3);
C.check('monthSpendSummary: Dec is −8% vs Nov ($86.20) and Oct is +31% vs Sep ($90.10)',
  dec.badge === '−8% vs Nov · $86.20' && oct.badge === '+31% vs Sep · $90.10');

// 9. All 24 widgets advance state deterministically and tourStateAt(t) is order-independent
const allStepped = M.WIDGET_IDS.length === 24 && M.WIDGET_IDS.every(id => {
  const after = M.stepWidget(M.DEFAULT_STATE, id);
  return JSON.stringify(after) !== JSON.stringify(M.DEFAULT_STATE);
});
const a = M.tourStateAt(4.2), b = M.tourStateAt(19.5), c = M.tourStateAt(4.2);
C.check('all 24 widgets transition state on stepWidget and tourStateAt(t) is order-independent',
  allStepped && JSON.stringify(a) === JSON.stringify(c) && JSON.stringify(a) !== JSON.stringify(b));

C.report();
