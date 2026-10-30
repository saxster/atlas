// "See the real molecule": a measured structure (XYZ text, ångström) in 3Dmol.js (BSD-3-Clause, github.com/3dmol/3Dmol.js),
// loaded from jsDelivr only when a reader asks, so a page that never opens one pays nothing. Offline, it says so.
// showMolecule(el, xyz, { background }) → Promise<{ viewer, source (the XYZ comment line), destroy() }>
const SRC = 'https://cdn.jsdelivr.net/npm/3dmol@2.5.5/build/3Dmol-min.js';
let loading = null;
export function load3Dmol() {
  if (window.$3Dmol) return Promise.resolve(window.$3Dmol);
  return loading ||= new Promise((ok, fail) => {
    const s = document.createElement('script'); s.src = SRC; s.crossOrigin = 'anonymous';
    s.onload = () => ok(window.$3Dmol); s.onerror = () => { loading = null; fail(new Error('3Dmol.js could not be loaded')); };
    document.head.appendChild(s);
  });
}

// colours by element in the atlas's restrained palette: carbon ink, hydrogen paper, nitrogen blue, oxygen red, sulfur ochre
const COLOURS = { C: '#4a4a50', H: '#f5f5f2', N: '#5b86d6', O: '#e5484d', S: '#d4a35f' };
export async function showMolecule(el, xyz, { background = '#fbfbfa' } = {}) {
  const $3Dmol = await load3Dmol();
  const viewer = $3Dmol.createViewer(el, { backgroundColor: background, antialias: true });
  const model = viewer.addModel(xyz, 'xyz');
  const scheme = { prop: 'elem', map: COLOURS };
  model.setStyle({}, { stick: { radius: 0.11, colorscheme: scheme }, sphere: { scale: 0.26, colorscheme: scheme } });
  // the heavy atoms named; hydrogens are the small white balls, as in every model kit
  for (const a of model.selectedAtoms({ elem: 'H', invert: true }))
    viewer.addLabel(a.elem, { position: { x: a.x, y: a.y, z: a.z }, fontColor: '#ffffff', backgroundOpacity: 0, fontSize: 15, alignment: 'center', inFront: true });
  // tipped towards the reader, so no bond points straight out of the screen and the shape reads as 3D from the start
  viewer.zoomTo(); viewer.rotate(-22, 'x'); viewer.rotate(28, 'y'); viewer.zoom(1.6); viewer.render();
  viewer.spin('y', 0.4);
  // the XYZ comment line says where the coordinates come from
  const source = xyz.split('\n')[1]?.trim();
  return { viewer, source, destroy() { viewer.spin(false); viewer.clear(); el.innerHTML = ''; } };
}
