// The 2×2 Matrix Sandbox world: transformed 2D grid, unit-square parallelogram, eigenvector lines, draggable basis columns, and draggable probe vectors.
import * as THREE from 'three';
import { PALETTE, part, box, shadeMat, V } from '@saxster/atlas/parts.js';
import { axes, curve, vector, lattice } from '@saxster/atlas/prims.js';
import { draggable } from '@saxster/atlas/stage.js';
import * as M from './model.js';

const setPos = (m, p) => { m.position.copy(p); m.userData.home.copy(p); };
const dot = (g, r, pal, name, tone = 'hi', ex = [0, 0, 0]) =>
  part(g, new THREE.SphereGeometry(r, 24, 16), { pal, name, tone, ex });

export function buildWorld(E, params, items, hooks) {
  const { scene, asm } = E;
  PALETTE.green = ['#6bc48e', '#2e8b57', '#1e5e3a'];
  PALETTE.amber = ['#f5c96b', '#d99b26', '#9e6d14'];

  const root = new THREE.Group(); scene.add(root);
  const brd = part(root, box(6.8, 5.2, 0.006), { tone: 'lo', pal: 'board', pos: [0, 0, -0.14], name: 'Board' });
  brd.userData.noEdge = true;

  const A = axes(root, { x: [-3, 3], y: [-2.5, 2.5], size: [6.0, 4.6], at: [0, 0, 0], ticks: { x: 3, y: 2 }, grid: true,
    names: { x: '<i>x</i>', y: '<i>y</i>' } });

  const g = asm('sandbox', root, { title: 'The 2×2 matrix playground', sub: 'drag Aî, Aĵ or any probe vector, or type your own matrix entries' });

  // Transformed grid via lattice()
  const lat = lattice(g, (u, v) => M.apply(params, [u, v]), { axes: A, x: [-2, 2], y: [-2, 2], n: [4, 4], samples: 16, color: '#9c9ca2', opacity: 0.65, name: 'Transformed grid' });

  // Unit square parallelogram mesh
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(4 * 3);
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const pMat = shadeMat('amber', { opacity: 0.28 });
  pMat.side = THREE.DoubleSide;
  const paraMesh = part(g, pGeo, { pal: 'amber', tone: 'lo', name: 'Transformed unit square', mat: pMat });
  paraMesh.userData.noEdge = true; paraMesh.renderOrder = 1;
  function updatePara(m) {
    const corners = M.unitSquareCorners(m);
    for (let i = 0; i < 4; i++) A.to(corners[i][0], corners[i][1], 0.01).toArray(pPos, 3 * i);
    pGeo.attributes.position.needsUpdate = true;
    pGeo.computeVertexNormals();
  }
  updatePara(params);

  // Eigenvector axes (shown when eigenvalues are real)
  const eigLine1 = curve(g, s => [s * 2.5, 0], { t: [-1, 1], axes: A, samples: 8, radius: 0.012, color: 'green', name: 'Eigenvector 1 axis' });
  const eigLine2 = curve(g, s => [0, s * 2.5], { t: [-1, 1], axes: A, samples: 8, radius: 0.012, color: 'green', name: 'Eigenvector 2 axis' });

  // Basis column vectors Aî = (a, c) and Aĵ = (b, d)
  const vI = vector(g, [0, 0], [params.a, params.c], { axes: A, color: 'red', label: '<i>A</i><b>î</b>', name: 'First column Aî' });
  const vJ = vector(g, [0, 0], [params.b, params.d], { axes: A, color: 'blue', label: '<i>A</i><b>ĵ</b>', name: 'Second column Aĵ' });

  draggable(vI.object, {
    axes: A,
    constrain: ([x, y]) => [Math.max(-2.5, Math.min(2.5, x)), Math.max(-2.2, Math.min(2.2, y))],
    onDrag: ([x, y]) => hooks?.setParams({ a: +x.toFixed(2), c: +y.toFixed(2) }),
  });
  draggable(vJ.object, {
    axes: A,
    constrain: ([x, y]) => [Math.max(-2.5, Math.min(2.5, x)), Math.max(-2.2, Math.min(2.2, y))],
    onDrag: ([x, y]) => hooks?.setParams({ b: +x.toFixed(2), d: +y.toFixed(2) }),
  });

  // Constructive user-placed probe vectors u_k (amber input dot + green image vector A u_k)
  const probes = items.map((it, idx) => {
    const inDot = dot(g, 0.08, 'amber', `Input vector u_${idx + 1}`);
    setPos(inDot, A.to(it.x, it.y, 0.04));
    const outVec = vector(g, [0, 0], M.apply(params, [it.x, it.y]), { axes: A, color: 'green', name: `Image vector A u_${idx + 1}` });
    draggable(inDot, {
      axes: A,
      constrain: ([x, y]) => [Math.max(-2.4, Math.min(2.4, x)), Math.max(-2.0, Math.min(2.0, y)), 0.04],
      onDrag: ([x, y]) => hooks?.updateItem(idx, { x: +x.toFixed(2), y: +y.toFixed(2) }),
    });
    return { inDot, outVec };
  });

  function update(s) {
    const m = { a: s.a, b: s.b, c: s.c, d: s.d };
    lat.update((u, v) => M.apply(m, [u, v]));
    updatePara(m);
    vI.set([0, 0], [m.a, m.c]);
    vJ.set([0, 0], [m.b, m.d]);

    const eig = s.eig;
    eigLine1.object.visible = eig.real && eig.dirs.length >= 1;
    eigLine2.object.visible = eig.real && eig.dirs.length >= 2;
    if (eig.real && eig.dirs[0]) eigLine1.update(u => [u * 2.4 * eig.dirs[0].v[0], u * 2.4 * eig.dirs[0].v[1]]);
    if (eig.real && eig.dirs[1]) eigLine2.update(u => [u * 2.4 * eig.dirs[1].v[0], u * 2.4 * eig.dirs[1].v[1]]);

    s.items.forEach((it, i) => {
      if (!probes[i]) return;
      setPos(probes[i].inDot, A.to(it.x, it.y, 0.04));
      probes[i].outVec.set([0, 0], M.apply(m, [it.x, it.y]));
    });
  }

  return { update, labels: [...A.labels, ...vI.labels, ...vJ.labels] };
}
