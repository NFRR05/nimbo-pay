import gsap from "gsap";

/**
 * The Nimbo app on the phone in the bento (reconciliation card).
 * When the card comes into view the phone rises from the bottom of the card, then the rows still "matching"
 * get matched one after the other (the counter and the bar follow). The rows left to check have a Match
 * button; the filter shows only those. With reduced motion everything is already matched and nothing moves.
 * <div data-nb-recon data-total data-start> … [data-nb-recon-row data-state="waiting|todo|done"] …
 */
export default function initRecon(root = document) {
  const apps = [...root.querySelectorAll("[data-nb-recon]")];
  if (!apps.length) return () => {};
  const cleanups = apps.map(setup);
  return () => cleanups.forEach((fn) => fn());
}

function setup(app) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const total = Number(app.dataset.total) || 0;
  let matched = Number(app.dataset.start) || 0;
  const count = app.querySelector("[data-nb-recon-count]");
  const bar = app.querySelector("[data-nb-recon-bar]");
  const badge = app.querySelector("[data-nb-recon-todo]");
  const rows = [...app.querySelectorAll("[data-nb-recon-row]")];
  const filters = [...app.querySelectorAll("[data-nb-recon-filter]")];
  const phone = app.closest("[data-cf-fx-rise]");
  const card = app.closest("article") || app;
  const offs = [];
  const timers = [];

  const render = () => {
    if (count) count.textContent = String(matched);
    bar?.style.setProperty("--p", String(total ? matched / total : 0));
    const todo = rows.filter((r) => r.dataset.state === "todo").length;
    if (badge) {
      badge.textContent = String(todo);
      badge.hidden = todo === 0;
    }
    app.toggleAttribute("data-empty", todo === 0);
  };
  const match = (row) => {
    if (row.dataset.state === "done") return;
    row.dataset.state = "done";
    matched = Math.min(total, matched + 1);
    render();
  };

  // matched by Nimbo while you watch
  const auto = rows.filter((r) => r.dataset.state === "waiting");
  if (reduce) {
    auto.forEach(match);
  } else {
    if (phone) gsap.set(phone, { y: 120 });
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        if (phone) gsap.to(phone, { y: 0, duration: 1.4, ease: "expo.out", delay: 0.15 });
        auto.forEach((row, i) => timers.push(window.setTimeout(() => match(row), 1100 + i * 850)));
      },
      { threshold: 0.35 },
    );
    io.observe(card);
    offs.push(() => io.disconnect());
  }

  // matched by you
  rows.forEach((row) => {
    const button = row.querySelector("button");
    if (!button) return;
    const onClick = () => {
      match(row);
      const next = rows.find((r) => r.dataset.state === "todo")?.querySelector("button");
      (next || filters[0])?.focus({ preventScroll: true });
    };
    button.addEventListener("click", onClick);
    offs.push(() => button.removeEventListener("click", onClick));
  });

  // the filter
  filters.forEach((button) => {
    const onClick = () => {
      app.dataset.filter = button.dataset.nbReconFilter;
      filters.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    };
    button.addEventListener("click", onClick);
    offs.push(() => button.removeEventListener("click", onClick));
  });

  render();
  return () => {
    timers.forEach((t) => clearTimeout(t));
    offs.forEach((fn) => fn());
    if (phone) gsap.set(phone, { clearProps: "transform" });
  };
}
