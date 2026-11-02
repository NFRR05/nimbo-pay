import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Bento from Collectify «ref-finax-bento», simplified for Nimbo. Same idea as the original, fewer moving parts:
 * - the cards come in one after the other when the grid reaches the viewport;
 * - then in each card the tiles and rows rise in one after the other, the new account arrives turning
 *   slightly and today's balance counts up.
 * Everything runs once. With reduced motion everything is still and visible.
 * Original notes — Bento «Finax»: ingresso a cascata delle card, poi in ogni card la sua animazione
 * (bonifico che sale, righe che entrano, linea del grafico che si disegna, importo che conta, etichette che cadono).
 */
export default function initFinaxBento(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-fx]")];
  if (!sections.length) return () => {};
  const cleanups = sections.map(setup);
  return () => cleanups.forEach((fn) => fn());
}

function setup(section) {
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const cards = [...section.querySelectorAll('[data-cf-fx-in="card"]')];
    gsap.set(cards, { visibility: "visible" });
    gsap.from(cards, {
      autoAlpha: 0,
      y: 36,
      duration: 1.05,
      ease: "power3.out",
      stagger: 0.1,
      scrollTrigger: { trigger: section.querySelector(".cf-fx__grid"), start: "top 85%", once: true },
    });

    cards.forEach((card) => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
      const parts = card.querySelectorAll("[data-cf-fx-part]");
      if (parts.length) tl.from(parts, { autoAlpha: 0, y: 18, duration: 1, stagger: 0.12 }, 0.2);

      const fresh = card.querySelector("[data-cf-fx-new]");
      if (fresh) tl.from(fresh, { autoAlpha: 0, y: 30, rotate: 8, duration: 1.1, ease: "back.out(1.6)" }, 0.5);

      const amount = card.querySelector("[data-cf-fx-amount]");
      if (amount) {
        const target = Number(amount.dataset.cfFxAmount) || 0;
        const euro = new Intl.NumberFormat(amount.dataset.cfFxLocale || "it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
        const state = { v: target * 0.9 };
        tl.to(state, { v: target, duration: 1.6, ease: "power3.out", onUpdate: () => (amount.textContent = euro.format(Math.round(state.v))) }, 0.4);
      }

      ScrollTrigger.create({ trigger: card, start: "top 80%", once: true, onEnter: () => tl.play() });
    });
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  return () => mm.revert();
}
