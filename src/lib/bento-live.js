import gsap from "gsap";

/**
 * The two wide cards of the bento, alive:
 * - treasury [data-nb-treasury]: every few seconds a movement arrives (a pill: black in, white out) and the
 *   balance follows it, while the card is in view;
 * - forecast [data-nb-forecast]: the 30-day line draws itself once, then the pointer (or a finger dragging
 *   across) reads any day: a dashed cursor, a dot on the line, the date, the amount and the change from today;
 * - receipt [data-nb-receipt]: it prints when it comes into view; the slider sets the monthly volume and the
 *   usage line and the total follow (the first 10,000 are free).
 * With reduced motion nothing arrives, draws or prints; the chart and the slider still answer.
 */
export default function initBentoLive(root = document) {
  const offs = [];
  root.querySelectorAll("[data-nb-treasury]").forEach((el) => offs.push(treasury(el)));
  root.querySelectorAll("[data-nb-forecast]").forEach((el) => offs.push(forecast(el)));
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
  const toast = el.querySelector("[data-nb-treasury-toast]");
  let feed = [];
  try {
    feed = JSON.parse(el.dataset.feed || "[]");
  } catch (err) {
    feed = [];
  }
  if (reduced() || !feed.length || !amount || !toast) return () => {};
  const locale = el.dataset.locale || "it-IT";
  const whole = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
  const signed = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", signDisplay: "always", useGrouping: "always" });
  const state = { v: Number(el.dataset.amount) || 0 };
  let i = 0;
  let timer = 0;
  let hide = 0;
  let visible = false;

  const arrive = () => {
    const [who, value] = feed[i % feed.length];
    i += 1;
    toast.textContent = `${signed.format(value)} · ${who}`;
    toast.classList.toggle("is-out", value < 0);
    toast.classList.add("is-on");
    clearTimeout(hide);
    hide = window.setTimeout(() => toast.classList.remove("is-on"), 2300);
    gsap.to(state, { v: state.v + value, duration: 1, ease: "power2.out", overwrite: true, onUpdate: () => (amount.textContent = whole.format(Math.round(state.v))) });
  };
  const loop = () => {
    timer = window.setTimeout(() => {
      if (visible && !document.hidden) arrive();
      loop();
    }, 3400);
  };
  const io = new IntersectionObserver(([entry]) => {
    const first = !visible && entry.isIntersecting && !timer;
    visible = entry.isIntersecting;
    if (first) {
      window.setTimeout(arrive, 900);
      loop();
    }
  });
  io.observe(el);
  return () => {
    io.disconnect();
    clearTimeout(timer);
    clearTimeout(hide);
  };
}

function forecast(el) {
  let values = [];
  try {
    values = JSON.parse(el.dataset.values || "[]");
  } catch (err) {
    values = [];
  }
  const plot = el.querySelector("[data-nb-forecast-plot]");
  const cursor = el.querySelector("[data-nb-forecast-cursor]");
  const dot = el.querySelector("[data-nb-forecast-dot]");
  const when = el.querySelector("[data-nb-forecast-when]");
  const value = el.querySelector("[data-nb-forecast-value]");
  const delta = el.querySelector("[data-nb-forecast-delta]");
  if (values.length < 2 || !plot) return () => {};
  const offs = [];
  const n = values.length - 1;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const y = (v) => 86 - ((v - lo) / (hi - lo)) * 72; // as drawn on the server
  const locale = el.dataset.locale || "it-IT";
  const whole = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: "exceptZero" });
  const rest = { when: when.textContent, value: value.textContent, delta: delta.textContent };

  const read = (e) => {
    const r = plot.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const d = Math.round(f * n);
    const v = values[d];
    cursor.setAttribute("x1", String((d / n) * 300));
    cursor.setAttribute("x2", String((d / n) * 300));
    dot.style.setProperty("--x", `${(d / n) * 100}%`);
    dot.style.setProperty("--y", `${y(v)}%`);
    when.textContent = d === 0 ? el.dataset.today : (el.dataset.day || "{n}").replace("{n}", String(d));
    value.textContent = whole.format(v);
    delta.textContent = d === 0 ? "" : pct.format(v / values[0] - 1);
    el.classList.add("is-reading");
  };
  const leave = () => {
    when.textContent = rest.when;
    value.textContent = rest.value;
    delta.textContent = rest.delta;
    el.classList.remove("is-reading");
  };
  plot.addEventListener("pointermove", read);
  plot.addEventListener("pointerdown", read);
  plot.addEventListener("pointerleave", leave);
  plot.addEventListener("pointercancel", leave);
  offs.push(() => {
    plot.removeEventListener("pointermove", read);
    plot.removeEventListener("pointerdown", read);
    plot.removeEventListener("pointerleave", leave);
    plot.removeEventListener("pointercancel", leave);
  });

  const svg = plot.querySelector("svg");
  if (svg && !reduced()) {
    // drawn from left to right (a clip, so the stroke keeps its width whatever the card's size)
    offs.push(onceSeen(el, () => gsap.fromTo(svg, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.8, ease: "power2.inOut", delay: 0.2 })));
  }
  return () => offs.forEach((fn) => fn());
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
