import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Pricing from Collectify «ref-nexwealth-pricing», reduced for Nimbo.
 * Volume switch (in place of Monthly / Annual): pressing a volume makes the Scale estimate count to the new
 * figure (0,05 € per transaction above the free 10.000), as in the original. The first time the plans come
 * into view the estimate counts up from zero. The estimate line under the price is a polite live region.
 * With reduced motion the figure changes at once.
 */
export default function initNexwealthPricing(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-nx]")];
  if (!sections.length) return () => {};
  const cleanups = sections.map((section) => setup(section));
  return () => cleanups.forEach((fn) => fn());
}

const FREE = 10000;
const PER_TX = 0.05;
const estimate = (n) => Math.max(0, n - FREE) * PER_TX;

function setup(section) {
  const buttons = [...section.querySelectorAll("[data-cf-nx-volume]")];
  if (!buttons.length) return () => {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const locale = section.dataset.cfNxLocale || document.documentElement.lang || "it-IT";
  const euro = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
  const num = new Intl.NumberFormat(locale);
  const format = (value) => euro.format(Math.round(value));
  const prices = [...section.querySelectorAll("[data-cf-nx-price]")];
  const estimates = [...section.querySelectorAll("[data-cf-nx-est]")];
  const state = { value: estimate(Number(buttons.find((b) => b.getAttribute("aria-pressed") === "true")?.dataset.cfNxVolume) || FREE) };
  const paint = () => prices.forEach((el) => (el.textContent = format(state.value)));

  const countTo = (target, from) => {
    gsap.killTweensOf(state);
    if (reduce.matches) {
      state.value = target;
      paint();
      return;
    }
    if (from !== undefined) state.value = from;
    gsap.to(state, { value: target, duration: 0.9, ease: "power3.out", onUpdate: paint });
  };

  const onClick = (event) => {
    const btn = event.currentTarget;
    const volume = Number(btn.dataset.cfNxVolume);
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    estimates.forEach((el) => (el.textContent = el.dataset.cfNxEst.replace("{n}", num.format(volume))));
    countTo(estimate(volume));
  };
  buttons.forEach((btn) => btn.addEventListener("click", onClick));

  // first view: count up from zero
  const intro =
    !reduce.matches && prices.length
      ? ScrollTrigger.create({
          trigger: prices[0],
          start: "top 88%",
          once: true,
          onEnter: () => countTo(state.value, 0),
        })
      : null;

  return () => {
    buttons.forEach((btn) => btn.removeEventListener("click", onClick));
    intro?.kill();
    gsap.killTweensOf(state);
    paint();
  };
}
