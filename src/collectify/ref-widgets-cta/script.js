import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Final CTA from Collectify «ref-widgets-cta», restyled for Nimbo: the amount counts in euro and the rates use
 * the page locale (data-cf-wg-locale) and their own unit (data-cf-wg-unit); no avatar photos to watch.
 * Original notes — CTA «Elevate your project with our dynamic charts!».
 * - Allo scroll: etichetta, titolo riga per riga da una maschera, testo e bottoni con blur;
 *   i quattro widget arrivano uno dopo l'altro, la barra del rischio si riempie e i numeri contano.
 * - Hover sul pannello argento: un riflesso segue il puntatore (i widget si alzano in CSS).
 * Con movimento ridotto non c'è nessun ingresso: tutto è visibile subito come nella shot.
 */
export default function initWidgetsCta(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-wg]")];
  if (!sections.length) return () => {};
  const cleanups = sections.map((section) => setup(section));
  return () => cleanups.forEach((fn) => fn());
}

const EASE = "expo.out";
const pad2 = (n) => String(Math.floor(n)).padStart(2, "0");

function setup(section) {
  const locale = section.dataset.cfWgLocale || "it-IT";
  const sep = new Intl.NumberFormat(locale).format(1.5).charAt(1);
  const euro = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0, signDisplay: "always" });
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const copy = [...section.querySelectorAll('[data-cf-wg-in="copy"]')];
    const lines = [...section.querySelectorAll('[data-cf-wg-in="line"]')];
    const widgets = [...section.querySelectorAll('[data-cf-wg-in="widget"]')];
    gsap.set([...copy, ...lines, ...widgets], { visibility: "visible" });

    const tl = gsap.timeline({
      defaults: { ease: EASE },
      scrollTrigger: { trigger: section, start: "top 80%", once: true },
    });
    tl.from(copy[0], { autoAlpha: 0, y: 14, filter: "blur(6px)", duration: 1, clearProps: "filter" }, 0)
      .from(lines, { yPercent: 110, duration: 1.2, stagger: 0.09 }, 0.1)
      .from(copy.slice(1), { autoAlpha: 0, y: 18, filter: "blur(8px)", duration: 1.1, stagger: 0.12, clearProps: "filter" }, 0.45)
      .from(widgets, { autoAlpha: 0, y: 34, scale: 0.94, filter: "blur(10px)", duration: 1.2, stagger: 0.12, clearProps: "filter,transform" }, 0.3);

    const fill = section.querySelector('[data-cf-wg-part="meter"]');
    if (fill) tl.from(fill, { scaleX: 0, transformOrigin: "0% 50%", duration: 1.4, ease: "power3.inOut" }, 0.8);

    const score = section.querySelector("[data-cf-wg-count]");
    if (score) {
      const v = { n: 0 };
      const end = Number(score.dataset.cfWgCount) || 0;
      tl.to(v, { n: end, duration: 1.4, ease: "power3.inOut", onUpdate: () => (score.textContent = euro.format(Math.round(v.n))), onComplete: () => (score.textContent = euro.format(end)) }, 0.8);
    }

    section.querySelectorAll("[data-cf-wg-rate]").forEach((rate, i) => {
      const end = Number(rate.dataset.cfWgRate) || 0;
      const v = { n: 0 };
      const unit = rate.dataset.cfWgUnit ?? "%";
      const paint = (n) => {
        const cents = Math.round(n * 100);
        rate.innerHTML = `${pad2(cents / 100)}${sep}<span>${String(cents % 100).padStart(2, "0")}${unit}</span>`;
      };
      tl.to(v, { n: end, duration: 1.6, ease: "power3.out", onUpdate: () => paint(v.n), onComplete: () => paint(end) }, 0.9 + i * 0.12);
    });

    // riflesso che segue il puntatore sul pannello argento
    const board = section.querySelector("[data-cf-wg-board]");
    const onMove = (event) => {
      const r = board.getBoundingClientRect();
      board.style.setProperty("--mx", `${event.clientX - r.left}px`);
      board.style.setProperty("--my", `${event.clientY - r.top}px`);
    };
    board?.addEventListener("pointermove", onMove);
    return () => board?.removeEventListener("pointermove", onMove);
  });

  return () => mm.revert();
}
