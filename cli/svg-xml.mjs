// Pure zero-dependency SVG XML AST parser, serializer, CSS inline-style & URL reference helpers.
// Used by cli/svg-lint.mjs and cli/export-svg.mjs.

const ENTITY_DECODE = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeEntities(str) {
  return String(str).replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (m, code) => {
    if (code in ENTITY_DECODE) return ENTITY_DECODE[code];
    if (code.startsWith('#x')) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return m;
  });
}

export function escapeXmlAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeXmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Parse CSS inline style declarations while respecting parenthesized/quoted segments. */
export function parseInlineStyle(styleStr) {
  const out = {};
  const src = String(styleStr || '').trim();
  if (!src) return out;
  let cur = '';
  let quote = '';
  let paren = 0;
  const parts = [];
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      cur += ch;
      if (ch === quote && src[i - 1] !== '\\') quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
    } else if (ch === '(') {
      paren++;
      cur += ch;
    } else if (ch === ')' && paren > 0) {
      paren--;
      cur += ch;
    } else if (ch === ';' && paren === 0) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur);
  for (const decl of parts) {
    const colon = decl.indexOf(':');
    if (colon <= 0) continue;
    const key = decl.slice(0, colon).trim().toLowerCase();
    const val = decl.slice(colon + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

export function formatInlineStyle(map) {
  return Object.entries(map || {})
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(([k, v]) => `${k}:${String(v).trim()}`)
    .join(';');
}

/** Extract local `#id` fragment identifiers from CSS `url(...)` references. */
export function extractLocalUrls(str) {
  const ids = [];
  const src = String(str || '');
  for (const m of src.matchAll(/url\(\s*(['"]?)#([^)"'\s]+)\1\s*\)/gi)) {
    ids.push(m[2]);
  }
  return ids;
}

function parseAttributes(raw, line) {
  const attrs = {};
  let i = 0;
  const len = raw.length;
  while (i < len) {
    while (i < len && /\s/.test(raw[i])) i++;
    if (i >= len) break;
    const nameStart = i;
    while (i < len && /[^\s=/>]/.test(raw[i])) i++;
    const name = raw.slice(nameStart, i);
    if (!name) throw new SyntaxError(`Unexpected token in attribute list at line ${line}`);
    while (i < len && /\s/.test(raw[i])) i++;
    if (raw[i] !== '=') {
      if (name in attrs) throw new SyntaxError(`Duplicate attribute "${name}" at line ${line}`);
      attrs[name] = '';
      continue;
    }
    i++; // '='
    while (i < len && /\s/.test(raw[i])) i++;
    const quote = raw[i];
    if (quote !== '"' && quote !== "'") {
      throw new SyntaxError(`Expected quoted value for attribute "${name}" at line ${line}`);
    }
    i++;
    const valStart = i;
    while (i < len && raw[i] !== quote) i++;
    if (i >= len) throw new SyntaxError(`Unterminated value for attribute "${name}" at line ${line}`);
    if (name in attrs) throw new SyntaxError(`Duplicate attribute "${name}" at line ${line}`);
    attrs[name] = decodeEntities(raw.slice(valStart, i));
    i++;
  }
  return attrs;
}

/** Parse SVG/XML markup into an explicit AST `{ type: 'document', children, root }`. */
export function parseSvgXml(xml) {
  const src = String(xml ?? '');
  if (!src.trim()) throw new SyntaxError('SVG input is empty.');
  const doc = { type: 'document', children: [], root: null };
  const stack = [doc];
  let i = 0;
  let line = 1;

  const advanceLine = chunk => {
    for (let k = 0; k < chunk.length; k++) if (chunk[k] === '\n') line++;
  };

  while (i < src.length) {
    const parent = stack[stack.length - 1];
    const parentTag = parent.type === 'element' ? parent.tag.toLowerCase() : '';
    if (parentTag === 'style' || parentTag === 'script') {
      const re = new RegExp(`</${parentTag}\\s*>`, 'i');
      const rest = src.slice(i);
      const m = re.exec(rest);
      if (!m) throw new SyntaxError(`Unclosed <${parentTag}> element`);
      if (m.index > 0) {
        const txt = rest.slice(0, m.index);
        advanceLine(txt);
        parent.children.push({ type: 'text', value: txt });
      }
      advanceLine(m[0]);
      i += m.index + m[0].length;
      stack.pop();
      continue;
    }

    const lt = src.indexOf('<', i);
    if (lt < 0) {
      const tail = src.slice(i);
      if (tail) {
        if (stack.length === 1 && tail.trim()) {
          throw new SyntaxError(`Unexpected trailing character data at line ${line}`);
        }
        advanceLine(tail);
        if (tail.trim() || stack.length > 1) parent.children.push({ type: 'text', value: decodeEntities(tail) });
      }
      break;
    }
    if (lt > i) {
      const txt = src.slice(i, lt);
      if (stack.length === 1 && txt.trim()) {
        throw new SyntaxError(`Unexpected character data outside root element at line ${line}`);
      }
      advanceLine(txt);
      if (txt.trim() || stack.length > 1) parent.children.push({ type: 'text', value: decodeEntities(txt) });
      i = lt;
    }

    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      if (end < 0) throw new SyntaxError(`Unterminated XML comment at line ${line}`);
      const body = src.slice(i + 4, end);
      advanceLine(src.slice(i, end + 3));
      parent.children.push({ type: 'comment', value: body });
      i = end + 3;
      continue;
    }
    if (src.startsWith('<![CDATA[', i)) {
      const end = src.indexOf(']]>', i + 9);
      if (end < 0) throw new SyntaxError(`Unterminated CDATA section at line ${line}`);
      const body = src.slice(i + 9, end);
      advanceLine(src.slice(i, end + 3));
      parent.children.push({ type: 'cdata', value: body });
      i = end + 3;
      continue;
    }
    if (src.startsWith('<?', i)) {
      const end = src.indexOf('?>', i + 2);
      if (end < 0) throw new SyntaxError(`Unterminated processing instruction at line ${line}`);
      advanceLine(src.slice(i, end + 2));
      i = end + 2;
      continue;
    }
    if (src.startsWith('<!', i)) {
      const end = src.indexOf('>', i + 2);
      if (end < 0) throw new SyntaxError(`Unterminated declaration at line ${line}`);
      advanceLine(src.slice(i, end + 1));
      i = end + 1;
      continue;
    }

    // Find closing `>` respecting quoted attribute values
    let j = i + 1;
    let q = '';
    while (j < src.length) {
      const ch = src[j];
      if (q) {
        if (ch === q) q = '';
      } else if (ch === '"' || ch === "'") {
        q = ch;
      } else if (ch === '>') {
        break;
      }
      j++;
    }
    if (j >= src.length) throw new SyntaxError(`Unclosed tag starting at line ${line}`);

    const rawTag = src.slice(i, j + 1);
    const startLine = line;
    advanceLine(rawTag);

    if (rawTag.startsWith('</')) {
      const closeMatch = /^<\/([A-Za-z_][\w:.-]*)\s*>$/.exec(rawTag);
      if (!closeMatch) throw new SyntaxError(`Malformed closing tag "${rawTag}" at line ${startLine}`);
      const closeTag = closeMatch[1];
      if (stack.length <= 1 || stack[stack.length - 1].tag !== closeTag) {
        const expected = stack.length > 1 ? stack[stack.length - 1].tag : '(document root)';
        throw new SyntaxError(`Mismatched closing tag </${closeTag}> at line ${startLine} (expected </${expected}>)`);
      }
      stack.pop();
    } else {
      const openMatch = /^<([A-Za-z_][\w:.-]*)([\s\S]*?)(\/?)>$/.exec(rawTag);
      if (!openMatch) throw new SyntaxError(`Malformed opening tag "${rawTag}" at line ${startLine}`);
      const [, tag, attrRaw, slash] = openMatch;
      const attrs = parseAttributes(attrRaw, startLine);
      const node = { type: 'element', tag, attrs, children: [], line: startLine };
      if (stack.length === 1) {
        if (doc.root) throw new SyntaxError(`Multiple root elements (${doc.root.tag} and ${tag}) at line ${startLine}`);
        doc.root = node;
      }
      parent.children.push(node);
      if (slash !== '/') stack.push(node);
    }
    i = j + 1;
  }

  if (stack.length > 1) {
    const unclosed = stack.slice(1).map(n => `<${n.tag}>`).join(', ');
    throw new SyntaxError(`Unclosed XML element(s): ${unclosed}`);
  }
  if (!doc.root) throw new SyntaxError('No root SVG element found.');
  return doc;
}

/** Serialize an AST back into clean SVG/XML markup. */
export function serializeSvg(node, parentTag = '') {
  if (!node) return '';
  if (node.type === 'document') return node.children.map(c => serializeSvg(c, '')).join('');
  if (node.type === 'comment') return `<!--${node.value}-->`;
  if (node.type === 'cdata') return `<![CDATA[${node.value}]]>`;
  if (node.type === 'text') {
    const p = parentTag.toLowerCase();
    return (p === 'style' || p === 'script') ? node.value : escapeXmlText(node.value);
  }
  if (node.type === 'element') {
    const attrStr = Object.entries(node.attrs || {})
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => ` ${k}="${escapeXmlAttr(v)}"`)
      .join('');
    if (!node.children || node.children.length === 0) return `<${node.tag}${attrStr}/>`;
    const inner = node.children.map(c => serializeSvg(c, node.tag)).join('');
    return `<${node.tag}${attrStr}>${inner}</${node.tag}>`;
  }
  return '';
}

/** Pre-order traversal over element nodes, passing `(el, ancestors)`. */
export function walkSvg(node, fn, ancestors = []) {
  if (!node) return;
  if (node.type === 'document') {
    for (const c of node.children) walkSvg(c, fn, ancestors);
    return;
  }
  if (node.type !== 'element') return;
  fn(node, ancestors);
  if (node.children?.length) {
    const nextAnc = [...ancestors, node];
    for (const c of node.children) walkSvg(c, fn, nextAnc);
  }
}
