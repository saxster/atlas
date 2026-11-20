// node tools/bundle-ink-demo.mjs [--check] — bundles examples/ink-ui/ and its @saxster/atlas/* 2D engine closure
// into a zero-network, single-file MIT HTML bundle at examples/ink-ui/atelier-ink-ui.html.
// Uses pure Node fs/path (zero esbuild/vite dependency) by inlining stylesheets and mapping the closed ESM graph
// into a data:text/javascript;base64 importmap.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './chapters.mjs';

const CHECK = process.argv.includes('--check');
const INK_DIR = path.join(ROOT, 'examples', 'ink-ui');
const OUT_FILE = path.join(INK_DIR, 'atelier-ink-ui.html');

const MODULE_MAP = {
  '@saxster/atlas/draft_standard.js': path.join(ROOT, 'engine', 'draft_standard.js'),
  '@saxster/atlas/draft_kit.js': path.join(ROOT, 'engine', 'draft_kit.js'),
  '@saxster/atlas/theme.js': path.join(ROOT, 'engine', 'theme.js'),
  '@saxster/atlas/iso_kit.js': path.join(ROOT, 'engine', 'iso_kit.js'),
  '@saxster/atlas/chart.js': path.join(ROOT, 'engine', 'chart.js'),
  '@saxster/atlas/diegetic.js': path.join(ROOT, 'engine', 'diegetic.js'),
  '@saxster/atlas/sound.js': path.join(ROOT, 'engine', 'sound.js'),
  'https://atlas.local/ink-ui/model.js': path.join(INK_DIR, 'model.js'),
};

function toDataUri(jsText) {
  return `data:text/javascript;base64,${Buffer.from(jsText, 'utf8').toString('base64')}`;
}

function rewriteRelativeImports(src, map) {
  return src.replace(/((?:from|import)\s+['"])([^'"]+)(['"])/g, (m, pre, spec, post) => {
    if (map[spec]) return `${pre}${map[spec]}${post}`;
    return m;
  });
}

function buildBundle() {
  const rawHtml = fs.readFileSync(path.join(INK_DIR, 'index.html'), 'utf8');
  const atlasCss = fs.readFileSync(path.join(ROOT, 'engine', 'atlas.css'), 'utf8');
  const figureCss = fs.readFileSync(path.join(ROOT, 'engine', 'figure.css'), 'utf8')
    .replace(/@import\s+url\(["']?labels\.css["']?\);?/g, '');

  // Encode engine leaf modules first, then modules that import them
  const imports = {};
  const draftStdSrc = fs.readFileSync(MODULE_MAP['@saxster/atlas/draft_standard.js'], 'utf8');
  const draftKitSrc = rewriteRelativeImports(fs.readFileSync(MODULE_MAP['@saxster/atlas/draft_kit.js'], 'utf8'), {
    './draft_standard.js': '@saxster/atlas/draft_standard.js',
  });
  const themeSrc = rewriteRelativeImports(fs.readFileSync(MODULE_MAP['@saxster/atlas/theme.js'], 'utf8'), {
    './draft_standard.js': '@saxster/atlas/draft_standard.js',
  });
  const isoSrc = fs.readFileSync(MODULE_MAP['@saxster/atlas/iso_kit.js'], 'utf8');
  const soundSrc = fs.readFileSync(MODULE_MAP['@saxster/atlas/sound.js'], 'utf8');
  const modelSrc = fs.readFileSync(MODULE_MAP['https://atlas.local/ink-ui/model.js'], 'utf8');

  imports['@saxster/atlas/draft_standard.js'] = toDataUri(draftStdSrc);
  imports['@saxster/atlas/draft_kit.js'] = toDataUri(draftKitSrc);
  imports['@saxster/atlas/theme.js'] = toDataUri(themeSrc);
  imports['@saxster/atlas/iso_kit.js'] = toDataUri(isoSrc);
  imports['@saxster/atlas/sound.js'] = toDataUri(soundSrc);
  imports['https://atlas.local/ink-ui/model.js'] = toDataUri(modelSrc);

  const chartSrc = rewriteRelativeImports(fs.readFileSync(MODULE_MAP['@saxster/atlas/chart.js'], 'utf8'), {
    './iso_kit.js': '@saxster/atlas/iso_kit.js',
  });
  imports['@saxster/atlas/chart.js'] = toDataUri(chartSrc);

  const diegeticSrc = rewriteRelativeImports(fs.readFileSync(MODULE_MAP['@saxster/atlas/diegetic.js'], 'utf8'), {
    './iso_kit.js': '@saxster/atlas/iso_kit.js',
  });
  imports['@saxster/atlas/diegetic.js'] = toDataUri(diegeticSrc);

  const widgetsSrc = rewriteRelativeImports(fs.readFileSync(path.join(INK_DIR, 'widgets.js'), 'utf8'), {
    './model.js': 'https://atlas.local/ink-ui/model.js',
  });
  imports['https://atlas.local/ink-ui/widgets.js'] = toDataUri(widgetsSrc);

  const mainSrc = rewriteRelativeImports(fs.readFileSync(path.join(INK_DIR, 'main.js'), 'utf8'), {
    './model.js': 'https://atlas.local/ink-ui/model.js',
    './widgets.js': 'https://atlas.local/ink-ui/widgets.js',
  });

  const importmapJson = JSON.stringify({ imports }, null, 2);

  return rawHtml
    .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
    .replace('<link rel="stylesheet" href="../../engine/atlas.css">', `<style id="inlined-atlas-css">\n${atlasCss}\n</style>`)
    .replace('<link rel="stylesheet" href="../../engine/figure.css">', `<style id="inlined-figure-css">\n${figureCss}\n</style>`)
    .replace(/<script type="importmap">[\s\S]*?<\/script>/, `<script type="importmap">\n${importmapJson}\n</script>`)
    .replace('<script type="module" src="./main.js"></script>', `<script type="module">\n${mainSrc}\n</script>`);
}

const html = buildBundle();
if (CHECK) {
  if (!fs.existsSync(OUT_FILE) || fs.readFileSync(OUT_FILE, 'utf8') !== html) {
    console.error('examples/ink-ui/atelier-ink-ui.html is stale; run node tools/bundle-ink-demo.mjs');
    process.exit(1);
  }
  console.log('atelier-ink-ui.html bundle: current');
  process.exit(0);
}
fs.writeFileSync(OUT_FILE, html, 'utf8');
console.log(`wrote ${path.relative(ROOT, OUT_FILE)} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KiB)`);
