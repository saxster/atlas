import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const te = M.triangleExterior(50, 60);
check('Exterior angle = 50 + 60 = 110°, gamma = 70°, sum = 180°', te.extDeg === 110 && te.gammaDeg === 70 && te.alphaDeg + te.betaDeg + te.gammaDeg === 180);
const pg = M.polygonAngles(6);
check('Hexagon splits into 4 triangles = 720° (120° interior, 60° exterior)', pg.triangles === 4 && pg.interiorSum === 720 && pg.regularInterior === 120);
process.exit(bad ? 1 : 0);
