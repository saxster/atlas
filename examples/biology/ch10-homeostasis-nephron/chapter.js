import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, torus, rod, shadeMat,
  prims, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Glucose feedback',
    fig: 'Glucose signals and liver handling',
    title: 'Negative Feedback: Insulin & Glucagon',
    alt: '3D negative-feedback loop between pancreatic islets and liver glycogen stores maintaining blood glucose at 90 mg/dL.',
    cam: { target: [0, 1.35, 0], az: 24, el: 20, dist: 11.1 },
    lit: 'pancreas_islet',
    parts: ['pancreas_islet', 'liver_glycogen'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: '3D Skin in summer',
    fig: 'Skin blood flow and sweat evaporation',
    title: 'Skin Thermoregulation in a Mumbai Summer',
    alt: '3D dermis/epidermis cutaway showing coiled sweat gland, evaporating sweat droplets, dilated dermal arterioles, and hair erector muscle.',
    cam: { target: [14, 1.35, 0], az: -22, el: 22, dist: 10.8 },
    lit: 'sweat_gland',
    parts: ['sweat_gland', 'dermal_arterioles'],
    look: { xray: 0.22, section: 0 },
  },
  {
    tab: '3D Kidney nephron',
    fig: 'Kidney filtration and selective recovery',
    title: 'The Kidney Nephron & Ultrafiltration',
    alt: '3D nephron showing high-pressure glomerular knot, Bowman capsule, proximal tubule glucose pumps, hairpin Loop of Henle, and ADH collecting duct.',
    cam: { target: [28, 1.35, 0], az: 20, el: 20, dist: 11.1 },
    lit: 'glomerulus_bowman',
    parts: ['glomerulus_bowman', 'pct_henle_loop', 'collecting_duct_adh'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Antibodies & memory',
    fig: 'Antibody recognition and memory',
    title: 'Clonal Memory, Antibodies & ORS Lifelines',
    alt: '3D Y-shaped IgG antibody binding an antigen alongside illustrative primary and secondary antibody-response curves.',
    cam: { target: [42.55, 1.1, 0], az: 24, el: 20, dist: 12.8 },
    lit: 'igg_antibody',
    parts: ['igg_antibody', 'vaccine_curves'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  pancreas_islet: {
    text: 'Islets of Langerhans: β-cells secrete insulin when blood glucose rises (recruiting GLUT4 transporters to muscle/adipose membranes and signalling storage; liver glucose handling uses other transport regulation); α-cells secrete glucagon when glucose falls.',
    facts: s => [['Peak glucose', `${s.gl.peakBloodGlucoseMgDl.toFixed(0)} mg/dL`], ['Excretion (model)', `${s.gl.renalGlucoseExcretionMgMin.toFixed(1)} mg/min`]],
  },
  liver_glycogen: {
    text: 'Hepatic bank & deamination hub: stores insoluble glycogen polymers after meals and converts excess amino groups (−NH₂) via the ornithine cycle into less toxic urea for the kidneys.',
  },
  sweat_gland: {
    text: 'Coiled eccrine sweat gland: secretes water + NaCl onto the epidermis where evaporation removes 2.4 kJ of latent heat per gram of sweat.',
  },
  dermal_arterioles: {
    text: 'Vasodilation vs vasoconstriction: in heat, superficial arterioles dilate to radiate warmth (vessels stay in place; flow through surface beds changes); in cold, they constrict.',
  },
  glomerulus_bowman: {
    text: 'Ultrafiltration under pressure: a wide afferent arteriole and narrow efferent arteriole force water, glucose, urea, and ions (but not plasma proteins or RBCs) into capsules; 180 L/day is the chosen total across both kidneys.',
  },
  pct_henle_loop: {
    text: 'Proximal Convoluted Tubule & Loop of Henle: PCT sodium–glucose carriers recover glucose, supported indirectly by ATP from mitochondria. The chosen 330 mg/min capacity is across both kidneys; the hairpin Loop builds a salty medullary gradient.',
  },
  collecting_duct_adh: {
    text: 'ADH, made in hypothalamic cells and released by the posterior pituitary, signals insertion of aquaporin-2 channels into the collecting duct wall, drawing water back into the blood to produce a small volume of concentrated hypertonic urine.',
    facts: s => [['Urine vol', `${s.ne.urineLPerDay.toFixed(2)} L/day`], ['Osmolarity', `${s.ne.urineOsmolarityMosm.toFixed(0)} mOsm/L`]],
  },
  igg_antibody: {
    text: 'Y-shaped IgG immunoglobulin (2 heavy + 2 light polypeptide chains): variable Fab tips form a complementary 3D paratope lock for one specific pathogen antigen.',
  },
  vaccine_curves: {
    text: 'Primary vs Secondary immune response: vaccines seed long-lived memory B and T lymphocytes that can support a faster, stronger response upon later recognised exposure; magnitude and protection vary.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 10,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['sweat_gland', 'glomerulus_bowman'],
  cutKeys: ['sweat_gland', 'glomerulus_bowman'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { insulinPct: 100, adhPct: 65, responseDay: 7 },
  controls: [
    { id: 'insulinPct', label: 'β-cell insulin capacity', min: 10, max: 100, step: 10, value: 100, unit: '%' },
    { id: 'responseDay', label: 'Days after recognised exposure', min: 0, max: 28, step: 1, value: 7, unit: 'd' },
    { id: 'adhPct', label: 'Pituitary ADH level', min: 0, max: 100, step: 10, value: 65, unit: '%' },
  ],
  lessons: {
    'ch10-feedback-glucose-3d': { page: 0, params: { insulinPct: 100 } },
    'ch10-diabetes-renal-3d': { page: 0, params: { insulinPct: 15 } },
    'ch10-skin-heat-3d': { page: 1 },
    'ch10-liver-nephron-3d': { page: 2, params: { adhPct: 80 } },
    'ch10-immunity-ors-3d': { page: 3 },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 180 + s.ne.urineOsmolarityMosm * 0.25, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const gl = M.glucoseHomeostasisAccount(65, p.insulinPct);
    const ne = M.nephronLedgerAccount(125, p.adhPct, gl.peakBloodGlucoseMgDl);
    return { t, gl, ne, insulinPct: p.insulinPct, adhPct: p.adhPct, responseDay: p.responseDay ?? 7, primary: M.immuneMemoryAccount(p.responseDay ?? 7, 'primary'), secondary: M.immuneMemoryAccount(p.responseDay ?? 7, 'secondary') };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Insulin capacity = ${s.insulinPct}%</b> · Post-meal peak glucose = <b>${s.gl.peakBloodGlucoseMgDl.toFixed(0)} mg/dL</b> · Liver glycogen banked = ${s.gl.glycogenStoredG.toFixed(1)} g · Model excretion = <b>${s.gl.renalGlucoseExcretionMgMin.toFixed(1)} mg/min</b>.`;
    }
    if (pageIdx === 1) {
      return `<b>Mumbai Summer Skin Balance</b> · Evaporation removes about 2.42 kJ/g. Arteriole dilation changes surface blood flow; dry heat transfer depends on surrounding temperatures. These are structures, not a thermal prediction.`;
    }
    if (pageIdx === 2) {
      return `<b>GFR = 125 mL/min (180 L/day) · ADH = ${s.adhPct}%</b> · PCT glucose reabsorbed = <b>${s.ne.glucoseReabsorbedPct.toFixed(0)}%</b> · Urine output = <b>${s.ne.urineLPerDay.toFixed(2)} L/day (${s.ne.urineOsmolarityMosm.toFixed(0)} mOsm/L)</b>.`;
    }
    return `<b>Antibody recognition & memory: Day ${s.responseDay}</b> · Primary ${s.primary.antibodyTitre.toFixed(1)} AU; secondary ${s.secondary.antibodyTitre.toFixed(1)} AU in the same illustrative curves as the 2D model. Memory can strengthen later defence; protection varies. The paired 2D figure explains ORS: sodium–glucose uptake supports osmotic water absorption.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Pancreas Islet & Liver Glycogen Feedback Loop
    const panAsm = asm('pancreas_islet', root, { title: 'Pancreatic Islet (β & α cells)', sub: 'Insulin & glucagon sensor-controller' });
    panAsm.position.set(-1.1, 1.35, 0);
    part(panAsm, capsule(0.38, 0.75, 10, 18), { pal: 'ochre', tone: 'lit', rot: [0, 0, 1.2], ex: [-0.45, 0.3, 0], name: 'Pancreatic islet' });

    const livAsm = asm('liver_glycogen', root, { title: 'Liver hepatocytes & glycogen bank', sub: 'Stores glucose & synthesizes urea' });
    livAsm.position.set(1.1, 1.35, 0);
    const livMesh = part(livAsm, box(1.15, 0.85, 0.75, 0.12), { pal: 'red', tone: 'hi', ex: [0.45, 0.3, 0], name: 'Hepatic lobe' });
    part(livAsm, torus(1.1, 0.045, 10, 28), { pal: 'blue', tone: 'hi', pos: [-1.1, 0, 0], ex: [0, -0.35, 0], name: 'Negative-feedback blood loop' });
    label('board', 'Pancreas β/α islet', () => V(-1.1, 2.25, 0));
    label('board', 'Liver glycogen bank', () => V(1.1, 2.25, 0));

    // Station 1 (x = 14): 3D Skin Cross-Section (Sweat Gland & Dilating Arterioles)
    const swAsm = asm('sweat_gland', root, { title: 'Coiled eccrine sweat gland & pore', sub: '2.4 kJ/g evaporative latent cooling' });
    swAsm.position.set(14.0, 1.2, 0);
    part(swAsm, box(2.2, 1.5, 1.3, 0.06), { pal: 'ochre', tone: 'mid', mat: shadeMat('ochre', { opacity: 0.35 }), ex: [0, -0.45, 0], name: 'Dermis & epidermis slab' });
    part(swAsm, torus(0.26, 0.07, 10, 20), { pal: 'blue', tone: 'lit', pos: [-0.45, -0.25, 0], ex: [-0.35, 0.35, 0], name: 'Coiled sweat gland base' });
    part(swAsm, cyl(0.055, 1.1, 14), { pal: 'blue', tone: 'lit', pos: [-0.45, 0.35, 0], ex: [-0.35, 0.55, 0], name: 'Sweat duct to surface pore' });

    const artAsm = asm('dermal_arterioles', root, { title: 'Dermal arteriolar loops', sub: 'Vasodilate in heat, vasoconstrict in cold' });
    artAsm.position.set(14.45, 1.25, 0);
    part(artAsm, torus(0.34, 0.075, 12, 22, Math.PI), { pal: 'red', tone: 'lit', ex: [0.45, 0.35, 0], name: 'Superficial arteriolar shunt' });
    label('board', 'Sweat gland & duct', () => V(13.5, 2.3, 0));
    label('board', 'Dermal arteriole', () => V(14.6, 2.3, 0));

    // Station 2 (x = 28): 3D Kidney Nephron (Glomerulus, Bowman, PCT/Henle, Collecting Duct)
    const glomAsm = asm('glomerulus_bowman', root, { title: 'Glomerulus & Bowman’s capsule', sub: 'Filtration (180 L/day across both kidneys)' });
    glomAsm.position.set(26.9, 1.85, 0);
    part(glomAsm, sphere(0.32, 20), { pal: 'red', tone: 'lit', ex: [-0.35, 0.35, 0], name: 'Glomerular capillary knot' });
    part(glomAsm, sphere(0.45, 22), { pal: 'ochre', tone: 'mid', mat: shadeMat('ochre', { opacity: 0.42 }), ex: [-0.55, 0.55, 0], name: 'Bowman’s cup' });

    const loopAsm = asm('pct_henle_loop', root, { title: 'PCT & hairpin Loop of Henle', sub: 'Glucose recovery & medullary salt gradient' });
    loopAsm.position.set(27.8, 1.15, 0);
    const lPts = [V(-0.6, 0.65, 0), V(-0.2, 0.55, 0), V(-0.2, -0.75, 0), V(0.25, -0.75, 0), V(0.25, 0.65, 0), V(0.65, 0.65, 0)];
    part(loopAsm, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lPts), 40, 0.085, 12, false), { pal: 'green', tone: 'hi', ex: [0, -0.45, 0], name: 'PCT & Loop of Henle' });

    const cdAsm = asm('collecting_duct_adh', root, { title: 'Collecting duct & ADH aquaporins', sub: 'Tunes final urine volume & osmolarity' });
    cdAsm.position.set(28.85, 1.15, 0);
    const cdTube = part(cdAsm, cyl(0.14, 1.75, 18), { pal: 'blue', tone: 'lit', ex: [0.45, 0, 0], name: 'Collecting duct' });
    label('board', 'Glomerulus & Bowman', () => V(26.9, 2.55, 0));
    label('board', 'Loop of Henle & ADH duct', () => V(28.4, 2.35, 0));

    // Station 3 (x = 42): 3D Y-Shaped IgG Antibody + Vaccine Primary/Secondary Curves
    const iggAsm = asm('igg_antibody', root, { title: 'Y-shaped IgG Antibody', sub: 'Heavy/light chains & antigen-binding paratopes' });
    iggAsm.position.set(40.9, 1.25, 0);
    part(iggAsm, cyl(0.11, 0.75, 16), { pal: 'blue', tone: 'hi', pos: [0, -0.25, 0], ex: [0, -0.35, 0], name: 'Fc constant stem' });
    part(iggAsm, cyl(0.1, 0.72, 16), { pal: 'blue', tone: 'lit', pos: [-0.26, 0.35, 0], rot: [0, 0, 0.55], ex: [-0.35, 0.35, 0], name: 'Left Fab arm' });
    part(iggAsm, cyl(0.1, 0.72, 16), { pal: 'blue', tone: 'lit', pos: [0.26, 0.35, 0], rot: [0, 0, -0.55], ex: [0.35, 0.35, 0], name: 'Right Fab arm' });
    part(iggAsm, sphere(0.15, 16), { pal: 'red', tone: 'lit', pos: [-0.48, 0.72, 0], ex: [-0.5, 0.55, 0], name: 'Bound pathogen antigen' });

    const vacAsm = asm('vaccine_curves', root, { title: 'Primary vs Secondary vaccine curves', sub: 'Clonal memory B/T amplification' });
    vacAsm.position.set(42.2, 0.25, -0.3);
    const axV = prims.axes(vacAsm, { x: [0, 28], y: [0, 240], size: [2.0, 1.65, 0.5], ticks: 3, names: { x: 'Days', y: 'Antibody AU' } });
    labels.push(...axV.labels);
    prims.plot(vacAsm, d => M.immuneMemoryAccount(d, 'primary').antibodyTitre, { axes: axV, samples: 80, color: 'ochre', width: 0.03 });
    prims.plot(vacAsm, d => M.immuneMemoryAccount(d, 'secondary').antibodyTitre, { axes: axV, samples: 80, color: 'green', width: 0.034 });
    const primaryMarker = part(vacAsm, sphere(0.065, 12), { pal: 'ochre', name: 'Selected primary response' });
    const secondaryMarker = part(vacAsm, sphere(0.065, 12), { pal: 'green', name: 'Selected secondary response' });
    label('board', 'Y-shaped IgG', () => V(40.9, 0.2, 0));
    label('board', 'Primary: ochre · Secondary: green', () => V(43.2, -0.55, -0.3));

    return {
      labels,
      update(s) {
        primaryMarker.position.copy(axV.to(s.responseDay, s.primary.antibodyTitre));
        secondaryMarker.position.copy(axV.to(s.responseDay, s.secondary.antibodyTitre));
        // Scale liver glycogen store with insulin capacity
        const gScale = 0.75 + (s.insulinPct / 100) * 0.35;
        livMesh.scale.setScalar(gScale);

        // Collecting duct diameter reflects urine volume
        const uScale = 0.65 + (1 - s.adhPct / 100) * 0.75;
        cdTube.scale.set(uScale, 1, uScale);
      },
    };
  },
};
