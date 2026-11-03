// Fit all assemblies named by a page, not just its highlighted part. The floor
// and neighbouring stations are deliberately excluded. Keep the authored aim
// and view angle; only pull back enough to retain the complete subject.
export function frameAssemblies(THREE, camera, pose, groups, { top = .62, bottom = .84, horizontal = .86, pan = null } = {}) {
  const bounds = new THREE.Box3();
  for (const group of groups) if (group) { group.updateWorldMatrix(true, true); bounds.expandByObject(group); }
  if (bounds.isEmpty()) return pose;
  const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const tanX = tanY * camera.aspect;
  const point = new THREE.Vector3();
  let distance = pose.dist;
  for (let i = 0; i < 8; i++) {
    point.set(i & 1 ? bounds.max.x : bounds.min.x, i & 2 ? bounds.max.y : bounds.min.y, i & 4 ? bounds.max.z : bounds.min.z);
    // Fit the unpanned composition, then retain the reader’s chosen pan.
    if (pan) point.add(pan);
    point.applyMatrix4(camera.matrixWorldInverse);
    const depth = Math.max(Math.abs(point.x) / (tanX * horizontal), Math.abs(point.y) / (tanY * (point.y > 0 ? top : bottom)));
    distance = Math.max(distance, pose.dist + point.z + depth * 1.03);
  }
  return { ...pose, dist: distance };
}

// Keep nearby projected labels distinct. Inputs are measured once after their
// horizontal edge adjustment; each frame starts from the original anchors.
export function separateLabels(boxes, height, top = 44, bottom = 28, gap = 4) {
  const placed = boxes.filter(box => box.fixed);
  return boxes.map(box => {
    if (box.fixed) return 0;
    const start = Math.max(top, Math.min(height - bottom - box.height, box.y));
    let y = start;
    for (let step = 0; step < 24; step++) {
      const offset = step ? Math.ceil(step / 2) * (box.height + gap) * (step % 2 ? 1 : -1) : 0;
      const candidate = { ...box, y: start + offset };
      if (candidate.y < top || candidate.y + box.height > height - bottom) continue;
      const overlaps = placed.some(p => candidate.x < p.x + p.width + gap && candidate.x + candidate.width + gap > p.x && candidate.y < p.y + p.height + gap && candidate.y + candidate.height + gap > p.y);
      if (!overlaps) { y = candidate.y;break; }
    }
    placed.push({ ...box, y });return y - box.y;
  });
}
