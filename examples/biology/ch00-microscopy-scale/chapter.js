import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, cone, lines, arrow, setArrow, rod,
  prims, motion, MOLECULES, studioGrid, playTone, shadeMat, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Redi jars',
    fig: 'Redi’s controlled jars',
    title: 'Redi’s Controlled Jars',
    alt: 'Three 3D glass jars holding meat: an open jar visited by flies, a gauze-topped jar where scent escapes and eggs stay on the mesh, and a sealed jar.',
    cam: { target: [0.15, 1.3, 0], az: 26, el: 22, dist: 13.0 },
    lit: 'gauze_jar',
    parts: ['open_jar', 'gauze_jar', 'sealed_jar'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Bead lens',
    fig: 'Bead-lens microscope',
    title: 'Leeuwenhoek’s Bead Microscope',
    alt: '3D brass microscope paddle with a tiny spherical glass lens, specimen screw pin, and refracted optical ray cone.',
    cam: { target: [14, 1.4, 0], az: -28, el: 18, dist: 11.2 },
    lit: 'bead_lens',
    parts: ['brass_plate', 'bead_lens', 'specimen_screw'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Swan-neck trap',
    fig: 'Swan-neck contamination trap',
    title: 'Pasteur’s Swan-Neck Flask',
    alt: '3D round-bottom flask with an S-shaped curved glass neck where airborne spores settle by Stokes gravity in the lower bend.',
    cam: { target: [28, 1.4, 0], az: 18, el: 20, dist: 11.9 },
    lit: 'swan_bend',
    parts: ['flask_bulb', 'swan_bend'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Scale ladder',
    fig: 'Schematic size-order columns',
    title: 'Biological Scale Ladder',
    alt: '3D scale comparison from a hydrogen-bonded water molecule cluster to a virus, bacterium and red blood cell, represented by labelled columns.',
    cam: { target: [42, 1.4, 0], az: 32, el: 22, dist: 12.5 },
    lit: 'scale_tower',
    parts: ['water_mol', 'scale_tower'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  open_jar: {
    text: 'Unsealed control jar: blowflies enter freely, lay eggs directly on the meat, and larvae hatch within days.',
  },
  gauze_jar: {
    text: 'Fine-gauze experimental jar: air and volatile amine scent plumes pass freely through the mesh, attracting flies to lay eggs on top of the gauze while the meat below remains larva-free.',
  },
  sealed_jar: {
    text: 'Parchment-sealed jar: blocks both flies and fresh air, answered by the gauze jar which admits air while excluding flies.',
  },
  brass_plate: {
    text: 'Hand-beaten twin brass plates clamping the tiny spherical soda-lime glass bead between aligned pinhole apertures.',
  },
  bead_lens: {
    text: 'Spherical glass bead lens: radius R sets focal length f = nR / 2(n − 1); smaller radius gives greater magnification in this ideal ball-lens model; usable magnification also depends on resolving detail.',
    facts: s => [['f', `${s.fMm.toFixed(2)} mm`], ['M', `${s.mag.toFixed(0)}×`], ['d_min', `${s.dMinNm.toFixed(0)} nm`]],
  },
  specimen_screw: {
    text: 'Threaded focus and elevation screws position the specimen relative to the lens; the chosen focal length changes with the lens-radius control.',
  },
  flask_bulb: {
    text: 'Boiled nutrient broth inside the round-bottom glass bulb: can remain clear when initially sterilised and protected from contamination by the intact neck.',
  },
  swan_bend: {
    text: 'Lower S-bend gravity trap: airborne dust and microbial spores settle at Stokes velocity v_s into the moist bottom curve instead of climbing into the bulb.',
    facts: s => [['v_s', `${(s.trap.vsMmPerSec * 1000).toFixed(1)} µm/s`], ['Trapped', `${(s.trap.fractionTrapped * 100).toFixed(1)}%`]],
  },
  water_mol: {
    text: '3D hydrogen-bonded water cluster (0.28 nm O–O distance): the molecular floor of biological structure.',
  },
  scale_tower: {
    text: 'Schematic columns order representative proteins (5 nm), viruses (100 nm), bacteria (2 µm) and red blood cells (8 µm). Heights show categories, not a calibrated logarithmic axis.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 0,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['open_jar', 'gauze_jar', 'sealed_jar', 'flask_bulb'],
  cutKeys: ['open_jar', 'gauze_jar', 'sealed_jar', 'flask_bulb'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { lensRadiusMm: 0.75, neckDipMm: 20, tiltFlask: 0 },
  controls: [
    { id: 'lensRadiusMm', label: 'Bead lens radius', min: 0.45, max: 1.5, step: 0.05, value: 0.75, unit: 'mm' },
    { id: 'neckDipMm', label: 'Swan-neck dip depth', min: 6, max: 30, step: 2, value: 20, unit: 'mm' },
    { id: 'tiltFlask', label: 'Flask tilt (0 upright → 1 tipped)', min: 0, max: 1, step: 1, value: 0, unit: '' },
  ],
  lessons: {
    'ch00-redi-3d': { page: 0 },
    'ch00-leeuwenhoek-3d': { page: 1, params: { lensRadiusMm: 0.70 } },
    'ch00-swan-neck-3d': { page: 2, params: { neckDipMm: 22, tiltFlask: 0 } },
    'ch00-scale-ladder-3d': { page: 3 },
  },
  sonify(ctx, s, page) {
    if (page === 1) playTone(ctx, { freq: 180 + s.mag * 1.4, dur: 0.06, type: 'sine', gain: 0.03 });
    else if (page === 2) playTone(ctx, { freq: s.tilted ? 150 : 420 * s.trap.fractionTrapped, dur: 0.06, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: 320, dur: 0.05, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.2 : clock;
    const fMm = M.focalLengthBallMm(p.lensRadiusMm, 1.52);
    const mag = M.ballLensMagnification(p.lensRadiusMm, 1.52);
    const dMinNm = M.rayleighLimitNm(550, Math.min(0.85, 0.35 + 0.3 / p.lensRadiusMm));
    const trap = M.swanNeckSporeCapture(p.neckDipMm, 1.5, 1.4);
    return { t, lensRadiusMm: p.lensRadiusMm, fMm, mag, dMinNm, neckDipMm: p.neckDipMm, tilted: p.tiltFlask > 0.5, trap };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Redi’s Controlled Jars</b> · Open jar: flies enter → larvae on meat · Gauze jar: scent plume escapes, flies lay eggs on mesh only (0 larvae on meat) · Sealed jar: air & flies excluded.`;
    }
    if (pageIdx === 1) {
      return `<b>Bead radius R = ${s.lensRadiusMm.toFixed(2)} mm</b> · Focal length f = ${s.fMm.toFixed(2)} mm · Magnification <b>${s.mag.toFixed(0)}×</b> · Chosen ideal-optics estimate d_min ≈ ${s.dMinNm.toFixed(0)} nm.`;
    }
    if (pageIdx === 2) {
      const status = s.tilted ? 'Tipped broth contacts trapped contamination; cloudiness represents subsequent growth under suitable conditions' : 'Upright bend keeps settled dust away from the broth in this schematic; the trapping estimate is illustrative, not a sterility prediction';
      return `<b>Swan-neck dip = ${s.neckDipMm} mm</b> · Stokes settling v_s = ${(s.trap.vsMmPerSec * 1000).toFixed(1)} µm/s · ${status}.`;
    }
    return `<b>Schematic size-order columns</b> · Water at molecular scale (~0.3 nm O–O spacing) → T4 Phage (100 nm) → E. coli (2 µm) → Human RBC (8 µm) · Labelled sizes supply the comparisons; column heights are illustrative.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Redi's 3 Jars
    const jars = [
      { key: 'open_jar', title: 'Open control jar', sub: 'Flies contact meat', x: -1.8, lid: 'none' },
      { key: 'gauze_jar', title: 'Fine-gauze jar', sub: 'Air in, flies out', x: 0.0, lid: 'gauze' },
      { key: 'sealed_jar', title: 'Parchment-sealed jar', sub: 'Air & flies blocked', x: 1.8, lid: 'sealed' },
    ];
    const flyClouds = [];
    for (const j of jars) {
      const g = asm(j.key, root, { title: j.title, sub: j.sub });
      g.position.set(j.x, 0, 0);
      part(g, cyl(0.62, 1.55, 24), { pal: 'paper', tone: 'mid', pos: [0, 0.8, 0], mat: shadeMat('paper', { opacity: 0.42 }), name: 'Glass jar wall' });
      part(g, box(0.65, 0.28, 0.5, 0.06), { pal: 'red', tone: 'hi', pos: [0, 0.22, 0], ex: [0, 0.35, 0], name: 'Meat sample' });
      if (j.lid === 'gauze') {
        part(g, cyl(0.66, 0.05, 24), { pal: 'ochre', tone: 'hi', pos: [0, 1.6, 0], ex: [0, 0.65, 0], name: 'Porous gauze mesh' });
      } else if (j.lid === 'sealed') {
        part(g, cyl(0.67, 0.12, 24), { pal: 'dark', tone: 'hi', pos: [0, 1.62, 0], ex: [0, 0.65, 0], name: 'Airtight parchment seal' });
      }
      const pCloud = prims.particles(g, 10, { radius: 0.045, color: 'ink' });
      flyClouds.push({ lid: j.lid, cloud: pCloud });
    }
    label('board', 'Open', () => V(-1.8, 2.15, 0));
    label('board', 'Gauze mesh', () => V(0.0, 2.15, 0), { leader: [0, -22] });
    label('board', 'Sealed', () => V(1.8, 2.15, 0));

    // Station 1 (x = 14): Leeuwenhoek's Brass Microscope & Bead Lens
    const plateAsm = asm('brass_plate', root, { title: 'Twin brass plates', sub: 'Hand-beaten frame' });
    plateAsm.position.set(14, 1.4, 0);
    part(plateAsm, box(1.1, 2.1, 0.12, 0.03), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], ex: [0, 0, -0.35], name: 'Front brass plate' });
    part(plateAsm, box(1.1, 2.1, 0.12, 0.03), { pal: 'ochre', tone: 'mid', pos: [0, 0, -0.14], ex: [0, 0, -0.65], name: 'Back brass plate' });

    const lensAsm = asm('bead_lens', root, { title: 'Soda-lime glass bead lens', sub: 'Spherical refractor' });
    lensAsm.position.set(14, 1.75, 0);
    const beadMesh = part(lensAsm, sphere(0.24, 24), { pal: 'blue', tone: 'lit', pos: [0, 0, 0], ex: [0, 0.35, 0.45], name: 'Spherical glass bead' });
    const rayUpper = rod(lensAsm, { r: 0.018, pal: 'red', tone: 'hi', name: 'Marginal light ray' });
    const rayLower = rod(lensAsm, { r: 0.018, pal: 'red', tone: 'hi', name: 'Marginal light ray' });

    const screwAsm = asm('specimen_screw', root, { title: 'Specimen focus screw', sub: 'Sub-millimetre stage' });
    screwAsm.position.set(14, 0.85, 0.35);
    part(screwAsm, cyl(0.06, 1.3, 16), { pal: 'dark', tone: 'hi', pos: [0, 0, 0], ex: [0, -0.4, 0.3], name: 'Lead screw' });
    part(screwAsm, sphere(0.11, 16), { pal: 'green', tone: 'hi', pos: [0, 0.9, -0.1], ex: [0, 0.25, 0.3], name: 'Pond-water drop' });
    label('board', 'Glass bead lens', () => V(14, 2.25, 0), { leader: [36, -24] });

    // Station 2 (x = 28): Pasteur's Swan-Neck Flask
    const flaskAsm = asm('flask_bulb', root, { title: 'Boiled broth bulb', sub: 'Sterile nutrient reservoir' });
    flaskAsm.position.set(28, 1.0, 0);
    part(flaskAsm, sphere(0.95, 28), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('paper', { opacity: 0.45 }), name: 'Round glass bulb' });
    const brothMesh = part(flaskAsm, cyl(0.82, 0.65, 24), { pal: 'ochre', tone: 'mid', pos: [0, -0.25, 0], ex: [0, -0.35, 0], name: 'Nutrient broth' });

    const neckAsm = asm('swan_bend', root, { title: 'Swan-neck S-bend trap', sub: 'Stokes gravity trap' });
    neckAsm.position.set(28, 1.85, 0);
    const neckPts = [
      V(0, 0, 0), V(0, 0.65, 0), V(0.55, 0.85, 0),
      V(1.15, 0.1, 0), V(1.65, -0.45, 0), V(2.15, 0.15, 0),
    ];
    const neckGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(neckPts), 40, 0.13, 12, false);
    part(neckAsm, neckGeo, { pal: 'blue', tone: 'hi', ex: [0.5, 0.35, 0], name: 'Curved S-neck tube' });
    const brothMaterials = { clear: shadeMat('ochre'), cloudy: shadeMat('red') };
    const sporeParticles = prims.particles(neckAsm, 18, { radius: 0.04, color: 'red' });
    label('board', 'Settled spores in dip', () => V(29.65, 1.4, 0), { leader: [38, 22] });

    // Station 3 (x = 42): Logarithmic Scale Ladder & Real Water Molecule Cluster
    const molAsm = asm('water_mol', root, { title: 'H₂O Hydrogen-bond cluster', sub: '0.28 nm molecular scale' });
    molAsm.position.set(40.6, 1.35, 0);
    prims.molecule(molAsm, MOLECULES.waterCluster.atoms.map(a => a.join(' ')).join('\n'), { scale: 0.28, names: false, name: 'Water cluster' });

    const towerAsm = asm('scale_tower', root, { title: 'Biological scale columns', sub: 'Orders of magnitude' });
    towerAsm.position.set(42.8, 0.1, 0);
    const steps = [
      { h: 0.45, pal: 'blue', x: -0.9, name: 'Protein (5 nm)' },
      { h: 0.95, pal: 'ochre', x: -0.3, name: 'Phage virus (100 nm)' },
      { h: 1.55, pal: 'green', x: 0.3, name: 'Bacterium (2 µm)' },
      { h: 2.25, pal: 'red', x: 0.9, name: 'Red blood cell (8 µm)' },
    ];
    for (const st of steps) {
      part(towerAsm, box(0.42, st.h, 0.42, 0.04), { pal: st.pal, tone: 'hi', pos: [st.x, st.h / 2, 0], ex: [0, st.h * 0.25, 0], name: st.name });
    }
    label('board', 'Water: molecular scale', () => V(40.6, 2.35, 0));
    label('board', 'Size-order columns', () => V(42.8, 2.55, 0));

    return {
      labels,
      update(s) {
        // Animate flies in Redi jars
        for (const fc of flyClouds) {
          const pts = [];
          for (let i = 0; i < 10; i++) {
            const ang = s.t * 1.8 + i * 0.63;
            const r = 0.28 + 0.12 * Math.sin(s.t + i);
            const y = fc.lid === 'none' ? 0.45 + 0.35 * Math.abs(Math.sin(s.t * 1.3 + i)) : 1.72 + 0.18 * Math.abs(Math.cos(s.t * 1.5 + i));
            pts.push([r * Math.cos(ang), y, r * Math.sin(ang)]);
          }
          pts.forEach((xyz, i) => fc.cloud.set(i, xyz));
        }
        // Scale bead lens & ray cone with lensRadiusMm
        const sc = s.lensRadiusMm / 0.75;
        beadMesh.scale.setScalar(sc);
        const fScene = Math.max(0.22, Math.min(0.85, s.fMm * 0.22));
        rayUpper.set(V(0, 0.18 * sc, 0), V(0, 0, fScene));
        rayLower.set(V(0, -0.18 * sc, 0), V(0, 0, fScene));

        // Flask tilt & spore positions in swan-neck bend
        const tiltRad = s.tilted ? -0.42 : 0;
        flaskAsm.rotation.z = tiltRad;
        neckAsm.rotation.z = tiltRad;
        brothMesh.material = s.tilted ? brothMaterials.cloudy : brothMaterials.clear;
        const sp = [];
        for (let i = 0; i < 18; i++) {
          const u = i / 18;
          if (s.tilted) {
            sp.push([0.3 * Math.cos(u * 6 + s.t), -0.6 + 0.3 * Math.sin(u * 6), 0.2 * Math.sin(i)]);
          } else {
            sp.push([1.55 + 0.25 * Math.cos(i + s.t * 0.5), -0.42 - (s.neckDipMm - 20) * 0.008 + 0.04 * Math.sin(i), 0.04 * Math.cos(i)]);
          }
        }
        sp.forEach((xyz, i) => sporeParticles.set(i, xyz));
      },
    };
  },
};
