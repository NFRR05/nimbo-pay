import gsap from "gsap";

/**
 * Hero from Collectify «ref-pelmatech-hero», restyled for Nimbo: no bar, no schedule panel (the site navbar
 * takes the bar's place) and no row of points, so no line moving between them. New: two white shades drift
 * behind the ribbed glass and the ribs sway a little, so the curtain moves (paused off screen, still with
 * reduced motion).
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

function setupMotion(section) {
  const pick = (name) => [...section.querySelectorAll(`[data-cf-pm-in="${name}"]`)];
  const all = [...section.querySelectorAll("[data-cf-pm-in]")];
  const bg = section.querySelector("[data-cf-pm-bg]");
  const shades = [...section.querySelectorAll("[data-cf-pm-shade]")];
  const ribs = section.querySelector(".cf-pm__bg");
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const ease = "expo.out";
    gsap.set(all, { visibility: "visible" });

    const tl = gsap.timeline({ defaults: { ease } });
    if (bg) tl.from(bg, { scale: 1.12, filter: "blur(24px)", opacity: 0.4, duration: 2, ease: "power3.out", clearProps: "filter,opacity" }, 0);
    tl.from(pick("bar"), { autoAlpha: 0, y: -14, duration: 0.9, stagger: 0.09 }, 0.15)
      .from(pick("line"), { yPercent: 105, duration: 1.25, stagger: 0.1 }, 0.3)
      .from(pick("copy"), { autoAlpha: 0, y: 16, filter: "blur(8px)", duration: 1.1, stagger: 0.12, clearProps: "filter" }, 0.65)
      .from(pick("panel"), { autoAlpha: 0, x: 40, filter: "blur(10px)", duration: 1.2, clearProps: "transform,filter" }, 0.45)
      .from(pick("slot"), { autoAlpha: 0, y: 18, duration: 0.9, stagger: 0.12, clearProps: "transform" }, 0.75);

    // Respiro del fondo
    let drift;
    if (bg) {
      drift = gsap.to(bg, { xPercent: -1.6, yPercent: 1.2, scale: 1.04, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2 });
    }

    // Curtain: the white shades cross the ribs slowly from side to side (at different speeds), and the
    // ribs sway half a groove, so the folds of light shift as the shades pass
    const loops = [drift].filter(Boolean);
    const [main, soft] = shades;
    if (main) loops.push(gsap.fromTo(main, { x: 0, xPercent: -20 }, { xPercent: 150, duration: 12, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    if (soft) loops.push(gsap.fromTo(soft, { x: 0, xPercent: 250 }, { xPercent: -30, duration: 16, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    if (ribs) loops.push(gsap.fromTo(ribs, { "--pm-sway": "0px" }, { "--pm-sway": "12px", duration: 5.5, ease: "sine.inOut", yoyo: true, repeat: -1 }));

    // Fuori schermo il respiro e la tenda si fermano
    const io = new IntersectionObserver(([entry]) => {
      loops.forEach((t) => (entry.isIntersecting ? t.resume() : t.pause()));
    });
    io.observe(section);

    return () => {
      io.disconnect();
      loops.forEach((t) => t.kill());
      gsap.set([...shades, ribs].filter(Boolean), { clearProps: "transform,--pm-sway" });
    };
  });

  return () => mm.revert();
}
