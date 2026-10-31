// The Mathematics atlas: its chapters (books: engine/book.js) and figures (machines, explorers and sandboxes), in order.
// Read by the pages, by tools/ (chapters.mjs) and by the contents page, so a new one is added here once.
import { XREFS } from '../xrefs.js';

export const SUBJECT = {
  id: 'maths',
  name: 'Atlas of Mathematics',
  blurb: 'trigonometry, calculus, linear algebra, differential equations and Fourier series',
  chapters: ['unit-circle', 'calculus', 'linear-algebra', 'differential-equations', 'fourier', 'multivariable'],
  figures: ['matrix-sandbox'],
  hero: 'Mathematics, taken apart.',
  tagline: 'Each idea as a figure you can turn over and take apart',
  // contents-page cards (tools/site.mjs); page: the book page tools/cards.mjs draws the picture from
  cards: {
    'unit-circle': { section: 'Trigonometry', title: 'The unit circle', sub: 'sine and cosine as shadows', pages: 8, page: 1,
      alt: 'A point on a circle lit from the side, its shadow on a screen showing its height, the sine' },
    'calculus': { section: 'Calculus', title: 'Slope and area', sub: 'derivatives, Riemann sums and the Fundamental Theorem', pages: 6, page: 3,
      alt: 'Blue midpoint Riemann rectangles under the red parabola f(x) = ½x² from x = 0 to 3' },
    'linear-algebra': { section: 'Linear algebra', title: 'Linear transformations', sub: 'matrices as grid moves, area scale and eigenvectors', pages: 6, page: 2,
      alt: 'A 2D coordinate grid and unit square stretched into a parallelogram of area det(A) = ad − bc by basis columns Aî and Aĵ' },
    'matrix-sandbox': { section: 'Linear algebra', title: 'The 2×2 matrix sandbox', sub: 'drag basis columns, type a matrix and test probes', grammar: 'sandbox', at: 2.0,
      alt: 'Interactive 2×2 matrix board with draggable red Aî and blue Aĵ basis columns, amber determinant parallelogram, and green eigenvector lines' },
    'differential-equations': { section: 'Differential equations and waves', title: 'Differential equations', sub: 'slope fields, phase portraits, spirals and saddles', pages: 6, page: 0,
      alt: 'A 2D slope field of arrows for dy/dt = y − t with a red integral curve threading through a draggable initial value dot' },
    'fourier': { section: 'Differential equations and waves', title: 'Fourier series', sub: 'spinning epicycles, spectrum and the Gibbs ears', pages: 6, page: 1,
      alt: 'Five chained rotating epicycle circles drawing a square wave alongside its target step function' },
    'multivariable': { section: 'Multivariable and vector calculus', title: 'Multivariable calculus', sub: 'surfaces, gradients, saddles, divergence and curl', pages: 6, page: 0,
      alt: 'A 3D blue paraboloid dome sliced by a constant-y plane showing the red partial-derivative parabola and amber tangent vector' },
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
  xrefs: XREFS,   // "Compare" notes between pages, across subjects (examples/xrefs.js)
};
