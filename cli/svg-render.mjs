// SVG -> PNG rasterizer with automatic backend fallback ladder:
//   browser (Chrome + puppeteer-core) -> rsvg-convert -> resvg -> inkscape -> magick -> qlmanage+sips.
// Resolves @saxster/atlas draft tokens via cli/export-svg.mjs first so light & dark renders are consistent.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { CHROME, GL_ARGS } from './chrome.mjs';
import { exportSvg, EXPORT_THEMES } from './export-svg.mjs';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function commandExists(bin) {
  try {
    execFileSync('which', [bin], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function detectSvgRenderers() {
  const available = [];
  if (fs.existsSync(CHROME)) available.push('browser');
  for (const bin of ['rsvg-convert', 'resvg', 'inkscape', 'magick', 'qlmanage']) {
    if (commandExists(bin)) available.push(bin);
  }
  return available;
}

function parseDimensions(svgText, width, scale) {
  const vbMatch = /\bviewBox="([^"]+)"/.exec(svgText);
  let vw = 560;
  let vh = 440;
  if (vbMatch) {
    const nums = vbMatch[1].trim().split(/[\s,]+/).map(Number);
    if (nums.length === 4 && nums[2] > 0 && nums[3] > 0) {
      vw = nums[2];
      vh = nums[3];
    }
  } else {
    const wm = /\bwidth="([0-9.]+)"/.exec(svgText);
    const hm = /\bheight="([0-9.]+)"/.exec(svgText);
    if (wm) vw = Number(wm[1]) || vw;
    if (hm) vh = Number(hm[1]) || vh;
  }
  const s = Number.isFinite(scale) && scale > 0 ? scale : 2;
  const cssW = width && Number(width) > 0 ? Math.round(Number(width)) : Math.round(vw);
  const cssH = Math.max(1, Math.round((cssW * vh) / vw));
  return { cssW, cssH, pxW: Math.round(cssW * s), pxH: Math.round(cssH * s), scale: s };
}

function assertValidPng(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`PNG output was not written: ${filePath}`);
  const head = Buffer.alloc(8);
  const fd = fs.openSync(filePath, 'r');
  try {
    fs.readSync(fd, head, 0, 8, 0);
  } finally {
    fs.closeSync(fd);
  }
  if (!head.equals(PNG_MAGIC)) {
    throw new Error(`Rendered output is not a valid PNG: ${filePath}`);
  }
}

async function renderWithBrowser(svgText, outPng, dims, bgColor) {
  const { default: puppeteer } = await import('puppeteer-core');
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: [...GL_ARGS] });
  } catch {
    const fallbackArgs = GL_ARGS.includes('--no-sandbox') ? GL_ARGS : [...GL_ARGS, '--no-sandbox'];
    browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: fallbackArgs });
  }
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: dims.cssW, height: dims.cssH, deviceScaleFactor: dims.scale });
    const bgCss = bgColor ? `background:${bgColor};` : 'background:transparent;';
    const html = `<!doctype html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;${bgCss}}svg{display:block;width:${dims.cssW}px;height:${dims.cssH}px;}</style></head><body>${svgText}</body></html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outPng, omitBackground: !bgColor });
  } finally {
    await browser.close();
  }
}

function renderWithBinary(backend, tmpSvg, outPng, dims, bgColor) {
  if (backend === 'rsvg-convert') {
    const args = ['-w', String(dims.pxW), '-h', String(dims.pxH)];
    if (bgColor) args.push('-b', bgColor);
    args.push('-o', outPng, tmpSvg);
    execFileSync('rsvg-convert', args, { stdio: 'pipe' });
    return;
  }
  if (backend === 'resvg') {
    const args = ['--width', String(dims.pxW), '--height', String(dims.pxH)];
    if (bgColor) args.push('--background', bgColor);
    args.push(tmpSvg, outPng);
    execFileSync('resvg', args, { stdio: 'pipe' });
    return;
  }
  if (backend === 'inkscape') {
    const args = [tmpSvg, '--export-type=png', `--export-width=${dims.pxW}`, `--export-filename=${outPng}`];
    if (bgColor) args.push(`--export-background=${bgColor}`);
    execFileSync('inkscape', args, { stdio: 'pipe' });
    return;
  }
  if (backend === 'magick') {
    const args = [
      '-background',
      bgColor || 'none',
      '-density',
      String(Math.round(96 * (dims.pxW / Math.max(1, dims.cssW)))),
      tmpSvg,
      '-resize',
      `${dims.pxW}x${dims.pxH}!`,
      outPng,
    ];
    execFileSync('magick', args, { stdio: 'pipe' });
    return;
  }
  if (backend === 'qlmanage') {
    const tmpDir = path.dirname(tmpSvg);
    const size = Math.max(dims.pxW, dims.pxH);
    execFileSync('qlmanage', ['-t', '-s', String(size), '-o', tmpDir, tmpSvg], { stdio: 'pipe' });
    const qlOut = path.join(tmpDir, `${path.basename(tmpSvg)}.png`);
    if (!fs.existsSync(qlOut)) throw new Error('qlmanage did not produce a thumbnail PNG.');
    if (commandExists('sips')) {
      execFileSync('sips', ['--resampleHeightWidth', String(dims.pxH), String(dims.pxW), qlOut, '--out', outPng], { stdio: 'pipe' });
    } else {
      fs.copyFileSync(qlOut, outPng);
    }
    return;
  }
  throw new RangeError(`Unsupported renderer backend: ${backend}`);
}

async function rasterizeSingle(svgText, outPng, { theme, width, scale, background, renderer, tmpDir }) {
  const exported = exportSvg(svgText, {
    theme,
    background: background === 'none' ? null : background,
  });
  const bgColor = background === 'none'
    ? null
    : (background === 'theme' ? (EXPORT_THEMES[theme]?.bg || '#fbfbfa') : background);
  const dims = parseDimensions(exported.svg, width, scale);
  const candidates = renderer === 'auto' ? detectSvgRenderers() : [renderer];
  if (!candidates.length) {
    throw new Error('No SVG rasterizer available (tried Chrome, rsvg-convert, resvg, inkscape, magick, qlmanage).');
  }

  const tmpSvg = path.join(tmpDir, `render-${theme}.svg`);
  fs.writeFileSync(tmpSvg, exported.svg, 'utf8');

  const errors = [];
  for (const backend of candidates) {
    try {
      if (backend === 'browser') {
        await renderWithBrowser(exported.svg, outPng, dims, bgColor);
      } else {
        renderWithBinary(backend, tmpSvg, outPng, dims, bgColor);
      }
      assertValidPng(outPng);
      return { file: outPng, renderer: backend, theme, width: dims.pxW, height: dims.pxH };
    } catch (err) {
      errors.push(`${backend}: ${err.message}`);
    }
  }
  throw new Error(`All SVG renderers failed for ${outPng}:\n  ${errors.join('\n  ')}`);
}

export async function renderSvgToPng(svgInputOrPath, {
  outPath,
  theme = 'light',
  width = null,
  scale = 2,
  background = 'theme',
  renderer = 'auto',
} = {}) {
  if (!outPath) throw new TypeError('renderSvgToPng requires outPath.');
  const svgText = fs.existsSync(svgInputOrPath) && !svgInputOrPath.trimStart().startsWith('<')
    ? fs.readFileSync(svgInputOrPath, 'utf8')
    : String(svgInputOrPath || '');

  const absOut = path.resolve(outPath);
  const outDir = path.dirname(absOut);
  fs.mkdirSync(outDir, { recursive: true });
  const tmpDir = path.join(outDir, `.atlas-svg-render-${process.pid}-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    if (theme === 'both') {
      const ext = path.extname(absOut) || '.png';
      const stem = absOut.slice(0, absOut.length - ext.length);
      const lightOut = await rasterizeSingle(svgText, `${stem}-light${ext}`, {
        theme: 'light', width, scale, background, renderer, tmpDir,
      });
      const darkOut = await rasterizeSingle(svgText, `${stem}-dark${ext}`, {
        theme: 'dark', width, scale, background, renderer, tmpDir,
      });
      return { files: [lightOut, darkOut], renderer: lightOut.renderer };
    }
    const single = await rasterizeSingle(svgText, absOut, {
      theme, width, scale, background, renderer, tmpDir,
    });
    return { files: [single], renderer: single.renderer };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

export async function svgRenderCli(inputPath, opts = {}) {
  if (!inputPath || !opts.out) {
    console.error('atlas svg-render <in.svg> --out <out.png> [--theme light|dark|both] [--width <px>] [--scale <n>] [--background theme|none|<hex>] [--renderer auto|browser|rsvg-convert|resvg|inkscape|magick|qlmanage]');
    return 2;
  }
  const res = await renderSvgToPng(inputPath, {
    outPath: opts.out,
    theme: opts.theme || 'light',
    width: opts.width ? Number(opts.width) : null,
    scale: opts.scale ? Number(opts.scale) : 2,
    background: opts.background || 'theme',
    renderer: opts.renderer || 'auto',
  });
  for (const f of res.files) {
    console.log(`rendered [${f.renderer}] ${f.theme} (${f.width}x${f.height}) -> ${f.file}`);
  }
  return 0;
}
