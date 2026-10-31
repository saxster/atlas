// Deliverable mesh hygiene audit (inspired by scenario-blender-expert's bx_audit.deliverable).
// Grades a Three.js Object3D / GLTF hierarchy before rendering or embedding:
// - non-empty triangle count within budget (maxTris)
// - no negative-determinant (inside-out) transforms or unapplied extreme scales
// - finite vertex positions and valid normals
// - UV coordinates present when textured or required
// - optional dielectric metalness clamping (image-to-3D models often mark glaze/lacquer as metal)
import * as THREE from 'three';

export function auditDeliverable(root, {
  maxTris = 50000,
  requireUV = false,
  checkScale = true,
  clampNonMetal = false,
} = {}) {
  const errors = [], warnings = [], perObject = {};
  let meshes = 0, tris = 0;
  if (!root) return { pass: false, meshes: 0, tris: 0, errors: ['missing root object'], warnings, perObject };

  root.updateMatrixWorld?.(true);
  const v = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion();

  root.traverse(obj => {
    if (!obj.isMesh) return;
    meshes++;
    const name = obj.name || `mesh_${meshes}`;
    const geo = obj.geometry;
    const objErrors = [], objWarnings = [];

    if (!geo || !geo.attributes?.position) {
      objErrors.push('missing position attribute');
      perObject[name] = { tris: 0, errors: objErrors, warnings: objWarnings };
      errors.push(`${name}: missing position attribute`);
      return;
    }

    const pos = geo.attributes.position;
    const count = geo.index ? geo.index.count : pos.count;
    const meshTris = Math.floor(count / 3);
    tris += meshTris;
    if (meshTris === 0) {
      objErrors.push('mesh has 0 triangles');
      errors.push(`${name}: mesh has 0 triangles`);
    }

    // Check finite coordinates
    let nonFinite = 0;
    for (let i = 0; i < pos.count; i++) {
      if (!Number.isFinite(pos.getX(i)) || !Number.isFinite(pos.getY(i)) || !Number.isFinite(pos.getZ(i))) {
        nonFinite++;
        break;
      }
    }
    if (nonFinite > 0) {
      objErrors.push('non-finite vertex coordinates');
      errors.push(`${name}: non-finite vertex coordinates`);
    }

    // Check normals
    const norm = geo.attributes.normal;
    if (!norm || norm.count !== pos.count) {
      objWarnings.push('missing or mismatched normals');
      warnings.push(`${name}: missing or mismatched normals`);
    } else {
      let zeroNormals = 0;
      for (let i = 0; i < Math.min(norm.count, 64); i++) {
        const lenSq = norm.getX(i) ** 2 + norm.getY(i) ** 2 + norm.getZ(i) ** 2;
        if (!Number.isFinite(lenSq) || lenSq < 1e-8) { zeroNormals++; break; }
      }
      if (zeroNormals > 0) {
        objErrors.push('degenerate zero-length or NaN normals');
        errors.push(`${name}: degenerate zero-length or NaN normals`);
      }
    }

    // Check world transform determinant & unapplied scale
    if (checkScale && obj.matrixWorld) {
      const det = obj.matrixWorld.determinant();
      if (det < 0) {
        objErrors.push('negative scale (inside-out face winding)');
        errors.push(`${name}: negative scale (inside-out face winding)`);
      }
      obj.matrixWorld.decompose(v, q, s);
      const ratio = Math.max(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)) / Math.max(1e-9, Math.min(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)));
      if (ratio > 25) {
        objWarnings.push(`extreme non-uniform scale (${s.x.toFixed(2)}, ${s.y.toFixed(2)}, ${s.z.toFixed(2)})`);
        warnings.push(`${name}: extreme non-uniform scale`);
      }
    }

    // Check UVs when required or when a material carries an image map
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    const hasTexture = mats.some(m => m.map || m.normalMap || m.roughnessMap || m.metalnessMap);
    if ((requireUV || hasTexture) && !geo.attributes.uv) {
      objErrors.push('missing UV attribute required for texture mapping');
      errors.push(`${name}: missing UV attribute`);
    }

    // Optional PBR dielectric fix: image-to-3D generators frequently set metalness > 0.5 on glazed/painted surfaces
    if (clampNonMetal) {
      for (const m of mats) {
        if (typeof m.metalness === 'number' && m.metalness > 0.15 && !m.userData?.isMetal) {
          m.metalness = 0.05;
          objWarnings.push('clamped spurious PBR metalness to 0.05');
        }
      }
    }

    perObject[name] = { tris: meshTris, errors: objErrors, warnings: objWarnings };
  });

  if (meshes === 0) errors.push('no mesh objects found in hierarchy');
  if (tris === 0 && meshes > 0) errors.push('total triangle count is 0');
  if (tris > maxTris) errors.push(`triangle count ${tris} exceeds budget ${maxTris}`);

  return {
    pass: errors.length === 0,
    meshes,
    tris,
    errors,
    warnings,
    perObject,
  };
}
