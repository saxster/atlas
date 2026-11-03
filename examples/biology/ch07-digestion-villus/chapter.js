import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, torus, shadeMat,
  prims, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Peristalsis & canal',
    fig: 'Figure 7.1–7.3 · Alimentary canal boundary & antagonistic peristaltic muscular wave',
    title: 'Peristalsis & the Topological Tube',
    alt: '3D muscular oesophagus/gut tube with circular and longitudinal smooth muscle layers squeezing a food bolus forward.',
    cam: { target: [0, 1.35, 0], az: 22, el: 20, dist: 10.8 },
    lit: 'circular_muscle',
    parts: ['circular_muscle', 'food_bolus'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Regional pH & mucus',
    fig: 'Figure 7.4–7.5 · Regional pH enzyme curves (pepsin, amylase, trypsin) & gastric mucus barrier',
    title: 'Beaumont’s Window & Regional pH',
    alt: '3D curves of pepsin (pH 1.8), salivary amylase (pH 6.8), and pancreatic trypsin/lipase (pH 8.0) alongside the stomach mucus shield.',
    cam: { target: [14, 1.35, 0], az: -22, el: 20, dist: 11.1 },
    lit: 'ph_curves',
    parts: ['ph_curves', 'mucus_shield'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Bile & lipase',
    fig: 'Figure 7.6–7.7 · Physical bile salt emulsification (N = k³ droplets) & pancreatic lipase',
    title: 'Bile Emulsification & Lipase Attack',
    alt: '3D hydrophobic fat globule shattered by amphipathic bile salts into micro-droplets attacked at the interface by pancreatic lipase.',
    cam: { target: [28, 1.35, 0], az: 24, el: 20, dist: 10.8 },
    lit: 'bile_droplets',
    parts: ['bile_droplets', 'lipase_enzyme'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: '3D Villus cutaway',
    fig: 'Figure 7.8–7.9 · 3D Intestinal villus teardown: brush border, capillary mesh & central lacteal',
    title: '3D Intestinal Villus & Dual Routing',
    alt: '3D cutaway of an ileal villus showing one-cell-thick goblet/enterocyte epithelium, capillary network to hepatic portal vein, and central lacteal.',
    cam: { target: [42, 1.35, 0], az: 20, el: 22, dist: 11.1 },
    lit: 'central_lacteal',
    parts: ['villus_epithelium', 'capillary_bed', 'central_lacteal'],
    look: { xray: 0.28, section: 0 },
  },
];

export const PLATES = {
  circular_muscle: {
    text: 'Antagonistic smooth muscle wall: circular muscle contracts behind the bolus to narrow the lumen, while longitudinal muscle contracts ahead to shorten and widen the receiving segment.',
  },
  food_bolus: {
    text: 'Lubricated food bolus propelled from oesophagus to ileum independently of gravity; the gut lumen remains topologically outside the body until substances cross the epithelial barrier; water and ions need no prior hydrolysis, and transport routes depend on the substance.',
  },
  ph_curves: {
    text: 'Illustrative pH activity profiles, not universal measured optima: salivary amylase (pH 6.8), gastric pepsin (pH 1.8, activated from pepsinogen by HCl), and pancreatic trypsin/lipase (pH 8.0, conditions maintained largely by pancreatic bicarbonate, with bile and intestinal secretions contributing).',
    facts: s => [['Pepsin', `${s.enz.pepsin.toFixed(0)}%`], ['Amylase', `${s.enz.amylase.toFixed(0)}%`], ['Lipase', `${s.enz.trypsinLipase.toFixed(0)}%`]],
  },
  mucus_shield: {
    text: 'Alkaline HCO₃⁻-rich goblet mucus blanket coating the stomach wall: helps protect the living gastric mucosa alongside epithelial joins, repair and regulated enzyme activation (breached in *H. pylori* ulcers).',
  },
  bile_droplets: {
    text: 'Physical emulsification (not chemical bond cleavage): bile salts made by the liver and stored/concentrated in the gallbladder split 1 fat drop of radius R₀ into k³ micro-droplets of radius R₀/k, multiplying surface area k-fold.',
    facts: s => [['Droplets', `${s.em.dropletCount}`], ['Area gain', `${s.em.areaMultiplier}×`], ['Digestion rate', 'Not calculated']],
  },
  lipase_enzyme: {
    text: 'Water-soluble pancreatic lipase: can only hydrolyse ester bonds at the water–oil boundary, converting triglycerides into monoglycerides + free fatty acids (lowering pH).',
  },
  villus_epithelium: {
    text: 'One-cell-thick columnar epithelium crowned with a microscopic microvilli brush border (20× area boost) and mucus-secreting goblet cells.',
  },
  capillary_bed: {
    text: 'After selective transport across epithelial cells, glucose and amino acids cross tissue fluid into capillaries and travel in portal blood to the liver. Sodium-coupled uptake occurs at the epithelial membrane, not at a capillary pump.',
  },
  central_lacteal: {
    text: 'Long-chain lipid products leave micelles, enter epithelial cells, and are rebuilt and packaged as chylomicrons. These new particles enter lacteals and travel through lymph to blood. They are not unchanged food droplets or micelles.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 7,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['circular_muscle', 'villus_epithelium'],
  cutKeys: ['circular_muscle', 'villus_epithelium'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { lumenPh: 1.8, bileSplit: 4 },
  controls: [
    { id: 'lumenPh', label: 'Regional gut lumen pH', min: 1.0, max: 9.5, step: 0.2, value: 1.8, unit: 'pH' },
    { id: 'bileSplit', label: 'Bile emulsification split factor k', min: 1, max: 6, step: 1, value: 4, unit: '×' },
  ],
  lessons: {
    'ch07-villus-3d-boundary': { page: 3 },
    'ch07-peristalsis-3d-bolus': { page: 0 },
    'ch07-peristalsis-3d-mucus': { page: 1 },
    'ch07-hepatic-3d-proteases': { page: 1 },
    'ch07-micelle-3d': { page: 2 },
    'ch07-micelle-3d-lipase': { page: 2 },
    'ch07-hepatic-3d': { page: 3 },
    'ch07-canal-3d': { page: 0 },
    'ch07-boundary-3d': { page: 0 },
    'ch07-peristalsis-3d': { page: 0 },
    'ch07-ph-mucus-3d': { page: 1, params: { lumenPh: 1.8 } },
    'ch07-bile-lipase-3d': { page: 2, params: { lumenPh: 8.0, bileSplit: 5 } },
    'ch07-villus-3d': { page: 3, params: { lumenPh: 8.0, bileSplit: 4 } },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 160 + s.em.areaMultiplier * 55, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const enz = M.regionalEnzymeRates(p.lumenPh);
    const em = M.bileEmulsificationAccount(p.bileSplit);
    const vil = M.villusAbsorptionFlux(20, 250);
    return { t, enz, em, vil, lumenPh: p.lumenPh, bileSplit: p.bileSplit };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Peristaltic Wave</b> · Circular smooth muscle contracts behind bolus while longitudinal muscle widens lumen ahead.`;
    }
    if (pageIdx === 1) {
      return `<b>Lumen pH = ${s.lumenPh.toFixed(1)}</b> · Pepsin: <b>${s.enz.pepsin.toFixed(0)}%</b> · Salivary amylase: <b>${s.enz.amylase.toFixed(0)}%</b> · Pancreatic trypsin/lipase: <b>${s.enz.trypsinLipase.toFixed(0)}%</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Bile split factor k = ${s.em.splitFactor}×</b> · 1 fat globule → <b>${s.em.dropletCount} droplets</b> (r = ${s.em.dropletRadiusUm.toFixed(0)} µm) · Interfacial area = <b>${s.em.areaMultiplier}×</b> · <b>Geometry alone does not determine hydrolysis rate</b>`;
    }
    return `<b>3D Intestinal Villus</b> · One-cell-thick brush border (20× area) · Capillary bed → <b>Hepatic portal vein</b> (glucose & amino acids) · Central lacteal → <b>Lymphatics</b> (chylomicron fats).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Peristaltic Muscular Tube & Food Bolus
    const musAsm = asm('circular_muscle', root, { title: 'Circular & longitudinal smooth muscle', sub: 'Travelling peristaltic wave' });
    musAsm.position.set(0, 1.35, 0);
    const rings = [];
    for (let i = -4; i <= 4; i++) {
      const m = part(musAsm, torus(0.48, 0.065, 12, 24), { pal: 'red', tone: 'hi', pos: [i * 0.34, 0, 0], rot: [0, Math.PI / 2, 0], ex: [0, 0.35, 0], name: 'Circular muscle ring' });
      rings.push(m);
    }
    const bolAsm = asm('food_bolus', root, { title: 'Lubricated food bolus', sub: 'Propelled along gut lumen' });
    bolAsm.position.set(0, 1.35, 0);
    const bolusMesh = part(bolAsm, sphere(0.36, 20), { pal: 'ochre', tone: 'lit', ex: [0, -0.45, 0], name: 'Chyme bolus' });
    label('board', 'Circular muscle rings', () => V(0, 2.25, 0));

    // Station 1 (x = 14): Regional pH Curves + Gastric Mucus Shield
    const phAsm = asm('ph_curves', root, { title: 'Regional pH enzyme activity curves', sub: 'Pepsin (1.8), Amylase (6.8), Lipase (8.0)' });
    phAsm.position.set(12.6, 0.25, -0.3);
    const axP = prims.axes(phAsm, { x: [0, 10], y: [0, 105], size: [2.2, 1.65, 0.5] });
    prims.plot(phAsm, x => M.regionalEnzymeRates(x).pepsin, { axes: axP, samples: 44, color: 'red', width: 0.03 });
    prims.plot(phAsm, x => M.regionalEnzymeRates(x).amylase, { axes: axP, samples: 44, color: 'ochre', width: 0.03 });
    prims.plot(phAsm, x => M.regionalEnzymeRates(x).trypsinLipase, { axes: axP, samples: 44, color: 'blue', width: 0.03 });
    const phCursor = part(phAsm, cyl(0.025, 1.65, 12), { pal: 'ink', tone: 'lit', name: 'Current lumen pH' });

    const mucAsm = asm('mucus_shield', root, { title: 'Gastric mucus & HCO₃⁻ barrier', sub: 'Protects stomach wall from pH 1.8 HCl' });
    mucAsm.position.set(15.5, 1.1, 0);
    part(mucAsm, box(0.95, 0.35, 0.95, 0.04), { pal: 'red', tone: 'hi', pos: [0, -0.25, 0], ex: [0, -0.35, 0], name: 'Gastric mucosa epithelium' });
    part(mucAsm, box(0.95, 0.28, 0.95, 0.05), { pal: 'green', tone: 'lit', pos: [0, 0.1, 0], ex: [0, 0.35, 0], name: 'Mucus–bicarbonate barrier' });
    label('board', 'Pepsin · Amylase · Lipase', () => V(13.7, 2.15, -0.3));
    label('board', 'Mucus barrier', () => V(15.5, 1.85, 0));

    // Station 2 (x = 28): Bile Emulsification Droplets + Lipase Blob
    const bileAsm = asm('bile_droplets', root, { title: 'Emulsified lipid droplets', sub: 'k³ droplets multiply surface area k×' });
    bileAsm.position.set(27.3, 1.35, 0);
    const dropletGroup = new THREE.Group();
    bileAsm.add(dropletGroup);
    const dropletMeshes = [];
    for (let i = 0; i < 216; i++) {
      const m = part(dropletGroup, sphere(0.55, 18), { pal: 'ochre', tone: 'hi', name: 'Emulsified lipid droplet' });
      dropletMeshes.push(m);
    }

    const lipAsm = asm('lipase_enzyme', root, { title: 'Pancreatic lipase at interface', sub: 'Hydrolyses ester bonds at water-oil boundary' });
    lipAsm.position.set(29.1, 1.35, 0);
    prims.blob(lipAsm, { r: 0.62, subdiv: 3, seed: 23, pal: 'blue', cleft: { dir: [-1, 0, 0], depth: 0.5, width: 0.48 }, name: 'Pancreatic lipase' });
    label('board', 'Fat droplets', () => V(27.3, 2.35, 0));
    label('board', 'Pancreatic lipase', () => V(29.1, 2.35, 0));

    // Station 3 (x = 42): 3D Intestinal Villus Teardown
    const epAsm = asm('villus_epithelium', root, { title: 'One-cell-thick brush-border epithelium', sub: 'Microvilli & goblet cells' });
    epAsm.position.set(42, 1.3, 0);
    part(epAsm, capsule(0.78, 1.25, 14, 24), { pal: 'ochre', tone: 'mid', mat: shadeMat('ochre', { opacity: 0.36 }), ex: [0, 0.55, 0], name: 'Columnar enterocyte wall' });

    const capAsm = asm('capillary_bed', root, { title: 'Fenestrated capillary meshwork', sub: 'Glucose & amino acids → Hepatic portal vein' });
    capAsm.position.set(42, 1.25, 0);
    for (const ang of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
      part(capAsm, cyl(0.065, 1.55, 14), { pal: 'red', tone: 'hi', pos: [0.36 * Math.cos(ang), 0, 0.36 * Math.sin(ang)], ex: [0.45 * Math.cos(ang), 0, 0.45 * Math.sin(ang)], name: 'Portal capillary loop' });
    }

    const lacAsm = asm('central_lacteal', root, { title: 'Central lymphatic lacteal', sub: 'Chylomicron fats → Thoracic duct' });
    lacAsm.position.set(42, 1.2, 0);
    part(lacAsm, capsule(0.16, 1.35, 10, 18), { pal: 'green', tone: 'lit', ex: [0, -0.45, 0.45], name: 'Central lacteal vessel' });
    label('board', 'Brush-border dome', () => V(42, 2.55, 0));
    label('board', 'Capillaries & Lacteal', () => V(42, 0.3, 0.85));

    return {
      labels,
      update(s) {
        // Peristaltic wave & bolus motion
        const bx = ((s.t * 0.65) % 2.4) - 1.2;
        bolusMesh.position.x = bx;
        rings.forEach((r, idx) => {
          const rx = (idx - 4) * 0.34;
          const dist = rx - bx;
          // Squeeze behind bolus (dist < 0 && dist > -0.6), relax ahead
          const squeeze = dist < 0 && dist > -0.65 ? 0.62 : dist > 0 && dist < 0.55 ? 1.18 : 1.0;
          r.scale.set(squeeze, squeeze, 1);
        });

        // pH cursor line
        const pPt = axP.to(s.lumenPh, 52, 0);
        phCursor.position.set(pPt.x, pPt.y, 0.05);

        // Bile emulsification droplet lattice
        const k = Math.round(s.bileSplit);
        const totalVis = k * k * k;
        const rScale = 1 / k;
        let idx = 0;
        for (let ix = 0; ix < 6; ix++) {
          for (let iy = 0; iy < 6; iy++) {
            for (let iz = 0; iz < 6; iz++) {
              const m = dropletMeshes[idx++];
              if (ix < k && iy < k && iz < k) {
                m.visible = true;
                m.scale.setScalar(rScale);
                const sp = 0.65 / k; // equal spheres stay separated even at maximum division
                m.position.set((ix - (k - 1) / 2) * sp * 2, (iy - (k - 1) / 2) * sp * 2, (iz - (k - 1) / 2) * sp * 2);
              } else {
                m.visible = false;
              }
            }
          }
        }
      },
    };
  },
};
