// The Mathematics atlas: its chapters (books: engine/book.js) and figures (machines and explorers), in order.
// Read by the pages, by tools/ (chapters.mjs) and by the contents page, so a new one is added here once.
export const SUBJECT = {
  id: 'maths',
  name: 'Atlas of Mathematics',
  blurb: 'trigonometry, calculus and linear algebra',
  chapters: ['unit-circle'],
  hero: 'Mathematics, taken apart.',
  tagline: 'Each idea as a figure you can turn over and take apart',
  // contents-page cards (tools/site.mjs); page: the book page tools/cards.mjs draws the picture from
  cards: {
    'unit-circle': { section: 'Trigonometry', title: 'The unit circle', sub: 'sine and cosine as shadows', pages: 8, page: 1,
      alt: 'A point on a circle lit from the side, its shadow on a screen showing its height, the sine' },
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
};
