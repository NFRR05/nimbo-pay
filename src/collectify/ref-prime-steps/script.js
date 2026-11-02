import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * «How it works» from Collectify «ref-prime-steps», restyled for Nimbo: same intro and motion; the popup is the
 * «sandbox ready» toast, the two chat messages are the connectors, the three cursors are the colour marks, and the
 * live-payment track fills up once the third card is in. No avatar images, so no broken-image handling.
 * Original notes — «Here's how it works» di Prime Design.
 * Quando la sezione entra nello schermo: l'occhiello si scrive, il titolo sale, il filo orizzontale
 * si allunga dal centro e i fili verticali scendono; poi le tre colonne una dopo l'altra (scheda, etichetta,
 * testi). Dentro le schede: si apre il popup del calendario, arrivano i due messaggi della chat e i tre
 * cursori volano al loro posto. Finché la sezione si vede i cursori ondeggiano piano, come in una
 * sessione condivisa. Con movimento ridotto non c'è nessun ingresso né movimento.
 */
export default function initPrimeSteps(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-pd]")];
  if (!sections.length) return () => {};

  const cleanups = sections.map((section) => {
    const offs = [setupIntro(section)];
    return () => offs.forEach((fn) => fn());
  });
  return () => cleanups.forEach((fn) => fn());
}

// Da dove arrivano i cursori (in px della scheda, moltiplicati per la scala attuale)
const CURSOR_FROM = [
  { x: 60, y: -40 },
  { x: -70, y: 50 },
  { x: -50, y: 40 },
];

function setupIntro(section) {
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const pick = (name, scope = section) => [...scope.querySelectorAll(`[data-cf-pd-in="${name}"]`)];
    const all = [...section.querySelectorAll("[data-cf-pd-in]")];
    const steps = [...section.querySelectorAll("[data-cf-pd-step]")];
    const typed = section.querySelector("[data-cf-pd-type]");
    const pop = section.querySelector("[data-cf-pd-pop]");
    const msgs = [...section.querySelectorAll("[data-cf-pd-msg]")];
    const cursors = [...section.querySelectorAll("[data-cf-pd-cursor]")];
    const scale = () => {
      const shot = section.querySelector(".cf-pd__shot");
      return shot ? shot.getBoundingClientRect().width / 420 : 1;
    };

    gsap.set(all, { visibility: "visible" });
    gsap.set(steps, { "--pd-draw": 0 });

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    const [eyebrow, title] = pick("head");

    tl.from(eyebrow, { autoAlpha: 0, duration: 0.4 }, 0);
    if (typed) {
      tl.fromTo(
        typed,
        { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: `steps(${Math.max(8, typed.textContent.trim().length)})`, clearProps: "clipPath" },
        0.1,
      );
    }
    tl.from(title, { autoAlpha: 0, y: 22, filter: "blur(8px)", duration: 1, clearProps: "filter" }, 0.2)
      .from(pick("rule"), { autoAlpha: 0, scaleX: 0, duration: 1.2, ease: "expo.inOut" }, 0.35)
      .to(steps, { "--pd-draw": 1, duration: 1, ease: "expo.inOut", stagger: 0.1 }, 0.7);

    steps.forEach((step, i) => {
      const at = 0.6 + i * 0.16;
      tl.from(pick("shot", step), { autoAlpha: 0, y: 26, scale: 0.97, transformOrigin: "50% 100%", duration: 0.9 }, at)
        .from(pick("chip", step), { autoAlpha: 0, scale: 0.8, transformOrigin: "0% 50%", duration: 0.6, ease: "back.out(2)" }, at + 0.25)
        .from(pick("text", step), { autoAlpha: 0, y: 14, duration: 0.8, stagger: 0.08 }, at + 0.3);
    });

    const track = section.querySelector(".cf-pd__live-track span");
    if (track) tl.from(track, { scaleX: 0, duration: 1.4, ease: "power2.inOut" }, 1.25);
    if (pop) tl.from(pop, { autoAlpha: 0, scale: 0.88, y: -6, duration: 0.6, ease: "back.out(1.8)" }, 1.15);
    if (msgs.length) tl.from(msgs, { autoAlpha: 0, x: -14, duration: 0.6, stagger: 0.25 }, 1.2);
    cursors.forEach((cursor, i) => {
      const from = CURSOR_FROM[i % CURSOR_FROM.length];
      tl.from(
        cursor,
        { autoAlpha: 0, x: () => from.x * scale(), y: () => from.y * scale(), duration: 1.1, ease: "power2.out" },
        1.3 + i * 0.15,
      );
    });
    tl.from(pick("perks"), { autoAlpha: 0, y: 24, duration: 0.9 }, 1.1);

    // Ondeggiamento dei cursori, solo mentre la sezione si vede e dopo l'ingresso
    const drift = cursors.map((cursor, i) =>
      gsap.to(cursor, {
        x: () => (i % 2 ? -5 : 6) * scale(),
        y: () => (i === 1 ? 4 : -4) * scale(),
        duration: 2.4 + i * 0.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        paused: true,
      }),
    );
    tl.eventCallback("onComplete", () => drift.forEach((tw) => tw.play()));

    const enter = ScrollTrigger.create({
      trigger: section,
      start: "top 75%",
      once: true,
      onEnter: () => tl.play(),
    });
    const live = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        if (tl.progress() < 1) return;
        drift.forEach((tw) => (self.isActive ? tw.play() : tw.pause()));
      },
    });

    return () => {
      enter.kill();
      live.kill();
      drift.forEach((tw) => tw.kill());
    };
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => mm.revert();
}
