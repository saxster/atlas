// The Biology atlas: its chapters (books: engine/book.js) and figures (machines and explorers), in order.
// Read by the pages, by tools/ (chapters.mjs) and by the contents page, so a new one is added here once.
import { XREFS } from '../xrefs.js';

export const SUBJECT = {
  id: 'biology',
  name: 'Atlas of Biology',
  blurb: 'cells, molecules and living machines',
  figures: ['diffusion', 'growth', 'enzyme'],
  cover: 'diffusion',
  hero: 'Biology, taken apart.',
  tagline: 'Living machines and random motion, driven by physics and chemistry',
  // contents-page cards (tools/site.mjs); at: the tour time tools/cards.mjs draws the picture from (default: the end)
  cards: {
    diffusion: { section: 'Cells and transport', title: 'Across the membrane', sub: 'random walks balance without a pump', grammar: 'explorer',
      alt: 'A cell membrane with channels between outside and inside, solute molecules bouncing through to balance both sides' },
    growth: { section: 'Populations', title: 'One cell to a crowded dish', sub: 'doubling meets a limit', grammar: 'machine', at: 20.5,
      alt: 'A Petri dish filling with dividing bacteria alongside the S-shaped logistic curve and the runaway exponential' },
    enzyme: { section: 'Biochemistry', title: 'Lock, key and saturation', sub: 'how active-site turnover caps reaction speed', grammar: 'machine', at: 19.0,
      alt: 'A globular blue enzyme with a catalytic cleft surrounded by amber substrate and green product beads, alongside the Michaelis–Menten saturation curve' },
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
  xrefs: XREFS,
};
