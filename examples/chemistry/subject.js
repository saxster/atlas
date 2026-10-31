// The Chemistry atlas: its chapters (books: engine/book.js) and figures (machines and explorers), in order.
// Read by the pages, by tools/ (chapters.mjs) and by the contents page, so a new one is added here once.
import { XREFS } from '../xrefs.js';

export const SUBJECT = {
  id: 'chemistry',
  name: 'Atlas of Chemistry',
  blurb: 'orbitals, molecules, reactions and energy',
  chapters: ['vsepr', 'orbitals'],
  figures: ['kinetics', 'titration', 'arrhenius'],
  hero: 'Chemistry, taken apart.',
  tagline: 'Orbitals, molecules, buffers and reaction barriers built from first principles',
  // contents-page cards (tools/site.mjs); page: the book page tools/cards.mjs draws the picture from
  cards: {
    vsepr: { section: 'Structure & bonding', title: 'The shapes of molecules', sub: 'electron pairs keep their distance', pages: 8, page: 6,
      alt: 'Methane, ammonia and water side by side at their measured bond angles' },
    orbitals: { section: 'Structure & bonding', title: 'Atomic orbitals', sub: 'probability clouds, radial shells and n − 1 nodes', pages: 6, page: 3,
      alt: 'Hydrogen 1s, 2s, 2p and 3d probability clouds colored by phase sign alongside radial distribution curves and nodal surfaces' },
    kinetics: { section: 'Kinetics and equilibrium', title: 'Forward, back and half-life', sub: 'reversible reactions and exponential decay', grammar: 'explorer',
      alt: 'A reaction vessel where blue reactant A and red product B interconvert alongside exponential relaxation curves' },
    titration: { section: 'Acids, bases & buffers', title: 'The buffer flat and the equivalence cliff', sub: 'weak-acid titration, Henderson–Hasselbalch and indicator jump', grammar: 'machine',
      alt: 'A burette dripping NaOH into a flask of weak acid HA and conjugate base A⁻ alongside the pH titration curve and equivalence cliff' },
    arrhenius: { section: 'Kinetics and equilibrium', title: 'Over the barrier: temperature and catalysts', sub: 'activation energy, the Maxwell–Boltzmann tail and Arrhenius rate', grammar: 'explorer',
      alt: 'A 3D potential energy barrier U(x) with colliding molecules and a catalyzed pathway paired with the Maxwell–Boltzmann high-energy tail' },
  },
  links: [],
  source: 'https://github.com/saxster/atlas',
  xrefs: XREFS,   // "Compare" notes between pages, across subjects (examples/xrefs.js)
};
