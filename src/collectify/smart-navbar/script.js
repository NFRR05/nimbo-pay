/**
 * Navbar che si nasconde scorrendo verso il basso e ricompare appena torni su.
 * Legge il data-theme della sezione che ha sotto e si adatta (chiaro/scuro): un IntersectionObserver su una
 * striscia sottile all'altezza della barra, invece di un elementsFromPoint a ogni fotogramma di scroll.
 * Sotto i 48rem i link finiscono in un pannello aperto dal bottone "Menu".
 */
export default function initSmartNav(root = document) {
  const navs = [...root.querySelectorAll("[data-cf-smart-nav]")];
  const cleanups = navs.map(setupNav);
  return () => cleanups.forEach((fn) => fn());
}

function setupNav(nav) {
  const threshold = parseFloat(nav.dataset.cfThreshold) || 120;
  const toggle = nav.querySelector("[data-cf-nav-toggle]");
  const panel = toggle && document.getElementById(toggle.getAttribute("aria-controls"));
  let lastY = window.scrollY;
  let ticking = false;

  const setOpen = (open) => {
    nav.dataset.open = String(open);
    toggle?.setAttribute("aria-expanded", String(open));
    if (toggle) toggle.textContent = open ? toggle.dataset.cfNavClose || "Chiudi" : toggle.dataset.cfNavOpen || "Menu";
    window.cfLenis?.[open ? "stop" : "start"]?.();
  };

  // sections with a theme under the bar's middle line; the innermost one wins
  const under = new Set();
  const depth = (el) => {
    let d = 0;
    for (let n = el; n; n = n.parentElement) d += 1;
    return d;
  };
  const applyTheme = () => {
    let best = null;
    under.forEach((el) => {
      if (!best || depth(el) > depth(best)) best = el;
    });
    const theme = best?.dataset.theme;
    if (theme && nav.dataset.theme !== theme) nav.dataset.theme = theme;
  };
  let themeIO = null;
  const watchThemes = () => {
    themeIO?.disconnect();
    under.clear();
    const y = Math.round(nav.offsetHeight / 2);
    themeIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? under.add(e.target) : under.delete(e.target)));
        applyTheme();
      },
      { rootMargin: `-${y}px 0px -${Math.max(0, window.innerHeight - y - 1)}px 0px` },
    );
    document.querySelectorAll("[data-theme]").forEach((el) => !nav.contains(el) && el !== nav && themeIO.observe(el));
  };

  const update = () => {
    ticking = false;
    const y = Math.max(0, window.scrollY);
    const delta = y - lastY;

    nav.dataset.scrolled = String(y > 8);

    if (Math.abs(delta) > 4) {
      const busy = nav.dataset.open === "true" || nav.contains(document.activeElement);
      nav.dataset.hidden = String(delta > 0 && y > threshold && !busy);
      lastY = y;
    }

  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  const onToggle = () => setOpen(nav.dataset.open !== "true");

  const onKey = (event) => {
    if (event.key === "Escape" && nav.dataset.open === "true") {
      setOpen(false);
      toggle?.focus();
    }
  };

  const onPanelClick = (event) => {
    if (event.target.closest("a")) setOpen(false);
  };

  const onFocusIn = () => (nav.dataset.hidden = "false");

  const desktop = window.matchMedia("(min-width: 48rem)");
  const onBreakpoint = () => desktop.matches && setOpen(false);

  const onResize = () => {
    onScroll();
    watchThemes();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  toggle?.addEventListener("click", onToggle);
  panel?.addEventListener("click", onPanelClick);
  nav.addEventListener("focusin", onFocusIn);
  document.addEventListener("keydown", onKey);
  desktop.addEventListener("change", onBreakpoint);

  setOpen(false);
  update();
  watchThemes();

  return () => {
    themeIO?.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    toggle?.removeEventListener("click", onToggle);
    panel?.removeEventListener("click", onPanelClick);
    nav.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("keydown", onKey);
    desktop.removeEventListener("change", onBreakpoint);
  };
}
