// Intentionally faulty model.js fixture for cold-run skill eval 05 (evals/briefs/05-faulty-figure-repair.txt).
// Do NOT import this outside evals/; cli/check.mjs intentionally excludes evals/ unless targeted directly.
import * as THREE from 'three';

export function faultyBeamTip(length = 2) {
  return new THREE.Vector3(length, 0, 0).x;
}
