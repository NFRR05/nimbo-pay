import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Stats from Collectify «ref-webyansh-stats», restyled for Nimbo: numbers are formatted with the page locale
 * (data-cf-wy-locale) and a counter can start from another value (data-cf-wy-from), e.g. 99 € down to 0 €.
 * Original notes — Numeri «Proven Track Record of Excellence» (shot di Webyansh).
 * - Allo scroll: titolo riga per riga, testo e bottone con blur, il grafico rosso si disegna
 *   da sinistra e l'area sfumata compare sotto la linea; i numeri contano da 0 in sequenza.
 * Con movimento ridotto non c'è nessun ingresso: tutto è visibile subito.
 */
export default function initWebyanshStats(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-wy]")];
  if (!sections.length) return () => {};
  const cleanups = sections.map((section) => setup(section));
  return () => cleanups.forEach((fn) => fn());
}

const format = (el, value) => {
  const decimals = Number(el.dataset.cfWyDecimals) || 0;
  const locale = el.closest("[data-cf-wy-locale]")?.dataset.cfWyLocale || "it-IT";
  const n = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  return `${el.dataset.cfWyPrefix || ""}${n}${el.dataset.cfWySuffix || ""}`;
};

function setup(section) {
  const mm = gsap.matchMedia();
  const pick = (name) => [...section.querySelectorAll(`[data-cf-wy-in="${name}"]`)];
  const all = [...section.querySelectorAll("[data-cf-wy-in]")];
  const stroke = section.querySelector("[data-cf-wy-stroke]");
  const area = section.querySelector("[data-cf-wy-area]");
  const counters = [...section.querySelectorAll("[data-cf-wy-count]")];

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.set(all, { visibility: "visible" });

    const tl = gsap.timeline({
      defaults: { ease: "expo.out" },
      scrollTrigger: { trigger: section, start: "top 75%", once: true },
    });

    tl.from(pick("line"), { yPercent: 110, duration: 1.2, stagger: 0.09 }, 0)
      .from(pick("copy"), { autoAlpha: 0, y: 16, filter: "blur(8px)", duration: 1.1, stagger: 0.1, clearProps: "filter" }, 0.3)
      .from(pick("stat"), { autoAlpha: 0, y: 22, filter: "blur(8px)", duration: 1.1, stagger: 0.08, clearProps: "filter" }, 0.15);

    if (stroke) tl.fromTo(stroke, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.9, ease: "power2.inOut" }, 0.55);
    if (area) {
      tl.fromTo(
        area,
        { opacity: 1, clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.9, ease: "power2.inOut", clearProps: "clipPath" },
        0.6,
      );
    }

    counters.forEach((el, i) => {
      const target = Number(el.dataset.cfWyCount) || 0;
      const state = { value: Number(el.dataset.cfWyFrom) || 0 };
      el.textContent = format(el, state.value);
      tl.to(state, { value: target, duration: i === 0 ? 2 : 1.6, ease: "power3.out", onUpdate: () => (el.textContent = format(el, state.value)) }, 0.35 + i * 0.1);
    });

    return () => {
      counters.forEach((el) => (el.textContent = format(el, Number(el.dataset.cfWyCount) || 0)));
      gsap.set([stroke, area].filter(Boolean), { clearProps: "all" });
    };
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => mm.revert();
}
