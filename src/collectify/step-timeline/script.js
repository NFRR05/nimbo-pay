import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Timeline verticale: la linea si riempie con lo scroll (scaleY in scrub),
 * ogni punto diventa verde quando il riempimento lo raggiunge e le voci
 * entrano dal basso con un po' di blur.
 */
export default function initStepTimeline(root = document) {
  const mm = gsap.matchMedia();
  const cleanups = [];

  root.querySelectorAll("[data-cf-timeline]").forEach((timeline) => {
    const track = timeline.querySelector(".cf-timeline__track");
    const fill = timeline.querySelector(".cf-timeline__fill");
    const items = [...timeline.querySelectorAll(".cf-timeline__item")];
    const dots = items.map((item) => item.querySelector(".cf-timeline__dot"));
    if (!track || !fill || !items.length || dots.includes(null)) return;

    // La linea va dal centro del primo punto al centro dell'ultimo
    let stops = [];
    const measure = () => {
      const centers = dots.map((dot) => dot.offsetTop + dot.offsetHeight / 2);
      const top = centers[0];
      const height = Math.max(1, centers.at(-1) - top);
      track.style.setProperty("--cf-tl-top", `${top}px`);
      track.style.setProperty("--cf-tl-height", `${height}px`);
      stops = centers.map((c) => (c - top) / height);
    };
    measure();
    ScrollTrigger.addEventListener("refreshInit", measure);
    cleanups.push(() => {
      ScrollTrigger.removeEventListener("refreshInit", measure);
      track.style.removeProperty("--cf-tl-top");
      track.style.removeProperty("--cf-tl-height");
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const scrub = parseFloat(timeline.dataset.cfScrub);

      // Il punto è raggiunto quando il riempimento (già ammorbidito dallo scrub) ci arriva
      const update = (progress) => {
        items.forEach((item, i) => item.classList.toggle("is-reached", progress > 0 && progress >= stops[i] - 0.002));
      };

      gsap.fromTo(
        fill,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          onUpdate() {
            update(this.progress());
          },
          scrollTrigger: {
            trigger: timeline.querySelector(".cf-timeline__line"),
            // la punta del riempimento resta all'altezza di metà schermo
            start: "top center",
            end: "bottom center",
            scrub: Number.isNaN(scrub) ? 0.4 : scrub,
          },
        },
      );

      items.forEach((item) => {
        const parts = item.querySelectorAll(".cf-timeline__when, .cf-timeline__content");
        gsap.set(parts, { autoAlpha: 0, y: 24, filter: "blur(8px)" });
        ScrollTrigger.create({
          trigger: item,
          start: "top 85%",
          once: true,
          onEnter: () =>
            gsap.to(parts, {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 1.1,
              ease: "expo.out",
              stagger: 0.08,
              clearProps: "transform,filter",
            }),
        });
      });

      return () => items.forEach((item) => item.classList.remove("is-reached"));
    });
  });

  return () => {
    mm.revert();
    cleanups.forEach((fn) => fn());
  };
}
