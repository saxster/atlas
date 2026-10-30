// The Chemistry atlas: its chapters (books: engine/book.js) and figures (machines and explorers), in order.
// Read by the pages, by tools/ (chapters.mjs) and by the contents page, so a new one is added here once.
export const SUBJECT = {
  id: 'chemistry',
  name: 'Atlas of Chemistry',
  blurb: 'molecules, reactions and energy',
  chapters: ['vsepr'],
  hero: 'Chemistry, taken apart.',
  tagline: 'Molecules built from their measured shapes',
  // contents-page cards (tools/site.mjs); page: the book page tools/cards.mjs draws the picture from
  cards: {
    vsepr: { section: 'Bonding', title: 'The shapes of molecules', sub: 'electron pairs keep their distance', pages: 8, page: 6,
      alt: 'Methane, ammonia and water side by side at their measured bond angles' },
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
};
