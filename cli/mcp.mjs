// cli/mcp.mjs — Zero-dependency local stdio MCP (Model Context Protocol) server for @saxster/atlas.
// Exposes boot packages, single-source voices, example catalog, concept search, model-first checks/gates,
// SVG linting, and headless critics/stills over JSON-RPC 2.0 on stdin/stdout (diagnostics on stderr only).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { boot } from './boot.mjs';
import { auditFigureDir } from './check.mjs';
import { evaluateGate } from './gate.mjs';
import { lintSvg } from './svg-lint.mjs';
import { listVoices, resolveVoice } from '../engine/voices.js';
import { deriveAccentTokens, auditTheme } from '../engine/theme.js';
import { rankSearch } from '../engine/search.js';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIGURE_MARKERS = new Set(['checks.mjs', 'model.js', 'world.js', 'figure.js', 'chapter.js', 'pages.js']);
const SKIP_DIRS = new Set(['node_modules', 'engine', 'adapters', 'bin', 'cli', 'tools', 'docs', 'concepts', 'equations', 'evals', 'img', 'videos', 'golden', 'shots']);

async function captureLogs(fn) {
  const logs = [];
  const origLog = console.log;
  const origInfo = console.info;
  const origWarn = console.warn;
  const push = (...args) => logs.push(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  console.log = push;
  console.info = push;
  console.warn = push;
  try {
    const value = await fn();
    return { value, logs };
  } finally {
    console.log = origLog;
    console.info = origInfo;
    console.warn = origWarn;
  }
}

function findFigureDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const hasMarker = entries.some(e => e.isFile() && FIGURE_MARKERS.has(e.name));
  const subDirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.has(e.name))
    .flatMap(e => findFigureDirs(path.join(dir, e.name)));
  return hasMarker ? [dir, ...subDirs] : subDirs;
}

const TOOLS = [
  {
    name: 'atlas_boot',
    description: 'Assemble a verified @saxster/atlas boot package (grammar, domain kit, or Creator Voice) or list available targets.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Target slug or task phrase (e.g. "machine", "plotter-draft", "circuit solver")' },
        list: { type: 'boolean', description: 'List all grammars, kits, and Creator Voices' },
      },
    },
  },
  {
    name: 'atlas_voices',
    description: 'Inspect the single-source @saxster/atlas Creator Voices manifest, tokens, and WCAG AA contrast audits.',
    inputSchema: {
      type: 'object',
      properties: {
        voice: { type: 'string', description: 'Optional specific voice id or alias' },
      },
    },
  },
  {
    name: 'atlas_list_examples',
    description: 'List published @saxster/atlas subjects, chapters, and figures with grammars and URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Optional subject id filter (e.g. "physics", "maths")' },
        grammar: { type: 'string', description: 'Optional grammar filter ("book", "machine", "explorer", "sandbox")' },
      },
    },
  },
  {
    name: 'atlas_search_concepts',
    description: 'Search chapters, figures, concepts, equations, threads, and practice questions using IDF + 1-hop graph spread.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Maximum results (default 12)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'atlas_check',
    description: 'Audit figure model.js purity (no DOM/Three.js) and execute checks.mjs.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Figure or directory path relative to repo root (default: examples)' },
      },
    },
  },
  {
    name: 'atlas_gate',
    description: 'Verify Model-First gate on a target scene or grammar file (world.js, figure.js, chapter.js, pages.js, practice.js).',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Target file path relative to repo root' },
      },
      required: ['file'],
    },
  },
  {
    name: 'atlas_svg_lint',
    description: 'Lint SVG files for XML validity, ID integrity, upside-down/stroked text, and strict Plotter drafting rules.',
    inputSchema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' }, description: 'SVG file paths relative to repo root' },
        strictDraft: { type: 'boolean', description: 'Enforce strict plotter-draft rules' },
        compact: { type: 'boolean', description: 'Enforce compact <400px SVG rules' },
      },
      required: ['files'],
    },
  },
  {
    name: 'atlas_critic',
    description: 'Run headless Chrome geometric, label, jump, and SVG clip critics (and optionally emit spatial review pins JSON).',
    inputSchema: {
      type: 'object',
      properties: {
        figures: { type: 'array', items: { type: 'string' }, description: 'Figure paths (e.g. ["examples/physics/newton"])' },
        intersections: { type: 'boolean', description: 'Enable pairwise 3D mesh intersection audit' },
        pinsOut: { type: 'string', description: 'Optional output path for unified spatial review pins JSON' },
      },
      required: ['figures'],
    },
  },
  {
    name: 'atlas_stills',
    description: 'Render desktop (1440x900) and phone (390x844) ?render stills for one or more figures.',
    inputSchema: {
      type: 'object',
      properties: {
        figures: { type: 'array', items: { type: 'string' }, description: 'Figure paths' },
        outDir: { type: 'string', description: 'Output directory for rendered PNG stills' },
      },
      required: ['figures', 'outDir'],
    },
  },
];

const RESOURCES = [
  { uri: 'atlas://llms.txt', name: 'llms.txt', mimeType: 'text/plain', rel: 'llms.txt' },
  { uri: 'atlas://llms-full.txt', name: 'llms-full.txt', mimeType: 'text/plain', rel: 'llms-full.txt' },
  { uri: 'atlas://voices.json', name: 'Creator Voices Manifest', mimeType: 'application/json', rel: 'engine/voices.json' },
  { uri: 'atlas://draft-standard.json', name: 'Orthographic Drafting Standard', mimeType: 'application/json', rel: 'engine/draft_standard.json' },
  { uri: 'atlas://docs/API.md', name: 'Atlas API Reference', mimeType: 'text/markdown', rel: 'docs/API.md' },
];

export function createMcpServer({ root = HERE } = {}) {
  const safePath = p => {
    const abs = path.resolve(root, String(p || ''));
    if (abs !== root && !abs.startsWith(root + path.sep)) {
      throw new Error(`Path escapes workspace root: ${p}`);
    }
    return abs;
  };

  async function callTool(name, args = {}) {
    if (name === 'atlas_boot') {
      const res = boot(args.query || '', { list: Boolean(args.list) });
      return {
        text: res.markdown || JSON.stringify(res, null, 2),
        structuredContent: res,
        isError: res.exitCode === 3,
      };
    }

    if (name === 'atlas_voices') {
      const list = args.voice ? [resolveVoice(args.voice)] : listVoices();
      const items = list.map(v => {
        const tokens = deriveAccentTokens(v.accent, {
          page: v.paper,
          card: v.card,
          ink: v.ink,
          tintNeutrals: v.tintNeutrals,
          type: v.typography,
          radius: v.radius,
        });
        const audit = auditTheme([
          { role: 'ink/paper', fg: tokens.neutrals.strong, bg: tokens.neutrals.page, kind: 'text' },
          { role: 'ink/card', fg: tokens.neutrals.strong, bg: tokens.neutrals.card, kind: 'text' },
          { role: 'accentInk/card', fg: tokens.accentInk, bg: tokens.neutrals.card, kind: 'text' },
          { role: 'accentOn/accent', fg: tokens.accentOn, bg: tokens.accent, kind: 'text' },
        ]);
        return { ...v, tokens, wcagPass: audit.ok };
      });
      return {
        text: JSON.stringify(items, null, 2),
        structuredContent: { voices: items },
      };
    }

    if (name === 'atlas_list_examples') {
      const { subjects } = await import(pathToFileURL(path.join(root, 'tools', 'chapters.mjs')).href);
      const all = await subjects();
      const subjFilter = args.subject ? String(args.subject).trim().toLowerCase() : null;
      const gramFilter = args.grammar ? String(args.grammar).trim().toLowerCase() : null;
      const items = [];
      for (const s of all) {
        if (s.id === 'minimal') continue;
        if (subjFilter && s.id !== subjFilter) continue;
        for (const id of s.chapters || []) {
          const grammar = 'book';
          if (gramFilter && grammar !== gramFilter) continue;
          const card = s.cards?.[id] || {};
          items.push({ subject: s.id, id, grammar, path: `examples/${s.id}/${id}`, title: card.title || id, sub: card.sub || '' });
        }
        for (const id of s.figures || []) {
          const card = s.cards?.[id] || {};
          const grammar = card.grammar || 'figure';
          if (gramFilter && grammar !== gramFilter) continue;
          items.push({ subject: s.id, id, grammar, path: `examples/${s.id}/${id}`, title: card.title || id, sub: card.sub || '' });
        }
      }
      return {
        text: JSON.stringify({ count: items.length, examples: items }, null, 2),
        structuredContent: { count: items.length, examples: items },
      };
    }

    if (name === 'atlas_search_concepts') {
      const mod = await import(pathToFileURL(path.join(root, 'examples', 'search-index.js')).href);
      const limit = Math.max(1, Math.min(50, Number(args.limit) || 12));
      const results = rankSearch(mod.SEARCH_INDEX || [], String(args.query || ''), { limit, spread: true });
      return {
        text: JSON.stringify({ count: results.length, results }, null, 2),
        structuredContent: { count: results.length, results },
      };
    }

    if (name === 'atlas_check') {
      const rel = String(args.target || 'examples').replace(/\/$/, '');
      const candidates = [
        safePath(rel),
        safePath(rel.startsWith('examples/') ? rel : path.join('examples', rel)),
      ];
      const targetDir = candidates.find(p => fs.existsSync(p)) || candidates[0];
      const dirs = findFigureDirs(targetDir);
      if (!dirs.length) {
        return { text: `No figure directories found under ${rel}`, isError: true };
      }
      const results = dirs.map(d => ({
        figure: path.relative(root, d),
        ...auditFigureDir(d, { runChecks: true }),
      }));
      const failed = results.filter(r => !r.ok);
      return {
        text: JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2),
        structuredContent: { total: results.length, failed: failed.length, results },
        isError: failed.length > 0,
      };
    }

    if (name === 'atlas_gate') {
      const absFile = safePath(args.file);
      const res = evaluateGate(absFile);
      return {
        text: res.allowed ? `PASS gate: ${args.file} (${res.pass ?? 0} checks pass)` : res.reason,
        structuredContent: res,
        isError: !res.allowed,
      };
    }

    if (name === 'atlas_svg_lint') {
      const files = Array.isArray(args.files) ? args.files : [];
      const results = files.map(f => {
        const abs = safePath(f);
        const raw = fs.readFileSync(abs, 'utf8');
        return lintSvg(raw, { strictDraft: Boolean(args.strictDraft), compact: Boolean(args.compact), source: f });
      });
      const ok = results.every(r => r.ok);
      return {
        text: JSON.stringify({ ok, results }, null, 2),
        structuredContent: { ok, results },
        isError: !ok,
      };
    }

    if (name === 'atlas_critic' || name === 'atlas_stills') {
      const figs = Array.isArray(args.figures) ? args.figures.map(String) : [];
      if (!figs.length) return { text: 'Missing figures array', isError: true };
      const binPath = path.join(root, 'bin', 'atlas.mjs');
      const cmdArgs = name === 'atlas_critic'
        ? [binPath, 'critic', ...figs, ...(args.intersections ? ['--intersections'] : []), ...(args.pinsOut ? ['--pins', args.pinsOut] : [])]
        : [binPath, 'stills', String(args.outDir || 'shots'), ...figs];
      const run = spawnSync(process.execPath, cmdArgs, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      let pins = null;
      if (name === 'atlas_critic' && args.pinsOut) {
        const absPins = safePath(args.pinsOut);
        if (fs.existsSync(absPins)) {
          try { pins = JSON.parse(fs.readFileSync(absPins, 'utf8')); } catch {}
        }
      }
      const payload = { exitCode: run.status ?? 1, stdout: run.stdout || '', stderr: run.stderr || '', ...(pins ? { pins } : {}) };
      return {
        text: JSON.stringify(payload, null, 2),
        structuredContent: payload,
        isError: (run.status ?? 1) !== 0,
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  }

  async function handleMessage(msg) {
    if (!msg || typeof msg !== 'object') {
      return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } };
    }
    const { id, method, params = {} } = msg;
    const hasId = id !== undefined && id !== null;

    if (method === 'notifications/initialized' || !hasId) {
      return null;
    }

    try {
      if (method === 'initialize') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {}, resources: {} },
            serverInfo: { name: '@saxster/atlas', version: '0.1.0' },
          },
        };
      }
      if (method === 'ping') {
        return { jsonrpc: '2.0', id, result: {} };
      }
      if (method === 'tools/list') {
        return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
      }
      if (method === 'tools/call') {
        const { value } = await captureLogs(() => callTool(params.name, params.arguments || {}));
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: value.text }],
            ...(value.structuredContent ? { structuredContent: value.structuredContent } : {}),
            ...(value.isError ? { isError: true } : {}),
          },
        };
      }
      if (method === 'resources/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: RESOURCES.map(({ uri, name, mimeType }) => ({ uri, name, mimeType })),
          },
        };
      }
      if (method === 'resources/read') {
        const spec = RESOURCES.find(r => r.uri === params.uri);
        if (!spec) {
          return { jsonrpc: '2.0', id, error: { code: -32002, message: `Unknown resource: ${params.uri}` } };
        }
        const abs = safePath(spec.rel);
        const text = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
        return {
          jsonrpc: '2.0',
          id,
          result: { contents: [{ uri: spec.uri, mimeType: spec.mimeType, text }] },
        };
      }
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
    } catch (err) {
      return { jsonrpc: '2.0', id, error: { code: -32603, message: err?.message || String(err) } };
    }
  }

  return { tools: TOOLS, resources: RESOURCES, handleMessage };
}

export function runStdioServer({ root = HERE } = {}) {
  const srv = createMcpServer({ root });
  let buf = '';
  let useContentLength = false;
  process.stdout.on('error', err => {
    if (err?.code === 'EPIPE') process.exit(0);
    throw err;
  });

  const writeMsg = res => {
    if (!res) return;
    const json = JSON.stringify(res);
    if (useContentLength) {
      const len = Buffer.byteLength(json, 'utf8');
      process.stdout.write(`Content-Length: ${len}\r\n\r\n${json}`);
    } else {
      process.stdout.write(`${json}\n`);
    }
  };

  let chain = Promise.resolve();
  const dispatchRaw = raw => {
    chain = chain.then(async () => {
      let msg;
      try { msg = JSON.parse(raw); } catch {
        writeMsg({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
        return;
      }
      const res = await srv.handleMessage(msg);
      writeMsg(res);
    });
  };

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    buf += chunk;
    while (buf.length > 0) {
      const clMatch = /^Content-Length:\s*(\d+)\r?\n\r?\n/i.exec(buf);
      if (clMatch) {
        useContentLength = true;
        const len = Number(clMatch[1]);
        const headLen = clMatch[0].length;
        if (Buffer.byteLength(buf.slice(headLen), 'utf8') < len) break;
        const bodyBytes = Buffer.from(buf.slice(headLen), 'utf8');
        const body = bodyBytes.subarray(0, len).toString('utf8');
        buf = bodyBytes.subarray(len).toString('utf8');
        dispatchRaw(body);
        continue;
      }
      const nl = buf.indexOf('\n');
      if (nl < 0) break;
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) dispatchRaw(line);
    }
  });
  process.stdin.on('end', () => {
    chain.then(() => process.exit(0));
  });
  process.stdin.resume();
  return srv;
}
