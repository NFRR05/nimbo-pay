import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Footer from Collectify «ref-schmidt-footer», restyled for Nimbo: same intro and drifting glow,
 * Original notes — Footer «Schmidt».
 * - Ingresso quando il footer entra nella pagina: l'alone si accende, menu e contatti salgono con blur,
 *   il nome emerge dal basso mettendosi a fuoco.
 * - L'alone resta vivo: le quattro macchie ondeggiano piano, ognuna con tempi diversi
 *   (in pausa quando il footer è fuori dallo schermo).
 * Con movimento ridotto non c'è nessun ingresso né movimento: l'alone è fermo come nella shot.
 */
export default function initSchmidtFooter(root = document) {
  const footers = [...root.querySelectorAll("[data-cf-sc]")];
  if (!footers.length) return () => {};
  const cleanups = footers.map(setup);
  return () => cleanups.forEach((fn) => fn());
}

// Oscillazione di ogni macchia attorno alla posizione della shot (± metà dei valori, in % della macchia):
// piccola, così la composizione resta quella dell'originale
const DRIFT = [
  { xPercent: 6, yPercent: 4, scale: 0.05, duration: 9 },
  { xPercent: 7, yPercent: 5, scale: 0.06, duration: 7.5 },
  { xPercent: 8, yPercent: 6, scale: 0.04, duration: 10 },
  { xPercent: 6, yPercent: 4, scale: 0.05, duration: 8.5 },
  { xPercent: 9, yPercent: 7, scale: 0.08, duration: 6.5 },
];

function setup(footer) {
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const pick = (name) => [...footer.querySelectorAll(`[data-cf-sc-in="${name}"]`)];
    const all = [...footer.querySelectorAll("[data-cf-sc-in]")];
    const blobs = [...footer.querySelectorAll("[data-cf-sc-blob]")];
    const ease = "expo.out";

    gsap.set(all, { visibility: "visible" });

    const intro = gsap.timeline({ paused: true, defaults: { ease } });
    intro
      .from(pick("glow"), { autoAlpha: 0, yPercent: 12, duration: 2.2, ease: "power2.out" }, 0)
      .from(pick("item"), { autoAlpha: 0, y: 18, filter: "blur(8px)", duration: 1.1, stagger: 0.07, clearProps: "filter" }, 0.15)
      .from(pick("icon"), { autoAlpha: 0, y: 12, duration: 0.9, stagger: 0.06 }, 0.25)
      .from(pick("line"), { autoAlpha: 0, y: 14, filter: "blur(6px)", duration: 1, stagger: 0.07, clearProps: "filter" }, 0.35)
      .from(pick("word"), { autoAlpha: 0, yPercent: 22, filter: "blur(28px)", duration: 1.8, clearProps: "filter" }, 0.3);

    const enter = ScrollTrigger.create({
      trigger: footer,
      start: "top 85%",
      once: true,
      onEnter: () => intro.play(),
    });

    const drift = blobs.map((blob, i) => {
      const d = DRIFT[i % DRIFT.length];
      const dir = i % 2 ? -1 : 1;
      return gsap
        .fromTo(
          blob,
          { xPercent: (-d.xPercent / 2) * dir, yPercent: d.yPercent / 2, scale: 1 - d.scale / 2 },
          {
            xPercent: (d.xPercent / 2) * dir,
            yPercent: -d.yPercent / 2,
            scale: 1 + d.scale / 2,
            duration: d.duration,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            paused: true,
            immediateRender: false,
          },
        )
        .totalTime(d.duration / 2 + i * 1.3);
    });

    // Le macchie si muovono solo quando il footer si vede
    const live = ScrollTrigger.create({
      trigger: footer,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => drift.forEach((tw) => (self.isActive ? tw.play() : tw.pause())),
    });
    if (live.isActive) drift.forEach((tw) => tw.play());

    return () => {
      enter.kill();
      live.kill();
    };
  });

  // I font cambiano le misure: ricalcola i trigger quando sono pronti
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => mm.revert();
}
