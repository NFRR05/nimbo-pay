import gsap from "gsap";

/**
 * The black metal Nimbo card ([data-nb-card3d], styles in src/styles/sections.css).
 * With a mouse, the card leans toward the pointer while it is over the card's box in the bento (its article):
 * a few degrees, never a turn, and the light on the metal moves with it. Without a mouse (phones) the scroll
 * position does the same, gently: the card tips as it crosses the screen. The glint is CSS.
 * With reduced motion nothing moves.
 */
export default function initCard3d(root = document) {
  const cards = [...root.querySelectorAll("[data-nb-card3d]")];
  if (!cards.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const cleanups = cards.map(setup);
  return () => cleanups.forEach((fn) => fn());
}

function setup(card) {
  const area = card.closest("article") || card.parentElement;
  const clamp = gsap.utils.clamp(-1, 1);
  let mouseAt = -1e9;
  let raf = 0;

  // nx, ny in -1…1: where the light comes from, relative to the card's centre
  const lean = (nx, ny, duration = 0.7) => {
    gsap.to(card, {
      "--ry": `${nx * 14}deg`,
      "--rx": `${-ny * 11}deg`,
      "--mx": `${50 + nx * 45}%`,
      "--my": `${40 + ny * 45}%`,
      "--sx": `${nx * 28}%`,
      "--shx": `${-nx * 10}px`,
      duration,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const onMove = (e) => {
    if (e.pointerType !== "mouse") return;
    mouseAt = performance.now();
    const r = card.getBoundingClientRect();
    lean(clamp((e.clientX - (r.left + r.width / 2)) / 260), clamp((e.clientY - (r.top + r.height / 2)) / 200));
  };
  const onLeave = (e) => {
    if (e.pointerType !== "mouse") return;
    lean(0, 0, 1.2);
  };

  // phones (or a mouse that has been still for a while): the scroll position tips the card
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (performance.now() - mouseAt < 2500) return;
      const r = card.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const t = clamp(((r.top + r.height / 2) / vh) * 2 - 1); // -1 at the top of the screen, 1 at the bottom
      lean(t * 0.45, t * 0.9, 0.9);
    });
  };

  area.addEventListener("pointermove", onMove);
  area.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    area.removeEventListener("pointermove", onMove);
    area.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("scroll", onScroll);
    gsap.killTweensOf(card);
  };
}
