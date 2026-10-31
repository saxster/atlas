// Four-stroke mechanical teardown: cylinder block housing (with solid / X-ray / section cutaway support), piston +
// connecting-rod slider-crank linkage, 14:28 2:1 timing gear train + rack, overhead intake valve with a live
// deformable helical return spring, and a draggable 2-link IK inspection arm.
import * as THREE from 'three';
import { part, box, cyl, gear, rack, spring, V } from '@saxster/atlas/parts.js';
import { linkage } from '@saxster/atlas/prims.js';
import * as M from './model.js';

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group();
  scene.add(root);

  // Base plate
  part(root, box(3.6, 0.08, 1.8), { tone: 'lo', pal: 'board', pos: [0.1, -0.58, 0], name: 'Baseplate' });

  // 1. Cylinder block housing (cutaway / X-ray target)
  const gBlock = asm('block', root, { title: 'Cylinder block', sub: 'cast sleeve · sliced open in Section or X-ray mode' });
  part(gBlock, box(0.86, 1.05, 0.76), { pal: 'paper', tone: 'lo', pos: [0, 0.98, 0], ex: [-0.9, 0.25, 0], name: 'Cylinder jacket' });
  part(gBlock, box(0.96, 0.14, 0.82), { pal: 'ink', tone: 'mid', pos: [0, 1.56, 0], ex: [-0.9, 0.45, 0], name: 'Cylinder head' });

  // 2. Slider-crank linkage & piston assembly
  const gCrank = asm('crank', root, { title: 'Crank & connecting rod', sub: 'R = 0.32 m · L = 0.96 m · stroke = 2R' });
  const lk = linkage(gCrank, {
    joints: { O: [0, 0], pin: [0, M.R], wrist: [0, M.TDC] },
    links: [['O', 'pin', '', 'red'], ['pin', 'wrist', '', 'ink']],
    r: 0.036,
    pinR: 0.062,
    pinDepth: 0.16,
    z: 0.05,
    name: 'Slider-crank linkage',
  });
  const piston = part(gCrank, cyl(0.30, 0.28, 32), { pal: 'blue', tone: 'hi', pos: [0, M.TDC, 0], ex: [0, 0.35, 0], name: 'Piston crown' });

  // 3. 2:1 Camshaft spur gear train & timing rack
  const gGears = asm('gears', root, { title: '2:1 timing gear train', sub: '14-tooth crank pinion drives 28-tooth cam gear at −½× speed' });
  const crankGear = gear(gGears, { teeth: M.TEETH_CRANK, module: M.MODULE, width: 0.14, bore: 0.06, pal: 'amber', tone: 'hi', pos: [0, 0, -0.18], ex: [0, -0.3, -0.35], name: 'Crank pinion (14T)' });
  const camGear = gear(gGears, { teeth: M.TEETH_CAM, module: M.MODULE, width: 0.14, bore: 0.09, pal: 'green', tone: 'hi', pos: [M.CAM_X, 0, -0.18], ex: [0.55, 0, -0.35], name: 'Cam gear (28T)' });
  const timingRack = rack(gGears, { teeth: 18, module: M.MODULE, width: 0.12, height: 0.12, pal: 'paper', tone: 'mid', pos: [0, M.RACK_Y, -0.18], ex: [0, -0.45, -0.35], name: 'Timing rack' });

  // 4. Overhead intake valve & deformable helical return spring
  const gValve = asm('valve', root, { title: 'Intake valve & coil spring', sub: 'lobe opens on Intake; live helical spring returns valve to seat' });
  const valveStem = part(gValve, cyl(0.025, 0.42, 16), { pal: 'red', tone: 'hi', pos: [0, 1.78, 0], ex: [0, 0.65, 0], name: 'Valve stem' });
  const valveHead = part(gValve, cyl(0.14, 0.035, 24), { pal: 'red', tone: 'hi', pos: [0, 1.56, 0], ex: [0, 0.65, 0], name: 'Valve head' });
  const valveSpring = spring(gValve, { r: 0.085, wire: 0.015, turns: 6, pal: 'ink', tone: 'hi', ex: [0, 0.65, 0], from: [0, 1.62, 0], to: [0, 1.98, 0], name: 'Valve return spring' });

  // 5. Draggable 2-link inverse-kinematics inspection arm
  const gArm = asm('arm', root, { title: '2-link IK inspection arm', sub: 'drag the red tip handle in 3D to solve twoLinkIK live' });
  const armLinkage = linkage(gArm, {
    joints: { base: M.ARM_BASE, elbow: [-0.8, 0.4], tip: M.ARM_HOME },
    links: [['base', 'elbow', '', 'blue'], ['elbow', 'tip', '', 'ink']],
    r: 0.024,
    pinR: 0.044,
    pinDepth: 0.11,
    z: 0.12,
    name: '2-link IK arm',
  });
  const armHandle = part(gArm, new THREE.SphereGeometry(0.068, 20, 16), { pal: 'red', tone: 'lit', pos: [M.ARM_HOME[0], M.ARM_HOME[1], 0.12], name: 'IK drag handle' });
  let draggedTarget = null;
  if (E.draggable) {
    E.draggable(armHandle, {
      plane: 'xy',
      autoMove: false,
      onDrag(pt) {
        draggedTarget = [pt[0], pt[1]];
      },
      onReset() {
        draggedTarget = null;
      },
    });
  }

  let curState = M.at(0);
  const labels = [
    {
      cls: 'tag',
      html: 'Piston (TDC ↔ BDC)',
      leader: true,
      anchor: () => V(-0.28, curState.s, 0.1),
      at: () => V(-1.25, curState.s + 0.22, 0.1),
    },
    {
      cls: 'tag',
      html: '2:1 Cam Gear (28T)',
      leader: true,
      anchor: () => V(M.CAM_X + M.R_CAM * 0.7, 0.15, -0.18),
      at: () => V(M.CAM_X + 0.95, 0.48, -0.18),
    },
    {
      cls: 'tag',
      html: 'Valve Spring',
      leader: true,
      anchor: () => V(0.09, 1.82 - curState.valveLift * 0.5, 0),
      at: () => V(0.95, 1.98, 0),
    },
  ];

  function update(s) {
    curState = s;
    lk.update({ O: [0, 0], pin: s.pin, wrist: s.wrist });
    piston.position.y = s.s;
    piston.userData.home.y = s.s;

    crankGear.rotation.z = -s.theta;
    camGear.rotation.z = -s.camAngle + M.CAM_PHASE_OFFSET;
    timingRack.position.x = s.rackX;
    timingRack.userData.home.x = s.rackX;

    const vy = -s.valveLift;
    valveStem.position.y = 1.78 + vy;
    valveStem.userData.home.y = 1.78 + vy;
    valveHead.position.y = 1.56 + vy;
    valveHead.userData.home.y = 1.56 + vy;
    valveSpring.set([0, 1.62, 0], [0, 1.98 + vy, 0]);

    const arm = draggedTarget ? M.solveArm(draggedTarget) : s.arm;
    armLinkage.update({ base: arm.base, elbow: arm.elbow, tip: arm.tip });
    armHandle.position.set(arm.tip[0], arm.tip[1], 0.12);
    armHandle.userData.home.set(arm.tip[0], arm.tip[1], 0.12);
  }

  return { update, labels };
}
