import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Footer che si scopre sotto la pagina: il contenuto interno parte spostato
 * verso l'alto e scuro, e si assesta mentre il footer entra nel viewport.
 */
export default function initFooterReveal(root = document) {
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    root.querySelectorAll("[data-cf-footer-reveal]").forEach((footer) => {
      const inner = footer.querySelector(".cf-footer__inner");
      const depth = parseFloat(footer.dataset.cfDepth) || 40;

      gsap.timeline({
        scrollTrigger: {
          trigger: footer,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      })
        .fromTo(inner, { yPercent: -depth }, { yPercent: 0, ease: "none" }, 0)
        .fromTo(footer, { "--cf-footer-shade": 0.65 }, { "--cf-footer-shade": 0, ease: "none" }, 0);
    });
  });

  return () => mm.revert();
}
