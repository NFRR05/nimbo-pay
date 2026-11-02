import gsap from "gsap";

/**
 * Small signs of life for the coloured marks: they blink now and then and, with a mouse, their eyes
 * glance a couple of units toward the pointer. Only marks on screen are touched. With reduced motion nothing moves.
 */
export default function initMarkLife(root = document) {
  const eyes = [...root.querySelectorAll(".nb-eye")];
  if (!eyes.length) return () => {};

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const svgs = [...new Set(eyes.map((eye) => eye.ownerSVGElement).filter(Boolean))];
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target)));
    });
    svgs.forEach((svg) => io.observe(svg));

    // blink: both eyes of one mark close together, at a random moment
    const blinkers = svgs.map((svg) => {
      const pair = svg.querySelectorAll(".nb-eye");
      const tl = gsap.timeline({ repeat: -1, repeatDelay: gsap.utils.random(2.5, 6), delay: gsap.utils.random(0.5, 5) });
      tl.to(pair, { scaleY: 0.1, transformOrigin: "50% 50%", duration: 0.07, ease: "power1.in" })
        .to(pair, { scaleY: 1, duration: 0.12, ease: "power1.out" });
      return tl;
    });

    // pupils follow the pointer, a couple of units at most
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const pupils = fine
      ? [...root.querySelectorAll(".nb-pupil")].map((pupil) => ({
          pupil,
          svg: pupil.ownerSVGElement,
          eye: pupil.closest(".nb-eye"),
          x: gsap.quickTo(pupil, "x", { duration: 0.5, ease: "power3.out" }),
          y: gsap.quickTo(pupil, "y", { duration: 0.5, ease: "power3.out" }),
        }))
      : [];

    let frame = 0;
    let px = 0;
    let py = 0;
    const look = () => {
      frame = 0;
      pupils.forEach((p) => {
        if (!visible.has(p.svg)) return;
        const r = p.eye.getBoundingClientRect();
        const dx = px - (r.left + r.width / 2);
        const dy = py - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, d / 260);
        p.x((dx / d) * 5 * reach);
        p.y((dy / d) * 4 * reach);
      });
    };
    const onMove = (event) => {
      px = event.clientX;
      py = event.clientY;
      if (!frame) frame = requestAnimationFrame(look);
    };
    if (pupils.length) window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      io.disconnect();
      blinkers.forEach((tl) => tl.kill());
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  });

  return () => mm.revert();
}
