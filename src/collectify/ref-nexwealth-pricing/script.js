/**
 * Pricing from Collectify «ref-nexwealth-pricing», reduced for Nimbo.
 * Volume switch (in place of Monthly / Annual): pressing a volume updates the Scale estimate at once
 * (0,05 € per transaction above the free 10.000). The estimate line under the price is a polite live region.
 * No entrance and no counting animation.
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
  const locale = section.dataset.cfNxLocale || document.documentElement.lang || "it-IT";
  const euro = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
  const num = new Intl.NumberFormat(locale);
  const prices = [...section.querySelectorAll("[data-cf-nx-price]")];
  const estimates = [...section.querySelectorAll("[data-cf-nx-est]")];

  const onClick = (event) => {
    const btn = event.currentTarget;
    const volume = Number(btn.dataset.cfNxVolume);
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    prices.forEach((el) => (el.textContent = euro.format(Math.round(estimate(volume)))));
    estimates.forEach((el) => (el.textContent = el.dataset.cfNxEst.replace("{n}", num.format(volume))));
  };

  buttons.forEach((btn) => btn.addEventListener("click", onClick));
  return () => buttons.forEach((btn) => btn.removeEventListener("click", onClick));
}
