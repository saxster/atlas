// The physics atlas: its chapters in order and the links its pages carry. Read by the book (main.js passes it to
// startBook), by tools/ and by equations/build.mjs, so a new chapter is added here once.
import { XREFS } from '../xrefs.js';

export const SUBJECT = {
  id: 'physics',
  name: 'Atlas of Physics',
  chapters: ['kinematics', 'newton', 'circular', 'energy', 'momentum', 'oscillations', 'rotation', 'fluids',
    'electrostatics', 'gauss', 'potential', 'capacitors', 'circuits', 'magnetism', 'induction'],
  figures: ['optics-bench'],
  // extra links in each chapter's top bar, relative to the chapter's directory
  links: [{ label: 'Equations', href: '../equations/', cls: 'eqlink' }],
  source: 'https://github.com/nathanliow/atlas-of-physics',
  xrefs: XREFS,   // "Compare" notes between pages, across subjects (examples/xrefs.js)
  cover: 'oscillations',   // its picture on the root shelf
  cards: {
    oscillations: { alt: 'A block on a spring drawing its own cosine on a paper strip' },
    'optics-bench': { section: 'Optics · 2D Blueprint to 3D', title: 'From 2D ray diagram to 3D optical bench', sub: 'thin-lens principal rays, 270° lens revolution and magnification', grammar: 'machine', at: 5.5,
      alt: 'A 2D principal-ray diagram that revolves into a 3D cutaway biconvex glass lens and brass barrel' },
  },
  contents: false,   // physics/index.html is made by hand: its sections follow the AP courses
};
