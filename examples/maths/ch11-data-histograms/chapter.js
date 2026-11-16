// Ch 11 · Frequency Density Histograms, Boxplots & Simpson's Paradox — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Area = Frequency',
    fig: 'Figure 11.1 · Why Unequal Class Widths Demand Height = Frequency ÷ Width',
    title: 'Why Unequal Class Widths Demand Height = Frequency ÷ Width',
    alt: '3D histogram blocks where block AREA (width × frequency density) equals class frequency, preventing wide-bin distortion.',
    body: ['3D histogram blocks where block AREA (width × frequency density) equals class frequency, preventing wide-bin distortion.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'hist_blocks',
    parts: ['hist_blocks'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Boxplot & Outliers',
    fig: 'Figure 11.2 · 5-Number Summary, IQR Box & 1.5×IQR Tukey Fences',
    title: '5-Number Summary, IQR Box & 1.5×IQR Tukey Fences',
    alt: 'Median, Q1–Q3 interquartile box, whiskers, and 1.5×IQR outlier fence markers.',
    body: ['Median, Q1–Q3 interquartile box, whiskers, and 1.5×IQR outlier fence markers.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'iqr_box',
    parts: ['iqr_box', 'fence_posts'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: "Simpson's Paradox",
    fig: 'Figure 11.3 · When Subgroup Trends Reverse Under Aggregation',
    title: 'When Subgroup Trends Reverse Under Aggregation',
    alt: 'Two hospital/department slabs with different severity mixes showing how higher rates in BOTH subgroups reverse when pooled.',
    body: ['Two hospital/department slabs with different severity mixes showing how higher rates in BOTH subgroups reverse when pooled.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'simpson_bars',
    parts: ['simpson_bars'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  hist_blocks: {
    title: 'Frequency Density Blocks (Area = Frequency)',
    text: 'Height = Frequency ÷ Class Width. The wide bin has frequency 30 across width 25, so its true height is 1.2 (not 30!).',
    facts: s => [['Bin 1 (w=10)', 'FD = 1.8 (f=18)'], ['Bin 2 (w=10)', 'FD = 2.4 (f=24)'], ['Wide Bin', `FD = ${s.bins[2].density.toFixed(2)} (f=${s.bins[2].freq})`]],
  },
  iqr_box: {
    title: 'Interquartile Box (Q1 = 42, Median = 54, Q3 = 64)',
    text: 'The middle 50% of observations span IQR = Q3 − Q1 = 22 points; the median stays at 54 even when x_max spikes.',
    facts: s => [['Median', `${s.tk.median}`], ['Mean (pulled)', `${s.tk.mean.toFixed(1)}`], ['IQR', `${s.tk.iqr}`]],
  },
  fence_posts: {
    title: 'Tukey 1.5×IQR Outlier Fence (Q3 + 1.5×IQR = 97)',
    text: 'Any point beyond 97 is flagged as an outlier so the whisker stops at the last non-outlier.',
    facts: s => [['Upper fence', `${s.tk.upperFence}`], ['x_max', `${s.tk.outlierVal} (${s.tk.isOutlier ? 'Outlier!' : 'Inside'})`]],
  },
  simpson_bars: {
    title: "Simpson's Paradox Subgroup vs Pooled Bars",
    text: "Hospital A wins Mild (93.1% > 86.7%) AND Severe (73.0% > 68.8%), but because A takes 75% severe cases, its pooled rate (78.0%) looks lower than B's (82.6%)!",
    facts: s => [['A Mild / Severe', '93.1% / 73.0%'], ['B Mild / Severe', '86.7% / 68.8%'], ['Pooled A vs B', '78.0% < 82.6%']],
  }
};

function buildWorld(rawE) {
  const E = { ...EKit, ...rawE };
  const { THREE, scene, asm } = E;
  const root = new THREE.Group();
  scene.add(root);
  EKit.studioGrid(root, { x0: -3, x1: 3 });
  const groups = {};
  for (const k of Object.keys(PLATES)) {
    const grp = asm ? asm(k, root, { title: PLATES[k].title, sub: '' }) : new THREE.Group();
    if (!asm) root.add(grp);
    groups[k] = grp;
  }
  const g = k => groups[k];
  const built = (function() {
    
    const pHist = g('hist_blocks');
    const b1 = E.algebraTile({ width: 0.65, height: 1.1, depth: 0.4, color: E.MATH_COL.setB, opacity: 0.85 });
    b1.position.set(-1.15, -0.15, 0);
    const b2 = E.algebraTile({ width: 0.65, height: 1.45, depth: 0.4, color: E.MATH_COL.proof, opacity: 0.85 });
    b2.position.set(-0.45, 0.02, 0);
    const b3 = E.algebraTile({ width: 1.5, height: 0.75, depth: 0.4, color: E.MATH_COL.warn, opacity: 0.88 });
    b3.position.set(0.7, -0.32, 0);
    pHist.add(b1, b2, b3);

    const pBox = g('iqr_box');
    pBox.add(E.algebraTile({ width: 1.4, height: 0.32, depth: 0.32, color: E.MATH_COL.inter, opacity: 0.85 }));
    pBox.position.set(-0.2, 0.95, 0);

    const pFence = g('fence_posts');
    const outDot = E.nodeSphere({ radius: 0.12, color: E.MATH_COL.setA });
    outDot.position.set(1.35, 0.95, 0);
    pFence.add(outDot);

    const pSimp = g('simpson_bars');
    pSimp.add(E.vectorArrow({ from: [-1.2, -1.0, 0.25], to: [1.0, -0.5, 0.25], color: E.MATH_COL.proof, radius: 0.035 }));
    pSimp.add(E.vectorArrow({ from: [-1.0, -1.1, 0.25], to: [1.2, -0.6, 0.25], color: E.MATH_COL.setB, radius: 0.035 }));

    return {
      at(s, p, pageIdx) {
        const wScale = p.wideBinWidth / 25;
        const dScale = s.bins[2].density / 1.2;
        b3.scale.set(wScale, dScale, 1);
        outDot.position.x = 0.4 + (p.outlierVal - 64) * 0.022;
        pSimp.visible = pageIdx === 2;
      }
    };

  })();
  Object.entries(groups).forEach(([k, grp], gIdx) => {
    let mIdx = 0;
    grp.traverse(o => {
      if (o.isMesh && o.userData.part === undefined) {
        o.userData.part = PLATES[k]?.title || k;
        o.userData.home = o.position.clone();
        o.userData.ex = new THREE.Vector3((gIdx % 2 === 0 ? -0.28 : 0.28), 0.18 + mIdx * 0.08, 0.22);
        mIdx++;
      }
    });
  });
  return {
    labels: [],
    update(s, look) {
      const p = CHAPTER.params || CHAPTER.defaultParams;
      const pageIdx = CHAPTER._pageIdx || 0;
      const visibleSet = new Set(PAGES[pageIdx]?.parts || Object.keys(groups));
      for (const [k, grp] of Object.entries(groups)) {
        grp.visible = visibleSet.has(k);
      }
      if (built && built.at) built.at(s, p, pageIdx, look?.section ? 'cut' : look?.xray ? 'xray' : 'solid');
    },
  };
}

export const CHAPTER = {
  subject: SUBJECT,
  no: 11,
  title: "Ch 11 · Frequency Density Histograms, Boxplots & Simpson's Paradox",
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'wideBinWidth': 25, 'wideBinFreq': 30, 'outlierVal': 98},
  controls: [
    { id: 'wideBinWidth', label: 'Wide class width Δx₃', min: 10, max: 40, step: 5, value: 25, unit: 'min' },
    { id: 'wideBinFreq', label: 'Wide class frequency f₃', min: 15, max: 60, step: 5, value: 30, unit: 'students' },
    { id: 'outlierVal', label: 'Extreme observation x_max', min: 70, max: 120, step: 5, value: 98, unit: 'pts' }
  ],
  lessons: {
    'atlas-ch11-1': { page: 0, params: {'wideBinWidth': 25, 'wideBinFreq': 30} },
    'atlas-ch11-2': { page: 1, params: {'outlierVal': 98} },
    'atlas-ch11-3': { page: 2, params: {} },
    'w_histogram_density_equalizer': { page: 0, params: {} },
    'w_boxplot_outlier_defender': { page: 1, params: {} },
    'w_simpsons_paradox_slicer': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const bins = M.histogramBins(p.wideBinWidth, p.wideBinFreq); const tk = M.tukeySummary(p.outlierVal); const sp = M.simpsonsParadox(); return { t, bins, tk, sp };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Frequency Density</b> · Wide class (width = ${s.bins[2].width}, freq = ${s.bins[2].freq}) → <b>FD = ${s.bins[2].freq} ÷ ${s.bins[2].width} = ${s.bins[2].density.toFixed(2)}</b> (Area = ${s.bins[2].width} × ${s.bins[2].density.toFixed(2)} = ${s.bins[2].freq}).`;
    if (pageIdx === 1) return `<b>Boxplot & Tukey Fence</b> · Q1 = 42, Median = <b>54</b>, Q3 = 64 (IQR = 22) · Upper fence = 64 + 1.5(22) = <b>97</b> → x_max = ${s.tk.outlierVal} is <b>${s.tk.isOutlier ? 'an OUTLIER' : 'within fence'}</b> (Mean pulled to ${s.tk.mean.toFixed(1)}).`;
    return `<b>Simpson's Paradox</b> · Subgroup A beats B in Mild (<b>93.1% > 86.7%</b>) AND Severe (<b>73.0% > 68.8%</b>), yet pooled A (<b>78.0%</b>) trails pooled B (<b>82.6%</b>) due to confounding case mix!`;
  },
  sonify(ctx, s, pageIdx = 0, p = CHAPTER.defaultParams) {
    const firstKey = Object.keys(p || CHAPTER.defaultParams)[0];
    const v = Number((p || CHAPTER.defaultParams)[firstKey]) || 1;
    EKit.playTone(ctx, { freq: 220 + (Math.abs(v) % 20) * 18, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  buildWorld,
  build: buildWorld,
};

export const chapter = CHAPTER;
