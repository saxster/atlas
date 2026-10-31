// The Chemistry atlas: its chapters (books: engine/book.js) and figures (machines and explorers), in order.
// Read by the pages, by tools/ (chapters.mjs) and by the contents page, so a new one is added here once.
import { XREFS } from '../xrefs.js';

export const SUBJECT = {
  id: 'chemistry',
  name: 'Atlas of Chemistry',
  blurb: 'molecules, reactions and energy',
  chapters: ['vsepr'],
  figures: ['kinetics'],
  hero: 'Chemistry, taken apart.',
  tagline: 'Molecules built from their measured shapes',
  // contents-page cards (tools/site.mjs); page: the book page tools/cards.mjs draws the picture from
  cards: {
    vsepr: { section: 'Bonding', title: 'The shapes of molecules', sub: 'electron pairs keep their distance', pages: 8, page: 6,
      alt: 'Methane, ammonia and water side by side at their measured bond angles' },
    kinetics: { section: 'Kinetics and equilibrium', title: 'Forward, back and half-life', sub: 'reversible reactions and exponential decay', grammar: 'explorer',
      alt: 'A reaction vessel where blue reactant A and red product B interconvert alongside exponential relaxation curves' },
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
  xrefs: XREFS,   // \"Compare\" notes between pages, across subjects (examples/xrefs.js)
};
