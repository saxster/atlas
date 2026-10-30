// The physics atlas: its chapters in order and the links its pages carry. Read by the book (main.js passes it to
// startBook), by tools/ and by equations/build.mjs, so a new chapter is added here once.
export const SUBJECT = {
  id: 'physics',
  name: 'Atlas of Physics',
  chapters: ['kinematics', 'newton', 'circular', 'energy', 'momentum', 'oscillations', 'rotation', 'fluids',
    'electrostatics', 'gauss', 'potential', 'capacitors', 'circuits', 'magnetism', 'induction'],
  // extra links in each chapter's top bar, relative to the chapter's directory
  links: [{ label: 'Equations', href: '../equations/', cls: 'eqlink' }],
  source: 'https://github.com/nathanliow/atlas-of-physics',
  cover: 'oscillations',   // its picture on the root shelf
  cards: { oscillations: { alt: 'A block on a spring drawing its own cosine on a paper strip' } },
  contents: false,   // physics/index.html is made by hand: its sections follow the AP courses
};
