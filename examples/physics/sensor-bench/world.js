import { part, box, cyl, lines, V } from '@saxster/atlas/parts.js';
import { canvasPlate, billboard, flowBeads } from '@saxster/atlas/prims.js';
import { breadboard, mcuBoard, jumperWire, ledComponent, resistorComponent, ultrasonicComponent } from '@saxster/atlas/phys_kit.js';

// Maps physical distance [20..100 cm] onto bench X coordinate [-1.1..+2.5] from transducer face at x = -1.9
export const TX_X = -1.9;
export const cmToX = cm => TX_X + 0.8 + ((cm - 20) / 80) * 3.6;
export const xToCm = x => 20 + ((x - (TX_X + 0.8)) / 3.6) * 80;

export function buildWorld(E, params) {
  const root = E.scene;

  // Optical/acoustic bench rail (non-picked reference track)
  const bench = new E.THREE.Group();
  bench.userData = { noPick: true };
  root.add(bench);
  part(bench, box(5.8, 0.12, 0.42, 0.03), { pal: 'base', tone: 'lo', pos: [0.4, -0.68, 0], name: 'Track' });
  const tickCoords = [];
  for (let cm = 20; cm <= 100; cm += 10) {
    const x = cmToX(cm);
    tickCoords.push(x, -0.61, 0.22, x, -0.61, 0.34);
  }
  lines(bench, tickCoords, '#8a8a8f');

  // 1. Ultrasonic Dual-Can Transducer (HC-SR04 style) at x = TX_X
  const gTx = E.asm('transducer', root, { title: 'Ultrasonic transducer', sub: '40 kHz piezo TX & RX cans' });
  ultrasonicComponent(gTx, { pos: [TX_X - 0.08, 0.14, 0], pal: 'blue', name: 'HC-SR04 transducer' });
  part(gTx, box(0.24, 0.56, 0.26, 0.02), { pal: 'dark', tone: 'mid', pos: [TX_X - 0.12, -0.44, 0], name: 'Stand post' });

  // 2. Reflector Target on a 1D draggable rail along +X
  const gTarget = E.asm('target', root, { title: 'Reflector paddle', sub: 'drag along the bench rail' });
  const initX = cmToX(params.distCm ?? 60);
  gTarget.position.set(initX, 0, 0);
  part(gTarget, box(0.14, 1.18, 1.36, 0.03), { pal: 'driver', tone: 'hi', pos: [0, 0.12, 0], ex: [0.45, 0.15, 0], name: 'Reflector face' });
  part(gTarget, box(0.36, 0.28, 0.56, 0.03), { pal: 'ink', tone: 'mid', pos: [0, -0.50, 0], name: 'Rail carriage' });

  const railDrag = E.draggable(gTarget, {
    axis: { origin: [cmToX(20), 0, 0], dir: [cmToX(100) - cmToX(20), 0, 0], min: 0, max: 1 },
    autoMove: false,
    onDrag: u => {
      const nextCm = Math.round(20 + u * 80);
      params.distCm = nextCm;
    },
  });
  railDrag.set(((params.distCm ?? 60) - 20) / 80);

  // 3. Diegetic 3D Microcontroller, Breadboard, 220 Ω Resistor, Status LEDs & Live OLED Readout Plate (z = -1.55)
  const gOled = E.asm('oled', root, { title: 'Echo timer, MCU & OLED display', sub: 'measures echo pulse width in µs' });
  const mcu = mcuBoard(gOled, { kind: 'uno', pos: [-1.85, -0.58, -1.55], pal: 'blue', name: 'Controller MCU' });
  breadboard(gOled, { cols: 12, rows: 5, pos: [0.35, -0.58, -1.55], pal: 'paper', name: 'Sensor breadboard' });
  resistorComponent(gOled, { pos: [0.02, -0.47, -1.55], ohms: 220, name: '220 Ω resistor' });
  const ledSafe = ledComponent(gOled, { pos: [0.32, -0.48, -1.72], pal: 'green', name: 'Safe zone LED' });
  const ledWarn = ledComponent(gOled, { pos: [0.52, -0.48, -1.72], pal: 'ochre', name: 'Warn zone LED' });
  const ledStop = ledComponent(gOled, { pos: [0.72, -0.48, -1.72], pal: 'red', name: 'Stop zone LED' });

  const oledPlate = canvasPlate(gOled, (ctx, { w, h, state }) => {
    const s = state || { echoUs: 3496, shownCm: 60, distCm: 60, zone: 'SAFE', comp: 0, waveFrac: 0 };
    ctx.fillStyle = '#18212b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#5b86d6';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    ctx.fillStyle = '#9ec993';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`ECHO  ${Math.round(s.echoUs)} us`, 14, 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(`${s.shownCm.toFixed(1)} cm`, 14, 66);

    ctx.fillStyle = s.zone === 'STOP' ? '#f07a7e' : s.zone === 'WARN' ? '#fee48a' : '#7ec49e';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`${s.zone} · ${s.comp ? 'TEMP COMP' : 'FIXED 343 m/s'}`, 14, 94);

    // Echo gate timing bar along bottom of OLED
    ctx.strokeStyle = '#8fb0f0';
    ctx.beginPath();
    const gx0 = 16, gx1 = w - 16, gy = h - 22;
    const pulseEnd = gx0 + Math.min(1, s.echoUs / 6200) * (gx1 - gx0);
    ctx.moveTo(gx0, gy);
    ctx.lineTo(gx0, gy - 16);
    ctx.lineTo(pulseEnd, gy - 16);
    ctx.lineTo(pulseEnd, gy);
    ctx.lineTo(gx1, gy);
    ctx.stroke();
  }, {
    width: 1.65,
    height: 1.0,
    pxWidth: 264,
    pxHeight: 160,
    bezel: 0.05,
    pal: 'ink',
    screenBg: '#18212b',
    pos: [-0.82, 0.22, -1.55],
    rot: [0, 0.16, 0],
    name: 'OLED screen',
  });

  // Arched DuPont jumper wires + signal beads between MCU, breadboard, and transducer
  const trigWire = jumperWire(bench, {
    from: mcu.pinPos(3),
    to: [TX_X - 0.14, -0.18, -0.25],
    lift: 0.32,
    pal: 'ochre',
    name: 'Trigger jumper wire',
  });
  jumperWire(bench, {
    from: mcu.pinPos(5),
    to: [0.02, -0.50, -1.55],
    lift: 0.24,
    pal: 'blue',
    name: 'LED rail jumper wire',
  });
  const wireBeads = flowBeads(bench, trigWire.curvePoints(16), { count: 6, radius: 0.032, color: 'ochre', name: 'Trigger beads' });

  // 4. Thermal Air-Column Burner (z = +1.15, clear of target carriage) + Ink-Outlined Flame Billboard
  const gHeater = E.asm('heater', root, { title: 'Air-column heater', sub: 'raises air speed of sound v(T)' });
  part(gHeater, cyl(0.24, 0.26, 20), { pal: 'compound', tone: 'mid', pos: [0.45, -0.54, 1.15], ex: [0, -0.2, 0.3], name: 'Burner base' });
  const heaterFlame = billboard(gHeater, {
    kind: 'flame',
    width: 0.56,
    height: 0.86,
    color: 'ochre',
    pos: [0.45, -0.02, 1.15],
    name: 'Heater flame',
  });

  // Ink-outlined ultrasonic wave-front ring traveling vertically perpendicular to bench axis (+X)
  const pulseRing = billboard(bench, {
    kind: 'ring',
    width: 1.05,
    height: 1.05,
    color: 'blue',
    rot: [0, Math.PI / 2, 0],
    faceCamera: false,
    pos: [TX_X + 0.3, 0.14, 0],
    name: 'Ultrasonic pulse',
  });

  let curState = { distCm: params.distCm ?? 60, vActual: 343.2, echoUs: 3496, shownCm: 60 };

  const labels = [
    {
      cls: 'board',
      html: '40 kHz TX/RX',
      leader: true,
      anchor: () => V(TX_X + 0.08, 0.38, -0.34),
      at: () => V(TX_X - 0.45, 1.28, -0.2),
    },
    {
      cls: 'board',
      html: 'Reflector (drag ↔)',
      leader: true,
      anchor: () => V(cmToX(curState.distCm), 0.68, 0.25),
      at: () => V(cmToX(curState.distCm) + 0.55, 1.38, 0.45),
    },
    {
      cls: 'mark',
      html: 'Echo OLED',
      leader: true,
      anchor: () => V(-0.82, 0.72, -1.55),
      at: () => V(-0.82, 1.28, -1.55),
    },
  ];

  function update(state) {
    curState = state;
    const tx = TX_X + 0.22;
    const rx = cmToX(state.distCm) - 0.10;
    gTarget.position.x = cmToX(state.distCm);

    oledPlate.update(state, state.t);
    mcu.setStatus({
      tx: state.stage === 'trigger' ? 1 : 0,
      rx: state.stage === 'echo' ? 1 : 0,
      led: 1,
    });
    ledSafe.setBrightness(state.zone === 'SAFE' ? 1 : 0.12);
    ledWarn.setBrightness(state.zone === 'WARN' ? 1 : 0.12);
    ledStop.setBrightness(state.zone === 'STOP' ? 1 : 0.12);

    const flameAmp = 0.32 + 0.85 * state.heaterLevel;
    heaterFlame.update(state.cyclePhase, {
      amp: flameAmp,
      visible: state.tempC > -8,
    });

    const showWave = state.stage === 'outbound' || state.stage === 'echo';
    const wx = tx + (rx - tx) * state.waveFrac;
    pulseRing.update(state.returning ? 0.68 : 0.42, {
      amp: state.returning ? 0.85 : 1.05,
      pos: [wx, 0.14, 0],
      visible: showWave,
    });

    wireBeads.update(state.cyclePhase * 2, {
      visibleCount: state.stage === 'trigger' || state.stage === 'echo' ? 6 : 2,
    });
  }

  return { update, labels };
}
