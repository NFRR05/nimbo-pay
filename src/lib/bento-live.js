import gsap from "gsap";

/**
 * The two wide cards of the bento, alive:
 * - treasury [data-nb-treasury]: every few seconds a movement arrives at the top of the latest movements
 *   (the oldest leaves) and the balance follows it, while the card is in view;
 * - receipt [data-nb-receipt]: it prints when it comes into view; the slider sets the monthly volume and the
 *   usage line and the total follow (the first 10,000 are free).
 * With reduced motion nothing arrives or prints; the slider still answers.
 */
export default function initBentoLive(root = document) {
  const offs = [];
  root.querySelectorAll("[data-nb-treasury]").forEach((el) => offs.push(treasury(el)));
  root.querySelectorAll("[data-nb-receipt]").forEach((el) => offs.push(receipt(el)));
  return () => offs.forEach((fn) => fn());
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Calls fn the first time el is well in view; returns a way to stop watching. */
function onceSeen(el, fn, threshold = 0.4) {
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      fn();
    },
    { threshold },
  );
  io.observe(el);
  return () => io.disconnect();
}

function treasury(el) {
  const amount = el.querySelector("[data-nb-treasury-amount]");
  const list = el.querySelector("[data-nb-treasury-list]");
  let feed = [];
  try {
    feed = JSON.parse(el.dataset.feed || "[]");
  } catch (err) {
    feed = [];
  }
  if (reduced() || !feed.length || !amount || !list) return () => {};
  const locale = el.dataset.locale || "it-IT";
  const whole = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", useGrouping: "always" });
  const state = { v: Number(el.dataset.amount) || 0 };
  let i = 0;
  let timer = 0;
  let visible = false;

  // a new row on top, the oldest one leaves: the list keeps its length
  const arrive = () => {
    const [who, value] = feed[i % feed.length];
    i += 1;
    const row = document.createElement("li");
    row.className = "cf-fx-move is-new";
    const name = document.createElement("span");
    name.className = "cf-fx-move__who";
    name.innerHTML = "<b></b><small></small>";
    name.firstChild.textContent = who;
    name.lastChild.textContent = value < 0 ? el.dataset.out : el.dataset.in;
    const amt = document.createElement("span");
    amt.className = `cf-fx-move__amt${value < 0 ? " is-out" : ""}`;
    amt.textContent = (value < 0 ? "\u2212" : "+") + money.format(Math.abs(value));
    row.append(name, amt);
    list.prepend(row);
    list.lastElementChild?.remove();
    gsap.to(state, { v: state.v + value, duration: 0.8, ease: "power2.out", overwrite: true, onUpdate: () => (amount.textContent = whole.format(Math.round(state.v))) });
  };
  const loop = () => {
    timer = window.setTimeout(() => {
      if (visible && !document.hidden) arrive();
      loop();
    }, 3600);
  };
  const io = new IntersectionObserver(([entry]) => {
    const first = !visible && entry.isIntersecting && !timer;
    visible = entry.isIntersecting;
    if (first) {
      window.setTimeout(arrive, 1200);
      loop();
    }
  });
  io.observe(el);
  return () => {
    io.disconnect();
    clearTimeout(timer);
  };
}

function receipt(el) {
  const range = el.querySelector("[data-nb-receipt-range]");
  const volume = el.querySelector("[data-nb-receipt-volume]");
  const times = el.querySelector("[data-nb-receipt-times]");
  const usage = el.querySelector("[data-nb-receipt-usage]");
  const total = el.querySelector("[data-nb-receipt-total]");
  if (!range) return () => {};
  const offs = [];
  const locale = el.dataset.locale || "it-IT";
  const price = Number(el.dataset.price) || 0;
  const eur = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", minimumFractionDigits: 2, useGrouping: "always" });
  const num = new Intl.NumberFormat(locale, { useGrouping: "always" });
  const shown = { v: Math.max(0, Number(range.value) - 10000) * price };
  const paint = () => {
    usage.textContent = eur.format(shown.v);
    total.textContent = eur.format(shown.v);
  };
  const update = () => {
    const n = Number(range.value);
    const over = Math.max(0, n - 10000);
    volume.textContent = num.format(n);
    times.textContent = (el.dataset.times || "{n}").replace("{n}", num.format(over));
    if (reduced()) {
      shown.v = over * price;
      paint();
    } else {
      gsap.to(shown, { v: over * price, duration: 0.35, ease: "power2.out", overwrite: true, onUpdate: paint });
    }
  };
  range.addEventListener("input", update);
  offs.push(() => range.removeEventListener("input", update));

  if (!reduced()) {
    offs.push(onceSeen(el.parentElement || el, () => gsap.fromTo(el, { y: 0, yPercent: -100 }, { y: 0, yPercent: 0, duration: 1.6, ease: "power2.out", delay: 0.2 }), 0.3));
  }
  return () => offs.forEach((fn) => fn());
}
