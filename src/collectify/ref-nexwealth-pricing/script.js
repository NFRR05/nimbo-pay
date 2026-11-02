import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Pricing from Collectify «ref-nexwealth-pricing», restyled for Nimbo.
 * - Volume switch (in place of Monthly / Annual): the black pill slides under the chosen volume and the
 *   Scale card counts to the monthly estimate (0,05 € per transaction above the free 10.000), with a small hop.
 *   The estimate line under the price is a polite live region.
 * - Scroll intro: label, title line by line with blur, switch, pattern rectangles from the centre out,
 *   side cards from below and the black card growing in; then the list items.
 * With reduced motion there is no intro and changes are instant. The panel menu of the original is gone
 * (the site has its own navbar).
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
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const locale = section.dataset.cfNxLocale || document.documentElement.lang || "it-IT";
  const euro = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
  const num = new Intl.NumberFormat(locale);
  const format = (value) => euro.format(Math.round(value));
  const offs = [];
  const on = (el, type, fn) => {
    el.addEventListener(type, fn);
    offs.push(() => el.removeEventListener(type, fn));
  };

  section.setAttribute("data-cf-nx-ready", "");

  /* ---------- Volume ---------- */

  const pill = section.querySelector(".cf-nx__period-pill");
  const buttons = [...section.querySelectorAll("[data-cf-nx-volume]")];
  const prices = [...section.querySelectorAll("[data-cf-nx-price]")];
  const estimates = [...section.querySelectorAll("[data-cf-nx-est]")];
  let volume = Number(buttons.find((b) => b.getAttribute("aria-pressed") === "true")?.dataset.cfNxVolume) || FREE;
  let shown = estimate(volume);

  const placePill = (animate) => {
    const btn = buttons.find((b) => Number(b.dataset.cfNxVolume) === volume);
    if (!pill || !btn) return;
    const props = { x: btn.offsetLeft, width: btn.offsetWidth };
    if (animate) gsap.to(pill, { ...props, duration: 0.6, ease: "expo.out", overwrite: true });
    else gsap.set(pill, props);
  };

  const showPrices = (animate) => {
    const target = estimate(volume);
    estimates.forEach((el) => (el.textContent = el.dataset.cfNxEst.replace("{n}", num.format(volume))));
    prices.forEach((el) => {
      const state = { value: shown };
      gsap.killTweensOf([el, state]);
      if (!animate || state.value === target) {
        el.textContent = format(target);
        gsap.set(el, { clearProps: "transform,opacity" });
        return;
      }
      gsap.to(state, { value: target, duration: 0.9, ease: "power3.out", onUpdate: () => (el.textContent = format(state.value)) });
      gsap.fromTo(el, { y: "-0.25em", opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.7, ease: "back.out(2)" });
    });
    shown = target;
  };

  buttons.forEach((btn) =>
    on(btn, "click", () => {
      const next = Number(btn.dataset.cfNxVolume);
      if (next === volume) return;
      volume = next;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      placePill(!reduce.matches);
      showPrices(!reduce.matches);
    }),
  );

  placePill(false);
  const ro = new ResizeObserver(() => placePill(false));
  const period = section.querySelector(".cf-nx__period");
  if (period) ro.observe(period);
  offs.push(() => ro.disconnect());

  /* ---------- Intro ---------- */

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const pick = (name) => [...section.querySelectorAll(`[data-cf-nx-in="${name}"]`)];
    gsap.set(section.querySelectorAll("[data-cf-nx-in]"), { visibility: "visible" });

    const cards = pick("card");
    const pro = section.querySelector(".cf-nx__card--pro");
    const nimbi = section.querySelector(".cf-nx__nimbi");
    const sides = cards.filter((c) => c !== pro);
    const rects = [...section.querySelectorAll("[data-cf-nx-pattern] rect")];
    const center = 583;
    rects.sort((a, b) => Math.abs(a.x.baseVal.value + 30 - center) - Math.abs(b.x.baseVal.value + 30 - center));

    const tl = gsap.timeline({
      defaults: { ease: "expo.out" },
      scrollTrigger: { trigger: section, start: "top 75%", once: true },
    });

    tl.from(pick("bar"), { autoAlpha: 0, y: -14, duration: 1 }, 0)
      .from(pick("line"), { autoAlpha: 0, y: 34, filter: "blur(10px)", duration: 1.2, stagger: 0.1, clearProps: "filter" }, 0.1)
      .from(pick("period"), { autoAlpha: 0, y: 16, duration: 1, stagger: 0.2 }, 0.35)
      .from(rects, { opacity: 0, y: 18, duration: 1.2, stagger: 0.025, ease: "power3.out" }, 0.2);
    if (pro) tl.from(pro, { autoAlpha: 0, y: 60, scale: 0.94, duration: 1.4 }, 0.45);
    if (nimbi) tl.from(nimbi, { yPercent: 60, autoAlpha: 0, duration: 0.9, ease: "back.out(2)" }, 1.1);
    tl.from(sides, { autoAlpha: 0, y: 70, duration: 1.3, stagger: 0.08 }, 0.6).from(
      section.querySelectorAll(".cf-nx__list li"),
      { autoAlpha: 0, x: -10, duration: 0.8, stagger: 0.03 },
      0.95,
    );

    prices.forEach((el) => {
      const target = shown;
      if (!target) return;
      const state = { value: 0 };
      el.textContent = format(0);
      tl.to(state, { value: target, duration: 1.4, ease: "power3.out", onUpdate: () => (el.textContent = format(state.value)) }, 0.7);
    });

    return () => prices.forEach((el) => (el.textContent = format(shown)));
  });

  document.fonts?.ready.then(() => {
    placePill(false);
    ScrollTrigger.refresh();
  });

  return () => {
    mm.revert();
    offs.forEach((fn) => fn());
    gsap.killTweensOf([pill, ...prices].filter(Boolean));
    if (pill) gsap.set(pill, { clearProps: "all" });
    section.removeAttribute("data-cf-nx-ready");
  };
}
