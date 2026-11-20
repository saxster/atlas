// node tools/visual-learner.mjs <subject/chapter> [--out <dir>] [--steps <n>] [--policy scripted|ollama]
import { key } from './chapters.mjs';
import { visualLearner } from '../cli/visual-learner.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args.splice(i, 2)[1]; };
const flag = k => { const i = args.indexOf(k); return i >= 0 && args.splice(i, 1).length > 0; };

const outDir = opt('--out', 'artifacts/visual-learner');
const steps = Number(opt('--steps', '4'));
const policy = opt('--policy', 'scripted');
const model = opt('--model', 'qwen3-vl:4b-instruct');
const width = Number(opt('--width', '960'));
const height = Number(opt('--height', '640'));
const deterministic = flag('--deterministic');

if (!args[0]) {
  console.error('usage: node tools/visual-learner.mjs <subject/chapter> [--out <dir>] [--steps <n>] [--policy scripted|ollama]');
  process.exit(2);
}

const summary = await visualLearner(key(args[0]), { outDir, steps, policy, model, width, height, deterministic });
console.log(`visual-learner ${summary.figure}: ${summary.steps.length} steps (${summary.outcome}) -> ${outDir}/report.html`);
