/**
 * Navbar che si nasconde scorrendo verso il basso e ricompare appena torni su.
 * Legge il data-theme della sezione che ha sotto e si adatta (chiaro/scuro).
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
    if (toggle) toggle.textContent = open ? "Chiudi" : "Menu";
    window.cfLenis?.[open ? "stop" : "start"]?.();
  };

  const themeUnderNav = () => {
    const y = nav.offsetHeight / 2;
    const stack = document.elementsFromPoint(window.innerWidth / 2, y);
    const below = stack.find((el) => !nav.contains(el) && el.closest("[data-theme]"));
    return below?.closest("[data-theme]")?.dataset.theme;
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

    const theme = themeUnderNav();
    if (theme && nav.dataset.theme !== theme) nav.dataset.theme = theme;
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

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  toggle?.addEventListener("click", onToggle);
  panel?.addEventListener("click", onPanelClick);
  nav.addEventListener("focusin", onFocusIn);
  document.addEventListener("keydown", onKey);
  desktop.addEventListener("change", onBreakpoint);

  setOpen(false);
  update();

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    toggle?.removeEventListener("click", onToggle);
    panel?.removeEventListener("click", onPanelClick);
    nav.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("keydown", onKey);
    desktop.removeEventListener("change", onBreakpoint);
  };
}
