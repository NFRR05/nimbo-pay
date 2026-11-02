import gsap from "gsap";

/**
 * Accordion basato su <details>/<summary> con apertura e chiusura animate.
 * L'attributo name rende il gruppo esclusivo anche senza JS; con JS lo script
 * lo sostituisce per poter animare anche la chiusura dell'elemento precedente.
 */
export default function initFaqAccordion(root = document) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = [...root.querySelectorAll("details.cf-faq__item")];
  const cleanups = [];

  items.forEach((details) => {
    if (details.name) {
      details.dataset.cfGroup = details.name;
      details.removeAttribute("name");
    }
  });

  const content = (details) => details.querySelector(".cf-faq__content");

  const close = (details) => {
    if (!details.open) return;
    if (reduce) {
      details.open = false;
      return;
    }
    details.dataset.closing = "";
    gsap.fromTo(
      content(details),
      { height: content(details).offsetHeight },
      {
        height: 0,
        duration: 0.45,
        ease: "power3.inOut",
        overwrite: true,
        onComplete: () => {
          details.open = false;
          delete details.dataset.closing;
          gsap.set(content(details), { clearProps: "height" });
        },
      },
    );
  };

  const open = (details) => {
    const group = details.dataset.cfGroup;
    if (group) {
      items.filter((d) => d !== details && d.dataset.cfGroup === group).forEach(close);
    }
    delete details.dataset.closing;
    details.open = true;
    if (reduce) return;
    gsap.fromTo(
      content(details),
      { height: 0 },
      { height: "auto", duration: 0.55, ease: "power3.out", overwrite: true, clearProps: "height" },
    );
  };

  items.forEach((details) => {
    const summary = details.querySelector("summary");
    const onClick = (event) => {
      event.preventDefault();
      details.open && !("closing" in details.dataset) ? close(details) : open(details);
    };
    summary.addEventListener("click", onClick);
    cleanups.push(() => summary.removeEventListener("click", onClick));
  });

  return () => {
    cleanups.forEach((fn) => fn());
    items.forEach((details) => {
      if (details.dataset.cfGroup) details.setAttribute("name", details.dataset.cfGroup);
    });
  };
}
