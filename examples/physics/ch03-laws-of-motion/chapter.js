import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, cone, lines, arrow, setArrow, rod, spring,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'a = F / m carts',
    fig: 'Figure 3.2 · Newton’s Second Law carts: doubling force vs doubling mass',
    title: 'Acceleration Proportional to F_net / m',
    alt: 'Two parallel 3D laboratory dynamics tracks comparing a reference cart against a programmable test cart driven by force vector F_net and loaded with brass mass bricks.',
    cam: { target: [0, 1.25, 0], az: 22, el: 22, dist: 7.4 },
    lit: 'test_cart',
    parts: ['ref_cart', 'test_cart'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Bridging chain',
    fig: 'Figure 3.3 · Tension drop T₁ > T₂ > T₃ along a three-car accelerating train',
    title: 'Tension Drop Along a Bridging Chain',
    alt: 'Three coupled 3D carriages pulled forward by engine force T₁, with couplings T₂ and T₃ showing progressively smaller tension arrows because each coupling accelerates fewer trailing cars.',
    cam: { target: [14, 1.2, 0], az: 20, el: 20, dist: 7.6 },
    lit: 'chain_couplings',
    parts: ['three_cars', 'chain_couplings'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Hooked scales',
    fig: 'Figure 3.4 · Two hooked luggage spring scales proving F_AB = −F_BA',
    title: 'Twin Hooked Spring Scales (3rd Law)',
    alt: 'Two 3D brass cylindrical spring scales hooked beak-to-beak with internal helical springs stretched to identical extensions and equal-and-opposite force arrows.',
    cam: { target: [28, 1.3, 0], az: 16, el: 20, dist: 6.8 },
    lit: 'scale_right',
    parts: ['scale_left', 'scale_right'],
    look: { xray: 0.3, section: 0 },
  },
  {
    tab: 'Action–reaction pairs',
    fig: 'Figure 3.5 · Distinguishing equilibrium pairs (same body) from 3rd-law pairs (two bodies)',
    title: 'Action–Reaction vs Equilibrium Pairs',
    alt: '3D skater pushing off a wall alongside a book resting on a table, colour-coding forces that act on different bodies (true 3rd-law pair) vs forces on the same body.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 7.2 },
    lit: 'skater_pair',
    parts: ['table_book_pair', 'skater_pair'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Rocket recoil',
    fig: 'Figure 3.7 · Deep-space rocket accelerating by throwing exhaust mass backward',
    title: 'Rocket Exhaust & Momentum Conservation',
    alt: '3D cutaway rocket nozzle in vacuum expelling high-speed gas molecules backward (−Δp_gas) while the rocket body gains equal forward momentum (+Δp_rocket).',
    cam: { target: [56, 1.35, 0], az: 22, el: 18, dist: 7.4 },
    lit: 'rocket_nozzle',
    parts: ['rocket_hull', 'rocket_nozzle'],
    look: { xray: 0.25, section: 0 },
  },
];

export const PLATES = {
  ref_cart: {
    text: 'Reference cart (m₀ = 2 kg, F₀ = 10 N → a₀ = 5.0 m/s²): provides a baseline strobe pace on the rear track.',
  },
  test_cart: {
    text: 'Programmable test cart: acceleration a = F_net / m rises linearly with net force and falls inversely with total mass.',
    facts: s => [['F_net', `${s.forceN.toFixed(0)} N`], ['Mass m', `${s.massKg.toFixed(1)} kg`], ['a', `${s.aCart.toFixed(2)} m/s²`]],
  },
  three_cars: {
    text: 'Three coupled carriages of mass m each: all three share the same forward acceleration a = T₁ / (3m).',
  },
  chain_couplings: {
    text: 'Why tension drops backward: front coupling T₁ accelerates all 3 cars (3ma), middle coupling T₂ pulls 2 cars (2ma), and rear coupling T₃ pulls only the last car (1ma).',
    facts: s => [['T₁ (front)', `${s.chain.T1.toFixed(1)} N`], ['T₂ (mid)', `${s.chain.T2.toFixed(1)} N`], ['T₃ (rear)', `${s.chain.T3.toFixed(1)} N`]],
  },
  scale_left: {
    text: 'Left luggage scale A: measures the pull of B on A. Even if you yank one end while holding the other still, both needles move together.',
    facts: s => [['F_BA on A', `${s.scales.scaleAN.toFixed(1)} N`]],
  },
  scale_right: {
    text: 'Right luggage scale B: measures the pull of A on B. Newton’s Third Law guarantees |F_AB| = |F_BA| at every microsecond.',
    facts: s => [['F_AB on B', `${s.scales.scaleBN.toFixed(1)} N`], ['Difference', `0.0 N`]],
  },
  table_book_pair: {
    text: 'Book on table: Normal force N_table→book and weight F_Earth→book act on the SAME book (equilibrium pair, can be unequal if the table is in a lift).',
  },
  skater_pair: {
    text: 'True 3rd-law pair: Wall pushes Skater forward (+F) while Skater pushes Wall backward (−F). Because they act on DIFFERENT bodies, they never cancel each other!',
  },
  rocket_hull: {
    text: 'Rocket propellant tank & hull: needs no surrounding air to push against — it pushes directly against its own escaping exhaust gas.',
    facts: s => [['Thrust', `${(s.rk.thrustN / 1000).toFixed(1)} kN`], ['Δv', `${s.rk.deltaVMps.toFixed(0)} m/s`]],
  },
  rocket_nozzle: {
    text: 'De Laval bell nozzle: accelerates hot gas backward at v_ex so every Δm ejected gives the rocket forward impulse v_ex Δm.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 3,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['three_cars', 'scale_left', 'scale_right', 'rocket_hull'],
  cutKeys: ['scale_left', 'scale_right', 'rocket_hull'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { forceN: 24, massKg: 3.0, exhaustSpeedMps: 2400 },
  controls: [
    { id: 'forceN', label: 'Applied pull force F', min: 6, max: 48, step: 2, value: 24, unit: 'N' },
    { id: 'massKg', label: 'Test cart mass m', min: 1.0, max: 8.0, step: 0.5, value: 3.0, unit: 'kg' },
    { id: 'exhaustSpeedMps', label: 'Rocket exhaust speed v_ex', min: 1000, max: 4000, step: 100, value: 2400, unit: 'm/s' },
  ],
  lessons: {
    'ch03-fma-3d': { page: 0, params: { forceN: 24, massKg: 3.0 } },
    'ch03-chain-3d': { page: 1, params: { forceN: 36 } },
    'ch03-scales-3d': { page: 2, params: { forceN: 30 } },
    'ch03-pairs-3d': { page: 3 },
    'ch03-rocket-3d': { page: 4, params: { exhaustSpeedMps: 2800 } },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: 180 + s.aCart * 25, dur: 0.06, type: 'sine', gain: 0.03 });
    else if (page === 1) playTone(ctx, { freq: 240 + s.chain.T1 * 4, dur: 0.06, type: 'triangle', gain: 0.03 });
    else if (page === 4) playTone(ctx, { freq: 140 + s.rk.thrustN * 0.015, slideTo: 280 + s.rk.thrustN * 0.02, dur: 0.09, type: 'sawtooth', gain: 0.03 });
    else playTone(ctx, { freq: 300, dur: 0.05, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const aCart = M.cartAccelerationMps2(p.forceN, p.massKg);
    const chain = M.threeCarChainTensions(p.forceN, 2, 2, 2);
    const scales = M.hookedScalesPair(p.forceN);
    const rk = M.rocketImpulseState(p.exhaustSpeedMps, 4.0, 400, 250);
    return { t, forceN: p.forceN, massKg: p.massKg, aCart, chain, scales, exhaustSpeedMps: p.exhaustSpeedMps, rk };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Net force F = ${s.forceN} N</b> on mass <b>m = ${s.massKg.toFixed(1)} kg</b> → Acceleration <b>a = F/m = ${s.aCart.toFixed(2)} m/s²</b> (Reference cart: 10 N / 2 kg = 5.00 m/s²).`;
    }
    if (pageIdx === 1) {
      return `<b>3-Car Chain Pulled by T₁ = ${s.chain.T1.toFixed(0)} N</b> · Middle link <b>T₂ = ${s.chain.T2.toFixed(0)} N</b> (2/3 T₁) · Rear link <b>T₃ = ${s.chain.T3.toFixed(0)} N</b> (1/3 T₁) · Ratio <b>3 : 2 : 1</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Hooked Spring Scales</b> · Left scale reads <b>${s.scales.scaleAN.toFixed(1)} N</b> · Right scale reads <b>${s.scales.scaleBN.toFixed(1)} N</b> · Difference = <b>0.0 N</b> (F_AB = −F_BA always).`;
    }
    if (pageIdx === 3) {
      return `<b>Third-Law Pair Rule</b> · True action–reaction pairs act on <b>two different objects</b> (Wall→Skater and Skater→Wall) so they can never cancel on a single free-body diagram.`;
    }
    return `<b>Rocket Propulsion (v_ex = ${s.exhaustSpeedMps} m/s)</b> · Thrust <b>F = v_ex dm/dt = ${(s.rk.thrustN / 1000).toFixed(1)} kN</b> · Ideal Tsiolkovsky <b>Δv = ${s.rk.deltaVMps.toFixed(0)} m/s</b> in vacuum.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 62 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): a = F/m Carts
    const refAsm = asm('ref_cart', root, { title: 'Reference cart (2 kg, 10 N)', sub: 'Baseline a₀ = 5 m/s²' });
    refAsm.position.set(0, 0.35, -0.65);
    const refMesh = part(refAsm, box(0.75, 0.32, 0.45, 0.03), { pal: 'blue', tone: 'mid', pos: [0, 0, 0], ex: [0, 0.3, -0.3], name: 'Reference cart' });

    const testAsm = asm('test_cart', root, { title: 'Variable F & m test cart', sub: 'a = F_net / m' });
    testAsm.position.set(0, 0.35, 0.65);
    const testMesh = part(testAsm, box(0.75, 0.38, 0.48, 0.03), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], ex: [0, 0.4, 0.3], name: 'Test cart' });
    const fCartVec = arrow(testAsm, { pal: 'green', r: 0.03 });
    label('board', 'a = F_net / m', () => V(0, 1.35, 0.65), { leader: [0, -20] });

    // Station 1 (x = 14): 3-Car Bridging Chain (T1 > T2 > T3)
    const carsAsm = asm('three_cars', root, { title: 'Three coupled carriages', sub: 'Equal mass m per car' });
    carsAsm.position.set(14, 0.4, 0);
    for (let i = 0; i < 3; i++) {
      part(carsAsm, box(0.78, 0.44, 0.52, 0.03), { pal: 'blue', tone: 'hi', pos: [-1.25 + i * 1.25, 0, 0], mat: shadeMat('blue', { opacity: 0.55 }), ex: [0, 0.35, 0], name: `Carriage ${3 - i}` });
    }
    const coupAsm = asm('chain_couplings', root, { title: 'Coupling tension links', sub: 'T₁ : T₂ : T₃ = 3 : 2 : 1' });
    coupAsm.position.set(14, 0.4, 0);
    const t1Vec = arrow(coupAsm, { pal: 'red', r: 0.03 });
    const t2Vec = arrow(coupAsm, { pal: 'ochre', r: 0.028 });
    const t3Vec = arrow(coupAsm, { pal: 'green', r: 0.026 });
    label('board', 'T₃ (1/3) < T₂ (2/3) < T₁ (3/3)', () => V(14, 1.45, 0), { leader: [0, -20] });

    // Station 2 (x = 28): Hooked Luggage Spring Scales
    const scL = asm('scale_left', root, { title: 'Left spring scale A', sub: 'Reads |F_BA|' });
    scL.position.set(27.0, 1.1, 0);
    part(scL, cyl(0.24, 1.2, 20), { pal: 'ochre', tone: 'mid', pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], mat: shadeMat('ochre', { opacity: 0.45 }), ex: [-0.45, 0, 0], name: 'Scale A casing' });
    spring(scL, { R: 0.12, r: 0.022, turns: 6, len: 0.85, pal: 'dark', pos: [-0.42, 0, 0], axis: [1, 0, 0], name: 'Scale A spring' });
    const vecBA = arrow(scL, { pal: 'blue', r: 0.028 });

    const scR = asm('scale_right', root, { title: 'Right spring scale B', sub: 'Reads |F_AB| = |F_BA|' });
    scR.position.set(29.0, 1.1, 0);
    part(scR, cyl(0.24, 1.2, 20), { pal: 'green', tone: 'mid', pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], mat: shadeMat('green', { opacity: 0.45 }), ex: [0.45, 0, 0], name: 'Scale B casing' });
    spring(scR, { R: 0.12, r: 0.022, turns: 6, len: 0.85, pal: 'dark', pos: [-0.42, 0, 0], axis: [1, 0, 0], name: 'Scale B spring' });
    const vecAB = arrow(scR, { pal: 'red', r: 0.028 });
    label('board', 'F_AB = −F_BA (Equal & opposite)', () => V(28, 1.95, 0), { leader: [0, -20] });

    // Station 3 (x = 42): Equilibrium Pair vs 3rd-Law Skater Pair
    const bookPair = asm('table_book_pair', root, { title: 'Book on table (same body)', sub: 'N and mg act on same book' });
    bookPair.position.set(41.0, 0.55, 0);
    part(bookPair, box(1.1, 0.12, 0.8, 0.02), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], name: 'Tabletop' });
    part(bookPair, box(0.55, 0.22, 0.45, 0.02), { pal: 'blue', tone: 'hi', pos: [0, 0.18, 0], ex: [0, 0.35, 0], name: 'Resting book' });

    const skaterAsm = asm('skater_pair', root, { title: 'Skater & wall (two bodies)', sub: 'True 3rd-law action-reaction pair' });
    skaterAsm.position.set(42.9, 0.1, 0);
    part(skaterAsm, box(0.22, 1.6, 0.9, 0.02), { pal: 'dark', tone: 'mid', pos: [-0.55, 0.8, 0], name: 'Rink wall' });
    const skaterBody = part(skaterAsm, cyl(0.18, 1.1, 16), { pal: 'ochre', tone: 'hi', pos: [0.15, 0.65, 0], ex: [0.4, 0.2, 0], name: 'Recoiling skater' });
    const fWallOnSkater = arrow(skaterAsm, { pal: 'green', r: 0.028 });
    const fSkaterOnWall = arrow(skaterAsm, { pal: 'red', r: 0.028 });
    setArrow(fWallOnSkater, V(-0.4, 0.85, 0), V(0.45, 0.85, 0));
    setArrow(fSkaterOnWall, V(-0.55, 0.85, 0), V(-1.4, 0.85, 0));
    label('board', 'Different bodies → never cancel!', () => V(42.9, 2.0, 0), { leader: [0, -20] });

    // Station 4 (x = 56): Rocket Momentum Recoil
    const hullAsm = asm('rocket_hull', root, { title: 'Rocket body & propellant tank', sub: '+Δp_rocket forward' });
    hullAsm.position.set(56.2, 1.25, 0);
    part(hullAsm, cyl(0.38, 1.5, 24), { pal: 'paper', tone: 'lit', pos: [0.2, 0, 0], rot: [0, 0, Math.PI / 2], mat: shadeMat('paper', { opacity: 0.6 }), ex: [0.4, 0.3, 0], name: 'Rocket fuselage' });
    part(hullAsm, cone(0.38, 0.55, 24), { pal: 'red', tone: 'hi', pos: [1.22, 0, 0], rot: [0, 0, -Math.PI / 2], ex: [0.7, 0.2, 0], name: 'Nose cone' });
    const pRocketVec = arrow(hullAsm, { pal: 'green', r: 0.032 });

    const nozAsm = asm('rocket_nozzle', root, { title: 'De Laval exhaust bell & plume', sub: '−Δp_gas backward' });
    nozAsm.position.set(55.45, 1.25, 0);
    part(nozAsm, cone(0.32, 0.48, 20), { pal: 'dark', tone: 'hi', pos: [0, 0, 0], rot: [0, 0, -Math.PI / 2], ex: [-0.45, 0, 0], name: 'Exhaust nozzle' });
    const exhaustCloud = prims.particles(nozAsm, { count: 24, r: 0.048, pal: 'ochre' });
    const pGasVec = arrow(nozAsm, { pal: 'red', r: 0.032 });
    label('board', '+Δp_rocket = −Δp_exhaust', () => V(56.0, 2.15, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 0: carts accelerate
        const u = (s.t * 0.65) % 1;
        refMesh.position.x = -1.2 + u * u * 1.4;
        const testDist = Math.min(2.6, (s.aCart / 5.0) * 1.4);
        testMesh.position.x = -1.2 + u * u * testDist;
        testMesh.scale.y = 0.7 + (s.massKg / 8) * 0.7;
        setArrow(fCartVec, V(testMesh.position.x + 0.4, 0, 0), V(testMesh.position.x + 0.4 + (s.forceN / 48) * 1.1, 0, 0));

        // Station 1: 3-car chain tension arrows (3 : 2 : 1)
        const scaleF = (s.forceN / 48) * 0.9;
        setArrow(t1Vec, V(1.65, 0.25, 0), V(1.65 + scaleF, 0.25, 0));
        setArrow(t2Vec, V(0.4, 0.25, 0), V(0.4 + scaleF * (2 / 3), 0.25, 0));
        setArrow(t3Vec, V(-0.85, 0.25, 0), V(-0.85 + scaleF * (1 / 3), 0.25, 0));

        // Station 2: equal and opposite scale vectors
        const sLen = (s.forceN / 48) * 0.95;
        setArrow(vecBA, V(0.6, 0.35, 0), V(0.6 + sLen, 0.35, 0));
        setArrow(vecAB, V(-0.6, 0.35, 0), V(-0.6 - sLen, 0.35, 0));

        // Station 3: skater recoil
        skaterBody.position.x = 0.15 + ((s.t * 0.5) % 0.65);

        // Station 4: rocket exhaust plume & momentum vectors
        const thLen = (s.exhaustSpeedMps / 4000) * 1.25;
        setArrow(pRocketVec, V(0.2, 0.52, 0), V(0.2 + thLen, 0.52, 0));
        setArrow(pGasVec, V(-0.1, 0.52, 0), V(-0.1 - thLen, 0.52, 0));
        const pts = [];
        for (let i = 0; i < 24; i++) {
          const prog = ((s.t * (s.exhaustSpeedMps / 900) + i * 0.17) % 1.4);
          pts.push([-0.25 - prog * 1.2, (Math.sin(i * 2.1) * 0.22) * prog, (Math.cos(i * 1.7) * 0.22) * prog]);
        }
        exhaustCloud.set(pts);
      },
    };
  },
};
