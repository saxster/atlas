import * as THREE from 'three';
import { PALETTE, part, box, lines, V } from '@saxster/atlas/parts.js';

export function buildWorld(E, p = { botShare: 0.70, independentPrimary: 1, buggy: 0 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  const gConsult = asm('consultation', root, {
    title: 'Raw comment volume vs deduplicated human sample',
    sub: 'tall red bot towers swamp genuine human voices unless automated duplicates and stolen identities are filtered out',
  });
  gConsult.userData.focus = () => ({ target: [-1.3, 1.1, 0], radius: 2.2 });

  const gTree = asm('provenance', root, {
    title: 'Citation provenance chain (12 outlets -> N_eff primary)',
    sub: 'tracing five or twelve secondary articles back to one memo collapses apparent corroboration to its true source count',
  });
  gTree.userData.focus = () => ({ target: [1.5, 1.1, 0], radius: 2.2 });

  part(gConsult, box(6.0, 0.06, 2.2), { pal: 'board', tone: 'faint', pos: [0, -0.03, 0], name: 'Consultation & citation base' });
  const unit = box(1, 1, 1, 0.015);
  const mBot = part(gConsult, unit, { pal: 'red', tone: 'lit', name: 'Synthetic / duplicated submissions' });
  const mHuman = part(gConsult, unit, { pal: 'green', tone: 'lit', name: 'Verified independent human respondents' });

  const mPrimary = part(gTree, unit, { pal: 'blue', tone: 'lit', name: 'Independent primary records (N_eff)' });
  const mCopies = [];
  for (let i = 0; i < 6; i++) {
    mCopies.push(part(gTree, unit, { pal: 'ochre', tone: 'mid', name: `Secondary echo outlet #${i + 1}` }));
  }

  lines(gTree, [1.5, 0.5, 0, 0.8, 1.4, 0, 1.5, 0.5, 0, 2.2, 1.4, 0], '#8c8578', 0.8);

  let cur = { botPct: 70, nEff: 1, rawSupp: 77.7, trueSupp: 35, buggy: 0 };
  const place = (m, x, y, w, h, d) => {
    m.scale.set(Math.max(0.05, w), Math.max(0.05, h), Math.max(0.05, d));
    m.position.set(x, y + Math.max(0.05, h) / 2, 0);
    m.userData.home.copy(m.position);
  };

  label('axis', () => cur.buggy ? 'BUGGY: COUNT RAW COPIES' : 'PROVENANCE AUDIT: COLLAPSE ECHOES', () => V(0.8, 2.65, 0));
  label('vec red', () => `Bot ${cur.botPct}%`, () => V(-2.0, 1.95, 0.45));
  label('vec green', () => `Human ${100 - cur.botPct}%`, () => V(-0.85, 1.15, 0.45));
  label('vec blue', () => `N_eff = ${cur.nEff}`, () => V(1.5, 0.35, 0.5));
  label('mark', () => `Support ${cur.buggy ? cur.rawSupp : cur.trueSupp}%`, () => V(1.6, 2.15, 0.35));

  function update(s) {
    const { e, snap } = s;
    const g = Math.max(0.08, snap.frac);
    cur = {
      botPct: Math.round(e.botShare * 100),
      nEff: e.res.uniqueSources,
      rawSupp: e.res.rawSupportPct,
      trueSupp: e.res.humanSupportPct,
      buggy: e.buggy,
    };

    const hBot = e.buggy ? Math.max(0.1, e.botShare * 2.4 * g) : Math.max(0.08, e.botShare * 2.2 * g);
    const hHum = Math.max(0.12, (1 - e.botShare) * 2.2 * g);
    place(mBot, -2.0, 0, 0.65, hBot, 0.65);
    place(mHuman, -0.85, 0, 0.65, hHum, 0.65);

    place(mPrimary, 1.5, 0, 0.75, Math.max(0.18, (e.res.uniqueSources / 6) * 0.9 * g), 0.75);
    for (let i = 0; i < mCopies.length; i++) {
      const colX = 0.65 + (i % 3) * 0.85;
      const colY = i < 3 ? 1.05 : 1.65;
      const visibleScale = e.buggy ? 0.38 : 0.16;
      place(mCopies[i], colX, colY, visibleScale, visibleScale * g, visibleScale);
    }
  }
  return { update, labels };
}
