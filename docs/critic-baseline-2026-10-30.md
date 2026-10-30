# Critic baseline, 2026-10-30 (re-run)

The critic tools over the 15 physics chapters inherited from Atlas of Physics and the economics and statistics
pilots, after the engine work of Phases 1–6 and the design-critique fixes. The unit circle and VSEPR were checked by
their builders (labels clean at desk and phone; their jumps are page-turn camera moves and lit-part switches).
Re-run and compare after changing a chapter.

## Summary

| | first run (before engine work) | this run |
|---|---|---|
| jumps.mjs, physics | 74 | 65 |
| labels.mjs, physics (desk + phone) | 62 | 65 |
| compound, galton | not built | 1 jump (a designed event), labels clean |

- **Jumps.** The jump floor is now 0.6 % of pixels, so fewer frames flag. Spot checks (newton, energy) are still
  scene loops restarting and forces switching off at the end of a push: designed, not render glitches. Book videos
  would read better if each page's clock started when the page arrives (not done yet).
- **Labels.** Labels anchored near the canvas edge now slide inside it (), so they can be read
  rather than cut off. Three of them now partly overlap a neighbour on kinematics phone pages 6–8 (, , the second ). Most remaining findings are physics labels crowding each other on phones, and
  magnetism page 5's grid of ⊗ symbols. These are content polish for the chapters, not engine faults.

## jumps.mjs

```
physics/kinematics       581 frames, 5 JUMPS
  t 3.8 s (page 0): 1.6 % vs 0.43 % around
  t 9.5 s (page 1): 1.7 % vs 0.37 % around
  t 15.1 s (page 2): 1.5 % vs 0.36 % around
  t 20.6 s (page 3): 1.5 % vs 0.32 % around
  t 55.4 s (page 10): 0.6 % vs 0.06 % around  
physics/newton           689 frames, 8 JUMPS
  t 23.4 s (page 4): 1.9 % vs 0.14 % around
  t 26.3 s (page 4): 5.0 % vs 1.19 % around
  t 40.0 s (page 7): 1.0 % vs 0.06 % around
  t 45.4 s (page 8): 0.9 % vs 0.07 % around
  t 49.8 s (page 9): 1.5 % vs 0.14 % around
  t 52.9 s (page 9): 1.5 % vs 0.13 % around
  t 54.1 s (page 10): 1.5 % vs 0.42 % around
  t 57.2 s (page 10): 1.5 % vs 0.19 % around  
physics/circular         689 frames, 1 JUMPS
  t 26.3 s (page 4): 10.0 % vs 2.25 % around  
physics/energy           635 frames, 9 JUMPS
  t 3.4 s (page 0): 1.5 % vs 0.28 % around
  t 5.0 s (page 0): 7.1 % vs 2.29 % around
  t 10.1 s (page 1): 8.2 % vs 1.42 % around
  t 16.1 s (page 2): 2.6 % vs 0.33 % around
  t 23.8 s (page 4): 3.5 % vs 0.13 % around
  t 34.5 s (page 6): 8.0 % vs 0.17 % around
  t 37.1 s (page 6): 9.3 % vs 2.23 % around
  t 54.7 s (page 10): 3.7 % vs 0.70 % around
  t 57.7 s (page 10): 3.9 % vs 0.70 % around  
physics/momentum         635 frames, 11 JUMPS
  t 2.8 s (page 0): 1.0 % vs 0.19 % around
  t 8.3 s (page 1): 0.7 % vs 0.15 % around
  t 18.1 s (page 3): 1.3 % vs 0.30 % around
  t 21.6 s (page 4): 1.3 % vs 0.37 % around
  t 25.2 s (page 4): 1.3 % vs 0.18 % around
  t 28.8 s (page 5): 0.8 % vs 0.03 % around
  t 39.6 s (page 7): 1.4 % vs 0.36 % around
  t 48.1 s (page 8): 4.8 % vs 1.22 % around
  t 48.2 s (page 8): 6.2 % vs 1.18 % around
  t 48.5 s (page 8): 1.1 % vs 0.32 % around
  t 53.3 s (page 9): 4.0 % vs 1.35 % around  
physics/oscillations     635 frames, 1 JUMPS
  t 53.3 s (page 9): 4.3 % vs 1.22 % around  
physics/rotation         797 frames, 7 JUMPS
  t 9.7 s (page 1): 5.1 % vs 0.34 % around
  t 11.8 s (page 2): 1.6 % vs 0.21 % around
  t 42.5 s (page 7): 3.2 % vs 0.92 % around
  t 50.1 s (page 9): 1.3 % vs 0.31 % around
  t 53.3 s (page 9): 4.6 % vs 1.22 % around
  t 60.4 s (page 11): 2.1 % vs 0.09 % around
  t 63.6 s (page 11): 2.2 % vs 0.15 % around  
physics/fluids           473 frames, 4 JUMPS
  t 15.7 s (page 2): 10.7 % vs 3.44 % around
  t 15.8 s (page 2): 12.4 % vs 2.56 % around
  t 20.9 s (page 3): 11.3 % vs 2.58 % around
  t 44.0 s (page 8): 0.9 % vs 0.14 % around  
physics/electrostatics   473 frames, 3 JUMPS
  t 10.1 s (page 1): 4.7 % vs 1.13 % around
  t 31.7 s (page 5): 6.1 % vs 1.72 % around
  t 43.1 s (page 7): 0.7 % vs 0.02 % around  
physics/gauss            473 frames, 3 JUMPS
  t 21.7 s (page 4): 2.0 % vs 0.48 % around
  t 37.1 s (page 6): 16.1 % vs 4.21 % around
  t 43.1 s (page 7): 0.9 % vs 0.14 % around  
physics/potential        473 frames, 3 JUMPS
  t 15.6 s (page 2): 16.1 % vs 4.67 % around
  t 15.7 s (page 2): 26.7 % vs 4.67 % around
  t 26.3 s (page 4): 3.8 % vs 0.83 % around  
physics/capacitors       473 frames, 4 JUMPS
  t 10.3 s (page 1): 21.4 % vs 6.72 % around
  t 26.3 s (page 4): 17.0 % vs 3.22 % around
  t 26.4 s (page 4): 16.9 % vs 5.60 % around
  t 43.1 s (page 7): 2.2 % vs 0.11 % around  
physics/circuits         473 frames, no jumps  
physics/magnetism        473 frames, 1 JUMPS
  t 16.1 s (page 2): 1.5 % vs 0.18 % around  
physics/induction        527 frames, 5 JUMPS
  t 6.9 s (page 1): 5.1 % vs 1.67 % around
  t 10.7 s (page 1): 1.2 % vs 0.13 % around
  t 19.0 s (page 3): 1.7 % vs 0.57 % around
  t 37.7 s (page 6): 3.7 % vs 0.08 % around
  t 43.1 s (page 7): 1.1 % vs 0.02 % around  
economics/compound       343 frames, 1 JUMPS
  t 1.7 s (page 1): 1.4 % vs 0.30 % around (6 at designed events) 
statistics/galton        95 frames, no jumps
```

## labels.mjs

```
physics/kinematics       desk   1 FINDINGS
  p2 "0" overlaps "t (s)" (40 %)
physics/kinematics       phone  6 FINDINGS
  p2 "0" overlaps "t (s)" (77 %)
  p6 "0" overlaps "t (s)" (32 %)
  p7 "vRG" overlaps "vRC" (29 %)
  p8 "vBW" overlaps "vWS" (25 %)
  p8 "vBW" overlaps "vWS" (26 %)
  p8 "straight across ↑" overlaps "aimed 37° upstream ↑" (31 %)
physics/newton           desk   clean
physics/newton           phone  clean
physics/circular         desk   3 FINDINGS
  p1 "ΣF" overlaps "FN" (52 %)
  p1 "v" overlaps "4.0 m/s" (50 %)
  p11 "RE" overlaps "Fg" (63 %)
physics/circular         phone  10 FINDINGS
  p1 "T" overlaps "ΣF" (30 %)
  p1 "T" overlaps "FN" (40 %)
  p1 "ΣF" overlaps "FN" (75 %)
  p1 "mg" overlaps "2.0 m/s" (20 %)
  p1 "v" overlaps "4.0 m/s" (58 %)
  p1 "T" overlaps "ΣF" (31 %)
  p2 "Fg" overlaps "fs" (49 %)
  p4 "FN" overlaps "ΣF" (53 %)
  p7 "F12" overlaps "F21" (20 %)
  p11 "RE" overlaps "Fg" (88 %)
physics/energy           desk   clean
physics/energy           phone  3 FINDINGS
  p3 "Wnet" overlaps "K" (100 %)
  p9 "0.30" overlaps "r (nm)" (75 %)
  p11 "fast · 1.0 m/s" overlaps "0" (56 %)
physics/momentum         desk   1 FINDINGS
  p8 "p2" overlaps "P" (47 %)
physics/momentum         phone  2 FINDINGS
  p4 "p2" overlaps "P" (40 %)
  p8 "p2" overlaps "P" (87 %)
physics/oscillations     desk   clean
physics/oscillations     phone  clean
physics/rotation         desk   clean
physics/rotation         phone  2 FINDINGS
  p6 "dm" overlaps "r" (30 %)
  p6 "axis through the centre · ML²/12" overlaps "axis through the end · ML²/3" (40 %)
physics/fluids           desk   clean
physics/fluids           phone  4 FINDINGS
  p2 "6 m" overlaps "P = 166 kPa" (74 %)
  p5 "Fb" overlaps "steel ship · floats" (40 %)
  p5 "wood · 60% under" overlaps "ice · 92% under" (35 %)
  p5 "ice · 92% under" overlaps "steel ball · sinks" (23 %)
physics/electrostatics   desk   2 FINDINGS
  p1 "wall" behind Wall
  p4 "F = q0E" overlaps "q0" (70 %)
physics/electrostatics   phone  6 FINDINGS
  p1 "wall" behind Wall
  p2 "+" overlaps "Fon 1" (42 %)
  p2 "−" overlaps "Fon 2" (33 %)
  p2 "−2 μC" overlaps "Fon 2" (21 %)
  p4 "+" overlaps "F = q0E" (43 %)
  p4 "F = q0E" overlaps "q0" (99 %)
physics/gauss            desk   clean
physics/gauss            phone  clean
physics/potential        desk   clean
physics/potential        phone  6 FINDINGS
  p2 "0 V" overlaps "−2.5 V" (62 %)
  p2 "−2.5 V" overlaps "−5.0 V" (32 %)
  p2 "−5.0 V" overlaps "−7.5 V" (32 %)
  p2 "−7.5 V" overlaps "−10.0 V" (45 %)
  p6 "P" overlaps "+2 nC" (55 %)
  p8 "+" overlaps "electron" (53 %)
physics/capacitors       desk   1 FINDINGS
  p2 "a" behind Inner sphere (+Q)
physics/capacitors       phone  2 FINDINGS
  p2 "a" behind Inner sphere (+Q)
  p5 "2 µF" overlaps "series" (23 %)
physics/circuits         desk   clean
physics/circuits         phone  1 FINDINGS
  p6 "+" overlaps "Req 3.6 Ω" (28 %)
physics/magnetism        desk   clean
physics/magnetism        phone  15 FINDINGS
  p1 "+" overlaps "F" (28 %)
  p1 "−" overlaps "F" (34 %)
  p3 "⊗" overlaps "B (into the page)" (38 %)
  p5 "⊗" overlaps "⊗" (52 %)
  p5 "⊗" overlaps "⊗" (52 %)
  p5 "⊗" overlaps "⊗" (51 %)
  p5 "⊗" overlaps "⊗" (38 %)
  p5 "⊗" overlaps "⊗" (38 %)
  p5 "⊗" overlaps "⊗" (38 %)
  p5 "⊗" overlaps "⊗" (31 %)
  p5 "⊗" overlaps "⊗" (30 %)
  p5 "⊗" overlaps "⊗" (30 %)
  p5 "⊗" overlaps "⊗" (21 %)
  p5 "⊗" overlaps "⊗" (21 %)
  p5 "⊗" overlaps "⊗" (21 %)
physics/induction        desk   clean
physics/induction        phone  clean
economics/compound       desk   clean
economics/compound       phone  clean
statistics/galton        desk   clean
statistics/galton        phone  clean
```
