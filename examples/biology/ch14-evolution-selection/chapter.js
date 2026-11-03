import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, torus,
  prims, studioGrid, playTone, shadeMat, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Luria–Delbrück dish',
    fig: 'Figure 14.1–14.2 & 14.4 · Luria–Delbrück Petri dish mutation & antibiotic selection sweep',
    title: 'Random Mutation vs Non-Random Selection',
    alt: '3D Petri dish with susceptible and pre-existing mutant bacterial colonies undergoing directional selection when antibiotic is applied.',
    cam: { target: [0, 1.35, 0], az: 24, el: 24, dist: 7.4 },
    lit: 'petri_colony',
    parts: ['petri_colony', 'selection_curve'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: '3D Fitness surface',
    fig: 'Figure 14.3 & 14.7 · Sewall Wright’s 3D adaptive fitness landscape W(x, y)',
    title: 'Adaptive Fitness Peaks & Valleys',
    alt: '3D two-peaked evolutionary fitness surface warping as environmental antibiotic pressure shifts the highest fitness peak.',
    cam: { target: [14, 1.35, 0], az: -26, el: 24, dist: 7.4 },
    lit: 'fitness_surface',
    parts: ['fitness_surface'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Xerophyte vs Hydrophyte',
    fig: 'Figure 14.5–14.6 · 3D Xerophyte sunken stomatal crypt vs Hydrophyte floating aerenchyma leaf',
    title: 'Structural Adaptations: Desert vs Pond',
    alt: '3D cutaway of a desert xerophyte sunken stomatal pit with humid trichome hairs versus a floating hydrophyte leaf with large air spaces.',
    cam: { target: [28, 1.35, 0], az: 20, el: 22, dist: 7.4 },
    lit: 'xerophyte_crypt',
    parts: ['xerophyte_crypt', 'hydrophyte_leaf'],
    look: { xray: 0.22, section: 0 },
  },
  {
    tab: 'Malaria & Sahni fossils',
    fig: 'Figure 14.8–14.9 · Haldane’s HbA/HbS heterozygote advantage curve & Sahni’s Glossopteris strata',
    title: 'Balancing Selection & Deep-Time Fossils',
    alt: '3D illustrative mean population fitness curve peaking at q* = s1/(s1+s2) alongside Birbal Sahni Gondwana fossil strata.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'balancing_curve',
    parts: ['balancing_curve', 'sahni_strata'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  petri_colony: {
    text: 'Salvador Luria & Max Delbrück (1943): resistance can exist before exposure to a selecting agent; selection does not specify the useful DNA change—it kills susceptible cells, leaving pre-existing resistant mutants to multiply.',
    facts: s => [['Antibiotic', `${(s.abDose * 100).toFixed(0)}%`], ['Resistant share', `${s.resPct.toFixed(0)}%`]],
  },
  selection_curve: {
    text: 'Logistic S-curve N(t) = K / (1 + ((K − N₀)/N₀)e^{−rt}): exponential growth slows as nutrient depletion and waste build-up impose environmental resistance at carrying capacity K.',
  },
  fitness_surface: {
    text: '3D adaptive fitness surface W(x, y): without antibiotics the wild-type peak is tallest; adding antibiotic collapses the wild-type peak so variants near the resistant peak can leave more descendants.',
  },
  xerophyte_crypt: {
    text: 'Desert xerophyte (*Nerium oleander* / marram grass): thick waxy cuticle, rolled leaf, and sunken stomatal crypts lined with trichome hairs that trap a humid boundary layer to slash transpiration.',
  },
  hydrophyte_leaf: {
    text: 'Floating *Nymphaea* leaves have upper stomata, water-repellent surface wax and large internal gas spaces. Fully submerged *Hydrilla* leaves have no stomata and exchange dissolved gases across thin surfaces.',
  },
  balancing_curve: {
    text: 'J. B. S. Haldane & Anthony Allison’s heterozygote advantage: one HbS copy can reduce severe-malaria risk. The hypothetical constant-fitness model sets wAS=1 and wSS=.20, giving q*=s₁/(s₁+s₂); this is not a universal clinical fitness measurement.',
    facts: s => [['s_malaria', `${(s.malariaS * 100).toFixed(0)}%`], ['Equilibrium q*', `${(s.bal.qEquilibrium * 100).toFixed(1)}%`]],
  },
  sahni_strata: {
    text: 'Schematic fossil strata: undisturbed lower layers are usually older. Sahni described Pentoxyleae in1948 as Jurassic; relevant Rajmahal material was later dated Early Cretaceous. Fossil features and sequences provide complementary evidence with uncertainty.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 14,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['petri_colony', 'xerophyte_crypt'],
  cutKeys: ['xerophyte_crypt', 'hydrophyte_leaf'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { antibioticDose: 75, malariaPressure: 18 },
  controls: [
    { id: 'antibioticDose', label: 'Antibiotic selection pressure', min: 0, max: 100, step: 5, value: 75, unit: '%' },
    { id: 'malariaPressure', label: 'Malaria selective coefficient s₁', min: 0, max: 35, step: 5, value: 18, unit: '%' },
  ],
  lessons: {
    'ch14-beak-3d': { page: 0 },
    'ch14-antibiotic-3d-mutagens': { page: 0 },
    'ch14-moth-3d': { page: 1 },
    'ch14-antibiotic-3d': { page: 0 },
    'ch14-landscape-3d-xero': { page: 2 },
    'ch14-beak-3d-adaptive': { page: 2 },
    'ch14-beak-3d-brassica': { page: 1 },
    'ch14-landscape-3d': { page: 3 },
    'ch14-landscape-3d-heterozygote': { page: 3 },
    'ch14-mutation-luria-3d': { page: 0, params: { antibioticDose: 80 } },
    'ch14-fitness-selection-3d': { page: 1, params: { antibioticDose: 85 } },
    'ch14-xerophyte-hydrophyte-3d': { page: 2 },
    'ch14-sahni-malaria-3d': { page: 3, params: { malariaPressure: 20 } },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 200 + s.resPct * 3.2, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const abDose = (p.antibioticDose || 0) / 100;
    const malariaS = (p.malariaPressure || 0) / 100;
    const susceptibleSurvivors = 990 * (1 - 0.9 * abDose);
    const resistantSurvivors = 10 * (1 - 0.1 * abDose);
    const resPct = 100 * resistantSurvivors / (susceptibleSurvivors + resistantSurvivors);
    const bal = M.balancingSelectionAccount(malariaS, 0.80, 0.15);
    return { t, abDose, malariaS, resPct, bal };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Antibiotic pressure = ${(s.abDose * 100).toFixed(0)}%</b> · Pre-existing resistant mutant share after selection = <b>${s.resPct.toFixed(0)}%</b> · Illustrative selection only: no patient, treatment course or clinical days are represented.`;
    }
    if (pageIdx === 1) {
      return `<b>3D Evolutionary Fitness Landscape W(x, y)</b> · Antibiotic pressure = ${(s.abDose * 100).toFixed(0)}% · ${s.abDose > 0.45 ? '<b>Resistant peak dominates; directional selection shifts population right</b>' : '<b>Wild-type peak dominates in antibiotic-free environment</b>'}.`;
    }
    if (pageIdx === 2) {
      return `<b>Adaptive Leaf Anatomy</b> · Xerophyte sunken crypt + trichomes trap humid air (reducing ΔΨ_w vapour gradient) · Hydrophyte aerenchyma provides buoyancy & internal O₂/CO₂ storage.`;
    }
    return `<b>Malaria selection s₁ = ${(s.malariaS * 100).toFixed(0)}% (s₂ = 80% SS anaemia)</b> · Balancing equilibrium HbS allele frequency <b>q* = s₁/(s₁+s₂) = ${(s.bal.qEquilibrium * 100).toFixed(1)}%</b>.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Luria-Delbruck Petri Dish & S-Curve
    const dishAsm = asm('petri_colony', root, { title: '3D Petri dish & resistant clones', sub: 'Pre-existing mutants survive antibiotic sweep' });
    dishAsm.position.set(-0.95, 0.35, 0);
    part(dishAsm, cyl(0.95, 0.22, 28), { pal: 'paper', tone: 'mid', mat: shadeMat('paper', { opacity: 0.45 }), ex: [0, -0.3, 0], name: 'Agar Petri dish' });
    const wildDots = prims.particles(dishAsm, 990, { radius: 0.012, color: 'blue' });
    const resDots = prims.particles(dishAsm, 10, { radius: 0.024, color: 'red' });

    const selAsm = asm('selection_curve', root, { title: 'Logistic S-curve N(t)', sub: 'Exponential phase → carrying capacity K' });
    selAsm.position.set(0.6, 0.25, -0.3);
    const axS = prims.axes(selAsm, { x: [0, 14], y: [0, 1050], size: [2.0, 1.65, 0.5] });
    prims.plot(selAsm, t => M.logisticColonyAccount(t).nLog, { axes: axS, samples: 40, color: 'green', width: 0.064 });
    label('board', 'Petri dish selection', () => V(-0.95, 1.85, 0));
    label('board', 'Logistic K = 1000', () => V(1.6, 2.15, -0.3));

    // Station 1 (x = 14): Sewall Wright 3D Fitness Landscape
    const fitAsm = asm('fitness_surface', root, { title: '3D Evolutionary fitness surface W(x, y)', sub: 'Wild-type vs resistant adaptive peaks' });
    fitAsm.position.set(13.0, 0.25, -0.6);
    const axF = prims.axes(fitAsm, { x: [-1.4, 1.4], y: [-1.2, 1.2], z: [0, 1.9], size: [2.2, 1.8, 1.65] });
    const surfF = prims.surface(fitAsm, (x, y) => M.fitnessLandscapeHeight(x, y, 0.75), { axes: axF, n: 26, pal: 'ochre' });
    const popPin = part(fitAsm, sphere(0.1, 16), { pal: 'red', tone: 'lit', name: 'Mean population phenotype' });
    label('board', 'Adaptive fitness peaks', () => V(14.1, 2.25, -0.6));

    // Station 2 (x = 28): Xerophyte Sunken Crypt vs Hydrophyte Aerenchyma Leaf
    const xeroAsm = asm('xerophyte_crypt', root, { title: 'Xerophyte sunken stomatal crypt', sub: 'Thick cuticle + humid trichome pocket' });
    xeroAsm.position.set(27.0, 1.25, 0);
    part(xeroAsm, box(1.35, 1.1, 1.0, 0.06), { pal: 'ochre', tone: 'hi', mat: shadeMat('ochre', { opacity: 0.42 }), ex: [-0.35, 0.3, 0], name: 'Thick-cuticle xerophyte leaf' });
    part(xeroAsm, sphere(0.38, 18), { pal: 'blue', tone: 'lit', pos: [0, -0.25, 0], ex: [0, -0.45, 0], name: 'Humid sunken stomatal crypt' });

    const hydroAsm = asm('hydrophyte_leaf', root, { title: 'Hydrophyte floating leaf & aerenchyma', sub: 'Buoyant air chambers & upper stomata' });
    hydroAsm.position.set(29.0, 1.25, 0);
    part(hydroAsm, box(1.35, 0.85, 1.0, 0.05), { pal: 'green', tone: 'mid', mat: shadeMat('green', { opacity: 0.38 }), ex: [0.35, 0.3, 0], name: 'Thin hydrophyte epidermis' });
    for (const sx of [-0.38, 0, 0.38]) {
      part(hydroAsm, sphere(0.22, 16), { pal: 'paper', tone: 'lit', pos: [sx, 0, 0], ex: [0, 0.45, 0], name: 'Buoyant aerenchyma air sac' });
    }
    label('board', 'Xerophyte sunken crypt', () => V(27.0, 2.25, 0));
    label('board', 'Hydrophyte aerenchyma', () => V(29.0, 2.25, 0));

    // Station 3 (x = 42): Haldane Balancing Selection Curve & Sahni Fossil Strata
    const balAsm = asm('balancing_curve', root, { title: 'Heterozygote advantage w̄(q)', sub: 'Peaks at equilibrium q* = s₁/(s₁+s₂)' });
    balAsm.position.set(40.6, 0.25, -0.3);
    const axB = prims.axes(balAsm, { x: [0, 0.5], y: [0.6, 1.02], size: [1.9, 1.65, 0.5] });
    const plotB = prims.plot(balAsm, q => M.balancingSelectionAccount(0.18, 0.80, q).wBar, { axes: axB, samples: 40, color: 'red', width: 0.064 });
    const qPin = part(balAsm, sphere(0.085, 16), { pal: 'green', tone: 'lit', name: 'Equilibrium allele frequency q*' });

    const sahAsm = asm('sahni_strata', root, { title: 'Birbal Sahni’s Gondwana fossil strata', sub: 'Oldest ancestors in deepest rock layers' });
    sahAsm.position.set(43.2, 0.2, 0);
    const strataSpecs = [
      { y: 0.25, pal: 'ink', name: 'Deep Permian stratum (Glossopteris)' },
      { y: 0.75, pal: 'ochre', name: 'Early Cretaceous Rajmahal stratum (Pentoxylon)' },
      { y: 1.25, pal: 'green', name: 'Cenozoic angiosperm stratum' },
    ];
    for (const st of strataSpecs) {
      part(sahAsm, box(1.1, 0.42, 0.85, 0.03), { pal: st.pal, tone: 'hi', pos: [0, st.y, 0], ex: [0.35, st.y * 0.3, 0], name: st.name });
    }
    label('board', 'Equilibrium q* peak', () => V(41.5, 2.15, -0.3));
    label('board', 'Sahni fossil strata', () => V(43.2, 1.95, 0));

    return {
      labels,
      update(s) {
        // Petri dish colonies under antibiotic selection
        const wPts = [], rPts = [];
        const nWild = Math.round(990 * (1 - s.abDose * 0.9));
        for (let i = 0; i < nWild; i++) {
          const a = i * 2.399, r = 0.025 * Math.sqrt(i);
          wPts.push([r * Math.cos(a), 0.16, r * Math.sin(a)]);
        }
        const nRes = Math.round(10 * (1 - s.abDose * 0.1));
        for (let i = 0; i < nRes; i++) {
          const a = i * 2.399 + 1.2, r = 0.15 * Math.sqrt(i);
          rPts.push([r * Math.cos(a), 0.18, r * Math.sin(a)]);
        }
        wPts.forEach((point, i) => wildDots.set(i, point));
        wildDots.show(nWild);
        rPts.forEach((point, i) => resDots.set(i, point));
        resDots.show(nRes);

        // Update 3D fitness surface & peak pin
        surfF.update((x, z) => M.fitnessLandscapeHeight(x, z, s.abDose));
        const px = -0.65 + s.abDose * 1.3;
        popPin.position.copy(axF.to(px, 0, M.fitnessLandscapeHeight(px, 0, s.abDose) + 0.08));

        // Update balancing selection curve & equilibrium pin
        plotB.update(q => M.balancingSelectionAccount(s.malariaS, 0.80, q).wBar);
        const qEq = s.bal.qEquilibrium;
        const wEq = M.balancingSelectionAccount(s.malariaS, 0.80, qEq).wBar;
        qPin.position.copy(axB.to(qEq, wEq, 0));
      },
    };
  },
};
