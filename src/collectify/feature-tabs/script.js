import gsap from "gsap";

/**
 * Tab accessibili con autoplay e barra di avanzamento.
 * L'autoplay si ferma con hover, focus, fuori schermo e con il bottone Pausa;
 * se l'utente sceglie un tab, il timer riparte da quel tab.
 */
export default function initFeatureTabs(root = document) {
  const cleanups = [...root.querySelectorAll("[data-cf-tabs]")].map(setupTabs);
  return () => cleanups.forEach((fn) => fn());
}

function setupTabs(el) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tabs = [...el.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
  const pauseBtn = el.querySelector("[data-cf-tabs-pause]");
  const seconds = parseFloat(el.dataset.cfAutoplay) || 0;
  const autoplay = seconds > 0 && !reduce;

  let current = Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));
  let progress = null;
  let hovered = false;
  let focused = false;
  let offscreen = false;
  let userPaused = false;

  const shouldRun = () => autoplay && !hovered && !focused && !offscreen && !userPaused && !document.hidden;

  const sync = () => {
    if (!progress) return;
    shouldRun() ? progress.play() : progress.pause();
  };

  const startProgress = () => {
    progress?.kill();
    tabs.forEach((t) => t.style.setProperty("--cf-progress", "0"));
    if (!autoplay) return;
    progress = gsap.fromTo(
      tabs[current],
      { "--cf-progress": 0 },
      { "--cf-progress": 1, duration: seconds, ease: "none", paused: true, onComplete: () => select((current + 1) % tabs.length) },
    );
    sync();
  };

  const select = (index, { focus = false } = {}) => {
    const prev = current;
    current = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) tabs[index].focus();
    if (prev !== index && !reduce) {
      gsap.fromTo(panels[index], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" });
    }
    startProgress();
  };

  const onClick = (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tabs.indexOf(tab));
  };

  const onKey = (event) => {
    const i = tabs.indexOf(event.target.closest('[role="tab"]'));
    if (i < 0) return;
    const keys = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select((keys[event.key] + tabs.length) % tabs.length, { focus: true });
  };

  const onPause = () => {
    userPaused = !userPaused;
    pauseBtn.setAttribute("aria-pressed", String(userPaused));
    pauseBtn.textContent = userPaused ? "Riprendi" : "Pausa";
    sync();
  };

  const onEnter = () => ((hovered = true), sync());
  const onLeave = () => ((hovered = false), sync());
  const onFocusIn = (event) => {
    // Solo il focus da tastiera mette in pausa: un clic col mouse non deve bloccare l'autoplay
    if (event.target === pauseBtn || !event.target.matches(":focus-visible")) return;
    focused = true;
    sync();
  };
  const onFocusOut = (event) => {
    if (!el.contains(event.relatedTarget)) {
      focused = false;
      sync();
    }
  };
  const onVisibility = () => sync();

  const io = new IntersectionObserver(([entry]) => {
    offscreen = !entry.isIntersecting;
    sync();
  });

  if (pauseBtn) pauseBtn.hidden = !autoplay;

  el.addEventListener("click", onClick);
  el.addEventListener("keydown", onKey);
  el.addEventListener("pointerenter", onEnter);
  el.addEventListener("pointerleave", onLeave);
  el.addEventListener("focusin", onFocusIn);
  el.addEventListener("focusout", onFocusOut);
  pauseBtn?.addEventListener("click", onPause);
  document.addEventListener("visibilitychange", onVisibility);
  io.observe(el);

  select(current);

  return () => {
    progress?.kill();
    io.disconnect();
    el.removeEventListener("click", onClick);
    el.removeEventListener("keydown", onKey);
    el.removeEventListener("pointerenter", onEnter);
    el.removeEventListener("pointerleave", onLeave);
    el.removeEventListener("focusin", onFocusIn);
    el.removeEventListener("focusout", onFocusOut);
    pauseBtn?.removeEventListener("click", onPause);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
