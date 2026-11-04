/**
 * The marks standing on the product cards (markPerch in src/lib/brand.js): a hop when the pointer enters the
 * card or when the mark is clicked, and now and then one of them hops on its own while the cards are in view.
 * The hop itself is a CSS animation (.nb-perch.is-hop in nimbo.css). With reduced motion nothing hops.
 */
export default function initPerch(root = document) {
  const perches = [...root.querySelectorAll("[data-nb-perch]")];
  if (!perches.length) return () => {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const offs = [];

  const hop = (perch) => {
    if (reduce.matches || perch.classList.contains("is-hop")) return;
    perch.classList.add("is-hop");
  };

  perches.forEach((perch) => {
    const host = perch.closest("[data-nb-perch-host]") || perch.parentElement;
    const onEnter = (e) => e.pointerType === "mouse" && hop(perch);
    const onClick = () => hop(perch);
    const onEnd = (e) => e.animationName === "nb-perch-hop" && perch.classList.remove("is-hop");
    host.addEventListener("pointerenter", onEnter);
    perch.addEventListener("click", onClick);
    perch.addEventListener("animationend", onEnd);
    offs.push(() => {
      host.removeEventListener("pointerenter", onEnter);
      perch.removeEventListener("click", onClick);
      perch.removeEventListener("animationend", onEnd);
      perch.classList.remove("is-hop");
    });
  });

  // a hop on its own every few seconds, from one of the marks on screen
  const onScreen = new Set();
  let timer = 0;
  const schedule = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const pool = [...onScreen];
      if (pool.length && !document.hidden) hop(pool[Math.floor(Math.random() * pool.length)]);
      schedule();
    }, 4500 + Math.random() * 4000);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting ? onScreen.add(entry.target) : onScreen.delete(entry.target)));
  });
  perches.forEach((perch) => io.observe(perch));
  schedule();
  offs.push(() => {
    io.disconnect();
    clearTimeout(timer);
  });

  return () => offs.forEach((fn) => fn());
}
