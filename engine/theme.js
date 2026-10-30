// A host page's colours as a theme for createStage (see parts.js applyTheme). Each name is a CSS custom property,
// read where the figure sits and resolved to #rrggbb by painting one pixel, so any CSS colour works (display-p3,
// color-mix, a var of a var). The defaults are the kym books' names.
export const KYM = { sheet: '--sheet', ink: '--ink', red: '--proton', blue: '--electron', green: '--green', ochre: '--neutron' };

export function readTheme(el = document.documentElement, names = KYM) {
  const cs = getComputedStyle(el), g = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const hex = v => {
    if (!v) return null;
    g.fillStyle = '#000'; g.fillStyle = v; g.clearRect(0, 0, 1, 1); g.fillRect(0, 0, 1, 1);
    const [r, gg, b] = g.getImageData(0, 0, 1, 1).data;
    return '#' + [r, gg, b].map(x => x.toString(16).padStart(2, '0')).join('');
  };
  const t = {};
  for (const [k, prop] of Object.entries(names)) { const v = hex(cs.getPropertyValue(prop).trim()); if (v) t[k] = v; }
  return t.sheet && t.ink ? t : null;          // without paper and ink there is no theme to follow
}
