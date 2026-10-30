<!--
Story-first text for the unit circle (future maths textbook; reader: Kym, 12, Mumbai). Every number agrees with
maths/unit-circle/model.js and is proved in checks.mjs (sin 30° = 1/2, 1 rad = 57.30°, 2π = 6.283, 2π − 6 = 0.283).

Sources for the history (checked 2026-10-30):
- MacTutor History of Mathematics, "The trigonometric functions" (O'Connor & Robertson):
  https://mathshistory.st-andrews.ac.uk/HistTopics/Trigonometric_functions/
  Aryabhata, in about 500, gave tables of half chords and used jya for our sine; the Arabs called it jiba, "a
  meaningless word with the same sound as jya"; jiba became jaib in later Arabic writings, meaning "a fold"; European
  translators turned jaib into Latin sinus, "fold"; Fibonacci's "sinus rectus arcus" spread the word; Gunter (1620)
  suggested co-sinus; Fincke first used "tangent" in 1583. MacTutor names no single translator.
- J.-P. Merlet, "A note on the history of trigonometric functions and substitutions" (INRIA):
  https://www.math.stonybrook.edu/~tony/history-resources/HISTORY_OF_TRIGONOMETRIC_F.pdf
  Aryabhata (476–550) used jya for half chords; Arabic jiba → jaib ("fold"); Latin sinus ("fold, bay or inlet");
  the first Latin use is disputed: Plato of Tivoli's 1116 translation of al-Battani (Cajori), Gerard of Cremona's
  translation of al-Khwarizmi (Eves), or Robert of Chester's 1145 translation of al-Khwarizmi's tables (Boyer).
  Gunter suggested co-sinus in 1620.
- Wikipedia, "Jyā, koti-jyā and utkrama-jyā" (citing Datta & Singh, Hindu Trigonometry, 1983; Van Brummelen, The
  Mathematics of the Heavens and the Earth, 2009): https://en.wikipedia.org/wiki/Jy%C4%81,_koti-jy%C4%81_and_utkrama-jy%C4%81
  jyā means "bowstring"; jīvā is a synonym in geometry; half-chords were ardha-jyā, later shortened to jyā; koti-jyā is
  the cosine; Arabic jība, read without short vowels as jaib/jayb, "bosom"; the same three candidate translators.
- Wikipedia, "Āryabhaṭa's sine table": https://en.wikipedia.org/wiki/%C4%80ryabha%E1%B9%ADa%27s_sine_table and
  "Aryabhata and the Construction of the First Trigonometric Table" (arXiv:2309.13577): https://arxiv.org/pdf/2309.13577
  24 sine differences at steps of 225 minutes (3¾°), the first 225, on a circle of radius 3438 minutes
  (≈ 21600 / 2π: the radius measured in the same minutes as the arc).
Hedged in the text: who first wrote "sinus" (disputed, three candidates); what jayb meant exactly (fold, bosom, the
pocket or neck-opening of a garment: sources word it differently); Āryabhaṭa's date ("around 500"); Kusumapura's
location is not stated, to avoid a claim the sources above do not make.
-->

## The shadow of a turning point

:::scene India, around the year 500

Around the year 500, a young astronomer named Āryabhaṭa wrote a short book of verses about the sky. Astronomers needed to know where the Sun, the Moon and the planets would be, and that meant working with circles: the paths in the sky looked like arcs. Indian astronomers had a lovely way of picturing a piece of a circle. An arc looks like a bow. The straight line joining its two ends is the string of the bow, and the Sanskrit word for a bowstring is *jyā* (another word for it was *jīvā*).

They found it most useful to work with half of that string, the *ardha-jyā*, the half-bowstring, and soon they dropped the "half" and simply called it *jyā*. Āryabhaṭa listed 24 of these half-strings, one for every 3¾ degrees, on a circle whose radius he measured as 3438 small units. Keep that odd number in mind; it turns out to be a clever choice.

Then the word went on a journey. Scholars writing in Arabic took up the Indian astronomy and kept the sound of the word, writing it as *jība*, which meant nothing in Arabic. But Arabic is usually written without its short vowels, so the word appeared as just two letters, *j* and *b*. Later readers took it for a real Arabic word, *jayb*, which means a fold, the fold of cloth at the chest of a garment, or a pocket. In the 1100s, translators in Spain turned Arabic books into Latin, and they translated *jayb* into the Latin word for a fold or a bay: *sinus*. Historians still argue about which translator did it first: three names are suggested, with dates between 1116 and about 1150, and nobody is sure. From *sinus* we get *sine*.

So the word you will learn in this chapter means "pocket", because somebody misread "bowstring". The idea survived the journey better than the name did.
:::

You do not need a bow to see the idea. You need something that goes round, and a light.

:::predict
A ceiling fan turns at a steady speed. Stick a small sticker on the tip of one blade. Late-afternoon sunlight comes in low through the window, level with the fan, and throws the sticker's shadow onto the far wall. As the fan turns, the shadow slides from side to side along the wall. How does it move?
- From side to side at a steady speed, like a train along a platform
- Fast near the two ends, slow in the middle
- Fast through the middle, slowing down near the two ends
???
Fast through the middle, slowing down near the two ends. When the sticker is at the front or back of its circle it is moving straight across the light, so all of its speed shows on the wall. At the two sides of the circle it is moving towards or away from the wall, which the light cannot show at all, so for a moment the shadow almost stops before it turns back.
:::

Let us make the fan simpler, and stand its circle upright like a wheel. Draw a circle on paper and call its radius 1. It does not matter whether that is 1 centimetre, 1 metre or 1 fan blade: we are going to measure everything in radii. Put a dot P on the circle and let it go round, anticlockwise, starting from the point on the far right. The angle it has turned through we call θ, the Greek letter theta.

Now shine level light on it from the side, and put a screen beyond the circle. P's shadow lands on the screen exactly as high as P is above the middle line. That height is the **sine** of θ. When P is on the middle line, the shadow is at 0. A quarter of the way round, P is at the top, and the shadow is as high as it can go: 1, the whole radius. Below the middle line the shadow goes below zero, so sine can be negative, but it can never be bigger than 1 or smaller than −1, because P never leaves the circle.

Turn the light so it shines straight down, like the noon sun, with the screen underneath. Now P's shadow slides from side to side, and how far it is to the right of the middle is the **cosine** of θ. The *co* is short for "complement": the cosine of an angle is the sine of what that angle needs to make a right angle. An English professor of astronomy, Edmund Gunter, suggested the name *co-sinus* in 1620. Indian astronomers had their own name for it long before: *koṭi-jyā*.

:::live atlas_unit_circle {"page": 1}

Some angles give exact shadows. Take a triangle with all three sides 1 and all three angles 60°, and cut it in half from the top. Each half has angles 30°, 60° and 90°, its longest side is 1, and the side opposite the 30° angle is half of the bottom: exactly ½. Now stand that half-triangle inside our circle with its 30° corner at the centre: its far corner is P, and its height is P's shadow. So the sine of 30° is exactly one half. Not roughly 0.5: exactly.

Here is something that is true of every angle at once. The shadow across, the shadow up and the radius make a right-angled triangle, with the radius as its longest side. Pythagoras says the squares on the two short sides add up to the square on the long one, and the long one is 1. So (sine)² + (cosine)² = 1, whatever the angle. If you know one shadow, you know the other, apart from which side of the middle it falls.

There is one more surprise, and it explains Āryabhaṭa's odd number. We usually measure angles in degrees, 360 to a full turn. That number was chosen by people long ago and has nothing to do with circles themselves. A circle offers its own measure: take a piece of thread as long as the radius and bend it round the edge. The angle it covers is called one **radian**, about 57.30°. How many radius-lengths fit all the way round? Six, and a bit left over: 0.283 of a radius. The exact number is 2π, about 6.283. Āryabhaṭa measured his arcs in minutes, and there are 21,600 minutes in a full turn. Divide 21,600 by 2π and you get about 3438. His radius was the length of the arc that one radian cuts off, measured in the same units as the arc. Fifteen hundred years ago he was already measuring the circle with its own radius.

Finally, let P go round steadily and let a strip of paper slide past at a steady speed, with a pen held level with P. The pen draws P's height against time: a smooth hill, a smooth valley, and again, forever. That is the **sine wave**. It is the shape of the sound of a tuning fork, of the alternating electricity in the wires of your home, and of a swing going back and forth. All of them are, in a sense, the shadow of something going round.

:::careful
> "Sine is something about triangles, so an angle bigger than 90° can't have a sine."

That is how many schools first teach it: sine as "opposite over hypotenuse" in a right-angled triangle. That rule is true, but it is only a window onto a bigger idea. Sine is the height of a point going round a circle. For 150°, P is up and to the left, and its height is ½, so sin 150° = ½. For 210°, P is below the middle, so sin 210° = −½. The triangle was a helper, never the definition.
:::

:::five Sine
? What is it?
The height of a point on a circle of radius 1 above the circle's middle line, when the point has turned through a given angle from the right. Equivalently, the length of the shadow that level light casts of that point.
? Why is it called this?
Indian astronomers called it *jyā*, the half-bowstring. Arabic scholars wrote it as *jība*; later readers mistook it for *jayb*, a fold or pocket, and twelfth-century translators put that into Latin as *sinus*, which became our "sine".
? What problem did it solve?
Astronomers needed to turn angles in the sky into lengths they could calculate with. A table of sines let them do it for any angle, so they could predict where the Sun and planets would be.
? Why does it work?
Every point on the circle is exactly 1 from the middle, so the height of the point depends only on how far round it has turned. The same angle always gives the same height, on any circle, once you measure in radii.
? How does it help?
It describes anything that repeats smoothly: swings, sound, tides, the electricity in your plugs. It also lets surveyors and engineers find heights and distances they cannot measure directly.
?? How do we know?
Measure the height of P on a carefully drawn circle at 30° and you get half the radius; the half-equilateral triangle proves it is exactly half. And a computer that turns a point round a circle in tiny steps, with no sine button at all, lands on the same heights.
?? What it isn't
It isn't a triangle, and it isn't a number you have to look up and memorise: it is a height you can see. It isn't limited to angles under 90°, and it isn't always positive.
?? Where does it stop working?
Never, for angles: the point can keep turning, and the sine just repeats every full turn. What does change is the shortcut "opposite over hypotenuse", which only makes sense when there is a right-angled triangle with an angle under 90°.
:::

:::check
On the circle of radius 1, P has turned 90° and is at the very top. What are sin 90° and cos 90°?
???
sin 90° = 1, because P is a whole radius above the middle line. cos 90° = 0, because P is straight above the middle, so its sideways shadow has shrunk to nothing.
:::
