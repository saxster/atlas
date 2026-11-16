// Authored source for Figma Account Generative Plugin: "Atlas Vector Foundry & Token Studio"
// Deployed ID: 0cf9a286-d5f1-440c-92d0-572ace830772
const PANEL_WIDTH = 280

type UiMessage =
  | { type: 'resize'; height: number }
  | {
      type: 'run'
      mode: string
      teeth: number
      size: number
      primaryHex: string
    }

const MODES: Record<string, Record<string, string>> = {
  'paper-ink': { page: '#f2f2ef', sheet: '#fbfbfa', ink: '#18181a', text: '#57575a', red: '#e5484d', blue: '#3d63a8', green: '#3f8a63', ochre: '#936022' },
  ciechanow: { page: '#f0f0ee', sheet: '#f8f8f8', ink: '#222226', text: '#4c4c50', red: '#ab3e3e', blue: '#3f84ad', green: '#57874d', ochre: '#826308' },
  'pencil-wash': { page: '#f3eee2', sheet: '#faf7ef', ink: '#2b2927', text: '#524e48', red: '#e5484d', blue: '#3d63a8', green: '#3f8a63', ochre: '#936022' },
  moebius: { page: '#eeece5', sheet: '#f6f4ee', ink: '#1c1b19', text: '#494742', red: '#c83c36', blue: '#2f5f9e', green: '#2a7852', ochre: '#8d6218' },
  risograph: { page: '#efe8d8', sheet: '#f7f2e7', ink: '#1f1e1c', text: '#4a4640', red: '#c83b32', blue: '#2c6cb8', green: '#268055', ochre: '#8c6314' },
  'byrne-1847': { page: '#ece5d5', sheet: '#f4efe2', ink: '#1b1917', text: '#2e2b27', red: '#d63a24', blue: '#1d5b8c', green: '#226b48', ochre: '#8c6208' },
  'kym-sepia': { page: '#efe4cf', sheet: '#f8f0e0', ink: '#3a2e22', text: '#4d3f31', red: '#a3452c', blue: '#3c687a', green: '#456446', ochre: '#87581b' },
  'kym-dark': { page: '#121917', sheet: '#18211e', ink: '#e6e3d6', text: '#cfccc0', red: '#e0896f', blue: '#78b3cb', green: '#7cbf9c', ochre: '#d4a35f' },
}

function hexToRgb(hex: string): RGB {
  const clean = String(hex || '#1b1917').replace('#', '').slice(0, 6)
  const n = Number.parseInt(clean, 16)
  if (!Number.isFinite(n)) return { r: 0.1, g: 0.1, b: 0.1 }
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  }
}

function placeNearViewport(node: SceneNode, w: number, h: number): void {
  const center = figma.viewport.center
  node.x = Math.round(center.x - w / 2)
  node.y = Math.round(center.y - h / 2)
  figma.currentPage.appendChild(node)
  if ('setRelaunchData' in node) {
    node.setRelaunchData({ '0cf9a286-d5f1-440c-92d0-572ace830772': 'Re-open Atlas Vector Foundry & Token Studio' })
  }
  figma.currentPage.selection = [node]
  figma.viewport.scrollAndZoomIntoView([node])
}

async function buildPaletteBoard(): Promise<string> {
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })

  const board = figma.createFrame()
  board.name = 'Atlas 8-Voice Palette Matrix'
  board.layoutMode = 'VERTICAL'
  board.primaryAxisSizingMode = 'AUTO'
  board.counterAxisSizingMode = 'AUTO'
  board.itemSpacing = 12
  board.paddingTop = 20
  board.paddingBottom = 20
  board.paddingLeft = 20
  board.paddingRight = 20
  board.cornerRadius = 14
  board.fills = [{ type: 'SOLID', color: hexToRgb('#fbfbfa') }]
  board.strokes = [{ type: 'SOLID', color: hexToRgb('#d4d4d6') }]
  board.strokeWeight = 1

  for (const [modeName, pal] of Object.entries(MODES)) {
    const row = figma.createFrame()
    row.name = `Voice · ${modeName}`
    row.layoutMode = 'HORIZONTAL'
    row.primaryAxisSizingMode = 'AUTO'
    row.counterAxisSizingMode = 'AUTO'
    row.counterAxisAlignItems = 'CENTER'
    row.itemSpacing = 8
    row.paddingTop = 10
    row.paddingBottom = 10
    row.paddingLeft = 14
    row.paddingRight = 14
    row.cornerRadius = 10
    row.fills = [{ type: 'SOLID', color: hexToRgb(pal.sheet) }]
    row.strokes = [{ type: 'SOLID', color: hexToRgb(pal.ink), opacity: 0.16 }]
    row.strokeWeight = 1

    const label = figma.createText()
    label.fontName = { family: 'Inter', style: 'Medium' }
    label.fontSize = 12
    label.characters = modeName
    label.fills = [{ type: 'SOLID', color: hexToRgb(pal.ink) }]
    label.resize(110, 18)
    row.appendChild(label)

    for (const key of ['ink', 'text', 'red', 'blue', 'green', 'ochre']) {
      const chip = figma.createRectangle()
      chip.name = `${modeName}/${key}`
      chip.resize(28, 22)
      chip.cornerRadius = 5
      chip.fills = [{ type: 'SOLID', color: hexToRgb(pal[key]) }]
      chip.strokes = [{ type: 'SOLID', color: hexToRgb(pal.ink), opacity: 0.25 }]
      chip.strokeWeight = 1
      row.appendChild(chip)
    }
    board.appendChild(row)
  }

  placeNearViewport(board, 380, 420)
  return 'Created 8-voice palette matrix card'
}

function buildByrneGlyphs(size: number, primaryHex: string): string {
  const s = Math.max(80, Math.min(360, Math.round(size)))
  const svg = `<svg width="${s * 3.2}" height="${s}" viewBox="0 0 320 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="320" height="100" rx="12" fill="#F4EFE2" stroke="#CFC6B4"/>
    <g id="Byrne-Segment">
      <line x1="22" y1="74" x2="94" y2="26" stroke="#1B1917" stroke-width="10" stroke-linecap="round"/>
      <line x1="22" y1="74" x2="94" y2="26" stroke="${primaryHex}" stroke-width="6" stroke-linecap="round"/>
    </g>
    <g id="Byrne-Angle">
      <path d="M128 76 L186 76 A58 58 0 0 0 166 32 Z" fill="#1D5B8C" stroke="#1B1917" stroke-width="2.5" stroke-linejoin="round"/>
      <line x1="128" y1="76" x2="196" y2="76" stroke="#1B1917" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="128" y1="76" x2="173" y2="24" stroke="#1B1917" stroke-width="3.5" stroke-linecap="round"/>
    </g>
    <g id="Byrne-Triangle">
      <polygon points="260,20 300,78 220,78" fill="#E5AD16" stroke="#1B1917" stroke-width="3.5" stroke-linejoin="round"/>
    </g>
  </svg>`
  const node = figma.createNodeFromSvg(svg)
  node.name = 'Oliver Byrne Visual Proof Trio'
  placeNearViewport(node, s * 3.2, s)
  return 'Created Oliver Byrne proof glyphs'
}

function buildInvoluteGear(teethCount: number, size: number, primaryHex: string): string {
  const teeth = Math.max(8, Math.min(48, Math.round(teethCount)))
  const outer = Math.max(80, Math.min(480, Math.round(size)))
  const rPitch = outer * 0.42
  const mod = (2 * rPitch) / teeth
  const rAdd = rPitch + 0.95 * mod
  const rDed = Math.max(12, rPitch - 1.15 * mod)
  const rBore = Math.max(6, rDed * 0.34)
  const cx = outer / 2
  const cy = outer / 2

  const pts: string[] = []
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step
    const a1 = a0 + step * 0.18
    const a2 = a0 + step * 0.32
    const a3 = a0 + step * 0.58
    const a4 = a0 + step * 0.72
    const p = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
    pts.push(i === 0 ? `M ${p(rDed, a0)}` : `L ${p(rDed, a0)}`)
    pts.push(`L ${p(rDed, a1)}`, `L ${p(rAdd, a2)}`, `L ${p(rAdd, a3)}`, `L ${p(rDed, a4)}`)
  }
  pts.push('Z')

  const notchX = (cx + rPitch * 0.58).toFixed(2)
  const svg = `<svg width="${outer}" height="${outer}" viewBox="0 0 ${outer} ${outer}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${pts.join(' ')}" fill="${primaryHex}" stroke="#18181A" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="${rBore.toFixed(2)}" fill="#F8F8F8" stroke="#18181A" stroke-width="2.2"/>
    <circle cx="${notchX}" cy="${cy}" r="${Math.max(3, rPitch * 0.08).toFixed(2)}" fill="#18181A"/>
  </svg>`
  const node = figma.createNodeFromSvg(svg)
  node.name = `Involute Gear (${teeth}T)`
  placeNearViewport(node, outer, outer)
  return `Created ${teeth}-tooth involute gear with timing mark`
}

function buildGuillocheRosette(lobesCount: number, size: number, primaryHex: string): string {
  const lobes = Math.max(6, Math.min(36, Math.round(lobesCount)))
  const s = Math.max(120, Math.min(520, Math.round(size)))
  const cx = s / 2
  const cy = s / 2
  const rBase = s * 0.36
  const rAmp = s * 0.09
  const samples = 360
  const dA: string[] = []
  const dB: string[] = []
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * Math.PI * 2
    const r1 = rBase + rAmp * Math.cos(lobes * t)
    const r2 = rBase + rAmp * Math.sin(lobes * t)
    const x1 = cx + r1 * Math.cos(t)
    const y1 = cy + r1 * Math.sin(t)
    const x2 = cx + r2 * Math.cos(t)
    const y2 = cy + r2 * Math.sin(t)
    dA.push(`${i === 0 ? 'M' : 'L'}${x1.toFixed(2)},${y1.toFixed(2)}`)
    dB.push(`${i === 0 ? 'M' : 'L'}${x2.toFixed(2)},${y2.toFixed(2)}`)
  }
  dA.push('Z')
  dB.push('Z')
  const svg = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${dA.join(' ')}" stroke="${primaryHex}" stroke-width="1.6"/>
    <path d="${dB.join(' ')}" stroke="#1B1917" stroke-width="1.2" stroke-opacity="0.72"/>
  </svg>`
  const node = figma.createNodeFromSvg(svg)
  node.name = `Guilloche Rosette (${lobes} lobes)`
  placeNearViewport(node, s, s)
  return `Created ${lobes}-lobe guilloche rosette`
}

figma.root.setRelaunchData({ '0cf9a286-d5f1-440c-92d0-572ace830772': 'Open Atlas Vector Foundry & Token Studio' })
figma.showUI(__html__, { width: PANEL_WIDTH, height: 340 })

figma.ui.onmessage = async (message: UiMessage) => {
  if (message.type === 'resize') {
    figma.ui.resize(PANEL_WIDTH, Math.max(120, Math.min(900, Math.round(message.height))))
    return
  }
  if (message.type === 'run') {
    try {
      let status = 'Done'
      if (message.mode === 'PaleMatrix') {
        status = await buildPaletteBoard()
      } else if (message.mode === 'ByrneGlyphs') {
        status = buildByrneGlyphs(message.size, message.primaryHex)
      } else if (message.mode === 'Gear') {
        status = buildInvoluteGear(message.teeth, message.size, message.primaryHex)
      } else {
        status = buildGuillocheRosette(message.teeth, message.size, message.primaryHex)
      }
      figma.ui.postMessage({ type: 'status', text: status })
    } catch (e) {
      figma.ui.postMessage({ type: 'status', text: 'Error: ' + (e instanceof Error ? e.message : String(e)) })
    }
  }
}
