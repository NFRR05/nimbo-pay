import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, ScrollTrigger);

const DEFAULT_STAGGER = { lines: 0.1, words: 0.045, chars: 0.018 };

/**
 * Testo che sale riga per riga da una maschera.
 * <h1 data-cf-line-reveal>…</h1>              → parte al caricamento
 * <p data-cf-line-reveal="scroll">…</p>       → parte quando entra nel viewport
 * Le righe si ricalcolano da sole al resize e al caricamento dei font.
 */
export default function initLineReveal(root = document) {
  const elements = [...root.querySelectorAll("[data-cf-line-reveal]")];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const splits = [];
  let cancelled = false;

  if (reduce) {
    gsap.set(elements, { autoAlpha: 1 });
    return () => {};
  }

  document.fonts.ready.then(() => {
    if (cancelled) return;

    elements.forEach((el) => {
      const unit = ["lines", "words", "chars"].includes(el.dataset.cfSplit) ? el.dataset.cfSplit : "lines";
      const onScroll = el.dataset.cfLineReveal === "scroll";

      const split = SplitText.create(el, {
        type: unit === "lines" ? "lines" : `lines,${unit}`,
        mask: "lines",
        autoSplit: true,
        linesClass: "cf-line",
        onSplit(self) {
          gsap.set(el, { autoAlpha: 1 });
          return gsap.from(self[unit], {
            yPercent: 115,
            rotate: unit === "lines" ? 2 : 0,
            transformOrigin: "0% 0%",
            duration: parseFloat(el.dataset.cfDuration) || 1.15,
            ease: "expo.out",
            stagger: parseFloat(el.dataset.cfStagger) || DEFAULT_STAGGER[unit],
            delay: parseFloat(el.dataset.cfDelay) || 0,
            scrollTrigger: onScroll ? { trigger: el, start: "top 85%", once: true } : undefined,
          });
        },
      });

      splits.push(split);
    });
  });

  return () => {
    cancelled = true;
    splits.forEach((split) => split.revert());
  };
}
