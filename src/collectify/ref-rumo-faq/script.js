import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * FAQ from Collectify «ref-rumo-faq», restyled for Nimbo: no photo (so no broken-image handling), the five
 * Nimbi hop up as the picture is revealed, and opening a question makes one Nimbi hop (none with reduced motion).
 * Original notes — FAQ «Rumo».
 * - Fisarmonica: data-cf-rm-acc="single" (una risposta aperta alla volta, come nella shot) o "multi".
 *   Altezza animata con GSAP, freccia che ruota in CSS; i pannelli chiusi diventano inert.
 * - Ingresso allo scroll: titolo riga per riga, sottotitolo con blur, foto che si scopre da sinistra, domande in sequenza.
 * Con movimento ridotto i pannelli si aprono senza animazione e non c'è ingresso.
 */
export default function initRumoFaq(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-rm]")];
  if (!sections.length) return () => {};

  const cleanups = sections.map((section) => {
    const offs = [setupAccordion(section), setupIntro(section)];
    return () => offs.forEach((fn) => fn());
  });
  return () => cleanups.forEach((fn) => fn());
}

function setupAccordion(section) {
  const list = section.querySelector("[data-cf-rm-acc]");
  if (!list) return () => {};
  const single = list.dataset.cfRmAcc !== "multi";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const buttons = [...list.querySelectorAll("[data-cf-rm-btn]")];
  const panelOf = (btn) => section.querySelector(`#${btn.getAttribute("aria-controls")}`);
  const nimbi = [...section.querySelectorAll("[data-cf-rm-nimbi]")];
  const hop = (index) => {
    const one = nimbi[index % nimbi.length];
    if (!one || reduce.matches) return;
    gsap.timeline()
      .to(one, { y: -16, duration: 0.22, ease: "power2.out" })
      .to(one, { y: 0, duration: 0.5, ease: "bounce.out" });
  };

  const setPanel = (btn, open, instant) => {
    const panel = panelOf(btn);
    if (!panel) return;
    btn.setAttribute("aria-expanded", String(open));
    gsap.killTweensOf(panel);
    panel.inert = !open;
    if (open) {
      gsap.set(panel, { visibility: "visible" });
      if (instant) gsap.set(panel, { height: "auto" });
      else gsap.fromTo(panel, { height: panel.offsetHeight }, { height: "auto", duration: 0.6, ease: "power3.out" });
    } else if (instant) {
      gsap.set(panel, { height: 0, visibility: "hidden" });
    } else {
      gsap.fromTo(
        panel,
        { height: panel.offsetHeight },
        { height: 0, duration: 0.5, ease: "power3.out", onComplete: () => gsap.set(panel, { visibility: "hidden" }) },
      );
    }
  };

  buttons.forEach((btn) => setPanel(btn, btn.getAttribute("aria-expanded") === "true", true));

  const onClick = (event) => {
    const btn = event.target.closest("[data-cf-rm-btn]");
    if (!btn || !list.contains(btn)) return;
    const open = btn.getAttribute("aria-expanded") !== "true";
    const instant = reduce.matches;
    if (single && open) buttons.forEach((other) => other !== btn && other.getAttribute("aria-expanded") === "true" && setPanel(other, false, instant));
    setPanel(btn, open, instant);
    if (open) hop(buttons.indexOf(btn));
  };

  list.addEventListener("click", onClick);
  return () => {
    list.removeEventListener("click", onClick);
    buttons.forEach((btn) => {
      const panel = panelOf(btn);
      if (!panel) return;
      gsap.killTweensOf(panel);
      gsap.set(panel, { clearProps: "height,visibility" });
      panel.inert = false;
    });
    gsap.killTweensOf(nimbi);
    gsap.set(nimbi, { clearProps: "transform" });
  };
}

function setupIntro(section) {
  const pick = (name) => [...section.querySelectorAll(`[data-cf-rm-in="${name}"]`)];
  const all = [...section.querySelectorAll("[data-cf-rm-in]")];
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.set(all, { visibility: "visible" });
    const ease = "expo.out";
    const photo = pick("photo")[0];

    const tl = gsap.timeline({ defaults: { ease }, scrollTrigger: { trigger: section, start: "top 78%", once: true } });
    tl.from(pick("line"), { yPercent: 110, duration: 1.2, stagger: 0.1 }, 0)
      .from(pick("copy"), { autoAlpha: 0, y: 14, filter: "blur(8px)", duration: 1, clearProps: "filter,transform" }, 0.25)
      .from(pick("item"), { autoAlpha: 0, y: 26, duration: 1, stagger: 0.08, clearProps: "transform" }, 0.15);

    if (photo) {
      tl.from(photo.querySelector(".cf-rm__floor"), { clipPath: "inset(0% 100% 0% 0%)", duration: 1.6, ease: "expo.inOut", clearProps: "clipPath" }, 0.2).from(
        photo.querySelectorAll("[data-cf-rm-nimbi]"),
        { yPercent: 40, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "back.out(2)", clearProps: "transform,opacity,visibility" },
        0.55,
      );
    }
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  return () => mm.revert();
}
