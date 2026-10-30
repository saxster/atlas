// A ball thrown from the ground at speed v and angle θ, no air resistance: x = v cos θ t, y = v sin θ t − g t²/2.
// Pure functions; metres, seconds, degrees in the params. Every number in the figure reads from here.

export const G = 9.81;
const rad = deg => deg * Math.PI / 180;
export const flightTime = (v, deg) => 2 * v * Math.sin(rad(deg)) / G;
export const range = (v, deg) => v * v * Math.sin(2 * rad(deg)) / G;
export const peak = (v, deg) => (v * Math.sin(rad(deg))) ** 2 / (2 * G);
export const at = (v, deg, t) => ({ x: v * Math.cos(rad(deg)) * t, y: v * Math.sin(rad(deg)) * t - G * t * t / 2, vx: v * Math.cos(rad(deg)), vy: v * Math.sin(rad(deg)) - G * t });
export const BEST = 45;                        // on flat ground, sin 2θ is largest at θ = 45°
export const SLOW = 2;                         // the run plays at half speed

export const X = [0, 70], Y = [0, 35];         // axes, in metres; the fastest, highest throw still fits
