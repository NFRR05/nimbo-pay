import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Stato iniziale e finale per ogni variante
const FROM = {
  up: { y: 32, autoAlpha: 0, filter: "blur(6px)" },
  fade: { autoAlpha: 0 },
  scale: { scale: 0.9, autoAlpha: 0 },
  clip: { clipPath: "inset(0% 0% 100% 0%)" },
};
const TO = {
  up: { y: 0, autoAlpha: 1, filter: "blur(0px)" },
  fade: { autoAlpha: 1 },
  scale: { scale: 1, autoAlpha: 1 },
  clip: { clipPath: "inset(0% 0% 0% 0%)" },
};

/**
 * Elementi che entrano allo scroll. Quelli che arrivano insieme
 * vengono messi in coda e partono uno dopo l'altro.
 * <div data-cf-reveal>…</div>  ·  varianti: up (default), fade, scale, clip
 */
export default function initScrollReveal(root = document) {
  const items = [...root.querySelectorAll("[data-cf-reveal]")];
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const variant = (el) => (FROM[el.dataset.cfReveal] ? el.dataset.cfReveal : "up");
    items.forEach((el) => gsap.set(el, FROM[variant(el)]));

    const reveal = (batch) => {
      const tl = gsap.timeline();
      batch.forEach((el, i) => {
        const stagger = parseFloat(el.dataset.cfStagger) || 0.09;
        tl.to(el, { ...TO[variant(el)], duration: 1.1, ease: "expo.out", clearProps: "transform,filter" }, i * stagger);
      });
    };

    ScrollTrigger.batch(items, {
      start: "top 88%",
      once: true,
      onEnter: reveal,
    });

    // Elementi già superati al caricamento (es. refresh a metà pagina): mostrali subito
    requestAnimationFrame(() => {
      items
        .filter((el) => el.getBoundingClientRect().bottom < 0)
        .forEach((el) => gsap.set(el, { ...TO[variant(el)], clearProps: "transform,filter" }));
    });
  });

  return () => mm.revert();
}
