// The Statistics atlas: its chapters (books: engine/book.js) and figures (machines and explorers), in order.
// Read by the pages, by tools/ (chapters.mjs) and by the contents page, so a new one is added here once.
import { XREFS } from '../xrefs.js';

export const SUBJECT = {
  id: 'statistics',
  name: 'Atlas of Statistics',
  blurb: 'probability, sampling and inference',
  figures: ['galton', 'error'],
  hero: 'Statistics, taken apart.',
  tagline: 'Chance as experiments you can run, and try to break',
  // contents-page cards (tools/site.mjs); at: the tour time tools/cards.mjs draws the picture from (default: the end)
  cards: {
    galton: { section: 'Probability', title: 'Where 500 balls land', sub: 'coin tosses add up to a bell', grammar: 'explorer',
      alt: 'A board of pegs with balls piled in slots beneath it, the pile following a bell curve' },
    error: { section: 'Inference and error', title: 'Repeated readings and the bell of error', sub: 'random spread, systematic bias and σ / √n', grammar: 'explorer',
      alt: 'Repeated measurements piling into histogram columns beneath a normal bell curve around μ = 100.0 mm with a ±σ/√k standard-error bar' },
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
  xrefs: XREFS,   // \"Compare\" notes between pages, across subjects (examples/xrefs.js)
};
