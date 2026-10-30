// node tools/allpages.mjs — every page of every chapter by deep link: practice present, no console errors.
import puppeteer from 'puppeteer-core';
import { chapters as allChapters } from './chapters.mjs';
import { CHROME, GL_ARGS } from './chrome.mjs';
const chapters = process.argv.length > 2 ? process.argv.slice(2) : await allChapters();
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: GL_ARGS });
const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
let errors = []; page.on('pageerror', e => errors.push(e.stack.split('\n').slice(0, 4).join(' <- '))); page.on('console', m => { if (m.type() === 'error' && !m.location().url?.includes('/_vercel/insights/')) errors.push(m.text()); });
let bad = 0, qs = 0;
for (const c of chapters) {
  errors = [];
  await page.goto(`http://127.0.0.1:8137/${c}/`, { waitUntil: 'networkidle0' }); await page.waitForFunction('window.__atlas');
  const n = await page.evaluate(() => document.querySelectorAll('#dots button').length), missing = [];
  for (let i = 0; i < n; i++) {
    await page.evaluate(i => { location.hash = '#' + i; }, i);
    await page.waitForFunction(i => document.getElementById('pagenum').textContent.startsWith(i + 1 + ' /'), { timeout: 8000 }, i).catch(() => missing.push('nav' + i));
    await new Promise(r => setTimeout(r, 120));
    const k = await page.evaluate(() => document.querySelectorAll('#sheet .practice .q').length); qs += k;
    if (!k) missing.push(i);
  }
  if (missing.length || errors.length) bad++;
  console.log(c.padEnd(15), n, 'pages', missing.length ? 'MISSING ' + missing : 'practice on all', errors.length ? 'ERRORS ' + errors.join(' | ') : 'no errors');
}
console.log('questions', qs, bad ? 'PROBLEMS ' + bad : 'all ok'); await browser.close();
