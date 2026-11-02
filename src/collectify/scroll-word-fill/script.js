import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, ScrollTrigger);

/**
 * Paragrafo che si "accende" parola per parola mentre scorre nel viewport.
 * Gli eventuali <mark> dentro il paragrafo stendono l'evidenziatore
 * nello stesso momento in cui si accendono le loro parole.
 */
export default function initScrollWordFill(root = document) {
  const mm = gsap.matchMedia();
  const splits = [];

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    root.querySelectorAll("[data-cf-word-fill]").forEach((el) => {
      const from = parseFloat(el.dataset.cfFrom) || 0.15;
      const step = 0.1;

      const split = SplitText.create(el, { type: "words", wordsClass: "cf-fill-word" });
      splits.push(split);
      const words = split.words;
      const marks = [...el.querySelectorAll("mark")];
      const markHeight = (mark) => getComputedStyle(mark).getPropertyValue("--cf-mark-height").trim() || "70%";

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: el.dataset.cfStart || "top 80%",
          end: el.dataset.cfEnd || "bottom 60%",
          scrub: 0.6,
        },
      });

      tl.fromTo(words, { opacity: from }, { opacity: 1, duration: 0.3, stagger: step, ease: "none" }, 0);

      marks.forEach((mark) => {
        const inside = words.filter((w) => mark.contains(w));
        if (!inside.length) return;
        tl.fromTo(
          mark,
          { backgroundSize: `0% ${markHeight(mark)}` },
          { backgroundSize: `100% ${markHeight(mark)}`, duration: inside.length * step + 0.3, ease: "none" },
          words.indexOf(inside[0]) * step,
        );
      });
    });
  });

  return () => {
    mm.revert();
    splits.forEach((s) => s.revert());
  };
}
