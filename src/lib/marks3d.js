import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import gsap from "gsap";

/**
 * The five coloured marks in 3D: soft cubes with the app icon's corners (28/128 of the side) and two white
 * eyes on the front face, in matte vinyl. One module for every live scene and for the still renders.
 *
 * <div data-nb-marks3d="play">   hero: the five play together (hops, passing a coin, a tower, leapfrog),
 *                                turn toward the pointer, blink, and jump when tapped
 * <div data-nb-marks3d="lineup"> final call to action: the five in a row, rising in, blinking, looking,
 *                                and now and then one hops
 * A poster <img data-nb-marks3d-poster> inside the box stays visible without script or WebGL.
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
    eyeMat: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32, emissive: 0xffffff, emissiveIntensity: 0.22 }),
    coinMat: new THREE.MeshStandardMaterial({ color: 0xf2f2f0, metalness: 0.35, roughness: 0.22, emissive: 0xffffff, emissiveIntensity: 0.08 }),
    shadowTex,
  };
  return shared;
}

// matte vinyl: a standard material is enough with the room light around it, and cheap on phones
function bodyMaterial(hex) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.46, metalness: 0 });
}

/** One mark: root (place, jump, spin) > squash (from the ground) > breath > body (centre) > look > mesh + eyes. */
export function createMark(color) {
  const p = parts();
  const root = new THREE.Group();
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
  root.add(squash);
  const shadow = new THREE.Mesh(p.shadow, new THREE.MeshBasicMaterial({ map: p.shadowTex, transparent: true, depthWrite: false, opacity: 1 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.003;
  const m = { color, root, squash, breath, body, look, eyes, mesh, shadow, home: new THREE.Vector3(), yaw: 0, busy: false, phase: Math.random() * TAU };
  mesh.userData.mark = m;
  return m;
}

function lights(scene, renderer, { dark = true } = {}) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = dark ? 0.42 : 0.6;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a1a, dark ? 0.4 : 0.65));
  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  key.position.set(-3.5, 5.5, 4.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, dark ? 1.8 : 0.9);
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
  renderer.toneMappingExposure = 1.05;
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
  },
  // a row, cut by the card edge below
  lineup: {
    homes: [[-2.7, 0], [-1.35, 0], [0, 0], [1.35, 0], [2.7, 0]],
    yaws: [0.22, 0.1, 0, -0.1, -0.22],
    need: [6.7, 1.95],
    fov: 16, // a long lens: the row stays flat, the cubes don't spread into each other
    lookAtY: 0.62,
    tilt: 0.1,
  },
};

function frame(camera, layout, aspect) {
  const [w, h] = layout.need;
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const d = Math.max(w / (2 * t * aspect), h / (2 * t));
  camera.aspect = aspect;
  camera.position.set(0, layout.lookAtY + d * Math.sin(layout.tilt), d * Math.cos(layout.tilt));
  camera.lookAt(0, layout.lookAtY, 0);
  camera.updateProjectionMatrix();
}

function buildScene(mode, renderer, aspect) {
  const layout = LAYOUTS[mode];
  const scene = new THREE.Scene();
  lights(scene, renderer, { dark: true });
  const camera = new THREE.PerspectiveCamera(layout.fov, aspect, 0.1, 200);
  frame(camera, layout, aspect);
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

/* ---------- still renders (posters and small marks) ---------- */

/** Render a still: the whole scene for a mode, or one mark. Returns a canvas (transparent background). */
export function renderStill({ mode = "play", color = null, width = 512, height = 512, blink = false, dpr = 1 } = {}) {
  const renderer = makeRenderer(width, height, dpr, true);
  let scene, camera;
  if (color) {
    scene = new THREE.Scene();
    lights(scene, renderer, { dark: false });
    camera = new THREE.PerspectiveCamera(26, width / height, 0.1, 50);
    camera.position.set(0.5, 1.25, 3.2);
    camera.lookAt(0, 0.5, 0);
    const m = createMark(color);
    m.root.rotation.y = -0.26;
    m.look.rotation.x = 0.06;
    if (blink) m.eyes.scale.y = 0.12;
    scene.add(m.root);
  } else {
    ({ scene, camera } = buildScene(mode, renderer, width / height));
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
  const focus = { point: null }; // a world point that games ask everyone to watch
  const tmpV = new THREE.Vector3();
  const lookPoint = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.6); // z = 2.6, in front of the marks
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointer.active = true;
    pointer.at = performance.now();
  };
  if (!reduce) {
    window.addEventListener("pointermove", onMove, { passive: true });
    offs.push(() => window.removeEventListener("pointermove", onMove));
  }

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
      const lift = THREE.MathUtils.clamp(p.y / 2.5, 0, 1);
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
    [w, h] = rect();
    renderer.setSize(w, h, false);
    frame(camera, layout, w / h);
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

  /* ----- life: blinking, taps ----- */
  marks.forEach((m) => offs.push(blinkLoop(m)));

  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(marks.map((m) => m.mesh), false)[0];
    return hit?.object.userData.mark || null;
  };
  const onTap = (e) => {
    const m = pick(e);
    if (!m || m.busy) return;
    m.busy = true;
    const tl = hop(m, { height: 1.25, dur: 0.85, spin: 1, y: m.root.position.y });
    tl.eventCallback("onComplete", () => {
      m.busy = false;
      tweens.delete(tl);
    });
    tweens.add(tl);
  };
  const onHover = (e) => {
    canvas.style.cursor = pick(e) ? "pointer" : "";
  };
  canvas.addEventListener("pointerdown", onTap);
  canvas.addEventListener("pointermove", onHover);
  offs.push(() => {
    canvas.removeEventListener("pointerdown", onTap);
    canvas.removeEventListener("pointermove", onHover);
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
        .add(hop(mint, { x: base.x, z: base.z, y: 2, height: 1.0, dur: 0.85 }), ">+=0.15")
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
