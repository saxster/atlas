// cli/slides.mjs — Capture 16:9 presentation slides from ?render&present and optionally export a vector-layout PDF handout.
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, open } from './render.mjs';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export async function slides(figureArg, {
  outDir = 'slides',
  pdf = null,
  width = 1600,
  height = 900,
} = {}) {
  const figure = figureArg.replace(/\/$/, '');
  const absOut = path.resolve(outDir);
  fs.mkdirSync(absOut, { recursive: true });

  const { server, base } = serve();
  const browser = await launch();
  const files = [];

  try {
    const R = await open(browser, base, figure, width, height, 'render&present');
    for (let i = 0; i < R.pages; i++) {
      const file = path.join(absOut, `slide-${String(i + 1).padStart(2, '0')}.png`);
      await R.shot(file, R.mid(i));
      files.push(file);
    }
    await R.page.close();

    if (pdf) {
      const absPdf = path.resolve(pdf);
      fs.mkdirSync(path.dirname(absPdf), { recursive: true });
      const pdfPage = await browser.newPage();
      await pdfPage.setViewport({ width, height, deviceScaleFactor: 1 });
      const imgsHtml = files.map((f, idx) => {
        const b64 = fs.readFileSync(f).toString('base64');
        return `<section class="slide"><img src="data:image/png;base64,${b64}" alt="Slide ${idx + 1}"></section>`;
      }).join('\n');
      await pdfPage.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
        @page { size: ${width}px ${height}px; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #fbfbfa; }
        .slide { width: ${width}px; height: ${height}px; page-break-after: always; overflow: hidden; }
        .slide:last-child { page-break-after: auto; }
        .slide img { width: 100%; height: 100%; object-fit: contain; display: block; }
      </style></head><body>${imgsHtml}</body></html>`, { waitUntil: 'load' });
      await pdfPage.evaluate(() => Promise.all([...document.images].map(img => img.decode().catch(() => {}))));
      await pdfPage.pdf({
        path: absPdf,
        width: `${width}px`,
        height: `${height}px`,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      await pdfPage.close();
      console.log(`wrote ${files.length} slides and PDF -> ${pdf}`);
    } else {
      console.log(`wrote ${files.length} slides -> ${outDir}/`);
    }
  } finally {
    await browser.close();
    server.close();
  }
  return { files, pdf: pdf ? path.resolve(pdf) : null };
}
