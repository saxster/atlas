// Saving ₹1,000 a month at 8 % a year for 20 years. Pure functions; money in rupees, time in months.
// Every number in the figure, its chips and its text comes from here.
//
// The bank's rule, as Indian recurring deposits and SIP calculators state it: 8 % a year is 8/12 % a month; at the
// end of each month the bank adds a month's interest on what is already in the pot, then your ₹1,000 goes in. So
// the pot after m months is B(m) = B(m−1)·(1 + r) + P, which sums to the annuity formula P·((1 + r)^m − 1)/r.
// Real deposits differ in small ways (quarterly compounding, tax, a deposit at the start of the month), and the
// figure says so; the shape of the story does not change.

export const P = 1000;              // rupees deposited each month
export const RATE = 0.08;           // a year, nominal
export const r = RATE / 12;         // a month: 0.6667 %
export const YEARS = 20, MONTHS = YEARS * 12;
export const LATE = 120;            // the late starter begins after 10 years
export const MONTH_S = 365.25 * 86400 / 12;   // seconds in an average month, for the speed badge

// the pot after m whole months (closed form)
export const pot = m => m <= 0 ? 0 : P * ((1 + r) ** m - 1) / r;
export const deposited = m => P * Math.max(0, m);
export const interest = m => pot(m) - deposited(m);
// if interest did not earn interest: each deposit earns P·r a month for as long as it has been in, never added back
export const simplePot = m => m <= 0 ? 0 : P * m + P * r * m * (m - 1) / 2;
// someone who starts saving LATE months later, for the rest of the 20 years
export const latePot = m => pot(m - LATE);
// a lump sum doubles in ln 2 / ln(1 + r) months; the rule of 72 says about 72 / 8 = 9 years
export const DOUBLE_MONTHS = Math.log(2) / Math.log(1 + r);
export const EFFECTIVE = (1 + r) ** 12 - 1;   // 8.30 % a year, once the monthly interest compounds

// the machine's clock runs in months; between month-ends the pot is drawn as it was at the last month-end, and the
// month's coin falls during the month
export function at(clock) {
  const m = Math.min(Math.max(clock, 0), MONTHS), whole = Math.floor(m + 1e-9), f = m - whole;
  return { m, whole, f, pot: pot(whole), deposited: deposited(whole), interest: interest(whole), simple: simplePot(whole), late: latePot(whole) };
}
// the pot at the end of year y (1–20) for the 20 columns, and the part of it that is interest
export const yearEnd = y => ({ pot: pot(12 * y), deposited: deposited(12 * y), interest: interest(12 * y), simple: simplePot(12 * y), late: latePot(12 * y) });

// rupees the Indian way: 5,89,020 (lakhs and crores), and in words for the big idea
export function rupees(x) {
  const n = Math.round(x), s = String(Math.abs(n)), last3 = s.slice(-3), rest = s.slice(0, -3);
  return (n < 0 ? '−' : '') + '₹' + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last3;
}
export const lakh = x => `₹${(x / 1e5).toFixed(2)} lakh`;
