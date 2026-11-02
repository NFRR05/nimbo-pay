import gsap from "gsap";

/**
 * The only sign of life the coloured marks have: now and then both eyes of a mark close and open.
 * Marks off screen are left alone. With reduced motion nothing moves.
 */
export default function initMarkLife(root = document) {
  const eyes = [...root.querySelectorAll(".nb-eye")];
  if (!eyes.length) return () => {};

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const svgs = [...new Set(eyes.map((eye) => eye.ownerSVGElement).filter(Boolean))];
    const blinkers = new Map();

    const blinker = (svg) => {
      const pair = svg.querySelectorAll(".nb-eye");
      const tl = gsap.timeline({ repeat: -1, repeatDelay: gsap.utils.random(2.5, 6), delay: gsap.utils.random(0.5, 4), paused: true });
      tl.to(pair, { scaleY: 0.1, transformOrigin: "50% 50%", duration: 0.07, ease: "power1.in" })
        .to(pair, { scaleY: 1, duration: 0.12, ease: "power1.out" });
      return tl;
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!blinkers.has(entry.target)) blinkers.set(entry.target, blinker(entry.target));
        const tl = blinkers.get(entry.target);
        if (entry.isIntersecting) tl.play();
        else tl.pause();
      });
    });
    svgs.forEach((svg) => io.observe(svg));

    return () => {
      io.disconnect();
      blinkers.forEach((tl) => tl.kill());
      gsap.set(eyes, { clearProps: "transform" });
    };
  });

  return () => mm.revert();
}
