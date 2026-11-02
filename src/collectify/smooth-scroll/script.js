import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scroll con Lenis, sincronizzato con il ticker di GSAP e ScrollTrigger.
 * - Link interni (href="#id") scorrono in modo fluido e spostano il focus sul target.
 * - Offset globale per header fissi: <html data-cf-scroll-offset="80">
 * - Con prefers-reduced-motion resta lo scroll nativo.
 */
export default function initSmoothScroll(root = document) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const html = document.documentElement;
  const getOffset = () => parseFloat(html.dataset.cfScrollOffset || "0") || 0;

  let lenis = null;
  let tick = null;

  if (!reduce) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    window.cfLenis = lenis; // utile per fermarlo: cfLenis.stop() / cfLenis.start()
  }

  const onClick = (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !root.contains(link)) return;
    const hash = link.getAttribute("href");
    if (hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;

    event.preventDefault();
    const offset = -getOffset();
    const focusTarget = () => {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };

    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.2, onComplete: focusTarget });
    } else {
      const y = target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: "auto" });
      focusTarget();
    }
    history.pushState(null, "", hash);
  };

  root.addEventListener("click", onClick);

  return () => {
    root.removeEventListener("click", onClick);
    if (tick) gsap.ticker.remove(tick);
    lenis?.destroy();
    if (window.cfLenis === lenis) delete window.cfLenis;
  };
}
