import gsap from "gsap";

/**
 * Bottoni con riempimento direzionale: il colore entra dal punto in cui
 * arriva il cursore ed esce dal punto in cui se ne va.
 * Con data-cf-magnetic il bottone segue leggermente il cursore.
 */
export default function initButtonFill(root = document) {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanups = [];

  root.querySelectorAll("[data-cf-btn-fill]").forEach((btn) => {
    const setOrigin = (event) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--x", `${event.clientX - r.left}px`);
      btn.style.setProperty("--y", `${event.clientY - r.top}px`);
      btn.style.setProperty("--d", `${Math.hypot(r.width, r.height) * 2.1}px`);
    };
    btn.addEventListener("pointerenter", setOrigin);
    btn.addEventListener("pointerleave", setOrigin);
    cleanups.push(() => {
      btn.removeEventListener("pointerenter", setOrigin);
      btn.removeEventListener("pointerleave", setOrigin);
    });
  });

  if (canHover && !reduce) {
    root.querySelectorAll("[data-cf-magnetic]").forEach((btn) => {
      const strength = parseFloat(btn.dataset.cfMagnetic) || 0.35;
      const label = btn.querySelector(".cf-btn__label");
      const moveX = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
      const moveY = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
      const labelX = label && gsap.quickTo(label, "x", { duration: 0.5, ease: "power3.out" });
      const labelY = label && gsap.quickTo(label, "y", { duration: 0.5, ease: "power3.out" });

      const onMove = (event) => {
        const r = btn.getBoundingClientRect();
        const dx = event.clientX - (r.left + r.width / 2);
        const dy = event.clientY - (r.top + r.height / 2);
        moveX(dx * strength);
        moveY(dy * strength);
        labelX?.(dx * strength * 0.35);
        labelY?.(dy * strength * 0.35);
      };

      const onLeave = () => {
        const targets = label ? [btn, label] : btn;
        gsap.to(targets, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.35)", overwrite: true });
      };

      btn.addEventListener("pointermove", onMove);
      btn.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        btn.removeEventListener("pointermove", onMove);
        btn.removeEventListener("pointerleave", onLeave);
        gsap.set(label ? [btn, label] : btn, { clearProps: "transform" });
      });
    });
  }

  return () => cleanups.forEach((fn) => fn());
}
