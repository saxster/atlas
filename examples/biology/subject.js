// The Biology atlas: its chapters (books: engine/book.js) and figures (machines and explorers), in order.
// Read by the pages, by tools/ (chapters.mjs) and by the contents page, so a new one is added here once.
import { XREFS } from '../xrefs.js';

export const SUBJECT = {
  id: 'biology',
  name: 'Atlas of Biology',
  blurb: 'cells, molecules and living machines',
  figures: ['diffusion', 'growth', 'enzyme', 'action-potential', 'central-dogma', 'lotka-volterra'],
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
    'action-potential': { section: 'Cells and transport', title: 'Na⁺ rush and K⁺ reset', sub: 'how voltage-gated pores fire a nerve impulse', grammar: 'machine', at: 18.0,
      alt: 'A phospholipid bilayer with voltage-gated Na+ and K+ channels alongside the Hodgkin–Huxley action potential spike and conductance curves' },
    'central-dogma': { section: 'Genetics and information', title: 'Three letters a codon', sub: 'DNA to mRNA to polypeptide on the ribosome', grammar: 'machine', at: 18.5,
      alt: 'A DNA double helix transcribed into a 5-codon mRNA strand decoded by a 3D ribosome and tRNA adaptors into Met–Phe–Gly–Asp' },
    'lotka-volterra': { section: 'Populations', title: 'Foxes, rabbits and the loop of life', sub: 'predator–prey waves and Volterra’s principle', grammar: 'explorer',
      alt: 'A phase portrait with a closed counterclockwise orbit around (R*, F*) alongside coupled prey and predator oscillation curves' },
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
  xrefs: XREFS,
};
