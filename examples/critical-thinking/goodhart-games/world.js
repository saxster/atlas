import * as THREE from 'three';
import { PALETTE, part, box, V } from '@saxster/atlas/parts.js';

export function buildWorld(E, p = { quotaPressure: 0.75, auditStrength: 0.25, gameKind: 0 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  const gGood = asm('goodhart', root, {
    title: 'Goodhart’s Law: proxy quota vs genuine trust',
    sub: 'rewarding an unverified account-count target makes proxy counts climb while unauthorized accounts erode customer trust',
  });
  gGood.userData.focus = () => ({ target: [-1.4, 1.1, 0], radius: 2.2 });

  const gGame = asm('games', root, {
    title: '2×2 strategic payoff landscape',
    sub: 'four columns represent payoffs in Prisoner’s Dilemma, Assurance, or Shared-Bill spillover games',
  });
  gGame.userData.focus = () => ({ target: [1.45, 1.0, 0], radius: 2.2 });

  part(gGood, box(6.2, 0.06, 2.3), { pal: 'board', tone: 'faint', pos: [0, -0.03, 0], name: 'Incentive & payoff plinth' });
  const unit = box(1, 1, 1, 0.015);
  const mProxy = part(gGood, unit, { pal: 'ochre', tone: 'lit', name: 'Rewarded proxy metric (Accounts/Customer)' });
  const mTrust = part(gGood, unit, { pal: 'green', tone: 'lit', name: 'Genuine verified customer value' });
  const mFake = part(gGood, unit, { pal: 'red', tone: 'lit', name: 'Unauthorized gaming share' });

  const gCells = [
    part(gGame, unit, { pal: 'blue', tone: 'lit', name: 'Cell (Cooperate, Cooperate)' }),
    part(gGame, unit, { pal: 'red', tone: 'lit', name: 'Cell (Cooperate, Defect)' }),
    part(gGame, unit, { pal: 'red', tone: 'mid', name: 'Cell (Defect, Cooperate)' }),
    part(gGame, unit, { pal: 'ochre', tone: 'mid', name: 'Cell (Defect, Defect)' }),
  ];

  let cur = { acc: 2.0, trust: 1.0, unauth: 0, gameName: 'PD' };
  const place = (m, x, z, w, h, d) => {
    const H = Math.max(0.06, h);
    m.scale.set(w, H, d);
    m.position.set(x, H / 2, z);
    m.userData.home.copy(m.position);
  };

  label('vec ochre', () => `Proxy ${cur.acc.toFixed(1)}`, () => V(-2.25, 2.3, 0.35));
  label('vec green', () => `Trust ${Math.round(cur.trust * 100)}%`, () => V(-1.35, 1.75, 0.35));
  label('vec red', () => `Fake ${Math.round(cur.unauth * 100)}%`, () => V(-0.45, 1.15, 0.35));
  label('axis', () => cur.gameName, () => V(1.65, 2.55, 0));

  function update(s) {
    const { e, snap } = s;
    const g = Math.max(0.08, snap.frac);
    cur = {
      acc: snap.accountsVis,
      trust: snap.trustVis,
      unauth: e.goodhart.unauthorizedShare * snap.frac,
      gameName: e.game.name.toUpperCase(),
    };

    place(mProxy, -2.25, 0, 0.56, Math.min(2.3, (snap.accountsVis / 6.5) * 2.2), 0.56);
    place(mTrust, -1.35, 0, 0.56, Math.max(0.15, snap.trustVis * 2.0), 0.56);
    place(mFake, -0.45, 0, 0.45, Math.max(0.06, cur.unauth * 2.4), 0.45);

    const coords = [[1.0, -0.48], [2.0, -0.48], [1.0, 0.48], [2.0, 0.48]];
    const flat = [
      e.game.payoffs[0][0][0], e.game.payoffs[0][1][1],
      e.game.payoffs[1][0][0], e.game.payoffs[1][1][0],
    ];
    for (let i = 0; i < 4; i++) {
      place(gCells[i], coords[i][0], coords[i][1], 0.62, Math.max(0.15, (flat[i] / 12) * 2.1 * g), 0.62);
    }
  }
  return { update, labels };
}
