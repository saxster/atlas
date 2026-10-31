// Prose, breakdowns, and SVG charts for Chapter 6: Multivariable Calculus (6 pages).
import * as M from './model.js';
import { at } from './world.js';

export const PAGES = [
  {
    kicker: 'Chapter 6 · Multivariable calculus',
    title: 'One variable at a time: slicing a surface',
    sub: 'A function z = f(x, y) is a landscape; freezing y = y₀ cuts a single-variable curve whose slope is ∂f/∂x',
    fig: 'The paraboloid z = 2 − ½(x² + y²) cut by a constant-y slice',
    alt: '3D blue paraboloid dome with a red parabola slice at y = y₀ and an amber tangent vector showing ∂f/∂x = −x₀.',
    cam: { target: at(0, 0, 1.0, 0), az: 33, el: 22, dist: 15.5 },
    lit: 'domeSlice',
    parts: ['domeSlice'],
    look: {},
    body: `
      <p class="lede">When height <i>z</i> = <i>f</i>(<i>x</i>, <i>y</i>) depends on two coordinates, the slope at a point depends on which direction you walk. A <b>partial derivative</b> freezes one coordinate and differentiates with respect to the other:</p>
      <div class="eq">∂<i>f</i> / ∂<i>x</i> = −<i>x</i>, &nbsp;&nbsp; ∂<i>f</i> / ∂<i>y</i> = −<i>y</i> &nbsp;&nbsp;for <i>f</i>(<i>x</i>, <i>y</i>) = 2 − ½(<i>x</i>² + <i>y</i>²)</div>
      <p>Geometrically, holding <i>y</i> = <i>y</i>₀ fixed slices the 3D dome with a vertical wall parallel to the <i>xz</i>-plane. The intersection is an ordinary 1D curve (drawn in red), and its tangent slope is ∂<i>f</i>/∂<i>x</i>.</p>
      <p><b>Drag the red point across the 3D dome</b> to slide the slice and watch the amber tangent vector tilt.</p>
      <p class="live" data-live="slice"></p>`,
  },
  {
    kicker: '6.1 · Linear approximation',
    title: 'Two tangent vectors span the tangent plane',
    sub: 'Zoom in on any smooth surface and it flattens into the plane z = z₀ + f_x(x − x₀) + f_y(y − y₀)',
    fig: 'Tangent plane patch spanned by t_x = (1, 0, f_x) and t_y = (0, 1, f_y), with normal n',
    alt: 'Amber tangent plane touching the blue paraboloid at (0.8, 0.6), with red x-tangent, green y-tangent, and blue normal vector.',
    cam: { target: at(1, 0, 1.1, 0), az: 33, el: 22, dist: 15.5 },
    lit: 'tangentPlane',
    parts: ['tangentPlane'],
    look: {},
    body: `
      <p class="lede">In single-variable calculus, a curve looks like its tangent line near the point of contact. In two variables, the two slice tangents <b>t</b><sub><i>x</i></sub> = (1, 0, <i>f<sub>x</sub></i>) and <b>t</b><sub><i>y</i></sub> = (0, 1, <i>f<sub>y</sub></i>) span the <b>tangent plane</b>:</p>
      <div class="eq"><i>z</i> ≈ <i>f</i>(<i>x</i>₀, <i>y</i>₀) + <i>f<sub>x</sub></i>(<i>x</i>₀, <i>y</i>₀)(<i>x</i> − <i>x</i>₀) + <i>f<sub>y</sub></i>(<i>x</i>₀, <i>y</i>₀)(<i>y</i> − <i>y</i>₀)</div>
      <p>Their cross product <b>t</b><sub><i>x</i></sub> × <b>t</b><sub><i>y</i></sub> gives the upward <b>normal vector</b> perpendicular to the surface:</p>
      <div class="eq"><b>n</b> = (−<i>f<sub>x</sub></i>, −<i>f<sub>y</sub></i>, 1)</div>`,
  },
  {
    kicker: '6.2 · The gradient vector',
    title: 'Steepest ascent is perpendicular to the contours',
    sub: 'Packaging the partials into ∇f = (f_x, f_y) gives a compass arrow pointing straight uphill',
    fig: 'Level contours f(x, y) = c and the inward gradient field ∇f = (−x, −y)',
    alt: 'Concentric circular level curves with red gradient vector pointing straight inward and green contour tangent perpendicular to it.',
    cam: { target: at(2, 0, 2.0, 0), az: 0, el: 5, dist: 16.2 },
    lit: 'gradContours',
    parts: ['gradContours'],
    look: {},
    body: `
      <p class="lede">Pack the two partial derivatives into a single 2D vector in the input plane and you get the <b>gradient</b> ∇<i>f</i> = (∂<i>f</i>/∂<i>x</i>, ∂<i>f</i>/∂<i>y</i>). By the multivariable chain rule, the rate of climb along any unit direction <b>u</b> is the dot product:</p>
      <div class="eq"><i>D</i><sub><b>u</b></sub><i>f</i> = ∇<i>f</i> · <b>u</b> = |∇<i>f</i>| cos θ</div>
      <p>Two consequences jump right out of cos θ:</p>
      <ul class="rules">
        <li><b>Steepest ascent (θ = 0°):</b> Walking in the direction of ∇<i>f</i> gives the largest possible slope, |∇<i>f</i>|.</li>
        <li><b>Level contours (θ = 90°):</b> Walking along a contour line where <i>f</i> is constant means <i>D</i><sub><b>u</b></sub><i>f</i> = 0, so <b>∇<i>f</i> is always perpendicular to every level curve</b>.</li>
      </ul>
      <p class="live" data-live="grad"></p>`,
  },
  {
    kicker: '6.3 · Maxima, minima and saddles',
    title: 'Flat in every direction, yet neither top nor bottom',
    sub: 'At a critical point where ∇f = 0, the Hessian determinant D = f_xx f_yy − f_xy² decides whether curvatures agree or clash',
    fig: 'The hyperbolic paraboloid h(x, y) = ½(x² − y²) curving up along x and down along y',
    alt: '3D saddle surface with a red upward parabola along the x-axis and a green downward parabola along the y-axis meeting at the amber saddle point.',
    cam: { target: at(3, 0, 1.0, 0), az: 33, el: 20, dist: 15.5 },
    lit: 'saddleSurf',
    parts: ['saddleSurf'],
    look: {},
    body: `
      <p class="lede">At a peak, valley, or mountain pass, the tangent plane is horizontal: ∇<i>f</i> = (0, 0). To tell them apart, look at the 2×2 <b>Hessian matrix</b> of second derivatives and its determinant:</p>
      <div class="eq"><i>D</i> = det(<i>H</i>) = <i>f<sub>xx</sub></i> <i>f<sub>yy</sub></i> − (<i>f<sub>xy</sub></i>)²</div>
      <p>On the hyperbolic paraboloid <i>h</i>(<i>x</i>, <i>y</i>) = ½(<i>x</i>² − <i>y</i>²), the red slice along <i>x</i> curves upward (<i>h<sub>xx</sub></i> = +1) while the green slice along <i>y</i> curves downward (<i>h<sub>yy</sub></i> = −1). Because the principal curvatures have opposite signs, <i>D</i> = (1)(−1) − 0 = <b>−1 &lt; 0</b>: a <b>saddle point</b>.</p>`,
  },
  {
    kicker: '6.4 · Divergence and flux',
    title: 'Measuring how strongly a vector field expands',
    sub: 'Divergence ∇·F = ∂F_x/∂x + ∂F_y/∂y is the outward flux per unit area',
    fig: 'Outward flux of F(x, y) = (x, y) across a circle of radius R = 1.25',
    alt: 'Expanding vector field F = (x, y) with a red circular boundary and eight amber outward normal flux arrows.',
    cam: { target: at(4, 0, 2.0, 0), az: 0, el: 5, dist: 16.2 },
    lit: 'divField',
    parts: ['divField'],
    look: {},
    body: `
      <p class="lede">For a vector field <b>F</b>(<i>x</i>, <i>y</i>) = (<i>F<sub>x</sub></i>, <i>F<sub>y</sub></i>), the <b>divergence</b> adds the rate of stretching in <i>x</i> to the rate of stretching in <i>y</i>:</p>
      <div class="eq">∇ · <b>F</b> = ∂<i>F<sub>x</sub></i> / ∂<i>x</i> + ∂<i>F<sub>y</sub></i> / ∂<i>y</i></div>
      <p>By the <b>Divergence Theorem</b>, the total outward flux crossing a closed boundary loop equals the integral of ∇ · <b>F</b> over the interior:</p>
      <div class="eq">∮ <b>F</b> · <b>n</b> d<i>s</i> = ∬ (∇ · <b>F</b>) d<i>A</i></div>
      <p>For <b>F</b> = (<i>x</i>, <i>y</i>), ∇ · <b>F</b> = 1 + 1 = 2 everywhere, so the outward flux through a disk of radius <i>R</i> is simply 2π<i>R</i>².</p>`,
  },
  {
    kicker: '6.5 · Curl and Green’s theorem',
    title: 'Microscopic spin adds up to macroscopic circulation',
    sub: 'A tiny paddlewheel placed in G(x, y) = (−y, x) turns at half the scalar curl ∂G_y/∂x − ∂G_x/∂y',
    fig: 'Vortex field G = (−y, x) spinning a central paddlewheel inside a circulation loop',
    alt: 'Rotational vector field G = (−y, x) with a blue circular loop and a spinning red paddlewheel at the origin.',
    cam: { target: at(5, 0, 2.0, 0), az: 0, el: 5, dist: 16.2 },
    lit: 'curlField',
    parts: ['curlField'],
    look: {},
    body: `
      <p class="lede">Whereas divergence measures expansion across a boundary, <b>curl</b> measures rotation along it:</p>
      <div class="eq">(∇ × <b>G</b>)<sub><i>z</i></sub> = ∂<i>G<sub>y</sub></i> / ∂<i>x</i> − ∂<i>G<sub>x</sub></i> / ∂<i>y</i></div>
      <p>Drop a tiny red paddlewheel into the vortex field <b>G</b> = (−<i>y</i>, <i>x</i>): because the flow pushes harder on one side than the other, the wheel spins counter-clockwise with curl 1 − (−1) = <b>+2</b>.</p>
      <p><b>Green's theorem</b> (Stokes' theorem in the plane) states that adding up all those microscopic spins inside a region equals the macroscopic <b>circulation</b> around its rim: ∮ <b>G</b> · d<b>r</b> = ∬ (∇ × <b>G</b>)<sub><i>z</i></sub> d<i>A</i> = 2π<i>R</i>².</p>`,
  },
];

export const PLATES = {
  domeSlice: {
    text: 'Partial differentiation reduces multivariable calculus to single-variable calculus along coordinate slices. Drag the red point to move (x₀, y₀) and watch the slice curve z = 2 − ½x² − ½y₀² shift.',
    facts: s => [
      ['point (x₀, y₀)', `(${s.slice.x0.toFixed(2)}, ${s.slice.y0.toFixed(2)})`],
      ['height z₀ = f(x₀, y₀)', s.slice.z0.toFixed(3)],
      ['partial ∂f/∂x = −x₀', s.slice.fx.toFixed(2)],
      ['partial ∂f/∂y = −y₀', s.slice.fy.toFixed(2)],
    ],
  },
  tangentPlane: {
    text: 'A function f(x, y) is differentiable at (x₀, y₀) when its surface is locally flat — meaning all directional tangents lie in a single plane normal to (−f_x, −f_y, 1).',
    facts: () => [
      ['tangency point', '(0.80, 0.60, 1.50)'],
      ['partials (f_x, f_y)', '(−0.80, −0.60)'],
      ['upward normal n', '(+0.80, +0.60, 1.00)'],
    ],
  },
  gradContours: {
    text: 'On a topographic map, closely spaced contour rings mean a large gradient |∇f| (steep cliff), and water flowing straight downhill follows −∇f perpendicular to every contour.',
    facts: s => [
      ['contour radius r', '1.10 (height z = 1.395)'],
      ['steepest slope |∇f|', '1.10'],
      ['contour tangent slope D_u f', '0.000'],
      ['angle θ', `${(s.grad.th % (2 * Math.PI)).toFixed(2)} rad`],
    ],
  },
  saddleSurf: {
    text: 'The second-order Taylor approximation near a critical point is f(x₀+Δx, y₀+Δy) ≈ f(x₀, y₀) + ½(f_xx Δx² + 2f_xy ΔxΔy + f_yy Δy²). When D = f_xx f_yy − f_xy² < 0, this quadratic form takes both positive and negative values.',
    facts: () => [
      ['critical point', '(0, 0, 0) with ∇h = (0, 0)'],
      ['curvatures h_xx, h_yy', '+1.00, −1.00'],
      ['Hessian det D', '−1.00 < 0 (saddle)'],
    ],
  },
  divField: {
    text: 'In electrostatics, Gauss’s law ∇·E = ρ/ε₀ is the 3D divergence theorem: electric field lines only begin on positive charges (∇·E > 0) and end on negative charges (∇·E < 0).',
    facts: () => [
      ['field F(x, y)', '(x, y)'],
      ['divergence ∇·F', '1 + 1 = 2.00'],
      ['loop radius R', '1.25'],
      ['outward flux 2πR²', M.diskFluxExact(1.25).toFixed(2)],
    ],
  },
  curlField: {
    text: 'Green’s theorem, the 2D Divergence theorem, and the Fundamental Theorem of Calculus ∫_a^b f′(x) dx = f(b) − f(a) are all special cases of the generalized Stokes theorem ∫_Ω dω = ∮_∂Ω ω.',
    facts: () => [
      ['field G(x, y)', '(−y, x)'],
      ['scalar curl (∇×G)_z', '1 − (−1) = 2.00'],
      ['paddlewheel angular speed', '½ curl = 1.00 rad/s'],
      ['circulation 2πR² (R=1.25)', M.diskCirculationExact(1.25).toFixed(2)],
    ],
  },
};
