import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Final call to action from Collectify «ref-refit-contact», restyled for Nimbo.
 * Original notes — Contatti di Refit: reveal e form demo, animazioni misurate sul sito Framer originale:
 * - reveal allo scroll: +40px e dissolvenza con la stessa molla;
 * - form demo: non invia, mostra una conferma (here: that Nimbo is a demo and nothing was sent).
 * Con il movimento ridotto non c'è nessun ingresso: tutto è visibile subito.
 */

// Molla sovrasmorzata di Framer (k 250, c 80, m 1) campionata su 1,6 s e normalizzata a 1
const SPRING_DURATION = 1.6;
const spring = (p) => {
  const t = p * SPRING_DURATION;
  return (1 - 1.0444 * Math.exp(-3.26 * t) + 0.0444 * Math.exp(-76.74 * t)) / 0.9943;
};

export default function initRefitContact(root = document) {
  const pages = [...root.querySelectorAll('[data-cf-rf="contact"]')];
  if (!pages.length) return () => {};
  const cleanups = pages.map((page) => setup(page));
  return () => cleanups.forEach((fn) => fn());
}

function setup(page) {
  const offs = [setupForm(page)];
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    page.querySelectorAll("[data-cf-rf-reveal]").forEach((el) => {
      gsap.set(el, { visibility: "visible" });
      gsap.from(el, {
        autoAlpha: 0,
        y: 40,
        duration: SPRING_DURATION,
        ease: spring,
        scrollTrigger: { trigger: el, start: "top 98%", once: true },
      });
    });
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => {
    mm.revert();
    offs.forEach((fn) => fn());
  };
}

/* ---------- Demo form: nothing is sent, the status line says so ---------- */

function setupForm(page) {
  const form = page.querySelector("[data-cf-rf-form]");
  if (!form) return () => {};
  const status = form.querySelector("[data-cf-rf-status]");
  const onSubmit = (event) => {
    event.preventDefault();
    if (status) status.textContent = form.dataset.cfRfSent || "";
    form.reset();
  };
  form.addEventListener("submit", onSubmit);
  return () => form.removeEventListener("submit", onSubmit);
}
