import * as THREE from 'three';
import { PALETTE, part, box, lines, V } from '@saxster/atlas/parts.js';

export function buildWorld(E, p = { claimedAUMBillions: 28, dtcVerifiedBillions: 0.018, buggyPaperTrust: 0 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  const gExchange = asm('exchange', root, {
    title: 'Global CBOE OEX exchange ceiling vs Madoff claimed contracts',
    sub: 'every valid hedge requires an option counterparty on the exchange; claimed AUM overflows global open interest',
  });
  gExchange.userData.focus = () => ({ target: [-1.2, 1.15, 0], radius: 2.3 });

  const gCustody = asm('custody', root, {
    title: 'Paper statement ($2.5B) vs DTC independent custody (< $18M)',
    sub: 'customer receipts and self-issued monthly statements prove payouts arrived, not that claimed shares existed at DTC',
  });
  gCustody.userData.focus = () => ({ target: [1.5, 1.15, 0], radius: 2.1 });

  part(gExchange, box(6.2, 0.06, 2.2), { pal: 'board', tone: 'faint', pos: [0, -0.03, 0], name: 'Clearing & custody ledger' });
  const unit = box(1, 1, 1, 0.015);
  const mCeiling = part(gExchange, unit, { pal: 'green', tone: 'lit', name: 'Entire Global CBOE OEX Option Market ($13.7B cap)' });
  const mClaimed = part(gExchange, unit, { pal: 'red', tone: 'lit', name: 'Claimed Split-Strike Option Contracts Needed' });

  const mPaper = part(gCustody, unit, { pal: 'ochre', tone: 'lit', name: 'Self-issued Paper Statement ($2.5B Fairfield Sentry)' });
  const mDTC = part(gCustody, unit, { pal: 'blue', tone: 'lit', name: 'Independent DTC Custody Record (< $18M)' });

  lines(gExchange, [-2.5, 0.9, 0.5, -0.3, 0.9, 0.5], '#45613b', 0.9);

  let cur = { aum: 1, share: 0.07, buggy: 0 };
  const place = (m, x, w, h, d) => {
    const H = Math.max(0.04, h);
    m.scale.set(w, H, d);
    m.position.set(x, H / 2, 0);
    m.userData.home.copy(m.position);
  };

  label('vec green', 'OEX Cap $13.7B', () => V(-2.0, 1.15, 0.45));
  label('vec red', () => `$${cur.aum.toFixed(0)}B (${Math.round(cur.share * 100)}% mkt)`, () => V(-0.95, 1.85, 0.55));
  label('axis', () => cur.buggy ? 'BUGGY: PAPER ALONE' : 'DTC CUSTODY AUDIT', () => V(1.85, 2.65, 0));
  label('mark', 'Paper $2.5B', () => V(1.0, 2.05, 0.45));
  label('vec blue', 'DTC < $18M', () => V(2.05, 0.42, 0.45));

  function update(s) {
    const { e, snap } = s;
    const g = Math.max(0.08, snap.frac);
    cur = { aum: snap.aumVis, share: snap.shareOfWorldMarket, buggy: e.buggyPaperTrust };

    place(mCeiling, -1.95, 0.72, 0.9, 0.72);
    const hClaimed = Math.min(2.7, (snap.aumVis / e.cap.exchangeCeilingBillions) * 0.9);
    place(mClaimed, -0.85, 0.72, hClaimed, 0.72);

    place(mPaper, 1.0, 0.68, 1.9 * g, 0.68);
    place(mDTC, 2.05, 0.68, e.buggyPaperTrust ? 1.9 * g : 0.06, 0.68);
  }
  return { update, labels };
}
