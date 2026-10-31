// The Mathematics atlas: its chapters (books: engine/book.js) and figures (machines and explorers), in order.
// Read by the pages, by tools/ (chapters.mjs) and by the contents page, so a new one is added here once.
import { XREFS } from '../xrefs.js';

export const SUBJECT = {
  id: 'maths',
  name: 'Atlas of Mathematics',
  blurb: 'trigonometry, calculus and linear algebra',
  chapters: ['unit-circle', 'calculus', 'linear-algebra'],
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
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
  xrefs: XREFS,   // \"Compare\" notes between pages, across subjects (examples/xrefs.js)
};
