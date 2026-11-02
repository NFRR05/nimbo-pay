import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Final CTA from Collectify «ref-dark-cta», restyled for Nimbo: white dots instead of violet, no review card,
 * and the five coloured marks rise into the glow (no bounce: the marks only blink). The two buttons say that
 * sign-up and contact are not live, since Nimbo is a demo.
 * Original notes — CTA scura.
 * - Matrice di puntini su canvas: colonne di trattini che scendono lentissime, più chiare vicino al bagliore
 *   (si ferma fuori schermo; con movimento ridotto è un'immagine ferma).
 * - Bagliore viola che «respira» piano.
 * - Ingresso allo scroll: card fantasma che si aprono a ventaglio, bagliore che sale, titolo riga per riga
 *   con blur, bottoni, recensione da destra e stelle una dopo l'altra.
 */
export default function initDarkCta(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-dk]")];
  if (!sections.length) return () => {};
  const cleanups = sections.map((section) => setup(section));
  return () => cleanups.forEach((fn) => fn());
}

function setup(section) {
  const offs = [];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  const canvas = section.querySelector("[data-cf-dk-dots]");
  if (canvas) offs.push(setupDots(canvas, reduce));

  // demo buttons: nothing to open, the status line says so
  const status = section.querySelector("[data-cf-dk-status]");
  const buttons = [...section.querySelectorAll("[data-cf-dk-demo]")];
  const onDemo = () => status && (status.textContent = status.dataset.cfDkStatus || "");
  buttons.forEach((b) => b.addEventListener("click", onDemo));
  offs.push(() => buttons.forEach((b) => b.removeEventListener("click", onDemo)));

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const pick = (name) => [...section.querySelectorAll(`[data-cf-dk-in="${name}"]`)];
    gsap.set(section.querySelectorAll("[data-cf-dk-in]"), { visibility: "visible" });
    const ghosts = [...section.querySelectorAll("[data-cf-dk-ghost]")];
    const card = section.querySelector("[data-cf-dk-card]");
    const glow = section.querySelector("[data-cf-dk-glow]");
    const marks = [...section.querySelectorAll("[data-cf-dk-lineup] svg")];

    const tl = gsap.timeline({
      defaults: { ease: "expo.out" },
      scrollTrigger: { trigger: section, start: "top 75%", once: true },
    });

    if (card) tl.from(card, { autoAlpha: 0, y: 40, duration: 1.3 }, 0);
    tl.from(ghosts, { y: 46, autoAlpha: 0, duration: 1.4, stagger: 0.1 }, 0.25);
    if (glow) tl.from(glow, { scaleY: 0.2, opacity: 0, duration: 2, ease: "power3.out" }, 0.3);
    tl.from(pick("line"), { autoAlpha: 0, y: 26, filter: "blur(10px)", duration: 1.2, stagger: 0.1, clearProps: "filter" }, 0.45)
      .from(pick("copy"), { autoAlpha: 0, y: 18, duration: 1, stagger: 0.1 }, 0.7)
      .from(marks, { yPercent: 110, duration: 1.2, stagger: 0.08, ease: "expo.out" }, 0.9);

    // respiro lento del bagliore, dopo l'ingresso
    let breathe;
    if (glow) {
      tl.add(() => {
        breathe = gsap.to(glow, { opacity: 0.82, scaleX: 1.04, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });
    }
    return () => breathe?.kill();
  });

  return () => {
    mm.revert();
    offs.forEach((fn) => fn());
  };
}

/* ---------- Matrice di puntini ---------- */

function setupDots(canvas, reduce) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const PITCH = 6.5;
  let cols = 0;
  let rows = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let seeds = [];
  let raf = 0;
  let visible = false;
  let last = 0;

  // numeri pseudo-casuali stabili: lo stesso disegno a ogni ridimensionamento
  const rand = (n) => {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };

  const resize = () => {
    const box = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const pitch = PITCH * Math.max(0.75, Math.min(1, width / 1244));
    cols = Math.ceil(width / pitch);
    rows = Math.ceil(height / pitch);
    seeds = Array.from({ length: cols }, (_, c) => ({
      speed: 0.15 + rand(c + 1) * 0.5,
      phase: rand(c + 7) * 40,
      dash: 3 + Math.floor(rand(c + 13) * 7),
      on: rand(c + 29) > 0.35,
      pitch,
    }));
    draw(0);
  };

  const draw = (time) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const t = time / 1000;
    for (let c = 0; c < cols; c += 1) {
      const s = seeds[c];
      const x = c * s.pitch + s.pitch / 2;
      // più luce verso il centro in basso, dove sta il bagliore
      const cx = Math.abs(x / width - 0.46);
      for (let r = 0; r < rows; r += 1) {
        const y = r * s.pitch + s.pitch / 2;
        const k = (r + s.phase - t * s.speed * 2) / s.dash;
        const inDash = s.on && k - Math.floor(k) < 0.55;
        const base = inDash ? 0.28 : 0.08;
        const glow = Math.max(0, 1 - cx * 1.6) * (y / height);
        const a = base * (0.6 + 0.8 * rand(c * 131 + r));
        const v = Math.round(200 + 55 * glow);
        ctx.fillStyle = `rgba(${v}, ${v}, ${v}, ${Math.min(0.55, a + glow * 0.12)})`;
        ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
      }
    }
  };

  const loop = (time) => {
    raf = requestAnimationFrame(loop);
    if (time - last < 80) return; // ~12 fotogrammi al secondo bastano
    last = time;
    draw(time);
  };

  const start = () => {
    if (raf || reduce.matches || !visible) return;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  });
  io.observe(canvas);
  const onReduce = () => (reduce.matches ? (stop(), draw(0)) : start());
  reduce.addEventListener("change", onReduce);

  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    reduce.removeEventListener("change", onReduce);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
