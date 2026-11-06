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

  // nx, ny in -1…1: where the light comes from. One reusable tween per property (quickTo), no new tweens per frame.
  // [amount, base]: degrees for the tilt, percent for the light, pixels for the shadow (units added in CSS)
  const props = { "--ry": [14], "--rx": [-11], "--mx": [45, 50], "--my": [45, 40], "--sx": [28], "--shx": [-10] };
  const to = (duration) => Object.fromEntries(Object.keys(props).map((k) => [k, gsap.quickTo(card, k, { duration, ease: "power3.out" })]));
  const fast = to(0.7);
  const slow = to(1.2);
  const lean = (nx, ny, calm = false) => {
    const set = calm ? slow : fast;
    Object.entries(props).forEach(([k, [amount, base = 0]]) => {
      const n = k === "--rx" || k === "--my" ? ny : nx;
      set[k](base + n * amount);
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
    lean(0, 0, true);
  };

  // phones (or a mouse that has been still for a while): the scroll position tips the card, only while it is on screen
  let onScreen = false;
  const seen = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting));
  seen.observe(card);
  const onScroll = () => {
    if (raf || !onScreen) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (performance.now() - mouseAt < 2500) return;
      const r = card.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const t = clamp(((r.top + r.height / 2) / vh) * 2 - 1); // -1 at the top of the screen, 1 at the bottom
      lean(t * 0.45, t * 0.9, true);
    });
  };

  area.addEventListener("pointermove", onMove);
  area.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    seen.disconnect();
    cancelAnimationFrame(raf);
    area.removeEventListener("pointermove", onMove);
    area.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("scroll", onScroll);
    gsap.killTweensOf(card);
  };
}
