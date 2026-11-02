import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Numbers from Collectify «ref-stepout-stats», restyled for Nimbo: same motion; a counter can start from
 * another value (data-cf-so-from, e.g. 99 € down to 0 €) and the weight wave runs on Outfit.
 * Original notes — Statistiche «Stepout».
 * - Ingresso allo scroll: pillola, titolo riga per riga, card in sequenza; i numeri contano da 0
 *   e le icone si disegnano (foglia, girandola, fulmine).
 * - Come nel video della shot: i caratteri dei numeri vicini al puntatore diventano più pesanti
 *   (peso variabile di Inter Tight) e le icone rifanno la loro animazione quando entri nella card.
 *   Sul touch un tocco sul numero fa passare l'onda di peso da sinistra a destra.
 * Con movimento ridotto: niente ingresso, contatori, onde né icone animate.
 */
const MAX_WEIGHT = 800;

export default function initStepoutStats(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-so]")];
  if (!sections.length) return () => {};
  const cleanups = sections.map((section) => setup(section));
  return () => cleanups.forEach((fn) => fn());
}

function setup(section) {
  const mm = gsap.matchMedia();
  const cards = [...section.querySelectorAll("[data-cf-so-card]")];
  const pick = (name) => [...section.querySelectorAll(`[data-cf-so-in="${name}"]`)];
  const all = [...section.querySelectorAll("[data-cf-so-in]")];

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.set(all, { visibility: "visible" });
    const icons = cards.map((card) => iconAnimation(card.querySelector("[data-cf-so-icon]")));
    const counters = [...section.querySelectorAll("[data-cf-so-count]")];

    // Ingresso
    const tl = gsap.timeline({
      defaults: { ease: "expo.out" },
      scrollTrigger: { trigger: section, start: "top 80%", once: true },
    });
    tl.from(pick("bar"), { autoAlpha: 0, y: -14, duration: 1 }, 0)
      .from(pick("line"), { yPercent: 110, duration: 1.2, stagger: 0.1 }, 0.1)
      .from(pick("card"), { autoAlpha: 0, y: 48, filter: "blur(10px)", duration: 1.3, stagger: 0.1, clearProps: "filter" }, 0.3);

    counters.forEach((el, i) => {
      const digits = [...el.querySelectorAll("[data-cf-so-digit]")];
      const target = Number(el.dataset.cfSoCount) || 0;
      const state = { value: Number(el.dataset.cfSoFrom) || 0 };
      const render = () => {
        const text = String(Math.round(state.value)).padStart(digits.length, " ");
        digits.forEach((d, j) => (d.textContent = text[j] === " " ? "" : text[j]));
      };
      render();
      tl.to(state, { value: target, duration: 1.8, ease: "power3.out", onUpdate: render }, 0.5 + i * 0.1);
    });

    icons.forEach((icon, i) => icon && tl.add(icon.draw(), 0.75 + i * 0.12));

    // Hover sulla card: rifà l'animazione dell'icona
    const offHover = cards.map((card, i) => {
      const onEnter = (event) => {
        if (event.pointerType === "touch" || tl.isActive()) return;
        icons[i]?.loop();
      };
      card.addEventListener("pointerenter", onEnter);
      return () => card.removeEventListener("pointerenter", onEnter);
    });

    const offWeight = () => {};

    return () => {
      offHover.forEach((fn) => fn());
      offWeight();
      icons.forEach((icon) => icon?.kill());
      counters.forEach((el) => {
        const ds = [...el.querySelectorAll("[data-cf-so-digit]")];
        const text = String(el.dataset.cfSoCount).padStart(ds.length, " ");
        ds.forEach((d, j) => (d.textContent = text[j] === " " ? "" : text[j]));
      });
    };
  });

  // I font cambiano le misure: ricalcola i trigger quando sono pronti
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => mm.revert();
}

/* ---------- Icone: foglia e fulmine si cancellano e si ridisegnano, la girandola diventa una croce e gira ---------- */

function iconAnimation(svg) {
  if (!svg) return null;
  const kind = svg.dataset.cfSoIcon;
  let current = null;

  if (kind === "pinwheel") {
    const spin = svg.querySelector("[data-cf-so-spin]");
    const petals = [...svg.querySelectorAll("[data-cf-so-petal]")];
    const arms = petals.map((p) => p.previousElementSibling);
    gsap.set(petals, { transformOrigin: "0% 50%" });
    gsap.set(spin, { svgOrigin: "12 12" });
    return {
      draw: () =>
        gsap
          .timeline()
          .fromTo(arms, { attr: { d: "M12 12V12" } }, { attr: { d: "M12 12V2.4" }, duration: 0.5, ease: "power2.out" })
          .fromTo(petals, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "back.out(1.6)" }, 0.25),
      loop() {
        if (current?.isActive()) return;
        current = gsap
          .timeline()
          .to(petals, { scaleX: 0, duration: 0.55, ease: "power2.inOut" })
          .to(spin, { rotation: "+=90", duration: 0.75, ease: "power2.inOut" }, 0.2)
          .to(petals, { scaleX: 1, duration: 0.5, ease: "back.out(1.6)" }, 0.95);
      },
      kill() {
        current?.kill();
        gsap.set(petals, { clearProps: "transform" });
        gsap.set(spin, { clearProps: "transform" });
        gsap.set(arms, { attr: { d: "M12 12V2.4" } });
      },
    };
  }

  // Foglia e fulmine: tratto con pathLength=1, si anima stroke-dashoffset
  const paths = [...svg.querySelectorAll("path")];
  const duration = kind === "bolt" ? 1.5 : 1.15;
  gsap.set(paths, { strokeDasharray: "1 1", strokeDashoffset: 0 });
  return {
    draw: () => gsap.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration, ease: "power2.inOut", stagger: 0.12 }),
    loop() {
      if (current?.isActive()) return;
      current = gsap
        .timeline()
        .to(paths, { strokeDashoffset: -1, duration, ease: "power2.inOut", stagger: { each: 0.1, from: "end" } })
        .set(paths, { strokeDashoffset: 1 })
        .to(paths, { strokeDashoffset: 0, duration, ease: "power2.inOut", stagger: 0.1 }, "+=0.2");
    },
    kill() {
      current?.kill();
      gsap.set(paths, { clearProps: "strokeDasharray,strokeDashoffset" });
    },
  };
}

/* ---------- Peso dei caratteri che segue il puntatore ---------- */

function setupWeight(section) {
  const area = section.querySelector("[data-cf-so-cards]");
  const nums = [...section.querySelectorAll("[data-cf-so-num]")];
  if (!area || !nums.length) return () => {};

  const chars = nums.flatMap((num) => {
    const size = () => parseFloat(getComputedStyle(num).fontSize) || 100;
    return [...num.querySelectorAll(".cf-so__ch")].map((el) => {
      const base = parseFloat(getComputedStyle(el).getPropertyValue("--so-w")) || 500;
      const state = { w: base };
      const to = gsap.quickTo(state, "w", {
        duration: 0.55,
        ease: "power3.out",
        onUpdate: () => el.style.setProperty("--so-w", state.w.toFixed(1)),
      });
      return { el, num, base, to, size, state };
    });
  });

  const apply = (x, y, only) => {
    chars.forEach((c) => {
      if (only && c.num !== only) return;
      const r = c.el.getBoundingClientRect();
      const radius = c.size() * 0.62;
      const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      const f = Math.max(0, 1 - d / radius);
      c.to(c.base + (MAX_WEIGHT - c.base) * f * f * (3 - 2 * f));
    });
  };
  const reset = (only) => chars.forEach((c) => (!only || c.num === only) && c.to(c.base));

  const onMove = (event) => {
    if (event.pointerType === "touch") return;
    apply(event.clientX, event.clientY);
  };
  const onLeave = () => reset();

  // Sul touch: un tocco sul numero fa scorrere l'onda di peso sui suoi caratteri
  let wave = null;
  const onDown = (event) => {
    if (event.pointerType !== "touch") return;
    const num = event.target.closest("[data-cf-so-num]");
    if (!num) return;
    wave?.kill();
    const box = num.querySelector(".cf-so__chars").getBoundingClientRect();
    const radius = (parseFloat(getComputedStyle(num).fontSize) || 100) * 0.62;
    const probe = { x: box.left - radius };
    wave = gsap.to(probe, {
      x: box.right + radius,
      duration: 1.1,
      ease: "sine.inOut",
      onUpdate: () => apply(probe.x, box.top + box.height / 2, num),
      onComplete: () => reset(num),
    });
  };

  area.addEventListener("pointermove", onMove);
  area.addEventListener("pointerleave", onLeave);
  area.addEventListener("pointerdown", onDown);

  return () => {
    area.removeEventListener("pointermove", onMove);
    area.removeEventListener("pointerleave", onLeave);
    area.removeEventListener("pointerdown", onDown);
    wave?.kill();
    chars.forEach((c) => {
      gsap.killTweensOf(c.state);
      c.el.style.removeProperty("--so-w");
    });
  };
}
