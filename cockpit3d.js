import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { createRenderProfile } from './render-profile.js';
import { batchCabin } from './cabin-batches.js';
import { createAdaptiveQuality } from './render-budget.js';
import { createFrameScheduler } from './render-scheduler.js';

// The cabin stays fixed in world space. Only the seated camera turns.
export function createCockpit() {
  const world = document.querySelector('#world');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 981px)');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#08121d');
  scene.fog = new THREE.Fog('#0b1826', 6, 15);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.035, 60);
  const seat = new THREE.Vector3(0, 1.16, 0.25);
  camera.position.copy(seat);
  camera.rotation.order = 'YXZ';

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.domElement.id = 'cockpit-webgl';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  world.prepend(renderer.domElement);

  const cssScene = new THREE.Scene();
  const css = new CSS3DRenderer();
  css.domElement.id = 'cockpit-surfaces';
  world.append(css.domElement);

  const material = (color, roughness = .68, metalness = .18) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const mats = {
    hull: material('#233847'), inset: material('#182a38'), rib: material('#3b5667', .49, .3),
    edge: material('#698796', .42, .4), black: material('#08141e', .75, .1),
    housing: material('#2e4655', .5, .22), panel: material('#203544'),
    amber: material('#b88650', .44, .25), grip: material('#111f2b', .9, 0),
    cyan: new THREE.MeshBasicMaterial({ color: '#a1edf0' }),
    warm: new THREE.MeshBasicMaterial({ color: '#f0c68d' }),
    green: new THREE.MeshBasicMaterial({ color: '#9bdfb0' }),
    darkGlass: new THREE.MeshStandardMaterial({ color: '#071527', roughness: .15, metalness: .4 })
  };
  const hemi = new THREE.HemisphereLight('#9bc9df', '#13212e', 1.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#c1d8e9', 1.35);
  key.position.set(-1.5, 4, 1.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -3;
  key.shadow.bias = -.0008;
  scene.add(key);
  const holoLight = new THREE.PointLight('#77d6e8', 3.8, 7, 2);
  holoLight.position.set(0, 1.05, -2.16);
  scene.add(holoLight);
  const cabinLight = new THREE.PointLight('#a0c5d8', 3.1, 8, 2);
  cabinLight.position.set(0, 2.7, -.8);
  scene.add(cabinLight);
  const warmFill = new THREE.PointLight('#eac18a', .9, 4.5, 2);
  warmFill.position.set(1.65, 1.3, -.4);
  scene.add(warmFill);
  const reflectedFill = new THREE.PointLight('#88b9d4', 1.35, 6, 2);
  reflectedFill.position.set(0, 1.75, .9);
  scene.add(reflectedFill);

  const geometries = new Map();
  function sharedGeometry(key, create) {
    if (!geometries.has(key)) geometries.set(key, create());
    return geometries.get(key);
  }
  function mesh(geometry, mat, parent = scene) {
    const object = new THREE.Mesh(geometry, mat);
    object.castShadow = !mat.isMeshBasicMaterial;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w, h, d, mat, pos = [0, 0, 0], parent = scene) {
    const object = mesh(sharedGeometry(`box:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d)), mat, parent);
    object.position.set(...pos);
    return object;
  }
  function chamfer(w, h, d, mat, parent = scene, bevel = .035) {
    const geo = sharedGeometry(`chamfer:${w}:${h}:${d}:${bevel}`, () => {
      const shape = new THREE.Shape();
      const r = Math.min(bevel * 2, w / 5, h / 5);
      shape.moveTo(-w / 2 + r, -h / 2);
      shape.lineTo(w / 2 - r, -h / 2); shape.lineTo(w / 2, -h / 2 + r);
      shape.lineTo(w / 2, h / 2 - r); shape.lineTo(w / 2 - r, h / 2);
      shape.lineTo(-w / 2 + r, h / 2); shape.lineTo(-w / 2, h / 2 - r);
      shape.lineTo(-w / 2, -h / 2 + r); shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, steps: 1 });
      geo.translate(0, 0, -d / 2);
      return geo;
    });
    return mesh(geo, mat, parent);
  }
  function line(points, color = '#83c7d8', opacity = .5, parent = scene) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point)));
    const result = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    parent.add(result);
    return result;
  }
  function tube(points, radius = .035, mat = mats.black, parent = scene) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve, 24, radius, 6, false), mat, parent);
  }
  function bolt(x, y, z, parent, size = .018) {
    const object = mesh(sharedGeometry(`bolt:${size}`, () => new THREE.CylinderGeometry(size, size, .012, 6)), mats.edge, parent);
    object.rotation.x = Math.PI / 2; object.position.set(x, y, z);
    return object;
  }
  function label(text, w, h, parent = scene, color = '#aac8d2') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color; ctx.font = '500 38px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 64);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: .8 });
    return mesh(new THREE.PlaneGeometry(w, h), mat, parent);
  }
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 64;
  const glowCtx = glowCanvas.getContext('2d');
  const gradient = glowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(220,255,255,.75)'); gradient.addColorStop(.2, 'rgba(140,235,255,.28)'); gradient.addColorStop(1, 'rgba(140,235,255,0)');
  glowCtx.fillStyle = gradient; glowCtx.fillRect(0, 0, 64, 64);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  function glow(pos, scale = .3, color = '#a0e7ed', parent = scene) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, opacity: .42, depthWrite: false, blending: THREE.AdditiveBlending }));
    sprite.position.set(...pos); sprite.scale.set(scale, scale, 1); parent.add(sprite);
    return sprite;
  }

  // A pressure shell extending forward and behind the seat, with real curved walls.
  const hullCenter = 1.08;
  const shellMat = mats.hull.clone(); shellMat.side = THREE.BackSide;
  const shell = mesh(new THREE.CylinderGeometry(2.37, 2.37, 5.9, 48, 1, true), shellMat);
  shell.rotation.x = Math.PI / 2; shell.position.set(0, hullCenter, -.9);
  shell.castShadow = false;
  for (const z of [-3.58, -2.15, -.72, .9, 1.95]) {
    const rib = mesh(sharedGeometry('rib', () => new THREE.TorusGeometry(2.28, .105, 4, 64)), mats.rib);
    rib.position.set(0, hullCenter, z);
    const innerEdge = mesh(sharedGeometry('rib-edge', () => new THREE.TorusGeometry(2.18, .012, 4, 64)), mats.edge);
    innerEdge.position.copy(rib.position); innerEdge.position.z += .03;
  }
  for (let section = 0; section < 4; section++) {
    const z = -2.86 + section * 1.42;
    for (let band = 0; band < 16; band++) {
      const angle = band / 16 * Math.PI * 2;
      const tangent = new THREE.Vector3(Math.cos(angle), -Math.sin(angle), 0);
      const axis = new THREE.Vector3(0, 0, 1);
      const inward = new THREE.Vector3(-Math.sin(angle), -Math.cos(angle), 0);
      const panel = new THREE.Group();
      panel.position.set(Math.sin(angle) * 2.33, hullCenter + Math.cos(angle) * 2.33, z);
      panel.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangent, axis, inward));
      scene.add(panel);
      box(.86, 1.19, .035, band % 3 === 0 ? mats.inset : mats.panel, [0, 0, 0], panel);
      box(.75, .015, .007, mats.black, [0, .42, .026], panel);
      box(.75, .015, .007, mats.black, [0, -.42, .026], panel);
      for (const x of [-.35, .35]) for (const y of [-.49, .49]) bolt(x, y, .035, panel, .012);
      if (band % 4 === 0) {
        const plaque = label(`RV-01 / ${String(section * 16 + band).padStart(3, '0')}`, .53, .07, panel);
        plaque.position.set(0, -.26, .024);
      }
    }
  }

  // The forward bulkhead is a circular wall with an actual small viewport opening.
  const wallShape = new THREE.Shape();
  wallShape.absarc(0, 0, 2.34, 0, Math.PI * 2, false);
  const viewportY = hullCenter + 1.76;
  const opening = new THREE.Path(); opening.absarc(0, 1.76, .32, 0, Math.PI * 2, true);
  wallShape.holes.push(opening);
  const bulkhead = mesh(new THREE.ExtrudeGeometry(wallShape, { depth: .12, bevelEnabled: false, curveSegments: 48 }), mats.inset);
  bulkhead.position.set(0, hullCenter, -3.77);
  const frontRim = mesh(new THREE.TorusGeometry(2.16, .045, 6, 64), mats.rib);
  frontRim.position.set(0, hullCenter, -3.59);
  const windowRing = mesh(new THREE.TorusGeometry(.345, .042, 6, 48), mats.edge);
  windowRing.position.set(0, viewportY, -3.58);
  const innerRing = mesh(new THREE.TorusGeometry(.296, .014, 6, 48), mats.black);
  innerRing.position.copy(windowRing.position); innerRing.position.z += .017;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    bolt(Math.sin(a) * .345, viewportY + Math.cos(a) * .345, -3.515, scene, .013);
  }
  const viewportBack = mesh(new THREE.CircleGeometry(.33, 48), new THREE.MeshBasicMaterial({ color: '#020a18' }));
  viewportBack.position.set(0, viewportY, -3.88);
  const starPositions = [];
  for (let i = 0; i < 60; i++) {
    const a = i * 2.39996, r = Math.sqrt((i + .5) / 60) * .295;
    starPositions.push(Math.cos(a) * r, viewportY + Math.sin(a) * r, -3.82);
  }
  const starsGeo = new THREE.BufferGeometry(); starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const viewportStars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: '#cbdff6', size: .009, sizeAttenuation: true }));
  scene.add(viewportStars);
  const planet = mesh(new THREE.SphereGeometry(.13, 24, 16), material('#5c759f', 1, 0));
  planet.position.set(.1, viewportY - .18, -3.82);

  // Foreground structure and conduits curve around the pilot rather than framing a page.
  for (const side of [-1, 1]) {
    tube([[side * 1.9, .25, .9], [side * 2.05, .3, -.4], [side * 1.95, .45, -1.8], [side * 1.63, .2, -3.3]], .055, mats.black);
    tube([[side * 1.93, .25, .9], [side * 2.08, .3, -.4], [side * 1.98, .45, -1.8], [side * 1.66, .2, -3.3]], .018, mats.amber);
    tube([[side * .75, 2.91, 1.6], [side * .77, 2.91, -.5], [side * .77, 2.86, -3.3]], .052, mats.rib);
    box(.035, .025, 2.3, mats.cyan, [side * .7, 2.91, -1.0]);
    for (let i = 0; i < 5; i++) {
      const floorTile = box(.95, .12, 1.08, mats.panel, [side * .54, -.91, -.8 + i * .58]);
      floorTile.castShadow = false;
    }
  }
  const rearSeat = chamfer(1.35, 1.6, .25, mats.grip);
  rearSeat.position.set(0, .42, 1.42); rearSeat.rotation.x = -.15;
  for (const side of [-1, 1]) {
    const arm = chamfer(.27, .24, 1.3, mats.grip);
    arm.position.set(side * .82, .3, .13);
    tube([[side * .85, .41, .72], [side * .9, .45, -.26], [side * .78, .44, -.79]], .055, mats.rib);
    box(.04, .014, .52, mats.warm, [side * .82, .435, -.34]);
  }

  // The hologram hangs in the cabin in front of a projector pedestal.
  const projectionWidth = 3.92, projectionHeight = 2.245;
  const hologramPosition = new THREE.Vector3(0, 1.1, -2.9);
  const emitter = chamfer(3.6, .24, .52, mats.housing);
  emitter.position.set(0, -.24, -2.77); emitter.rotation.x = -.09;
  box(3.34, .022, .035, mats.cyan, [0, -.125, -2.52]);
  for (const x of [-1.5, 0, 1.5]) {
    const emitterLens = mesh(new THREE.CylinderGeometry(.07, .08, .027, 16), mats.cyan);
    emitterLens.position.set(x, -.098, -2.64); glow([x, -.07, -2.64], .55);
  }
  const holoOutline = [[-projectionWidth / 2, -projectionHeight / 2, 0], [-projectionWidth / 2, projectionHeight / 2, 0], [projectionWidth / 2, projectionHeight / 2, 0], [projectionWidth / 2, -projectionHeight / 2, 0], [-projectionWidth / 2, -projectionHeight / 2, 0]];
  const holoFrame = new THREE.Group(); holoFrame.position.copy(hologramPosition); scene.add(holoFrame);
  line(holoOutline, '#a0eeef', .28, holoFrame);
  for (const side of [-1, 1]) {
    line([[side * 1.5, -.08, -2.64], [side * 1.95, 2.22, -2.9]], '#79deed', .11);
    line([[side * 1.5, -.08, -2.64], [side * .35, 2.22, -2.9]], '#79deed', .045);
    const pedestalSupport = chamfer(.24, .68, .22, mats.rib);
    pedestalSupport.position.set(side * 1.38, -.61, -2.81);
  }
  const forwardLabel = label('RV-01 / FORWARD VIEWPORT', 1.3, .08);
  forwardLabel.position.set(-1.0, 2.72, -3.57);
  const projectorLabel = label('H O L O G R A P H I C   P R O J E C T O R', 2.2, .07);
  projectorLabel.position.set(0, -.257, -2.465);

  const surfaces = [];
  function mountSurface(selector, width, height, scale, position, rotation, zone) {
    const element = document.querySelector(selector);
    const placeholder = document.createComment(`restore ${zone}`);
    element.before(placeholder);
    const originalStyle = element.getAttribute('style');
    element.classList.add('spatial-surface', `spatial-${zone}`);
    element.dataset.zone = zone;
    element.style.width = `${width}px`; element.style.height = `${height}px`;
    const object = new CSS3DObject(element);
    object.position.set(...position); object.rotation.set(...rotation); object.scale.setScalar(scale);
    cssScene.add(object);
    surfaces.push({ object, element, placeholder, originalStyle, width, height, scale, zone });
    return object;
  }
  mountSurface('.command-center', 1100, 630, projectionWidth / 1100, [0, 1.1, -2.885], [0, 0, 0], 'forward');

  const panelYaw = THREE.MathUtils.degToRad(64);
  function sideConsole(side) {
    const group = new THREE.Group();
    group.position.set(side * 2.02, 1.15, -.72);
    group.rotation.y = -side * panelYaw;
    group.scale.setScalar(.9);
    scene.add(group);
    const backing = chamfer(1.49, 2.31, .21, mats.housing, group, .045);
    backing.position.z = -.115;
    const inner = chamfer(1.37, 2.17, .022, mats.black, group, .018);
    inner.position.z = .025;
    for (const x of [-.69, .69]) for (const y of [-1.08, 1.08]) bolt(x, y, .092, group, .021);
    box(.014, 1.83, .012, mats.cyan, [-.71 * side, .05, .069], group);
    glow([-.71 * side, .85, .09], .22, '#9de1ed', group);
    const bracket = chamfer(.22, .82, .34, mats.rib, group);
    bracket.position.set(side * .73, -.93, -.17);
    for (let i = 0; i < 6; i++) box(.1, .026, .02, mats.black, [side * .76, -.64 - i * .078, .017], group);
    tube([[side * .72, -.9, -.04], [side * .88, -.86, -.2], [side * .91, .24, -.26], [side * .68, .73, -.28]], .042, mats.black, group);
    const valve = mesh(new THREE.CylinderGeometry(.095, .095, .05, 12), mats.amber, group);
    valve.rotation.x = Math.PI / 2; valve.position.set(side * .84, -.83, .064);
    box(.023, .13, .023, mats.edge, [side * .84, -.83, .104], group);
    const source = side < 0 ? '.side-console-left' : '.side-console-right';
    mountSurface(source, 420, 672, 1.215 / 420, [side * 1.971, 1.15, -.696], [0, -side * panelYaw, 0], side < 0 ? 'port' : 'starboard');
    const badge = label(side < 0 ? 'PORT / BUILD SYSTEMS' : 'STARBOARD / PILOT RECORDS', 1.3, .105, group);
    badge.position.set(0, 1.29, .01);
    return group;
  }
  sideConsole(-1); sideConsole(1);

  // Separate physical surfaces above and below the eye line.
  const overheadGroup = new THREE.Group(); overheadGroup.position.set(0, 2.69, -1.73); overheadGroup.rotation.x = .58; scene.add(overheadGroup);
  const overheadHousing = chamfer(3.18, .53, .2, mats.housing, overheadGroup);
  for (const x of [-1.46, 1.46]) bolt(x, 0, .16, overheadGroup);
  mountSurface('.overhead', 1200, 180, .00255, [0, 2.69, -1.70], [.58, 0, 0], 'overhead');
  for (const side of [-1, 1]) {
    box(.035, .025, .28, mats.warm, [side * 1.18, 2.5, -1.54]);
    glow([side * 1.18, 2.48, -1.53], .38, '#f0c68d');
  }
  const lowerGroup = new THREE.Group(); lowerGroup.position.set(0, .04, -1.28); lowerGroup.rotation.x = -.65; scene.add(lowerGroup);
  chamfer(3.08, .67, .22, mats.housing, lowerGroup, .055);
  for (const x of [-1.42, 1.42]) bolt(x, 0, .15, lowerGroup);
  mountSurface('.lower-deck', 1100, 200, .0027, [0, .067, -1.255], [-.65, 0, 0], 'lower');
  const leverMount = chamfer(.22, .2, .18, mats.black);
  leverMount.position.set(1.1, .03, -.76);
  const lever = new THREE.Group(); lever.position.set(1.1, .14, -.76); scene.add(lever);
  const leverStem = box(.033, .25, .033, mats.edge, [0, .12, 0], lever);
  const leverGrip = chamfer(.11, .065, .068, mats.amber, lever, .008); leverGrip.position.y = .26;

  // Peripheral instruments fill the remaining spaces on the curved shell.
  for (const side of [-1, 1]) {
    const service = new THREE.Group(); service.position.set(side * 1.95, 2.08, .42); service.rotation.y = -side * 1.5; scene.add(service);
    chamfer(.6, .4, .1, mats.rib, service);
    for (let i = 0; i < 7; i++) box(.48, .021, .025, mats.black, [0, -.13 + i * .043, .068], service);
    const caution = label('SERVICE / 02', .45, .08, service, '#d8b580'); caution.position.set(0, .25, .055);
    const storage = new THREE.Group(); storage.position.set(side * 1.72, .1, .3); storage.rotation.y = -side * 1.28; scene.add(storage);
    chamfer(.82, .56, .14, mats.panel, storage);
    box(.24, .06, .045, mats.rib, [0, 0, .12], storage);
    const storageText = label('TOOLS / STOWED', .59, .07, storage); storageText.position.set(0, .17, .09);
  }

  const hud = document.createElement('div'); hud.id = 'flight-hud';
  hud.innerHTML = `<div class="view-controls" role="group" aria-label="Look around the cockpit"><button type="button" data-look="port" aria-label="Look left at projects">← <span>PORT</span></button><button type="button" data-look="forward" aria-label="Face forward and follow cursor"><span>FORWARD</span> ⊙</button><button type="button" data-look="starboard" aria-label="Look right at pilot records"><span>STARBOARD</span> →</button><button type="button" data-look="overhead" aria-label="Look up at auxiliary controls">AUX ↑</button><button type="button" data-look="lower" aria-label="Look down at the flight deck">DECK ↓</button></div><span class="look-readout" id="look-readout">FORWARD / 000°</span><nav aria-label="Accessible portfolio navigation"><button type="button" data-module="home">HOME</button><button type="button" data-look="port">PROJECTS</button><button type="button" data-module="profile">PROFILE</button><button type="button" data-module="resume">RESUME</button><button type="button" data-module="comms">COMMS</button></nav><span class="look-hint">MOVE CURSOR TO TURN YOUR HEAD</span>`;
  world.append(hud);

  let active = false, disposed = false;
  let yaw = 0, pitch = 0, targetYaw = 0, targetPitch = 0, yawVelocity = 0, pitchVelocity = 0;
  let manualView = false, dragGuard = false;
  let lastTime = performance.now(), lastReadout = 0;
  let thrust = 0;
  const lookLimit = THREE.MathUtils.degToRad(56);
  const cabinColor = new THREE.Color('#a0c5d8');
  const normalColor = new THREE.Color('#a0c5d8');
  const alertColor = new THREE.Color('#e46d66');
  const nightColor = new THREE.Color('#477da2');

  function lookAt(zone, keyboard = false) {
    manualView = zone !== 'forward' || keyboard;
    targetYaw = zone === 'port' ? lookLimit : zone === 'starboard' ? -lookLimit : 0;
    targetPitch = zone === 'overhead' ? .29 : zone === 'lower' ? -.29 : 0;
    if (reduced.matches) { yaw = targetYaw; pitch = targetPitch; yawVelocity = pitchVelocity = 0; }
    hud.dataset.manual = String(manualView);
    wake();
  }
  hud.addEventListener('click', event => {
    const lookButton = event.target.closest('[data-look]');
    if (lookButton) lookAt(lookButton.dataset.look);
    if (event.target.closest('[data-module]')) lookAt('forward', true);
  });
  document.addEventListener('focusin', event => {
    if (!active) return;
    const surface = event.target.closest('.spatial-surface');
    if (surface && event.target.matches(':focus-visible')) lookAt(surface.dataset.zone, true);
  });
  addEventListener('pointerdown', () => { dragGuard = true; });
  addEventListener('pointerup', () => { dragGuard = false; });
  addEventListener('pointermove', event => {
    if (!active || manualView || reduced.matches || event.pointerType === 'touch' || dragGuard) return;
    // Hold the camera while a physical control is under the cursor, so it stays clickable.
    if (event.target.closest('button,a') || event.target.closest('#diagnostics-overlay')) {
      targetYaw = yaw; targetPitch = pitch; yawVelocity *= .1; pitchVelocity *= .1;
      wake();
      return;
    }
    const x = THREE.MathUtils.clamp((event.clientX / innerWidth - .5) * 2, -1, 1);
    const y = THREE.MathUtils.clamp((event.clientY / innerHeight - .5) * 2, -1, 1);
    targetYaw = -x * lookLimit;
    targetPitch = -y * .28;
    wake();
  }, { passive: true });
  addEventListener('blur', () => { if (!manualView) { targetYaw = 0; targetPitch = 0; wake(); } });
  document.addEventListener('cockpit:module', event => {
    if (event.detail?.focusForward) lookAt('forward', true);
    holoLight.color.set(event.detail?.id === 'vynk' ? '#67a9e8' : event.detail?.id === 'chancify' ? '#6dcbd4' : '#77d6e8');
    wake();
  });

  function restoreSurface(surface) {
    surface.spatialStyle = surface.element.getAttribute('style');
    surface.placeholder.after(surface.element);
    if (surface.originalStyle === null) surface.element.removeAttribute('style');
    else surface.element.setAttribute('style', surface.originalStyle);
  }
  function resize() {
    const shouldActivate = desktop.matches;
    if (shouldActivate !== active) {
      active = shouldActivate;
      document.body.classList.toggle('spatial-active', active);
      if (!active) surfaces.forEach(restoreSurface);
      else {
        surfaces.forEach(surface => {
          if (surface.spatialStyle) surface.element.setAttribute('style', surface.spatialStyle);
          surface.element.style.width = `${surface.width}px`; surface.element.style.height = `${surface.height}px`;
          surface.element.style.position = 'absolute'; surface.element.style.pointerEvents = 'auto';
        });
        scrollTo(0, 0);
      }
      if (!active) document.querySelector('#render-fps').textContent = 'DOM MODE';
    }
    camera.aspect = innerWidth / innerHeight;
    // Keep a consistent horizontal framing on very wide monitors.
    camera.fov = camera.aspect > 2.2 ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(48)) / camera.aspect)) : 55;
    camera.updateProjectionMatrix();
    if (active) { renderer.setSize(innerWidth, innerHeight); css.setSize(innerWidth, innerHeight); }
    cssCamera = '';
    wake();
  }
  lever.rotation.x = .28;
  const batchStats = batchCabin(scene, new Set([lever, viewportStars]));
  cssScene.updateMatrixWorld(true);
  cssScene.traverse(object => { object.matrixAutoUpdate = false; });
  cssScene.matrixWorldAutoUpdate = false;
  for (const surface of surfaces) {
    surface.normal = new THREE.Vector3(0, 0, 1).applyQuaternion(surface.object.quaternion);
    surface.bounds = new THREE.Box3(
      new THREE.Vector3(-surface.width * surface.scale / 2, -surface.height * surface.scale / 2, -.001),
      new THREE.Vector3(surface.width * surface.scale / 2, surface.height * surface.scale / 2, .001)
    ).applyMatrix4(new THREE.Matrix4().compose(surface.object.position, surface.object.quaternion, new THREE.Vector3(1, 1, 1)));
  }
  const profile = createRenderProfile(renderer, world);
  Object.assign(profile.state, { phase: 'optimized', ...batchStats, fpsCap: 60 });
  const frustum = new THREE.Frustum(), viewProjection = new THREE.Matrix4(), towardCamera = new THREE.Vector3();
  const readout = document.querySelector('#look-readout'), fpsReadout = document.querySelector('#render-fps');
  const adaptiveQuality = createAdaptiveQuality(Math.min(devicePixelRatio, 1.5), dpr => {
    renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight);
  });
  let nextFrameAt = 0, lastActivity = performance.now(), lastRender = 0;
  let lastMode = '', shadowLeverAngle = lever.rotation.x, cssCamera = '';
  let renderMode = 'interactive';
  const scheduler = createFrameScheduler(animate, { isActive: () => active && !disposed && !document.hidden });

  function cancelPending() {
    scheduler.cancel();
  }
  function setMode(mode) {
    renderMode = mode; profile.state.mode = mode;
    if (world.dataset.renderState !== mode) world.dataset.renderState = mode;
  }
  function schedule() {
    if (disposed) return;
    if (document.hidden || !active) {
      setMode(document.hidden ? 'hidden' : 'mobile');
      profile.publish();
      return;
    }
    scheduler.requestAt(nextFrameAt);
  }
  function wake() {
    lastActivity = performance.now();
    cancelPending(); nextFrameAt = Math.max(0, lastRender + 1000 / 60);
    schedule();
  }
  function animate(time) {
    if (disposed || !active || document.hidden) { schedule(); return; }
    if (time < nextFrameAt - .2) { schedule(); return; }
    const elapsed = (time - lastTime) / 1000;
    const dt = Math.min(elapsed, .04); lastTime = time;
    const moving = Math.abs(targetYaw - yaw) + Math.abs(targetPitch - pitch) > .0001 || Math.abs(yawVelocity) + Math.abs(pitchVelocity) > .001;
    const thrustTarget = document.body.dataset.thrust === 'on' ? 1 : 0;
    const mode = document.body.dataset.light;
    cabinColor.copy(mode === 'red' ? alertColor : mode === 'night' ? nightColor : normalColor);
    const lightMoving = Math.abs(cabinLight.color.r - cabinColor.r) + Math.abs(cabinLight.color.g - cabinColor.g) + Math.abs(cabinLight.color.b - cabinColor.b) > .001;
    const interacting = moving || lightMoving || Math.abs(thrust - thrustTarget) > .001 || time - lastActivity < 1000;
    setMode(interacting || (thrustTarget && !reduced.matches) ? 'interactive' : mode === 'red' && !reduced.matches ? 'alert' : 'idle');
    profile.begin();
    const damping = Math.exp(-9 * dt);
    yawVelocity = (yawVelocity + (targetYaw - yaw) * 65 * dt) * damping;
    pitchVelocity = (pitchVelocity + (targetPitch - pitch) * 65 * dt) * damping;
    yaw += yawVelocity * dt; pitch += pitchVelocity * dt;
    camera.position.copy(seat);
    if (!reduced.matches) camera.position.y += Math.sin(time * .0007) * .002;
    thrust += (thrustTarget - thrust) * (1 - Math.exp(-4 * dt));
    if (!reduced.matches) camera.position.x += Math.sin(time * .037) * .0008 * thrust;
    camera.rotation.set(pitch, yaw, 0);
    lever.rotation.x = THREE.MathUtils.lerp(.28, -.25, thrust);
    if (Math.abs(lever.rotation.x - shadowLeverAngle) > .001) {
      renderer.shadowMap.needsUpdate = true;
      shadowLeverAngle = lever.rotation.x;
    }
    lever.updateMatrixWorld(true);
    cabinLight.color.lerp(cabinColor, 1 - Math.exp(-3 * dt));
    cabinLight.intensity = mode === 'red' ? 2.3 + (reduced.matches ? 0 : Math.sin(time * .0017) * .7) : mode === 'night' ? .6 : 3.1;
    hemi.intensity = mode === 'night' ? .72 : 1.55;
    viewportStars.rotation.z = reduced.matches ? 0 : Math.sin(time * .00001) * .03;
    viewportStars.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(viewProjection);
    let surfacesChanged = false;
    for (const surface of surfaces) {
      towardCamera.subVectors(camera.position, surface.object.position);
      const visible = towardCamera.dot(surface.normal) > .1 && frustum.intersectsBox(surface.bounds);
      if (surface.object.visible !== visible) {
        surface.object.visible = visible; surfacesChanged = true;
      }
      const visibility = String(visible);
      if (surface.element.dataset.visible !== visibility) surface.element.dataset.visible = visibility;
    }
    renderer.render(scene, camera);
    const pose = `${yaw},${pitch},${camera.position.x},${camera.position.y}`;
    if (surfacesChanged || pose !== cssCamera) { css.render(cssScene, camera); cssCamera = pose; }
    const cost = profile.end();
    adaptiveQuality.sample(cost, elapsed, time, renderMode !== 'idle', renderMode === 'alert' ? 30 : 60);
    if (time - lastReadout > 100) {
      const vertical = Math.abs(yaw) < .15 && Math.abs(pitch) > .16;
      const degrees = Math.abs(THREE.MathUtils.radToDeg(vertical ? pitch : yaw));
      const direction = vertical ? pitch > 0 ? 'OVERHEAD' : 'FLIGHT DECK' : Math.abs(yaw) < .15 ? 'FORWARD' : yaw > 0 ? 'PORT' : 'STARBOARD';
      const text = `${direction} / ${String(Math.round(degrees)).padStart(3, '0')}°`;
      if (readout.textContent !== text) readout.textContent = text;
      if (world.dataset.view !== direction.toLowerCase()) world.dataset.view = direction.toLowerCase();
      const fpsText = `${profile.state.fps} FPS${renderMode === 'idle' ? ' / IDLE' : ''}`;
      if (fpsReadout.textContent !== fpsText) fpsReadout.textContent = fpsText;
      lastReadout = time;
    }
    lastRender = time;
    const interval = renderMode === 'interactive' ? 1000 / 60 : renderMode === 'alert' ? 1000 / 30 : 250;
    nextFrameAt = lastMode === renderMode ? Math.max(time + interval - .2, nextFrameAt + interval) : time + interval;
    lastMode = renderMode;
    if (reduced.matches && renderMode === 'idle') { profile.publish(); return; }
    schedule();
  }
  const bodyChanges = new MutationObserver(wake);
  bodyChanges.observe(document.body, { attributes: true, attributeFilter: ['data-light', 'data-thrust'] });
  function visibilityChanged() {
    profile.visibility(document.hidden);
    document.body.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) { cancelPending(); setMode('hidden'); profile.publish(); }
    else { lastTime = performance.now(); wake(); }
  }
  document.addEventListener('visibilitychange', visibilityChanged);
  reduced.addEventListener('change', wake);
  addEventListener('resize', resize);
  resize();
  renderer.compile(scene, camera);
  visibilityChanged();
  return {
    lookAt,
    dispose() {
      disposed = true; scheduler.dispose(); bodyChanges.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      reduced.removeEventListener('change', wake); removeEventListener('resize', resize);
      surfaces.forEach(restoreSurface); renderer.dispose(); profile.dispose();
      renderer.domElement.remove(); css.domElement.remove(); hud.remove(); document.body.classList.remove('spatial-active');
    }
  };
}
