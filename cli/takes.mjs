// cli/takes.mjs — Generates a standalone 3-Take synchronized exploration board HTML page.
import fs from 'node:fs';
import path from 'node:path';
import { buildTakesSpec } from '../engine/takes.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function buildTakesHtml({
  title = 'Atlas · 3 Takes',
  figure = 'examples/minimal/machine',
  voices = ['textbook-pure', 'bugged-sketchbook', 'whacky-lab'],
  compare = null,
  rootRel = '/',
  duration = 0,
} = {}) {
  const prefix = rootRel.endsWith('/') ? rootRel : `${rootRel}/`;
  const takesArg = Array.isArray(compare) && compare.length
    ? compare.map((fig, i) => ({
      id: `compare-${i + 1}`,
      label: fig.replace(/^examples\//, ''),
      badge: 'Compare figure',
      figure: fig.replace(/^\/+|\/+$/g, ''),
    }))
    : null;

  const spec = buildTakesSpec({
    title,
    figure,
    voices,
    takes: takesArg,
    basePrefix: prefix,
    sync: true,
    calm: true,
  });

  const specJson = JSON.stringify(spec).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(spec.title)}</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="${esc(prefix)}engine/atlas.css">
<script type="importmap">
{ "imports": {
  "@saxster/atlas": "${esc(prefix)}engine/index.js",
  "@saxster/atlas/": "${esc(prefix)}engine/",
  "@saxster/atlas/adapters/": "${esc(prefix)}adapters/"
} }
</script>
</head>
<body style="margin:0;padding:18px;background:var(--page)">
  <main id="takes-host"></main>
  <script type="application/json" id="takes-spec">${specJson}</script>
  <script type="module">
    import { mountTakesBoard } from '@saxster/atlas/takes.js';
    const spec = JSON.parse(document.getElementById('takes-spec').textContent);
    window.__takes = mountTakesBoard(document.getElementById('takes-host'), {
      title: spec.title,
      takes: spec.takes,
      duration: ${Number(duration) || 0},
    });
  </script>
</body>
</html>
`;
}

export function writeTakesBoard(figureArg, {
  voices = ['textbook-pure', 'bugged-sketchbook', 'whacky-lab'],
  compare = null,
  out = 'takes.html',
  title = null,
} = {}) {
  const absOut = path.resolve(out);
  const cwd = process.cwd();
  const relToRoot = absOut.startsWith(cwd + path.sep)
    ? (path.relative(path.dirname(absOut), cwd) || '.')
    : '/';
  const rootRel = relToRoot === '/' ? '/' : (relToRoot === '.' ? './' : `${relToRoot.replace(/\\/g, '/')}/`);
  const cleanFig = (figureArg || '').replace(/\/$/, '');
  const html = buildTakesHtml({
    title: title || `${cleanFig || 'Comparison'} · 3 Takes`,
    figure: cleanFig,
    voices,
    compare,
    rootRel,
  });
  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  fs.writeFileSync(absOut, html, 'utf8');
  console.log(`wrote takes board -> ${out}`);
  return { out: absOut, html };
}
