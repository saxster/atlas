// Left: 3D potential energy hill U(x) along the reaction coordinate showing the uncatalyzed barrier (red)
// and catalyzed pathway (green) with colliding molecules attempting to summit the transition state.
// Right: Maxwell–Boltzmann energy distribution with the shaded high-energy tail E ≥ E_eff.
import * as THREE from 'three';
import { PALETTE, part, rod, lines, V } from '@saxster/atlas/parts.js';
import { axes, plot, area, curve, particles } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.cat = ['#6bc48e', '#2e8b57', '#1e5e3a'];   // catalyzed pathway & reactive molecules (green)
PALETTE.amber = ['#f5c96b', '#d99b26', '#9e6d14']; // transition state marker

export function buildWorld(E, p0 = { T: 300, Ea: 54, dEcat: 0 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // ---------- left: 3D reaction-coordinate potential energy barrier U(x) ----------
  const gb = asm('barrier', root, {
    title: 'Reaction coordinate energy profile U(x)',
    sub: 'molecules with collision energy E < E_a bounce back; those in the Boltzmann tail E ≥ E_a cross the transition state at x = 0.5',
  });
  gb.userData.focus = () => ({ target: [-1.85, 1.15, 0], radius: 1.85 });

  const axHill = axes(gb, {
    x: [0, 1], y: [-20, 80], size: [3.1, 2.35], at: [-3.45, 0.45, 0],
    ticks: { x: 2, y: 4 }, names: { x: 'reaction coordinate <i>x</i>', y: '<i>U</i> (kJ/mol)' }, grid: true,
  });
  labels.push(...axHill.labels);

  // Reference zero line U = 0 (reactants) and product shelf U = ΔH = −15 kJ/mol
  const pR0 = axHill.to(0, 0), pR1 = axHill.to(1, 0);
  lines(gb, [...pR0.toArray(), ...pR1.toArray()], '#9a9aa0', 0.55);

  // Uncatalyzed 3D barrier curve (red) and catalyzed pathway curve (green)
  const uncatCurve = curve(gb, x => [x, M.barrierU(x, p0.Ea, 0), 0], {
    axes: axHill, t: [0, 1], samples: 120, radius: 0.022, color: 'red', name: 'Uncatalyzed barrier U(x)',
  });
  const catCurve = curve(gb, x => [x, M.barrierU(x, p0.Ea, p0.dEcat), 0.03], {
    axes: axHill, t: [0, 1], samples: 120, radius: 0.020, color: 'cat', name: 'Catalyzed pathway U_cat(x)',
  });

  // Vertical activation-energy gauge rod at x = 0.5
  const eaRod = rod(gb, { r: 0.022, pal: 'red', name: 'Activation energy E_a', ex: [0.2, 0, 0.3] });
  const tsDot = part(gb, new THREE.SphereGeometry(0.068, 20, 14), {
    pal: 'amber', tone: 'lit', name: 'Transition state (x = 0.5)',
  });

  // Colliding molecules: blue (sub-threshold, bounce back) vs green (reactive E >= E_eff, cross over x = 0.5)
  const bounceBeads = particles(gb, M.N_PARTICLES, { radius: 0.048, color: 'blue', name: 'Sub-barrier collisions (E < E_a)' });
  const reactBeads  = particles(gb, M.N_PARTICLES, { radius: 0.052, color: 'cat',  name: 'Reactive collisions (E ≥ E_a)' });
  const colliders = M.buildColliders(M.N_PARTICLES, 303);

  // ---------- right: Maxwell–Boltzmann distribution & high-energy tail ----------
  const gm = asm('boltzmann', root, {
    title: 'Maxwell–Boltzmann collision energy distribution',
    sub: 'a small rise in temperature T barely shifts the average energy, but swells the shaded reactive tail E ≥ E_a exponentially',
  });
  const axMB = axes(gm, {
    x: [0, 80], y: [0, 1.05], size: [3.25, 2.35], at: [0.35, 0.0, 0],
    ticks: { x: 4, y: 4 }, names: { x: 'collision energy <i>E</i> (kJ/mol)', y: 'relative density' }, grid: true,
  });
  labels.push(...axMB.labels);

  // Normalized visual Maxwell–Boltzmann curve on [0, 80] kJ/mol so the peak and high-energy tail at E_a = 35–75 are crystal clear
  const visMB = (E, T) => {
    const Epeak = 12.0 * (T / 300); // visual peak scales linearly with T
    if (E <= 0) return 0;
    const u = E / Epeak;
    return Math.sqrt(u) * Math.exp(0.5 * (1 - u));
  };

  // Reference 280 K baseline curve (faint grey)
  plot(gm, E => visMB(E, 280), {
    axes: axMB, x: [0, 80], samples: 120, color: 'grey', width: 0.018, name: 'Cold reference (280 K)',
  });

  // Shaded reactive tail E >= E_eff
  const tailArea = area(gm, E => visMB(E, p0.T), {
    axes: axMB, x: [M.effectiveEa(p0.Ea, p0.dEcat), 80], pal: 'cat', opacity: 0.36, name: 'Reactive tail (E ≥ E_eff)',
  });
  const mbCurve = plot(gm, E => visMB(E, p0.T), {
    axes: axMB, x: [0, 80], samples: 120, color: 'blue', width: 0.040, name: 'Maxwell–Boltzmann distribution at T',
  });

  // Threshold vertical bar at E = E_eff (and uncatalyzed E_a when catalyst is active)
  const threshRod = rod(gm, { r: 0.024, pal: 'cat', name: 'Effective threshold E_eff', ex: [0.2, 0, 0.3] });
  const uncatRod  = rod(gm, { r: 0.018, pal: 'red', name: 'Uncatalyzed threshold E_a', ex: [0.2, 0, 0.3] });

  let cur = { T: p0.T, Ea: p0.Ea, dEcat: p0.dEcat, Eeff: M.effectiveEa(p0.Ea, p0.dEcat), nReact: 0 };
  label('vec red', () => `<i>E</i><sub>a</sub> = ${cur.Ea} kJ/mol`, () => axHill.to(0.68, cur.Ea + 12, 0.05));
  label('board', () => cur.dEcat > 0 ? `catalyzed <i>E</i><sub>eff</sub> = ${cur.Eeff} kJ/mol` : 'Δ<i>H</i> = −15 kJ/mol', () =>
    axHill.to(0.65, -55, 0.05));
  label('vec blue', () => `<i>T</i> = ${cur.T} K`, () => axMB.to(42, 0.96, 0.05));
  label('board', () => `tail <i>E</i> ≥ ${cur.Eeff} kJ/mol`, () => axMB.to(78, 0.32, 0.05));

  function update(s) {
    const { T, Ea, dEcat, t } = s;
    const Eeff = M.effectiveEa(Ea, dEcat);

    // Update 3D barrier curves and transition-state markers
    uncatCurve.update(x => [x, M.barrierU(x, Ea, 0), 0]);
    catCurve.update(x => [x, M.barrierU(x, Ea, dEcat), 0.03]);
    catCurve.object.visible = dEcat > 0;

    eaRod.set(axHill.to(0.5, 0, 0.02), axHill.to(0.5, Eeff, 0.02));
    tsDot.position.copy(axHill.to(0.5, Eeff, 0.04));

    // Animate colliding molecules along the reaction coordinate
    let iBounce = 0, iReact = 0;
    for (let i = 0; i < M.N_PARTICLES; i++) {
      const c = colliders[i];
      const Epart = M.visualCollisionEnergy(c.u, T);
      const tau = ((t * c.speed + c.phase) % 1.0); // cycle in [0, 1)
      if (Epart >= Eeff) {
        // Reactive molecule: climbs from x = 0 over x = 0.5 down to product valley x = 1
        const x = tau;
        const y = M.barrierU(x, Ea, dEcat) + 2.5;
        const pos = axHill.to(x, y, c.zOff);
        reactBeads.set(iReact++, [pos.x, pos.y, pos.z]);
      } else {
        // Sub-threshold molecule: climbs up to turningPointX(Epart, Eeff) and bounces back to x = 0
        const xTurn = M.turningPointX(Epart, Eeff);
        const tri = tau < 0.5 ? (2 * tau) : (2 * (1 - tau));
        const x = xTurn * Math.sin(0.5 * Math.PI * tri);
        const y = M.barrierU(x, Ea, dEcat) + 2.0;
        const pos = axHill.to(x, y, c.zOff);
        bounceBeads.set(iBounce++, [pos.x, pos.y, pos.z]);
      }
    }
    bounceBeads.show(iBounce);
    reactBeads.show(iReact);

    // Update Maxwell–Boltzmann distribution and shaded reactive tail
    mbCurve.update(E => visMB(E, T));
    tailArea.update(E => visMB(E, T), { x: [Eeff, 80] });
    threshRod.set(axMB.to(Eeff, 0, 0.03), axMB.to(Eeff, Math.max(0.18, visMB(Eeff, T)), 0.03));
    uncatRod.set(axMB.to(Ea, 0, 0.02), axMB.to(Ea, Math.max(0.18, visMB(Ea, T)), 0.02));
    uncatRod.visible = dEcat > 0;

    cur = { T, Ea, dEcat, Eeff, nReact: iReact };
  }

  return { update, labels };
}
