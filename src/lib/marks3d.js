import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import gsap from "gsap";

/**
 * The five coloured marks in 3D: soft cubes with the app icon's corners (28/128 of the side) and two white
 * eyes on the front face, in matte vinyl. One module for every live scene and for the still renders.
 *
 * <div data-nb-marks3d="play">   hero: the five play together (hops, passing a coin, a tower, leapfrog),
 *                                turn toward the pointer, blink, and jump when tapped, at any moment
 * <div data-nb-marks3d="lineup"> final call to action: the five in a row, rising in, blinking, looking,
 *                                and now and then one hops
 * <div data-nb-marks3d="solo" data-nb-color="coral" data-nb-side="right">
 *                                one mark on its own (the section where they introduce themselves): it drops
 *                                in when its row comes up, turns toward its words (data-nb-side) or the
 *                                pointer, bobs as if talking while you scroll through its text
 *                                ([data-nb-talk-text] in the same [data-nb-talk-row]) and jumps when tapped.
 *                                All the solo boxes share one renderer: each frame is copied into the box's
 *                                own 2D canvas, so the page holds one WebGL context for all of them.
 * A poster <img data-nb-marks3d-poster> inside the box stays visible without script or WebGL.
 * The box frames the scene; the canvas can reach above it (CSS --nb-head, a fraction of the box height) so
 * jumps are not cut at the top, while the marks keep the size and place they have in the box.
 * The canvas never takes clicks itself (it can lie over text and buttons): taps are hit-tested on the page.
 * With reduced motion the scene is drawn once, still. Rendering stops while the box is off screen.
 */

export const MARK_HEX = { coral: "#FE765C", amber: "#FEAD42", mint: "#A7E2BC", lavender: "#C6A7E8", blue: "#0259EE" };
export const MARK_ORDER = ["coral", "amber", "mint", "lavender", "blue"];

const TAU = Math.PI * 2;
const R = 0.22; // corner radius of a 1-unit cube, as on the app icon

/* ---------- shared pieces ---------- */

let shared = null;
function parts() {
  if (shared) return shared;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(0.45, "rgba(0,0,0,0.28)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(c);
  shadowTex.colorSpace = THREE.SRGBColorSpace;
  shared = {
    body: new RoundedBoxGeometry(1, 1, 1, 5, R),
    eye: new THREE.SphereGeometry(0.1, 24, 12),
    shadow: new THREE.PlaneGeometry(1.6, 1.6),
    coin: new THREE.CylinderGeometry(0.3, 0.3, 0.07, 48),
    eyeMat: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.28 }),
    coinMat: new THREE.MeshStandardMaterial({ color: 0xf2f2f0, metalness: 0.35, roughness: 0.22, emissive: 0xffffff, emissiveIntensity: 0.08 }),
    shadowTex,
  };
  return shared;
}

// matte vinyl: a standard material is enough with the room light around it, and cheap on phones
function bodyMaterial(hex) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.44, metalness: 0 });
}

/**
 * One mark: root (place, game jumps, spin) > pop (the jump when tapped, on top of any game) > squash (from the
 * ground) > breath > body (centre) > look > mesh + eyes.
 */
export function createMark(color) {
  const p = parts();
  const root = new THREE.Group();
  const pop = new THREE.Group();
  const squash = new THREE.Group();
  const breath = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.5;
  const look = new THREE.Group();
  const mesh = new THREE.Mesh(p.body, bodyMaterial(MARK_HEX[color] || color));
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.02, 0.5);
  for (const x of [-0.145, 0.145]) {
    const e = new THREE.Mesh(p.eye, p.eyeMat);
    e.scale.set(1, 1, 0.42);
    e.position.set(x, 0, -0.014);
    eyes.add(e);
  }
  look.add(mesh, eyes);
  body.add(look);
  breath.add(body);
  squash.add(breath);
  pop.add(squash);
  root.add(pop);
  const shadow = new THREE.Mesh(p.shadow, new THREE.MeshBasicMaterial({ map: p.shadowTex, transparent: true, depthWrite: false, opacity: 1 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.003;
  const m = { color, root, pop, squash, breath, body, look, eyes, mesh, shadow, home: new THREE.Vector3(), yaw: 0, busy: false, tapped: false, phase: Math.random() * TAU };
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
  // a loose cluster: three in front, two behind
  play: {
    homes: [[-2.15, 0.55], [-1.05, -0.75], [0.1, 0.75], [1.2, -0.65], [2.25, 0.5]],
    yaws: [0.3, 0.14, -0.03, -0.16, -0.32],
    need: [6.5, 4.4], // world width and height the camera must show (room for a spin at the edges)
    fov: 30,
    lookAtY: 1.05,
    tilt: 0.4,
    tap: { height: 1.25, dur: 0.85 },
  },
  // a row, cut by the card edge below
  lineup: {
    homes: [[-2.7, 0], [-1.35, 0], [0, 0], [1.35, 0], [2.7, 0]],
    yaws: [0.22, 0.1, 0, -0.1, -0.22],
    need: [6.7, 1.95],
    fov: 16, // a long lens: the row stays flat, the cubes don't spread into each other
    lookAtY: 0.62,
    tilt: 0.1,
    tap: { height: 1, dur: 0.75 },
  },
  // one mark, standing low in an 8:9 box, with room above for a jump
  solo: {
    need: [2.3, 2.75],
    fov: 22,
    lookAtY: 1.05, // the floor at about 12% up the box
    tilt: 0.2,
    tap: { height: 1, dur: 0.8 },
    turn: 0.32, // how far it turns toward its words
  },
};

/**
 * Frame the layout in a box of width w and height h. When the canvas is taller (ch > h, the extra above the
 * box), the same view is kept in the bottom h pixels and the picture simply goes on above it: the camera sees
 * a taller frustum around the same centre and renders only its upper part (a view offset).
 */
function frame(camera, layout, w, h, ch = h) {
  const [nw, nh] = layout.need;
  const t = Math.tan(THREE.MathUtils.degToRad(layout.fov / 2));
  const d = Math.max(nw / (2 * t * (w / h)), nh / (2 * t));
  camera.position.set(0, layout.lookAtY + d * Math.sin(layout.tilt), d * Math.cos(layout.tilt));
  camera.lookAt(0, layout.lookAtY, 0);
  const extra = ch - h;
  if (extra > 0.5) {
    const full = h + 2 * extra;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((t * full) / h));
    camera.aspect = w / full;
    camera.setViewOffset(w, full, 0, 0, w, h + extra);
  } else {
    camera.fov = layout.fov;
    camera.aspect = w / h;
    camera.clearViewOffset();
  }
  camera.updateProjectionMatrix();
}

function buildScene(mode, renderer, w, h, ch = h) {
  const layout = LAYOUTS[mode];
  const scene = new THREE.Scene();
  lights(scene, renderer, { dark: true });
  const camera = new THREE.PerspectiveCamera(layout.fov, w / h, 0.1, 200);
  frame(camera, layout, w, h, ch);
  const marks = MARK_ORDER.map((color, i) => {
    const m = createMark(color);
    const [x, z] = layout.homes[i];
    m.home.set(x, 0, z);
    m.yaw = layout.yaws[i];
    m.root.position.copy(m.home);
    m.root.rotation.y = m.yaw;
    m.shadow.position.set(x, 0.003, z);
    scene.add(m.root, m.shadow);
    return m;
  });
  return { scene, camera, marks, layout };
}

/* ---------- still renders (posters, small marks, the marks standing on the product cards) ---------- */

/**
 * Render a still: the whole scene for a mode, or one mark. `view: "perch"` sees the mark a little from above,
 * as if standing on the top edge of a card, with the rim light of the dark scenes (`dark: true`).
 * `mode: "solo"` with a `color` and a `side` is the poster of a talking mark, framed as the live one.
 * Returns a canvas (transparent background).
 */
export function renderStill({ mode = "play", color = null, view = "icon", side = "right", dark = false, width = 512, height = 512, blink = false, dpr = 1 } = {}) {
  const renderer = makeRenderer(width, height, dpr, true);
  let scene, camera;
  if (mode === "solo" && color) {
    const layout = LAYOUTS.solo;
    scene = new THREE.Scene();
    lights(scene, renderer, { dark: false });
    camera = new THREE.PerspectiveCamera(layout.fov, width / height, 0.1, 100);
    frame(camera, layout, width, height);
    const m = createMark(color);
    m.yaw = (side === "left" ? -1 : 1) * layout.turn;
    m.root.rotation.y = m.yaw;
    m.look.rotation.y = -m.yaw * 0.45;
    m.look.rotation.x = 0.04;
    if (blink) m.eyes.scale.y = 0.12;
    scene.add(m.root, m.shadow);
  } else if (color) {
    scene = new THREE.Scene();
    lights(scene, renderer, { dark });
    const perch = view === "perch";
    camera = new THREE.PerspectiveCamera(perch ? 24 : 26, width / height, 0.1, 50);
    if (perch) camera.position.set(0.12, 1.6, 3.6);
    else camera.position.set(0.5, 1.25, 3.2);
    camera.lookAt(0, 0.5, 0);
    const m = createMark(color);
    m.root.rotation.y = perch ? -0.32 : -0.26;
    if (!perch) m.look.rotation.x = 0.06;
    if (blink) m.eyes.scale.y = 0.12;
    scene.add(m.root);
  } else {
    ({ scene, camera } = buildScene(mode, renderer, width, height));
  }
  renderer.render(scene, camera);
  return renderer.domElement;
}

/* ---------- motion helpers ---------- */

function hop(m, o = {}) {
  const p = m.root.position;
  const s = m.squash.scale;
  const dur = o.dur ?? 0.62;
  const height = o.height ?? 0.8;
  const toY = o.y ?? 0;
  let startY = 0;
  const tl = gsap.timeline();
  tl.add(() => (startY = p.y))
    .to(s, { x: 1.14, y: 0.78, z: 1.14, duration: 0.11, ease: "power2.out" })
    .addLabel("air")
    .to(s, { x: 0.9, y: 1.16, z: 0.9, duration: 0.14, ease: "power2.out" }, "air")
    .to(s, { x: 1, y: 1, z: 1, duration: dur - 0.14, ease: "sine.out" }, "air+=0.14")
    .to(p, { y: () => Math.max(startY, toY) + height, duration: dur / 2, ease: "power2.out" }, "air")
    .to(p, { y: toY, duration: dur / 2, ease: "power2.in" }, `air+=${dur / 2}`);
  if (o.x !== undefined || o.z !== undefined) {
    tl.to(p, { x: o.x ?? p.x, z: o.z ?? p.z, duration: dur, ease: "sine.inOut" }, "air");
  }
  if (o.spin) tl.to(m.root.rotation, { y: `+=${o.spin * TAU}`, duration: dur, ease: "power1.inOut" }, "air");
  tl.to(s, { x: 1.16, y: 0.8, z: 1.16, duration: 0.09, ease: "power2.out" }, `air+=${dur}`).to(s, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.55,
    ease: "elastic.out(1, 0.42)",
  });
  return tl;
}

/** The tap: the same jump and spin as a hop, on the pop group, so it can happen in the middle of a game. */
function tapHop(m, { height = 1.25, dur = 0.85 } = {}) {
  const p = m.pop.position;
  const s = m.pop.scale;
  return gsap
    .timeline()
    .to(s, { x: 1.14, y: 0.78, z: 1.14, duration: 0.11, ease: "power2.out" })
    .addLabel("air")
    .to(s, { x: 0.9, y: 1.16, z: 0.9, duration: 0.14, ease: "power2.out" }, "air")
    .to(s, { x: 1, y: 1, z: 1, duration: dur - 0.14, ease: "sine.out" }, "air+=0.14")
    .to(p, { y: height, duration: dur / 2, ease: "power2.out" }, "air")
    .to(p, { y: 0, duration: dur / 2, ease: "power2.in" }, `air+=${dur / 2}`)
    .to(m.pop.rotation, { y: `+=${TAU}`, duration: dur, ease: "power1.inOut" }, "air")
    .to(s, { x: 1.16, y: 0.8, z: 1.16, duration: 0.09, ease: "power2.out" }, `air+=${dur}`)
    .to(s, { x: 1, y: 1, z: 1, duration: 0.55, ease: "elastic.out(1, 0.42)" });
}

function blinkLoop(m) {
  let call;
  const next = () => {
    call = gsap.delayedCall(gsap.utils.random(2.2, 6), () => {
      gsap.to(m.eyes.scale, { y: 0.12, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.inOut", onComplete: next });
    });
  };
  next();
  return () => call?.kill();
}

/* ---------- live scenes ---------- */

export default function initMarks3D(root = document) {
  const boxes = [...root.querySelectorAll("[data-nb-marks3d]")];
  if (!boxes.length) return () => {};
  const solos = boxes.filter((box) => box.dataset.nbMarks3d === "solo");
  const guard = (fn) => {
    try {
      return fn();
    } catch (err) {
      // no WebGL: the posters stay
      return () => {};
    }
  };
  const cleanups = boxes.filter((box) => !solos.includes(box)).map((box) => guard(() => setup(box)));
  if (solos.length) cleanups.push(guard(() => setupSolos(solos)));
  return () => cleanups.forEach((fn) => fn());
}

function setup(box) {
  const mode = box.dataset.nbMarks3d === "lineup" ? "lineup" : "play";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const poster = box.querySelector("[data-nb-marks3d-poster]");
  const area = box.parentElement; // where the hand cursor shows over a mark
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = makeRenderer(1, 1, dpr);
  const canvas = renderer.domElement;
  canvas.className = "nb-marks3d__canvas";
  canvas.setAttribute("aria-hidden", "true");
  box.appendChild(canvas);
  // the box frames the scene, the canvas (as tall as the box or taller, see --nb-head) shows it
  const rect = () => [Math.max(1, box.clientWidth), Math.max(1, box.clientHeight), Math.max(1, canvas.clientHeight)];
  let [w, h, ch] = rect();
  renderer.setSize(w, ch, false);

  const { scene, camera, marks, layout } = buildScene(mode, renderer, w, h, ch);
  const offs = [];
  const tweens = new Set();
  let last = performance.now();
  let elapsed = 0;

  /* ----- where the eyes look ----- */
  const pointer = { active: false, ndc: new THREE.Vector2(), at: 0 };
  const focus = { point: null }; // a world point that games ask everyone to watch
  const tmpV = new THREE.Vector3();
  const lookPoint = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.6); // z = 2.6, in front of the marks

  /* ----- per frame: shadows, breathing, looking ----- */
  const update = (t, dt) => {
    const usePointer = pointer.active && performance.now() - pointer.at < 4000;
    if (usePointer) {
      ray.setFromCamera(pointer.ndc, camera);
      ray.ray.intersectPlane(plane, lookPoint);
    }
    for (const m of marks) {
      const p = m.root.position;
      m.shadow.position.set(p.x, 0.003, p.z);
      const lift = THREE.MathUtils.clamp((p.y + m.pop.position.y) / 2.5, 0, 1);
      // a mark standing on another casts its shadow on it, not on the floor: keep it simple, fade it
      m.shadow.material.opacity = (1 - lift) * (p.y > 0.95 ? 0.15 : 1);
      m.shadow.scale.setScalar(1 - lift * 0.45);
      if (!reduce) {
        const b = Math.sin(t * 2.1 + m.phase);
        m.breath.scale.set(1 - b * 0.008, 1 + b * 0.016, 1 - b * 0.008);
      }
      // target: the pointer, else the game's focus, else the viewer with a slow wander
      let target;
      if (usePointer) target = lookPoint;
      else if (focus.point) target = focus.point;
      else target = tmpV.set(Math.sin(t * 0.35 + m.phase) * 1.4, layout.lookAtY + 0.6 + Math.sin(t * 0.5 + m.phase) * 0.3, 6);
      m.body.getWorldPosition(m._wp || (m._wp = new THREE.Vector3()));
      const dx = target.x - m._wp.x;
      const dy = target.y - m._wp.y;
      const dz = Math.max(0.4, target.z - m._wp.z);
      // relative to the mark's resting yaw, so a spin during a jump stays visible
      let yaw = Math.atan2(dx, dz) - m.yaw;
      yaw = THREE.MathUtils.clamp(Math.atan2(Math.sin(yaw), Math.cos(yaw)), -0.7, 0.7);
      const pitch = THREE.MathUtils.clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -0.45, 0.4);
      const k = 1 - Math.exp(-dt * 6);
      m.look.rotation.y += (yaw - m.look.rotation.y) * k;
      m.look.rotation.x += (pitch - m.look.rotation.x) * k;
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
    [w, h, ch] = rect();
    renderer.setSize(w, ch, false);
    frame(camera, layout, w, h, ch);
    if (!raf) drawOnce();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(box);
  offs.push(() => ro.disconnect());

  const shown = () => {
    box.classList.add("is-live");
  };

  if (reduce) {
    drawOnce();
    shown();
    return () => {
      offs.forEach((fn) => fn());
      renderer.dispose();
      canvas.remove();
    };
  }

  /* ----- life: blinking, looking, taps (any mark, at any moment, games included) ----- */
  marks.forEach((m) => offs.push(blinkLoop(m)));

  const toNdc = (e) => {
    const r = canvas.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return null;
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  const pick = (e) => {
    const ndc = toNdc(e);
    if (!ndc) return null;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(marks.map((m) => m.mesh), false)[0];
    return hit?.object.userData.mark || null;
  };
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointer.active = true;
    pointer.at = performance.now();
    if (e.pointerType === "mouse") area.style.cursor = pick(e) ? "pointer" : "";
  };
  const onTap = (e) => {
    if (e.button > 0 || e.target.closest?.("a, button, input, select, textarea, label")) return;
    const m = pick(e);
    if (!m || m.tapped) return;
    m.tapped = true;
    const tl = tapHop(m, layout.tap);
    tl.eventCallback("onComplete", () => {
      m.tapped = false;
      tweens.delete(tl);
    });
    tweens.add(tl);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onTap, { passive: true });
  offs.push(() => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onTap);
    area.style.cursor = "";
  });

  /* ----- entrance ----- */
  const intro = gsap.timeline({ paused: true });
  if (mode === "play") {
    marks.forEach((m, i) => {
      m.root.position.y = 5 + i * 0.35;
      intro
        .to(m.root.position, { y: 0, duration: 0.7, ease: "power2.in" }, i * 0.12)
        .to(m.squash.scale, { x: 1.2, y: 0.74, z: 1.2, duration: 0.09, ease: "power2.out" }, i * 0.12 + 0.7)
        .to(m.squash.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" }, i * 0.12 + 0.79);
    });
  } else {
    marks.forEach((m, i) => {
      m.root.position.y = -1.3;
      intro.to(m.root.position, { y: 0, duration: 1.1, ease: "expo.out" }, i * 0.08);
    });
  }

  /* ----- games (hero) and idle hops (lineup) ----- */
  const coin = new THREE.Mesh(parts().coin, parts().coinMat);
  coin.rotation.x = Math.PI / 2;
  coin.visible = false;
  scene.add(coin);
  const head = (m) => new THREE.Vector3(m.root.position.x, m.root.position.y + 1.33, m.root.position.z);

  const games = {
    wave() {
      const tl = gsap.timeline();
      marks.forEach((m, i) => tl.add(hop(m, { height: 0.55, dur: 0.5, spin: i === marks.length - 1 ? 1 : 0 }), i * 0.13));
      return tl;
    },
    coin() {
      const tl = gsap.timeline();
      const first = head(marks[0]);
      coin.position.set(first.x, first.y + 2.4, first.z);
      coin.scale.setScalar(0.001);
      focus.point = coin.position;
      tl.add(() => (coin.visible = true))
        .to(coin.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "back.out(2)" })
        .to(coin.position, { y: first.y, duration: 0.55, ease: "power2.in" }, "<")
        .to(marks[0].squash.scale, { x: 1.1, y: 0.86, z: 1.1, duration: 0.08, yoyo: true, repeat: 1 }, ">");
      for (let i = 0; i < marks.length - 1; i += 1) {
        const from = marks[i];
        const to = marks[i + 1];
        const a = head(from);
        const b = head(to);
        const t0 = `>+=0.05`;
        tl.add(hop(from, { height: 0.35, dur: 0.42 }), t0)
          .addLabel(`pass${i}`, "<+=0.12")
          .to(coin.position, { x: b.x, z: b.z, duration: 0.72, ease: "none" }, `pass${i}`)
          .to(coin.position, { y: Math.max(a.y, b.y) + 1.5, duration: 0.36, ease: "power2.out" }, `pass${i}`)
          .to(coin.position, { y: b.y, duration: 0.36, ease: "power2.in" }, `pass${i}+=0.36`)
          .to(coin.rotation, { z: `+=${TAU}`, duration: 0.72, ease: "none" }, `pass${i}`)
          .to(to.squash.scale, { x: 1.1, y: 0.86, z: 1.1, duration: 0.08, yoyo: true, repeat: 1 }, `pass${i}+=0.72`);
      }
      const last = marks[marks.length - 1];
      const lastHop = hop(last, { height: 0.9, dur: 0.7, spin: 1 });
      tl.add(lastHop, ">+=0.1")
        .to(coin.position, { y: `+=${0.9}`, duration: 0.35, ease: "power2.out" }, "<+=0.11")
        .to(coin.position, { y: head(last).y, duration: 0.35, ease: "power2.in" }, ">")
        .to(coin.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.35, ease: "back.in(2)" }, ">+=0.5")
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
        .add(hop(blue, { x: base.x, z: base.z, y: 1, height: 0.9, dur: 0.7 }))
        .add(hop(mint, { x: base.x, z: base.z, y: 2, height: 0.6, dur: 0.8 }), ">+=0.15")
        .addLabel("wobble", ">+=0.1");
      [lavender, blue, mint].forEach((m, i) => {
        tl.to(m.root.rotation, { z: 0.06 * (i + 1), duration: 0.22, ease: "sine.inOut", yoyo: true, repeat: 3 }, "wobble");
      });
      tl.add(hop(mint, { x: mint.home.x, z: mint.home.z, y: 0, height: 0.6, dur: 0.75, spin: 1 }), ">+=0.2")
        .add(hop(blue, { x: blue.home.x, z: blue.home.z, y: 0, height: 0.6, dur: 0.7 }), "<+=0.25")
        .add(() => (focus.point = null), ">");
      return tl;
    },
    leapfrog() {
      const [coral, amber] = marks;
      const tl = gsap.timeline();
      const over = (a, b) =>
        gsap
          .timeline()
          .to(b.squash.scale, { x: 1.12, y: 0.7, z: 1.12, duration: 0.18, ease: "power2.out" }, 0.05)
          .add(hop(a, { x: b.home.x + (b.home.x - a.home.x) * 0.9, z: b.home.z, height: 1.4, dur: 0.8 }), 0)
          .to(b.squash.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "elastic.out(1, 0.45)" }, 0.55);
      tl.add(() => (focus.point = head(amber)))
        .add(over(coral, amber))
        .add(hop(coral, { x: coral.home.x, z: coral.home.z, height: 1.4, dur: 0.8, spin: -1 }), ">+=0.3")
        .to(amber.squash.scale, { x: 1.12, y: 0.7, z: 1.12, duration: 0.18, yoyo: true, repeat: 1 }, "<")
        .add(() => (focus.point = null));
      return tl;
    },
  };

  let director = null;
  let current = null;
  const order = [];
  const nextGame = () => {
    if (!order.length) order.push(...gsap.utils.shuffle(Object.keys(games)));
    return order.shift();
  };
  const busyAll = (v) => marks.forEach((m) => (m.busy = v));
  const play = () => {
    if (mode === "play") {
      director = gsap.delayedCall(gsap.utils.random(1.8, 3.2), () => {
        busyAll(true);
        current = games[nextGame()]();
        current.eventCallback("onComplete", () => {
          busyAll(false);
          // every mark back at home, upright
          marks.forEach((m) => {
            m.root.rotation.z = 0;
            m.root.rotation.y = m.yaw + Math.round((m.root.rotation.y - m.yaw) / TAU) * TAU;
          });
          current = null;
          play();
        });
      });
    } else {
      director = gsap.delayedCall(gsap.utils.random(3.5, 7), () => {
        const m = marks[Math.floor(Math.random() * marks.length)];
        if (!m.busy) {
          m.busy = true;
          current = hop(m, { height: 0.5, dur: 0.5, spin: Math.random() < 0.3 ? 1 : 0 });
          current.eventCallback("onComplete", () => {
            m.busy = false;
            current = null;
          });
        }
        play();
      });
    }
  };

  let started = false;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      start();
      if (!started) {
        started = true;
        shown();
        intro.play();
        intro.eventCallback("onComplete", play);
      } else {
        director?.resume();
        current?.resume();
      }
    } else {
      stop();
      director?.pause();
      current?.pause();
    }
  });
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
    tweens.forEach((t) => t.kill());
    offs.forEach((fn) => fn());
    renderer.dispose();
    canvas.remove();
    box.classList.remove("is-live");
    if (poster) poster.hidden = false;
  };
}

/* ---------- the marks on their own (the section where they introduce themselves) ---------- */

function setupSolos(boxes) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const layout = LAYOUTS.solo;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = makeRenderer(1, 1, dpr); // off screen: each frame is copied into the box's 2D canvas
  const scene = new THREE.Scene();
  lights(scene, renderer, { dark: false });
  const camera = new THREE.PerspectiveCamera(layout.fov, 1, 0.1, 100);
  const ray = new THREE.Raycaster();
  const offs = [];
  const tweens = new Set();

  const slots = boxes.map((box) => {
    const m = createMark(box.dataset.nbColor || "coral");
    const side = box.dataset.nbSide === "left" ? -1 : 1;
    m.yaw = side * layout.turn;
    m.root.rotation.y = m.yaw;
    m.root.visible = m.shadow.visible = false;
    scene.add(m.root, m.shadow);
    const canvas = document.createElement("canvas");
    canvas.className = "nb-marks3d__canvas";
    canvas.setAttribute("aria-hidden", "true");
    box.appendChild(canvas);
    const text = box.closest("[data-nb-talk-row]")?.querySelector("[data-nb-talk-text]") || null;
    offs.push(blinkLoop(m));
    return { box, canvas, ctx: canvas.getContext("2d"), m, side, text, w: 1, h: 1, visible: false, entered: false, talk: 0 };
  });
  if (slots.some((s) => !s.ctx)) throw new Error("no 2D canvas");

  const size = (s) => {
    s.w = Math.max(1, s.box.clientWidth);
    s.h = Math.max(1, s.box.clientHeight);
    // as three sizes its own drawing buffer, so the copy is pixel for pixel
    s.canvas.width = Math.floor(s.w * dpr);
    s.canvas.height = Math.floor(s.h * dpr);
  };
  slots.forEach(size);
  const ro = new ResizeObserver((entries) => entries.forEach((e) => size(slots.find((s) => s.box === e.target))));
  slots.forEach((s) => ro.observe(s.box));
  offs.push(() => ro.disconnect());

  /* ----- pointer: where they look; taps on the mark itself (its canvas sits beside the text, not over it) ----- */
  const pointer = { x: 0, y: 0, at: -1e9 };
  const onMove = (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.at = performance.now();
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  offs.push(() => window.removeEventListener("pointermove", onMove));

  const hit = (s, e) => {
    const r = s.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    frame(camera, layout, s.w, s.h);
    s.m.root.updateMatrixWorld(true);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(s.m.mesh, false).length > 0;
  };
  slots.forEach((s) => {
    const onDown = (e) => {
      if (!s.entered || s.m.tapped || !hit(s, e)) return;
      s.m.tapped = true;
      const tl = tapHop(s.m, layout.tap);
      tweens.add(tl);
      tl.eventCallback("onComplete", () => {
        s.m.tapped = false;
        tweens.delete(tl);
      });
    };
    const onHover = (e) => {
      if (e.pointerType === "mouse") s.canvas.style.cursor = s.entered && hit(s, e) ? "pointer" : "";
    };
    s.canvas.addEventListener("pointerdown", onDown);
    s.canvas.addEventListener("pointermove", onHover);
    offs.push(() => {
      s.canvas.removeEventListener("pointerdown", onDown);
      s.canvas.removeEventListener("pointermove", onHover);
    });
  });

  /* ----- each frame: talk while its words are lighting up and the page is moving ----- */
  let raf = 0;
  let last = performance.now();
  let t = 0;
  let lastY = window.scrollY;
  let speed = 0;
  const update = (s, dt) => {
    const { m } = s;
    const vh = window.innerHeight;
    // the same range as the word fill: from the text's top at 82% of the screen to its bottom at 58%
    let reading = false;
    if (s.text) {
      const r = s.text.getBoundingClientRect();
      const p = (vh * 0.82 - r.top) / (vh * 0.24 + r.height);
      reading = p > 0 && p < 1.05;
    }
    s.talk += ((reading ? speed : 0) - s.talk) * (1 - Math.exp(-dt * 10));
    const b = Math.sin(t * 2.1 + m.phase);
    const pulse = s.talk * Math.max(0, Math.sin(t * 15 + m.phase));
    m.breath.scale.set(1 - b * 0.008 + pulse * 0.04, 1 + b * 0.016 - pulse * 0.08, 1 - b * 0.008 + pulse * 0.04);
    m.breath.position.y = pulse * 0.05;
    // look: at the pointer when it moved lately, else toward the viewer, turned a little to its words
    const r = s.box.getBoundingClientRect();
    let yaw;
    let pitch;
    if (performance.now() - pointer.at < 4000) {
      const dx = pointer.x - (r.left + r.width / 2);
      const dy = pointer.y - (r.top + r.height * 0.6);
      yaw = Math.atan2(dx, 900) - m.yaw;
      pitch = Math.atan2(dy, 900);
    } else {
      yaw = -m.yaw * 0.45 + Math.sin(t * 0.4 + m.phase) * 0.12;
      pitch = 0.04 + Math.sin(t * 0.55 + m.phase) * 0.05;
    }
    const k = 1 - Math.exp(-dt * 6);
    m.look.rotation.y += (THREE.MathUtils.clamp(yaw, -0.75, 0.75) - m.look.rotation.y) * k;
    m.look.rotation.x += (THREE.MathUtils.clamp(pitch, -0.4, 0.4) - m.look.rotation.x) * k;
    const lift = THREE.MathUtils.clamp((m.root.position.y + m.pop.position.y) / 2.5, 0, 1);
    m.shadow.material.opacity = 1 - lift;
    m.shadow.scale.setScalar(1 - lift * 0.45);
  };
  const draw = (s) => {
    const { m } = s;
    const [rw, rh] = [renderer.domElement.width, renderer.domElement.height];
    if (rw !== s.canvas.width || rh !== s.canvas.height) renderer.setSize(s.w, s.h, false);
    frame(camera, layout, s.w, s.h);
    m.root.visible = m.shadow.visible = true;
    renderer.render(scene, camera);
    m.root.visible = m.shadow.visible = false;
    s.ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
    s.ctx.drawImage(renderer.domElement, 0, 0, s.canvas.width, s.canvas.height);
  };
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;
    const y = window.scrollY;
    const v = Math.abs(y - lastY) / Math.max(dt, 0.001);
    lastY = y;
    speed += (Math.min(v / 700, 1) - speed) * (1 - Math.exp(-dt * 8));
    for (const s of slots) {
      if (!s.visible || !s.entered) continue;
      update(s, dt);
      draw(s);
    }
  };
  const anyVisible = () => slots.some((s) => s.visible);
  const start = () => {
    if (raf || document.hidden || !anyVisible()) return;
    last = performance.now();
    lastY = window.scrollY;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  /* ----- entrance: it drops in when its row comes up ----- */
  const enter = (s) => {
    s.entered = true;
    const { m } = s;
    m.root.position.y = 3.4;
    const tl = gsap
      .timeline()
      .to(m.root.position, { y: 0, duration: 0.55, ease: "power2.in" })
      .to(m.squash.scale, { x: 1.2, y: 0.75, z: 1.2, duration: 0.09, ease: "power2.out" })
      .to(m.squash.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: "elastic.out(1, 0.42)" });
    tweens.add(tl);
  };
  slots.forEach((s) => s.box.classList.add("is-live"));
  const seen = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const s = slots.find((x) => x.box === e.target);
        s.visible = e.isIntersecting;
        if (!s.visible) s.ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
      });
      if (anyVisible()) start();
      else stop();
    },
    { rootMargin: "80px 0px" },
  );
  const arrive = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const s = slots.find((x) => x.box === e.target);
        if (!s.entered) enter(s);
        arrive.unobserve(e.target);
      });
    },
    { rootMargin: "0px 0px -18% 0px" },
  );
  slots.forEach((s) => {
    seen.observe(s.box);
    arrive.observe(s.box);
  });
  offs.push(() => {
    seen.disconnect();
    arrive.disconnect();
  });
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVis);
  offs.push(() => document.removeEventListener("visibilitychange", onVis));

  return () => {
    stop();
    tweens.forEach((tl) => tl.kill());
    offs.forEach((fn) => fn());
    renderer.dispose();
    slots.forEach((s) => {
      s.canvas.remove();
      s.box.classList.remove("is-live");
    });
  };
}
