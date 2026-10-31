// The Economics atlas: its chapters (books: engine/book.js) and figures (machines and explorers), in order.
// Read by the pages, by tools/ (chapters.mjs) and by the contents page, so a new one is added here once.
import { XREFS } from '../xrefs.js';

export const SUBJECT = {
  id: 'economics',
  name: 'Atlas of Economics',
  blurb: 'money, markets and growth',
  figures: ['compound', 'market', 'ppf', 'multiplier'],
  hero: 'Economics, taken apart.',
  tagline: 'Money and markets as machines you can step through',
  // contents-page cards (tools/site.mjs); at: the tour time tools/cards.mjs draws the picture from (default: the end)
  cards: {
    compound: { section: 'Money and time', title: '₹1,000 a month at 8 %', sub: 'how interest earns interest', grammar: 'machine', at: 26.4,
      alt: 'Twenty columns of coins, one per year, each taller than the last, with the interest part stacked on the savings' },
    market: { section: 'Microeconomics', title: 'Where supply meets demand', sub: 'marginal cost, market clearing and surplus', grammar: 'machine', at: 12.0,
      alt: 'Total Cost C(Q) on the left linked to Supply = Marginal Cost crossing Demand at Q* = 40, P* = ₹50 with shaded consumer and producer surplus' },
    ppf: { section: 'Trade and production', title: 'Why trade helps even when one side is better at everything', sub: 'opportunity cost, the PPF and comparative advantage', grammar: 'machine', at: 15.0,
      alt: 'Two solo Production Possibility Frontiers linked to a kinked joint World PPF at (60 cloth, 100 grain) with post-trade consumption outside both solo frontiers' },
    multiplier: { section: 'Macroeconomics', title: 'How ₹100 of spending becomes ₹400 of income', sub: 're-spending rounds, savings leakages and the Keynesian Cross', grammar: 'machine', at: 14.0,
      alt: 'Geometric cascade of spending rounds ΔG·c^k beside a Keynesian Cross staircase converging to 4× total income at ₹400 Cr' },
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
  xrefs: XREFS,   // "Compare" notes between pages, across subjects (examples/xrefs.js)
};
