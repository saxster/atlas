// Pure model for Corner Atelier (examples/ink-ui/): deterministic state, pricing, conservation, thermal curve,
// timer countdown, bar-chart deltas, and stateless ?render tour evaluation across all 24 widgets.
// Zero DOM globals, zero Three.js or presentation imports.

export const MENU_CATALOG = [
  { id: 'fw', name: 'Flat white', category: 'Hot', price: 4.80 },
  { id: 'esp', name: 'Double espresso', category: 'Hot', price: 3.60 },
  { id: 'cap', name: 'Cappuccino', category: 'Hot', price: 4.60 },
  { id: 'pourover', name: 'Single-origin pour-over', category: 'Hot', price: 5.40 },
  { id: 'cortado', name: 'Cortado', category: 'Hot', price: 4.30 },
  { id: 'mocha', name: 'Dark cocoa mocha', category: 'Hot', price: 5.20 },
  { id: 'iced-fw', name: 'Iced flat white', category: 'Iced', price: 5.10 },
  { id: 'cold-brew', name: 'Slow cold brew', category: 'Iced', price: 4.90 },
  { id: 'espresso-tonic', name: 'Espresso tonic', category: 'Iced', price: 5.50 },
  { id: 'iced-latte', name: 'Iced oat latte', category: 'Iced', price: 5.30 },
  { id: 'sencha', name: 'Uji sencha green tea', category: 'Tea', price: 4.40 },
  { id: 'hojicha', name: 'Roasted hojicha latte', category: 'Tea', price: 5.00 },
  { id: 'chai', name: 'Cardamom masala chai', category: 'Tea', price: 4.90 },
  { id: 'earl', name: 'Bergamot earl grey', category: 'Tea', price: 4.20 },
  { id: 'matcha', name: 'Ceremonial iced matcha', category: 'Tea', price: 5.60 },
];

export const TOTAL_MENU_ITEMS = 42;
export const CATEGORY_COUNTS = { All: 42, Hot: 18, Iced: 14, Tea: 10 };
export const SEARCH_PRESETS = ['flat white', 'cardamom', 'cold brew', 'hojicha', ''];

export const SCHEDULE_DAYS = [
  { day: 'Wed 16', event: 'Cupping · 4 pm' },
  { day: 'Thu 17', event: 'Roastery tour' },
  { day: 'Fri 18', event: 'Table for 2' },
  { day: 'Sat 19', event: 'Bake day' },
  { day: 'Sun 20', event: 'Acoustic set' },
];

export const BREW_STEPS = ['Drinks', 'Pastry', 'Pickup'];

export const SIZE_OPTIONS = [
  { key: 'S', label: 'Small', oz: 8, price: 4.20, scale: 0.78 },
  { key: 'M', label: 'Regular', oz: 12, price: 4.80, scale: 0.96 },
  { key: 'L', label: 'Large', oz: 16, price: 5.30, scale: 1.14 },
];

export const RATING_LABELS = ['Fair', 'Good', 'Solid', 'Great', 'Sublime'];

export const MILK_OPTIONS = [
  { key: 'whole', label: 'Whole', short: 'WHOLE', surcharge: 0.0, badge: 'Included' },
  { key: 'oat', label: 'Oat', short: 'OAT', surcharge: 0.60, badge: '+ $0.60' },
  { key: 'almond', label: 'Almond', short: 'ALMOND', surcharge: 0.60, badge: '+ $0.60' },
];

export const ORDER_STAGES = ['Queued', 'Brewing', 'Ready'];

export const TRAY_ITEMS = [
  { id: 'fw', label: 'Flat white', price: 4.80 },
  { id: 'bun', label: 'Bun', price: 3.60 },
  { id: 'oat', label: 'Oat milk', price: 0.60 },
];

export const TOAST_MESSAGES = [
  { title: 'Your flat white is ready', meta: 'Counter 2 · now' },
  { title: 'Double stamps today', meta: 'Coffee club · until 6 pm' },
];

export const PAY_STAGES = ['Tap to pay', 'Checking…', 'Paid ✓'];
export const TAB_ITEMS = ['Menu', 'Orders (2)', 'Rewards'];
export const WAVEFORM_BARS = [0.38, 0.76, 0.54, 0.96, 0.68, 0.45, 0.88, 0.42, 0.62, 0.84, 0.50, 0.32];

export const MONTHLY_SPEND = [
  { key: 'jul', label: 'Jul', value: 64.00 },
  { key: 'aug', label: 'Aug', value: 72.50 },
  { key: 'sep', label: 'Sep', value: 68.80 },
  { key: 'oct', label: 'Oct', value: 90.10 },
  { key: 'nov', label: 'Nov', value: 93.70 },
  { key: 'dec', label: 'Dec', value: 86.20 },
];

export const WIDGET_IDS = [
  'search', 'filter', 'date', 'stepper', 'oven', 'toggles',
  'split', 'size', 'rating', 'milk', 'timer', 'order',
  'tray', 'toast', 'pay', 'audio', 'tabs', 'chat', 'tip',
  'club', 'shots', 'wallet', 'coupon', 'chart',
];

export const DEFAULT_STATE = {
  searchIndex: 0,
  searchQuery: 'flat white',
  filterCategory: 'All',
  dateIndex: 3,        // Sat 19 · Bake day
  brewStep: 1,         // Step 2 of 3
  ovenProgress: 0.78,  // 0..1 -> 20°C..220°C
  toggleMask: 0b111,   // Open, Lights, Music all on
  splitCount: 3,       // $48.00 / 3 = $16.00 each
  sizeIndex: 2,        // Large · $5.30
  rating: 4,           // 4/5 Great
  milkIndex: 1,        // Oat +$0.60
  timerSec: 45,        // 00:45 countdown
  orderStage: 1,       // Brewing
  traySlots: [true, true, false], // $4.80 + $3.60 = $8.40
  toastIndex: 1,       // Double stamps today
  payStage: 0,         // Tap to pay ($48.00)
  audioSec: 2,         // 0:02 of 0:04
  tabIndex: 0,         // Menu
  chatTyping: false,   // ✓✓ Seen · 9:41
  tipPct: 18,          // 18%
  clubStamps: 7,       // 7/10
  shots: 3,            // 3 shots
  walletDrops: 0,      // $1,240 base + $5 * drops
  couponTorn: false,   // BUN20
  chartMonthIndex: 5,  // Dec ($86.20, −8% vs Nov)
};

export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
export const smooth01 = u => { const x = clamp(u, 0, 1); return x * x * (3 - 2 * x); };
export const dollars = v => `$${Number(v).toFixed(2)}`;

export function searchMenu(query = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return { query: '', count: TOTAL_MENU_ITEMS, badge: `${TOTAL_MENU_ITEMS} items` };
  const hits = MENU_CATALOG.filter(it => it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q));
  // Scale to full 42-item menu (3 matches for 'flat white')
  const count = q === 'flat white' ? 3 : Math.max(1, hits.length * 2);
  return { query: q, count, badge: `${count} result${count === 1 ? '' : 's'}` };
}

export function filterCount(category = 'All') {
  const count = CATEGORY_COUNTS[category] ?? TOTAL_MENU_ITEMS;
  return { category, count, badge: `${category} · ${count}` };
}

export function ovenState(progress = 0.78) {
  const u = clamp(progress, 0, 1);
  const tempC = Math.round(20 + 200 * smooth01(u));
  const status = u >= 0.92 ? 'Fresh out' : (u >= 0.25 ? 'Baking' : 'Preheating');
  return { progress: u, tempC, status, badge: `${ status } · ${ tempC }°C` };
}

export function toggleCount(mask = 0b111) {
  const m = mask & 0b111;
  const on = ((m & 1) ? 1 : 0) + ((m & 2) ? 1 : 0) + ((m & 4) ? 1 : 0);
  return { mask: m, on, badge: `${on} on` };
}

export function splitBill(bill = 48.00, people = 3) {
  const n = clamp(Math.round(people), 2, 6);
  const exactShare = +(bill / n).toFixed(2);
  const remainderCents = Math.round(bill * 100) - Math.round(exactShare * 100) * n;
  return {
    bill,
    people: n,
    share: exactShare,
    remainderCents,
    conservedTotal: +(exactShare * n + remainderCents / 100).toFixed(2),
    badge: `${dollars(exactShare)} each`,
  };
}

export function trayTotal(slots = [true, true, false]) {
  let sum = 0;
  const active = TRAY_ITEMS.map((it, i) => {
    const on = Boolean(slots[i]);
    if (on) sum += it.price;
    return { ...it, on };
  });
  const total = +sum.toFixed(2);
  return { active, total, badge: dollars(total) };
}

export function timerReadout(sec = 45) {
  const s = clamp(Math.round(sec), 0, 90);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  const ready = s === 0;
  return { sec: s, ready, formatted: `${mm}:${ss}`, badge: ready ? 'Ready ✓ · 00:00' : `00:${ss}` };
}

export function tipSummary(bill = 48.00, tipPct = 18) {
  const pct = clamp(Math.round(tipPct), 0, 30);
  const tipAmount = +(bill * (pct / 100)).toFixed(2);
  const total = +(bill + tipAmount).toFixed(2);
  const coins = Math.max(1, Math.round((pct / 30) * 10));
  return { pct, tipAmount, total, coins, badge: `${pct}% · ${dollars(tipAmount)}` };
}

export function shotsSummary(shots = 3) {
  const k = clamp(Math.round(shots), 1, 4);
  return { shots: k, caffeineMg: k * 63, badge: `${k} shot${k === 1 ? '' : 's'}` };
}

export function walletSummary(drops = 0, base = 1240) {
  const n = Math.max(0, Math.round(drops));
  const balance = base + n * 5;
  return { drops: n, balance, formatted: `$${balance.toLocaleString('en-US')}`, badge: n > 0 ? `+ $${n * 5} cashback` : 'Cashback active' };
}

export function monthSpendSummary(monthIndex = 5) {
  const idx = clamp(Math.round(monthIndex), 0, MONTHLY_SPEND.length - 1);
  const cur = MONTHLY_SPEND[idx];
  const prev = MONTHLY_SPEND[idx > 0 ? idx - 1 : 0];
  const diff = +(cur.value - prev.value).toFixed(2);
  const pct = idx === 0 ? 0 : Math.round((diff / prev.value) * 100);
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : '';
  const deltaText = idx === 0 ? 'baseline' : `${sign}${Math.abs(pct)}% vs ${prev.label}`;
  return {
    index: idx,
    month: cur.label,
    value: cur.value,
    pct,
    deltaText,
    badge: `${deltaText} · ${dollars(cur.value)}`,
  };
}

// Step a single widget forward by 1 interaction beat (used by both user clicks and Autoplay).
export function stepWidget(state, widgetId) {
  const next = { ...state, traySlots: [...(state.traySlots || DEFAULT_STATE.traySlots)] };
  switch (widgetId) {
    case 'search': {
      next.searchIndex = ((next.searchIndex || 0) + 1) % SEARCH_PRESETS.length;
      next.searchQuery = SEARCH_PRESETS[next.searchIndex];
      break;
    }
    case 'filter': {
      const cats = Object.keys(CATEGORY_COUNTS);
      const idx = (cats.indexOf(next.filterCategory) + 1) % cats.length;
      next.filterCategory = cats[idx];
      break;
    }
    case 'date':
      next.dateIndex = (next.dateIndex + 1) % SCHEDULE_DAYS.length;
      break;
    case 'stepper':
      next.brewStep = (next.brewStep + 1) % BREW_STEPS.length;
      break;
    case 'oven':
      next.ovenProgress = next.ovenProgress >= 0.95 ? 0.25 : +(next.ovenProgress + 0.35).toFixed(2);
      break;
    case 'toggles':
      next.toggleMask = ((next.toggleMask || 1) % 7) + 1;
      break;
    case 'split':
      next.splitCount = next.splitCount >= 4 ? 2 : next.splitCount + 1;
      break;
    case 'size':
      next.sizeIndex = (next.sizeIndex + 1) % SIZE_OPTIONS.length;
      break;
    case 'rating':
      next.rating = (next.rating % 5) + 1;
      break;
    case 'milk':
      next.milkIndex = (next.milkIndex + 1) % MILK_OPTIONS.length;
      break;
    case 'timer':
      next.timerSec = next.timerSec <= 0 ? 45 : Math.max(0, next.timerSec - 15);
      break;
    case 'order':
      next.orderStage = (next.orderStage + 1) % ORDER_STAGES.length;
      break;
    case 'tray': {
      const p = (next.traySlots[0] ? 1 : 0) + (next.traySlots[1] ? 2 : 0) + (next.traySlots[2] ? 4 : 0);
      const np = (p % 7) + 1;
      next.traySlots = [Boolean(np & 1), Boolean(np & 2), Boolean(np & 4)];
      break;
    }
    case 'toast':
      next.toastIndex = (next.toastIndex + 1) % TOAST_MESSAGES.length;
      break;
    case 'pay':
      next.payStage = (next.payStage + 1) % PAY_STAGES.length;
      break;
    case 'audio':
      next.audioSec = (next.audioSec + 1) % 5;
      break;
    case 'tabs':
      next.tabIndex = (next.tabIndex + 1) % TAB_ITEMS.length;
      break;
    case 'chat':
      next.chatTyping = !next.chatTyping;
      break;
    case 'tip':
      next.tipPct = next.tipPct >= 24 ? 12 : next.tipPct + 6;
      break;
    case 'club':
      next.clubStamps = (next.clubStamps % 10) + 1;
      break;
    case 'shots':
      next.shots = (next.shots % 4) + 1;
      break;
    case 'wallet':
      next.walletDrops = (next.walletDrops + 1) % 6;
      break;
    case 'coupon':
      next.couponTorn = !next.couponTorn;
      break;
    case 'chart':
      next.chartMonthIndex = (next.chartMonthIndex + 1) % MONTHLY_SPEND.length;
      break;
    default:
      break;
  }
  return next;
}

export const TOUR_STEP_SEC = 1.2;
export const TOUR_DURATION = WIDGET_IDS.length * TOUR_STEP_SEC;

// Pure order-independent state at tour timestamp t (in seconds) for ?render mode.
export function tourStateAt(t = 0) {
  const clamped = clamp(Number(t) || 0, 0, TOUR_DURATION);
  const steps = Math.floor(clamped / TOUR_STEP_SEC);
  const phase = (clamped - steps * TOUR_STEP_SEC) / TOUR_STEP_SEC;
  let st = { ...DEFAULT_STATE, traySlots: [...DEFAULT_STATE.traySlots] };
  for (let i = 0; i <= steps && i < WIDGET_IDS.length; i++) {
    st = stepWidget(st, WIDGET_IDS[i]);
  }
  const activeWidget = WIDGET_IDS[Math.min(steps, WIDGET_IDS.length - 1)];
  return { state: st, activeWidget, stepIndex: steps, phase };
}
