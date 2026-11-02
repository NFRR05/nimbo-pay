/**
 * FAQ from Collectify «ref-rumo-faq», reduced for Nimbo.
 * Accordion: data-cf-rm-acc="single" (one answer open at a time) or "multi". The script only flips
 * aria-expanded and inert; the height and the chevron are animated in CSS (and not at all with reduced motion).
 */
export default function initRumoFaq(root = document) {
  const lists = [...root.querySelectorAll("[data-cf-rm] [data-cf-rm-acc]")];
  if (!lists.length) return () => {};
  const cleanups = lists.map((list) => setupAccordion(list));
  return () => cleanups.forEach((fn) => fn());
}

function setupAccordion(list) {
  const single = list.dataset.cfRmAcc !== "multi";
  const buttons = [...list.querySelectorAll("[data-cf-rm-btn]")];
  const panelOf = (btn) => list.querySelector(`#${btn.getAttribute("aria-controls")}`);

  const setPanel = (btn, open) => {
    btn.setAttribute("aria-expanded", String(open));
    const panel = panelOf(btn);
    if (panel) panel.inert = !open;
  };

  const onClick = (event) => {
    const btn = event.target.closest("[data-cf-rm-btn]");
    if (!btn || !list.contains(btn)) return;
    const open = btn.getAttribute("aria-expanded") !== "true";
    if (single && open) buttons.forEach((other) => other !== btn && setPanel(other, false));
    setPanel(btn, open);
  };

  list.addEventListener("click", onClick);
  return () => list.removeEventListener("click", onClick);
}
