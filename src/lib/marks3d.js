import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import gsap from "gsap";

/**
 * The five coloured marks in 3D: soft cubes with the app icon's corners (28/128 of the side) and two white
 * eyes on the front face, in matte vinyl. Each colour has its own character, in the face and in the way it
 * moves (MOODS below). One module for every live scene and for the still renders.
 *
 * <div data-nb-marks3d="play">   hero: the five play together (a wave of hops, passing a coin, a tower,
 *                                leapfrog), fidget in character, turn toward the pointer, blink, and each one
 *                                answers a click in its own way, even in the middle of a game
 * <div data-nb-marks3d="lineup"> final call to action: the five stand in a row inside the card; when one
 *                                jumps it comes forward, out over the card's edge, and lands back inside
 * A poster <img data-nb-marks3d-poster> inside the box stays visible without script or WebGL.
 * The canvas never takes clicks itself (it can sit over buttons): clicks are hit-tested on the page.
 * With reduced motion the scene is drawn once, still. Rendering stops while the box is off screen.
 */

export const MARK_HEX = { coral: "#FE765C", amber: "#FEAD42", mint: "#A7E2BC", lavender: "#C6A7E8", blue: "#0259EE" };
export const MARK_ORDER = ["coral", "amber", "mint", "lavender", "blue"];

/**
 * Characters. face: the lids or cheeks drawn over the eyes. breath: [speed, depth]. look: how fast it turns to
 * the pointer (speed), how far (range), a resting tilt (pitch, + looks down), away: looks away when looked at.
 * blink: [min, max] seconds between blinks, close: how long the eyes take to close. jump: height of its hops.
 * out: how far forward it comes when it jumps out of the card (lineup).
 */
export const MOODS = {
  coral: { name: "grumpy", face: "angry", breath: [2.8, 1.7], look: { speed: 6.5, range: 0.75, pitch: 0.04 }, blink: [4, 8], close: 0.07, jump: 0.7, out: 0.95 },
  amber: { name: "cheerful", face: "happy", breath: [2.3, 1.3], look: { speed: 4.5, range: 0.75, pitch: -0.06, wobble: 0.05 }, blink: [2, 4.5], close: 0.08, jump: 1.15, out: 1 },
  mint: { name: "sleepy", face: "sleepy", breath: [0.9, 1.7], look: { speed: 1.5, range: 0.45, pitch: 0.08 }, blink: [2.6, 5], close: 0.24, jump: 0.85, out: 0.9 },
  lavender: { name: "shy", face: "shy", breath: [1.7, 0.8], look: { speed: 3, range: 0.6, pitch: 0.16, away: true }, blink: [2.2, 4.5], close: 0.09, jump: 0.6, out: 0.65 },
  blue: { name: "sad", face: "sad", breath: [1.05, 1.1], look: { speed: 1.7, range: 0.4, pitch: 0.28 }, blink: [3, 6], close: 0.16, jump: 0.45, out: 0.72, droop: 0.965 },
};

const TAU = Math.PI * 2;
const R = 0.22; // corner radius of a 1-unit cube, as on the app icon

/* ---------- shared pieces ---------- */

function radialTexture(stops) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([at, color]) => grad.addColorStop(at, color));
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let shared = null;
function parts() {
  if (shared) return shared;
  const cheek = new THREE.CylinderGeometry(0.12, 0.12, 0.024, 40);
  cheek.rotateX(Math.PI / 2);
  shared = {
    body: new RoundedBoxGeometry(1, 1, 1, 5, R),
    eye: new THREE.SphereGeometry(0.1, 24, 12),
    lid: new RoundedBoxGeometry(0.27, 0.13, 0.024, 2, 0.011),
    cheek,
    blush: new THREE.CircleGeometry(0.058, 28),
    plane: new THREE.PlaneGeometry(1, 1),
    coin: new THREE.CylinderGeometry(0.3, 0.3, 0.07, 48),
    eyeMat: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.28 }),
    coinMat: new THREE.MeshStandardMaterial({ color: 0xf4f4f2, metalness: 0.35, roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.12 }),
    shadowTex: radialTexture([[0, "rgba(0,0,0,0.5)"], [0.45, "rgba(0,0,0,0.24)"], [1, "rgba(0,0,0,0)"]]),
    glowTex: radialTexture([[0, "rgba(255,255,255,0.9)"], [0.35, "rgba(255,255,255,0.35)"], [1, "rgba(255,255,255,0)"]]),
  };
  return shared;
}

// matte vinyl: a standard material is enough with the room light around it, and cheap on phones
function bodyMaterial(hex) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.44, metalness: 0 });
}

/** The face: lids or cheeks in the body's own colour, laid over the eyes; pink blush for the shy one. */
function buildFace(m, kind, mat) {
  const p = parts();
  const face = new THREE.Group();
  face.position.copy(m.eyes.position);
  const add = (geo, x, y, z, rz = 0) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rz;
    face.add(mesh);
    return mesh;
  };
  for (const s of [-1, 1]) {
    const x = s * 0.145;
    // angry: the inner ends low (a frown); sad: the inner ends high; sleepy: level, half down
    if (kind === "angry") add(p.lid, x, 0.105, 0.02, s * 0.44);
    if (kind === "sad") add(p.lid, x + s * 0.01, 0.112, 0.02, -s * 0.34);
    if (kind === "sleepy") add(p.lid, x, 0.086, 0.02);
    // happy: round cheeks pushed up under the eyes, so only an arch of each eye shows
    if (kind === "happy") add(p.cheek, x, -0.098, 0.02);
    if (kind === "shy") {
      const blush = new THREE.Mesh(p.blush, new THREE.MeshBasicMaterial({ color: 0xff7aa2, transparent: true, opacity: 0.5, depthWrite: false }));
      blush.position.set(s * 0.255, -0.115, 0.004);
      face.add(blush);
      m.blush.push(blush);
    }
  }
  if (kind === "shy") {
    m.eyes.scale.set(0.86, 0.86, 1);
    m.eyes.position.y -= 0.012;
  }
  if (kind === "sad") m.eyes.position.y -= 0.016;
  m.eyeY = m.eyes.scale.y;
  return face;
}

/**
 * One mark: root (place, game jumps and spins) > pop (click answers, on top of any game) > squash (from the
 * ground) > fidget (its little habits) > breath > body (centre) > look (toward the pointer) > mesh, eyes, face.
 */
export function createMark(color) {
  const p = parts();
  const mood = MOODS[color] || MOODS.amber;
  const root = new THREE.Group();
  const pop = new THREE.Group();
  const squash = new THREE.Group();
  const fidget = new THREE.Group();
  const breath = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.5;
  const look = new THREE.Group();
  const mat = bodyMaterial(MARK_HEX[color] || color);
  const mesh = new THREE.Mesh(p.body, mat);
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.02, 0.5);
  for (const x of [-0.145, 0.145]) {
    const e = new THREE.Mesh(p.eye, p.eyeMat);
    e.scale.set(1, 1, 0.42);
    e.position.set(x, 0, -0.014);
    eyes.add(e);
  }
  const m = { color, mood, root, pop, squash, fidget, breath, body, look, eyes, mesh, blush: [], home: new THREE.Vector3(), yaw: 0, busy: false, reacting: false, phase: Math.random() * TAU };
  const face = buildFace(m, mood.face, mat);
  look.add(mesh, eyes, face);
  body.add(look);
  breath.add(body);
  fidget.add(breath);
  squash.add(fidget);
  pop.add(squash);
  root.add(pop);
  const shadow = new THREE.Mesh(p.plane, new THREE.MeshBasicMaterial({ map: p.shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.setScalar(1.6);
  m.shadow = shadow;
  mesh.userData.mark = m;
  return m;
}

function lights(scene, renderer, { dark = true } = {}) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = dark ? 0.68 : 0.72;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a2a, dark ? 0.8 : 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(-3.5, 6, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 1.05);
  fill.position.set(2.5, 2, 6);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, dark ? 2.2 : 1.0);
  rim.position.set(4, 3, -4.5);
  scene.add(rim);
}

function makeRenderer(width, height, dpr, keep = false) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: keep });
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.22;
  return renderer;
}

/* ---------- layouts ---------- */

const LAYOUTS = {
  // hero: a loose cluster, three in front and two behind, on a soft pool of light
  play: {
    homes: [[-2.15, 0.55], [-1.05, -0.75], [0.1, 0.75], [1.2, -0.65], [2.25, 0.5]],
    yaws: [0.3, 0.14, -0.03, -0.16, -0.32],
    need: [6.5, 4.4], // world width and height the camera must show (room for a spin at the edges)
    fov: 30,
    tilt: 0.4,
    ground: 0.3, // where the floor line sits, from the bottom of the box
    glow: true,
  },
  // call to action: a row standing inside the card, the box reaching below the card so jumps can come out
  lineup: {
    homes: [[-2.9, 0], [-1.45, 0], [0, 0], [1.45, 0], [2.9, 0]],
    yaws: [0.2, 0.09, 0, -0.09, -0.2],
    need: [8.4, 3.8],
    fov: 24,
    tilt: 0.2,
    ground: 0.44,
    edge: 1.4, // depth of the card's bottom edge on the floor: in front of it there is no floor, so no shadow
    out: 3.4, // how far a jump comes toward the viewer
    glow: false,
  },
};

/** Distance from the need, then the height that puts the floor line where the layout wants it. */
function frame(camera, layout, aspect) {
  const [w, h] = layout.need;
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const d = Math.max(w / (2 * t * aspect), h / (2 * t));
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  const place = (L) => {
    camera.position.set(0, L + d * Math.sin(layout.tilt), d * Math.cos(layout.tilt));
    camera.lookAt(0, L, 0);
    camera.updateMatrixWorld();
  };
  const target = layout.ground * 2 - 1; // NDC
  const v = new THREE.Vector3();
  let lo = -h;
  let hi = h;
  for (let i = 0; i < 28; i += 1) {
    const mid = (lo + hi) / 2;
    place(mid);
    v.set(0, 0, 0).project(camera);
    if (v.y > target) lo = mid;
    else hi = mid;
  }
  place((lo + hi) / 2);
}

function buildScene(mode, renderer, aspect) {
  const layout = LAYOUTS[mode];
  const scene = new THREE.Scene();
  lights(scene, renderer, { dark: true });
  const camera = new THREE.PerspectiveCamera(layout.fov, aspect, 0.1, 200);
  frame(camera, layout, aspect);
  if (layout.glow) {
    const p = parts();
    const glow = new THREE.Mesh(p.plane, new THREE.MeshBasicMaterial({ map: p.glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.2 }));
    glow.rotation.x = -Math.PI / 2;
    glow.scale.set(9, 5, 1);
    glow.position.y = 0.001;
    scene.add(glow);
  }
  const marks = MARK_ORDER.map((color, i) => {
    const m = createMark(color);
    const [x, z] = layout.homes[i];
    m.home.set(x, 0, z);
    m.yaw = layout.yaws[i];
    m.root.position.copy(m.home);
    m.root.rotation.y = m.yaw;
    m.shadow.position.set(x, 0.003, z);
    restingPose(m);
    scene.add(m.root, m.shadow);
    return m;
  });
  return { scene, camera, marks, layout };
}

/** The pose a mark keeps when nothing is going on: the sad one slumped and looking down, the shy one aside. */
function restingPose(m) {
  const { mood } = m;
  m.look.rotation.x = mood.look.pitch;
  if (mood.look.away) m.look.rotation.y = 0.28;
  if (mood.droop) m.breath.scale.y = mood.droop;
}

/* ---------- still renders (posters, the small marks and the ones on the product cards) ---------- */

/**
 * Render a still. A whole scene for a mode (posters), or one mark (`color`): `view: "icon"` for the small
 * marks (avatars), `view: "perch"` seen a little from above, as if standing on a card, with the rim light of
 * the dark scenes (`dark: true`). Each mark keeps its character's resting pose. Returns a canvas with a
 * transparent background.
 */
export function renderStill({ mode = "play", color = null, view = "icon", dark = false, width = 512, height = 512, blink = false, dpr = 1 } = {}) {
  const renderer = makeRenderer(width, height, dpr, true);
  let scene, camera;
  if (color) {
    scene = new THREE.Scene();
    lights(scene, renderer, { dark });
    camera = new THREE.PerspectiveCamera(24, width / height, 0.1, 50);
    if (view === "perch") camera.position.set(0.12, 1.6, 3.6);
    else camera.position.set(0.5, 1.25, 3.2);
    camera.lookAt(0, 0.5, 0);
    const m = createMark(color);
    m.root.rotation.y = view === "perch" ? -0.32 : -0.26;
    restingPose(m);
    m.look.rotation.x = m.mood.look.pitch * 0.6;
    if (m.mood.look.away) m.look.rotation.y = 0.2;
    if (blink) m.eyes.scale.y = 0.12;
    scene.add(m.root);
  } else {
    ({ scene, camera } = buildScene(mode, renderer, width / height));
  }
  renderer.render(scene, camera);
  return renderer.domElement;
}

/* ---------- motion: soft, floaty arcs ---------- */

function hop(m, o = {}) {
  const p = m.root.position;
  const s = m.squash.scale;
  const dur = o.dur ?? 0.95;
  const height = o.height ?? 0.8;
  const toY = o.y ?? 0;
  let startY = 0;
  const tl = gsap.timeline();
  tl.add(() => (startY = p.y))
    .to(s, { x: 1.07, y: 0.9, z: 1.07, duration: 0.2, ease: "sine.inOut" })
    .addLabel("air")
    .to(s, { x: 0.97, y: 1.05, z: 0.97, duration: 0.24, ease: "sine.out" }, "air")
    .to(s, { x: 1, y: 1, z: 1, duration: dur * 0.5, ease: "sine.inOut" }, "air+=0.24")
    .to(p, { y: () => Math.max(startY, toY) + height, duration: dur / 2, ease: "power1.out" }, "air")
    .to(p, { y: toY, duration: dur / 2, ease: "power1.in" }, `air+=${dur / 2}`);
  if (o.x !== undefined || o.z !== undefined) {
    tl.to(p, { x: o.x ?? p.x, z: o.z ?? p.z, duration: dur, ease: "sine.inOut" }, "air");
  }
  if (o.forward) {
    // out toward the viewer at the top of the arc, back to its place on landing
    tl.to(p, { z: `+=${o.forward}`, duration: dur / 2, ease: "sine.out" }, "air").to(p, { z: `-=${o.forward}`, duration: dur / 2, ease: "sine.in" }, `air+=${dur / 2}`);
  }
  if (o.spin) tl.to(m.root.rotation, { y: `+=${o.spin * TAU}`, duration: dur, ease: "sine.inOut" }, "air");
  tl.to(s, { x: 1.06, y: 0.92, z: 1.06, duration: 0.12, ease: "sine.out" }, `air+=${dur}`).to(s, { x: 1, y: 1, z: 1, duration: 0.5, ease: "sine.inOut" });
  return tl;
}

/** A jump on the pop group (so it can happen in the middle of a game), toward the viewer if `forward`. */
function popJump(tl, m, { height, up, forward = 0, spin = 0, at = 0 }) {
  const pp = m.pop.position;
  const ps = m.pop.scale;
  tl.to(ps, { x: 1.08, y: 0.88, z: 1.08, duration: 0.18, ease: "sine.inOut" }, at)
    .addLabel("air", ">")
    .to(ps, { x: 0.96, y: 1.06, z: 0.96, duration: 0.22, ease: "sine.out" }, "air")
    .to(ps, { x: 1, y: 1, z: 1, duration: up * 0.8, ease: "sine.inOut" }, "air+=0.22")
    .to(pp, { y: height, duration: up, ease: "power1.out" }, "air")
    .to(pp, { y: 0, duration: up, ease: "power1.in" }, `air+=${up}`);
  if (forward) tl.to(pp, { z: forward, duration: up, ease: "sine.out" }, "air").to(pp, { z: 0, duration: up, ease: "sine.in" }, `air+=${up}`);
  if (spin) tl.to(m.pop.rotation, { y: `+=${spin * TAU}`, duration: up * 2, ease: "sine.inOut" }, "air");
  tl.to(ps, { x: 1.06, y: 0.92, z: 1.06, duration: 0.12, ease: "sine.out" }, `air+=${up * 2}`).to(ps, { x: 1, y: 1, z: 1, duration: 0.45, ease: "sine.inOut" });
  return tl;
}

/**
 * A click, answered in character. In the row of the call to action the jumps stay low (`lift`) and come
 * forward instead (`out`): toward the viewer, over the card's edge.
 */
function react(m, { out = 0, lift = 1 } = {}) {
  if (m.reacting) return null;
  m.reacting = true;
  const tl = gsap.timeline({ onComplete: () => (m.reacting = false) });
  const forward = out * m.mood.out;
  const pr = m.pop.rotation;
  switch (m.mood.face) {
    case "happy": // a big jump with a full turn
      popJump(tl, m, { height: 1.2 * lift, up: 0.5, forward, spin: 1 });
      break;
    case "angry": // a short stomp of a jump, then shakes its head: no
      popJump(tl, m, { height: 0.55 * lift, up: 0.32, forward });
      tl.to(pr, { y: 0.38, duration: 0.09, ease: "sine.inOut", yoyo: true, repeat: 5 }, ">-0.2").to(pr, { y: 0, duration: 0.15, ease: "sine.out" });
      break;
    case "sleepy": // startled awake: eyes wide, a floaty jump with a slow turn
      m.eyesBusy = true;
      tl.eventCallback("onComplete", () => {
        m.reacting = false;
        m.eyesBusy = false;
      });
      tl.to(m.eyes.scale, { x: 1.15, y: m.eyeY * 1.25, duration: 0.12, ease: "sine.out" }, 0);
      popJump(tl, m, { height: 0.9 * lift, up: 0.6, forward, spin: 0.5, at: 0.05 });
      tl.to(pr, { y: `+=${TAU / 2}`, duration: 0.7, ease: "sine.inOut" }, ">-0.2").to(m.eyes.scale, { x: 1, y: m.eyeY, duration: 0.6, ease: "sine.inOut" }, "<");
      break;
    case "sad": // a small, slow jump, then a sigh
      popJump(tl, m, { height: 0.45 * lift, up: 0.55, forward });
      tl.to(m.pop.scale, { y: 0.9, x: 1.04, z: 1.04, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: 1 }, ">-0.1");
      break;
    case "shy": // shrinks, blushes and turns away, then a little hop back
      tl.to(m.pop.scale, { x: 1.08, y: 0.8, z: 1.08, duration: 0.25, ease: "sine.out" }, 0)
        .to(pr, { y: 0.75, duration: 0.35, ease: "sine.out" }, 0)
        .to(m.blush.map((b) => b.material), { opacity: 1, duration: 0.3, ease: "sine.out" }, 0)
        .to(m.pop.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: "sine.inOut" }, 0.9)
        .to(pr, { y: 0, duration: 0.5, ease: "sine.inOut" }, 0.9);
      popJump(tl, m, { height: 0.35 * lift, up: 0.32, forward, at: 1.0 });
      tl.to(m.blush.map((b) => b.material), { opacity: 0.5, duration: 0.8, ease: "sine.inOut" }, ">-0.2");
      break;
    default:
      popJump(tl, m, { height: 0.8 * lift, up: 0.45, forward });
  }
  return tl;
}

/** Its little habits, now and then, when it isn't playing or answering a click. */
function fidget(m) {
  const f = m.fidget;
  const tl = gsap.timeline();
  switch (m.mood.face) {
    case "happy": // two bounces in place, sometimes with a turn
      for (let i = 0; i < 2; i += 1) {
        tl.to(f.scale, { x: 1.05, y: 0.92, z: 1.05, duration: 0.12, ease: "sine.inOut" })
          .to(f.scale, { x: 0.98, y: 1.03, z: 0.98, duration: 0.18, ease: "sine.out" })
          .to(f.position, { y: 0.32, duration: 0.24, ease: "power1.out" }, "<")
          .to(f.position, { y: 0, duration: 0.24, ease: "power1.in" })
          .to(f.scale, { x: 1, y: 1, z: 1, duration: 0.25, ease: "sine.out" });
      }
      if (Math.random() < 0.4) tl.to(f.rotation, { y: `+=${TAU}`, duration: 0.9, ease: "sine.inOut" }, 0.3);
      break;
    case "angry": // fuming: puffs up and trembles, then two stomps
      tl.to(f.scale, { x: 1.06, y: 0.93, z: 1.06, duration: 0.25, ease: "sine.out" })
        .to(f.rotation, { z: 0.05, duration: 0.05, ease: "none", yoyo: true, repeat: 7 })
        .to(f.rotation, { z: 0, duration: 0.05 })
        .to(f.scale, { x: 1, y: 1, z: 1, duration: 0.2, ease: "sine.inOut" });
      for (let i = 0; i < 2; i += 1) {
        tl.to(f.position, { y: 0.14, duration: 0.11, ease: "power1.out" }).to(f.position, { y: 0, duration: 0.09, ease: "power1.in" }).to(f.scale, { x: 1.07, y: 0.9, z: 1.07, duration: 0.07, yoyo: true, repeat: 1, ease: "sine.out" });
      }
      break;
    case "sleepy": // dozes off, nods, wakes with a start
      m.eyesBusy = true;
      tl.eventCallback("onComplete", () => (m.eyesBusy = false));
      tl.to(m.eyes.scale, { y: m.eyeY * 0.14, duration: 1.1, ease: "sine.inOut" })
        .to(f.rotation, { x: 0.14, duration: 1.3, ease: "sine.inOut" }, "<0.3")
        .to(f.rotation, { x: 0.08, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 1 })
        .to(f.rotation, { x: 0, duration: 0.18, ease: "sine.out" }, ">0.2")
        .to(m.eyes.scale, { y: m.eyeY, duration: 0.14, ease: "sine.out" }, "<")
        .to(f.position, { y: 0.12, duration: 0.12, ease: "power1.out", yoyo: true, repeat: 1 }, "<");
      break;
    case "sad": // a long sigh, sinking a little and looking down
      tl.to(f.scale, { x: 1.03, y: 1.04, z: 1.03, duration: 0.8, ease: "sine.inOut" })
        .to(f.scale, { x: 1.04, y: 0.9, z: 1.04, duration: 1.3, ease: "sine.inOut" })
        .to(f.rotation, { x: 0.12, duration: 1.3, ease: "sine.inOut" }, "<")
        .to(f.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "sine.inOut" }, ">0.4")
        .to(f.rotation, { x: 0, duration: 1.2, ease: "sine.inOut" }, "<");
      break;
    case "shy": // peeks at you, blushes, hides its face
      tl.to(f.rotation, { y: -0.3, duration: 0.5, ease: "sine.inOut" })
        .to(m.blush.map((b) => b.material), { opacity: 0.95, duration: 0.3, ease: "sine.out" }, ">0.3")
        .to(f.rotation, { y: 0.55, duration: 0.35, ease: "sine.out" }, "<")
        .to(f.scale, { x: 1.04, y: 0.92, z: 1.04, duration: 0.3, ease: "sine.out" }, "<")
        .to(f.rotation, { y: 0, duration: 0.9, ease: "sine.inOut" }, ">0.8")
        .to(f.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "sine.inOut" }, "<")
        .to(m.blush.map((b) => b.material), { opacity: 0.5, duration: 0.9, ease: "sine.inOut" }, "<");
      break;
    default:
  }
  return tl;
}

function blinkLoop(m) {
  let call;
  const { blink, close } = m.mood;
  const next = () => {
    call = gsap.delayedCall(gsap.utils.random(blink[0], blink[1]), () => {
      // not while the eyes are doing something else (dozing, startled); the cheerful one sometimes blinks twice
      if (!m.eyesBusy) {
        const twice = m.mood.face === "happy" && Math.random() < 0.35;
        gsap.fromTo(m.eyes.scale, { y: m.eyeY }, { y: m.eyeY * 0.12, duration: close, yoyo: true, repeat: twice ? 3 : 1, repeatDelay: m.mood.face === "sleepy" ? 0.25 : 0, ease: "sine.inOut" });
      }
      next();
    });
  };
  next();
  return () => call?.kill();
}

/* ---------- live scenes ---------- */

export default function initMarks3D(root = document) {
  const boxes = [...root.querySelectorAll("[data-nb-marks3d]")];
  if (!boxes.length) return () => {};
  const cleanups = boxes.map((box) => {
    try {
      return setup(box);
    } catch (err) {
      // no WebGL: the poster stays
      return () => {};
    }
  });
  return () => cleanups.forEach((fn) => fn());
}

function setup(box) {
  const mode = box.dataset.nbMarks3d === "lineup" ? "lineup" : "play";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const poster = box.querySelector("[data-nb-marks3d-poster]");
  const area = box.parentElement; // where the hand cursor shows over a mark
  const rect = () => [Math.max(1, box.clientWidth), Math.max(1, box.clientHeight)];
  let [w, h] = rect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = makeRenderer(w, h, dpr);
  const canvas = renderer.domElement;
  canvas.className = "nb-marks3d__canvas";
  canvas.setAttribute("aria-hidden", "true");
  box.appendChild(canvas);

  const { scene, camera, marks, layout } = buildScene(mode, renderer, w / h);
  const offs = [];
  const tweens = new Set();
  let last = performance.now();
  let elapsed = 0;

  /* ----- where the eyes look ----- */
  const pointer = { active: false, ndc: new THREE.Vector2(), at: 0 };
  const focus = { point: null }; // a world point a game asks everyone to watch
  const attention = { mark: null, until: 0 }; // a clicked mark everyone glances at
  const tmpV = new THREE.Vector3();
  const lookPoint = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.6); // z = 2.6, in front of the marks
  const toNdc = (e, out) => {
    const r = canvas.getBoundingClientRect();
    out.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    return r;
  };
  const markAt = (e) => {
    const r = canvas.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return null;
    const ndc = new THREE.Vector2();
    toNdc(e, ndc);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(marks.map((m) => m.mesh), false)[0];
    return hit?.object.userData.mark || null;
  };

  /* ----- per frame: shadows, breathing, looking ----- */
  const update = (t, dt) => {
    const now = performance.now();
    const usePointer = pointer.active && now - pointer.at < 4000;
    if (usePointer) {
      ray.setFromCamera(pointer.ndc, camera);
      ray.ray.intersectPlane(plane, lookPoint);
    }
    const watched = attention.mark && now < attention.until ? attention.mark : null;
    for (const m of marks) {
      const { mood } = m;
      const p = m.root.position;
      const pp = m.pop.position;
      const y = p.y + pp.y + m.fidget.position.y;
      const sz = p.z + pp.z;
      m.shadow.position.set(p.x + pp.x, 0.003, sz);
      const lift = THREE.MathUtils.clamp(y / 2.6, 0, 1);
      // a mark standing on another casts its shadow on it, not on the floor: keep it simple, fade it
      let alpha = (1 - lift) * (p.y > 0.95 ? 0.15 : 1);
      // past the card's edge there is no floor
      if (layout.edge) alpha *= 1 - THREE.MathUtils.smoothstep(sz, layout.edge - 0.3, layout.edge + 0.3);
      m.shadow.material.opacity = alpha;
      m.shadow.scale.setScalar(1.6 * (1 - lift * 0.45));
      if (!reduce) {
        const b = Math.sin(t * mood.breath[0] + m.phase) * mood.breath[1];
        m.breath.scale.set(1 - b * 0.006, (mood.droop || 1) * (1 + b * 0.012), 1 - b * 0.006);
      }
      // target: a clicked friend, the pointer, the game's focus, or the viewer with a slow wander
      let target;
      let fromPointer = false;
      if (watched && watched !== m) target = watched.body.getWorldPosition(tmpV);
      else if (usePointer) {
        target = lookPoint;
        fromPointer = true;
      } else if (focus.point) target = focus.point;
      else target = tmpV.set(Math.sin(t * 0.3 + m.phase) * 1.4, 1.4 + Math.sin(t * 0.42 + m.phase) * 0.3, 6);
      m.body.getWorldPosition(m._wp || (m._wp = new THREE.Vector3()));
      const dx = target.x - m._wp.x;
      const dy = target.y - m._wp.y;
      const dz = Math.max(0.4, target.z - m._wp.z);
      // relative to the mark's resting yaw, so a spin during a jump stays visible
      let yaw = Math.atan2(dx, dz) - m.yaw;
      yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      // the shy one looks away from the pointer, and from the viewer when nothing is going on
      if (mood.look.away && (fromPointer || !focus.point)) yaw = -yaw * 0.5 + (yaw >= 0 ? -0.3 : 0.3);
      yaw = THREE.MathUtils.clamp(yaw, -mood.look.range, mood.look.range);
      const pitch = THREE.MathUtils.clamp(-Math.atan2(dy, Math.hypot(dx, dz)) * (mood.look.range / 0.75) + mood.look.pitch, -0.45, 0.5);
      const k = 1 - Math.exp(-dt * mood.look.speed);
      m.look.rotation.y += (yaw - m.look.rotation.y) * k;
      m.look.rotation.x += (pitch - m.look.rotation.x) * k;
      if (mood.look.wobble && !reduce) m.look.rotation.z = Math.sin(t * 2.1 + m.phase) * mood.look.wobble;
    }
  };

  /* ----- rendering only while visible ----- */
  let raf = 0;
  let visible = false;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    update(elapsed, dt);
    renderer.render(scene, camera);
  };
  const start = () => {
    if (raf || reduce) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const drawOnce = () => {
    update(0, 1);
    renderer.render(scene, camera);
  };

  const resize = () => {
    [w, h] = rect();
    renderer.setSize(w, h, false);
    frame(camera, layout, w / h);
    if (!raf) drawOnce();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(box);
  offs.push(() => ro.disconnect());

  const shown = () => box.classList.add("is-live");

  if (reduce) {
    drawOnce();
    shown();
    return () => {
      offs.forEach((fn) => fn());
      renderer.dispose();
      canvas.remove();
    };
  }

  /* ----- pointer: looking, hand cursor, clicks (hit-tested, the canvas lets clicks through) ----- */
  const onMove = (e) => {
    toNdc(e, pointer.ndc);
    pointer.active = true;
    pointer.at = performance.now();
    if (e.pointerType === "mouse") area.style.cursor = markAt(e) ? "pointer" : "";
  };
  const onDown = (e) => {
    if (e.button > 0 || e.target.closest?.("a, button, input, select, textarea, label")) return;
    const m = markAt(e);
    if (!m) return;
    const tl = react(m, mode === "lineup" ? { out: layout.out, lift: 0.4 } : {});
    if (!tl) return;
    attention.mark = m;
    attention.until = performance.now() + 1400;
    tweens.add(tl);
    const done = tl.eventCallback("onComplete");
    tl.eventCallback("onComplete", () => {
      done?.();
      tweens.delete(tl);
    });
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  offs.push(() => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    area.style.cursor = "";
  });

  /* ----- life: blinking ----- */
  marks.forEach((m) => offs.push(blinkLoop(m)));

  /* ----- entrance ----- */
  const intro = gsap.timeline({ paused: true });
  if (mode === "play") {
    marks.forEach((m, i) => {
      m.root.position.y = 5 + i * 0.35;
      const at = i * 0.16;
      intro
        .to(m.root.position, { y: 0, duration: 0.85, ease: "power2.in" }, at)
        .to(m.squash.scale, { x: 1.1, y: 0.86, z: 1.1, duration: 0.12, ease: "sine.out" }, at + 0.85)
        .to(m.squash.scale, { x: 1, y: 1, z: 1, duration: 0.55, ease: "sine.inOut" }, at + 0.97);
    });
  } else {
    // nothing clips the row any more (it stands over the card's edge): each one pops up in place
    marks.forEach((m, i) => {
      m.squash.scale.setScalar(0.001);
      const at = 0.15 + i * 0.12;
      intro
        .to(m.squash.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: "sine.out" }, at)
        .fromTo(m.root.position, { y: 0 }, { y: 0.45, duration: 0.35, ease: "power1.out", yoyo: true, repeat: 1, immediateRender: false }, at);
    });
  }

  /* ----- games (hero) and the odd jump out of the card (lineup) ----- */
  const coin = new THREE.Mesh(parts().coin, parts().coinMat);
  coin.rotation.x = Math.PI / 2;
  coin.visible = false;
  scene.add(coin);
  const head = (m) => new THREE.Vector3(m.root.position.x, m.root.position.y + 1.33, m.root.position.z);
  const jumpOf = (m, base) => base * (0.55 + m.mood.jump * 0.45); // each one jumps a little like itself

  const games = {
    wave() {
      const tl = gsap.timeline();
      marks.forEach((m, i) => tl.add(hop(m, { height: jumpOf(m, 0.6), dur: 0.8, spin: m.mood.face === "happy" ? 1 : 0 }), i * 0.18));
      return tl;
    },
    coin() {
      const tl = gsap.timeline();
      const first = head(marks[0]);
      coin.position.set(first.x, first.y + 2.4, first.z);
      coin.scale.setScalar(0.001);
      focus.point = coin.position;
      tl.add(() => (coin.visible = true))
        .to(coin.scale, { x: 1, y: 1, z: 1, duration: 0.45, ease: "sine.out" })
        .to(coin.position, { y: first.y, duration: 0.75, ease: "power1.in" }, "<")
        .to(marks[0].squash.scale, { x: 1.06, y: 0.92, z: 1.06, duration: 0.14, yoyo: true, repeat: 1, ease: "sine.inOut" }, ">");
      for (let i = 0; i < marks.length - 1; i += 1) {
        const from = marks[i];
        const to = marks[i + 1];
        const a = head(from);
        const b = head(to);
        const arc = 0.95;
        tl.add(hop(from, { height: jumpOf(from, 0.35), dur: 0.6 }), ">+=0.08")
          .addLabel(`pass${i}`, "<+=0.2")
          .to(coin.position, { x: b.x, z: b.z, duration: arc, ease: "sine.inOut" }, `pass${i}`)
          .to(coin.position, { y: Math.max(a.y, b.y) + 1.5, duration: arc / 2, ease: "power1.out" }, `pass${i}`)
          .to(coin.position, { y: b.y, duration: arc / 2, ease: "power1.in" }, `pass${i}+=${arc / 2}`)
          .to(coin.rotation, { z: `+=${TAU}`, duration: arc, ease: "sine.inOut" }, `pass${i}`)
          .to(to.squash.scale, { x: 1.06, y: 0.92, z: 1.06, duration: 0.14, yoyo: true, repeat: 1, ease: "sine.inOut" }, `pass${i}+=${arc}`);
      }
      const last = marks[marks.length - 1];
      tl.add(hop(last, { height: 0.9, dur: 1.0, spin: 1 }), ">+=0.12")
        .to(coin.position, { y: `+=0.9`, duration: 0.5, ease: "power1.out" }, "<+=0.2")
        .to(coin.position, { y: head(last).y, duration: 0.5, ease: "power1.in" }, ">")
        .to(coin.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.45, ease: "sine.in" }, ">+=0.6")
        .add(() => {
          coin.visible = false;
          focus.point = null;
        });
      return tl;
    },
    tower() {
      const [, , mint, lavender, blue] = marks;
      const base = lavender.home;
      const top = new THREE.Vector3(base.x, 2.6, base.z);
      const tl = gsap.timeline();
      tl.add(() => (focus.point = top))
        .add(hop(blue, { x: base.x, z: base.z, y: 1, height: 0.9, dur: 1.0 }))
        .add(hop(mint, { x: base.x, z: base.z, y: 2, height: 1.0, dur: 1.15 }), ">+=0.2")
        .addLabel("wobble", ">+=0.15");
      [lavender, blue, mint].forEach((m, i) => {
        tl.to(m.root.rotation, { z: 0.05 * (i + 1), duration: 0.36, ease: "sine.inOut", yoyo: true, repeat: 3 }, "wobble");
      });
      tl.add(hop(mint, { x: mint.home.x, z: mint.home.z, y: 0, height: 0.6, dur: 1.05, spin: 1 }), ">+=0.25")
        .add(hop(blue, { x: blue.home.x, z: blue.home.z, y: 0, height: 0.6, dur: 1.0 }), "<+=0.35")
        .add(() => (focus.point = null), ">");
      return tl;
    },
    leapfrog() {
      const [coral, amber] = marks;
      const tl = gsap.timeline();
      tl.add(() => (focus.point = head(amber)))
        .to(amber.squash.scale, { x: 1.08, y: 0.78, z: 1.08, duration: 0.3, ease: "sine.inOut" }, 0.1)
        .add(hop(coral, { x: amber.home.x + (amber.home.x - coral.home.x) * 0.9, z: amber.home.z, height: 1.4, dur: 1.1 }), 0)
        .to(amber.squash.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "sine.inOut" }, 0.85)
        .add(hop(coral, { x: coral.home.x, z: coral.home.z, height: 1.4, dur: 1.1, spin: -1 }), ">+=0.4")
        .to(amber.squash.scale, { x: 1.08, y: 0.78, z: 1.08, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, "<+=0.05")
        .add(() => (focus.point = null));
      return tl;
    },
  };
  // who takes part in each game (the others carry on with their habits)
  const cast = { wave: marks, coin: marks, tower: marks.slice(2), leapfrog: marks.slice(0, 2) };

  let director = null;
  let current = null;
  let habits = null;
  const order = [];
  const nextGame = () => {
    if (!order.length) order.push(...gsap.utils.shuffle(Object.keys(games)));
    return order.shift();
  };
  const play = () => {
    if (mode === "play") {
      director = gsap.delayedCall(gsap.utils.random(2.6, 4.2), () => {
        const name = nextGame();
        cast[name].forEach((m) => (m.busy = true));
        current = games[name]();
        current.eventCallback("onComplete", () => {
          // every mark back at home, upright
          marks.forEach((m) => {
            m.busy = false;
            m.root.rotation.z = 0;
            m.root.rotation.y = m.yaw + Math.round((m.root.rotation.y - m.yaw) / TAU) * TAU;
          });
          current = null;
          play();
        });
      });
    } else {
      director = gsap.delayedCall(gsap.utils.random(3.5, 6.5), () => {
        const m = marks[Math.floor(Math.random() * marks.length)];
        if (!m.busy && !m.reacting) {
          m.busy = true;
          current = hop(m, { height: jumpOf(m, 0.48), dur: 0.95 + (1 - m.mood.jump) * 0.25, forward: layout.out * m.mood.out, spin: m.mood.face === "happy" ? 1 : 0 });
          current.eventCallback("onComplete", () => {
            m.busy = false;
            current = null;
          });
        }
        play();
      });
    }
  };
  // habits: every few seconds one free mark does its thing
  const live = () => {
    habits = gsap.delayedCall(gsap.utils.random(2.2, 4.5), () => {
      const free = marks.filter((m) => !m.busy && !m.reacting && !m.fidgeting);
      if (free.length) {
        const m = free[Math.floor(Math.random() * free.length)];
        m.fidgeting = true;
        const tl = fidget(m);
        tweens.add(tl);
        tl.eventCallback("onComplete", () => {
          m.fidgeting = false;
          tweens.delete(tl);
        });
      }
      live();
    });
  };

  let started = false;
  // the row waits until the card is well in view (it fades in with the section's own entrance)
  const ioOptions = mode === "lineup" ? { rootMargin: "0px 0px -18% 0px" } : {};
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      start();
      if (!started) {
        started = true;
        shown();
        intro.play();
        intro.eventCallback("onComplete", () => {
          play();
          live();
        });
      } else {
        director?.resume();
        current?.resume();
        habits?.resume();
      }
    } else {
      stop();
      director?.pause();
      current?.pause();
      habits?.pause();
    }
  }, ioOptions);
  io.observe(box);
  offs.push(() => io.disconnect());
  const onVis = () => (document.hidden ? stop() : visible && start());
  document.addEventListener("visibilitychange", onVis);
  offs.push(() => document.removeEventListener("visibilitychange", onVis));

  return () => {
    stop();
    intro.kill();
    director?.kill();
    current?.kill();
    habits?.kill();
    tweens.forEach((t) => t.kill());
    offs.forEach((fn) => fn());
    renderer.dispose();
    canvas.remove();
    box.classList.remove("is-live");
    if (poster) poster.hidden = false;
  };
}
