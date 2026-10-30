// The Economics atlas: its chapters (books: engine/book.js) and figures (machines and explorers), in order.
// Read by the pages, by tools/ (chapters.mjs) and by the contents page, so a new one is added here once.
export const SUBJECT = {
  id: 'economics',
  name: 'Atlas of Economics',
  blurb: 'money, markets and growth',
  figures: ['compound'],
  hero: 'Economics, taken apart.',
  tagline: 'Money and markets as machines you can step through',
  // contents-page cards (tools/site.mjs); at: the tour time tools/cards.mjs draws the picture from (default: the end)
  cards: {
    compound: { section: 'Money and time', title: '₹1,000 a month at 8 %', sub: 'how interest earns interest', grammar: 'machine', at: 26.4,
      alt: 'Twenty columns of coins, one per year, each taller than the last, with the interest part stacked on the savings' },
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
};
