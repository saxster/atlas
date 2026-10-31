// The minimal examples: one small figure per grammar, built from the building blocks (engine/prims.js). `atlas new`
// copies them as the starting point for a new figure, so each stays short and working.
import { XREFS } from '../xrefs.js';

export const SUBJECT = {
  id: 'minimal',
  name: 'Minimal examples',
  blurb: 'one small figure per grammar, built from the building blocks',
  chapters: ['book'],
  figures: ['machine', 'explorer', 'sandbox'],
  hero: 'Four figures, about fifty lines each.',
  tagline: 'A book, a machine, an explorer and a sandbox, each built from the building blocks',
  // contents-page cards (tools/site.mjs); page: the book page, at: the tour time tools/cards.mjs draws the picture from
  cards: {
    book: { section: 'Book', title: 'The derivative is the slope', sub: 'a tangent sliding along a cubic', pages: 3, page: 1,
      alt: 'The curve y = x³/3 − x on axes, with a red tangent line touching it and run and rise arrows showing its slope' },
    machine: { section: 'Machine', title: 'Half-lives', sub: '200 nuclei, halving each step', grammar: 'machine', at: 9,
      alt: 'A grid of 200 beads on a table, some red and still radioactive, the rest grey and sunk, in front of a graph of the count halving' },
    explorer: { section: 'Explorer', title: 'How far does it fly?', sub: 'launch angle and range', grammar: 'explorer', at: 2.6,
      alt: 'A ball’s arc over the ground on distance and height axes, with its velocity arrow' },
    sandbox: { section: 'Sandbox', title: 'Sculpt the electric field', sub: 'place and drag charges in 3D', grammar: 'sandbox', at: 2.5,
      alt: 'Positive and negative charges on a 2D grid with electric field arrows and a draggable probe' },
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
  xrefs: XREFS,
};
