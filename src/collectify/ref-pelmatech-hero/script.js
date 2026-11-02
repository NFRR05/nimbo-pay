import gsap from "gsap";

/**
 * Hero from Collectify «ref-pelmatech-hero», restyled for Nimbo: no bar or panel toggle (the site navbar
 * takes their place), and each point brings its Nimbi into focus behind the ribbed glass.
 * Original notes — Hero «Pelmatech».
 * - Ingresso: fondo che si mette a fuoco, barra, titolo riga per riga, testo e bottoni con blur,
 *   scheda degli orari da destra con le card una dopo l'altra, punti in basso.
 * - Il fondo «respira» piano (spostamento e zoom lentissimi) e la linea lime avanza da un punto all'altro.
 * - Il bottone con l'orologio apre e chiude la scheda degli orari; quello a righe apre la tendina del menu.
 * Con movimento ridotto: tutto visibile subito, nessun ciclo automatico (resta attivo il primo punto).
 */
export default function initPelmatechHero(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-pm]")];
  if (!sections.length) return () => {};

  const cleanups = sections.map((section) => setupMotion(section));

  return () => cleanups.forEach((fn) => fn());
}

// Posiziona la linea lime sopra il punto attivo: su desktop va dall'inizio del punto a metà dello spazio
// che lo separa dal successivo (come nella shot); quando ogni punto ha il suo filetto, copre il punto.
function measure(list, item) {
  const items = [...list.querySelectorAll("[data-cf-pm-feature]")];
  const i = items.indexOf(item);
  const own = parseFloat(getComputedStyle(item).borderTopWidth) > 0;
  if (own) return { x: item.offsetLeft, y: item.offsetTop, w: item.offsetWidth };
  const next = items[i + 1];
  const end = next && next.offsetTop === item.offsetTop
    ? (item.offsetLeft + item.offsetWidth + next.offsetLeft) / 2
    : list.clientWidth;
  return { x: item.offsetLeft, y: -1, w: end - item.offsetLeft };
}

function setupMotion(section) {
  const pick = (name) => [...section.querySelectorAll(`[data-cf-pm-in="${name}"]`)];
  const all = [...section.querySelectorAll("[data-cf-pm-in]")];
  const features = section.querySelector(".cf-pm__features");
  const progress = section.querySelector("[data-cf-pm-progress]");
  const fill = progress?.firstElementChild;
  const items = [...section.querySelectorAll("[data-cf-pm-feature]")];
  const bg = section.querySelector("[data-cf-pm-bg]");
  const nimbi = [...section.querySelectorAll("[data-cf-pm-nimbi]")];
  const focus = (i) => nimbi.forEach((n, k) => n.toggleAttribute("data-on", k === i));
  focus(0);
  const mm = gsap.matchMedia();

  // Linea sopra il punto attivo, anche senza animazioni (si riallinea quando cambia la larghezza)
  let active = 0;
  const place = () => {
    if (!progress || !items[active]) return;
    const m = measure(features, items[active]);
    gsap.set(progress, { x: m.x, y: m.y + 1, width: m.w, top: -1 });
  };
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
  if (features && ro) ro.observe(features);
  place();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const ease = "expo.out";
    gsap.set(all, { visibility: "visible" });

    const tl = gsap.timeline({ defaults: { ease } });
    if (bg) tl.from(bg, { scale: 1.12, filter: "blur(24px)", opacity: 0.4, duration: 2, ease: "power3.out", clearProps: "filter,opacity" }, 0);
    tl.from(pick("bar"), { autoAlpha: 0, y: -14, duration: 0.9, stagger: 0.09 }, 0.15)
      .from(pick("line"), { yPercent: 105, duration: 1.25, stagger: 0.1 }, 0.3)
      .from(pick("copy"), { autoAlpha: 0, y: 16, filter: "blur(8px)", duration: 1.1, stagger: 0.12, clearProps: "filter" }, 0.65)
      .from(pick("panel"), { autoAlpha: 0, x: 40, filter: "blur(10px)", duration: 1.2, clearProps: "transform,filter" }, 0.45)
      .from(pick("slot"), { autoAlpha: 0, y: 18, duration: 0.9, stagger: 0.12, clearProps: "transform" }, 0.75)
      .from(pick("feature"), { autoAlpha: 0, y: 14, duration: 0.9, stagger: 0.07 }, 0.9);

    // Respiro del fondo
    let drift;
    if (bg) {
      drift = gsap.to(bg, { xPercent: -1.6, yPercent: 1.2, scale: 1.04, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2 });
    }

    // Ciclo dei punti: la linea si riempie sopra il punto attivo, poi passa al successivo
    let cycle;
    let visible = true;
    if (fill && items.length) {
      const go = (i) => {
        items[active]?.classList.remove("is-active");
        active = i;
        items[active].classList.add("is-active");
        focus(active);
        place();
        cycle = gsap.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 4.2, ease: "none", onComplete: () => go((active + 1) % items.length) });
        if (!visible) cycle.pause();
      };
      tl.add(() => go(0), 1.3);
    }

    // Fuori schermo il ciclo e il respiro si fermano
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      [cycle, drift].forEach((t) => t && (entry.isIntersecting ? t.resume() : t.pause()));
    });
    io.observe(section);

    return () => {
      io.disconnect();
      cycle?.kill();
      drift?.kill();
      items.forEach((el, i) => el.classList.toggle("is-active", i === 0));
      active = 0;
      focus(0);
      if (fill) gsap.set(fill, { clearProps: "transform" });
      place();
    };
  });

  return () => {
    mm.revert();
    ro?.disconnect();
    if (progress) gsap.set(progress, { clearProps: "all" });
  };
}
