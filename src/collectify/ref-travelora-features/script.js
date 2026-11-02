import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Products from Collectify «ref-travelora-features», restyled for Nimbo: same stack and shrink, the heading
 * comes in with blur, each panel's Nimbi pops onto its corner, and the five mini interfaces are Nimbo's
 * (payment in progress, treasury day, compliance chat, nightly reconciliation, API terminal).
 * Original notes — Funzioni di Travelora: pila di card allo scroll.
 * - Da 900px in su le card sono sticky (CSS); qui ogni card che arriva rimpicciolisce quelle sotto
 *   di 3,6% e ne ingrigisce l'etichetta, come nello stato finale della shot.
 * - Testo a sinistra con blur quando la card entra; a destra la mini interfaccia si monta:
 *   prompt che si scrive, toast, orbita del pianeta arancione; giornata con il punto "adesso" che pulsa;
 *   chat con domanda, risposta, scheda del locale e puntini che rimbalzano; portafoglio con le righe in
 *   arrivo e il conto alla rovescia del volo.
 * - I cicli si fermano quando la card esce dallo schermo.
 * Con movimento ridotto la pila resta (è solo CSS) ma senza rimpicciolimento, ingressi né cicli.
 */
export default function initTravelora(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-tv]")];
  if (!sections.length) return () => {};
  const cleanups = sections.map((section) => setup(section));
  return () => cleanups.forEach((fn) => fn());
}

const EASE = "expo.out";
const SHRINK = 0.036;

function setup(section) {
  const stack = section.querySelector(".cf-tv__stack");
  const cards = [...section.querySelectorAll("[data-cf-tv-card]")];
  if (!stack || !cards.length) return () => {};

  const mm = gsap.matchMedia();

  mm.add(
    { motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 900px)" },
    (context) => {
      const { motion, wide } = context.conditions;
      if (!motion) return undefined;

      if (wide) setupStack(stack, cards);

      const head = [...section.querySelectorAll("[data-cf-tv-head]")];
      gsap.set(head, { visibility: "visible" });
      gsap.from(head, {
        autoAlpha: 0,
        y: 20,
        filter: "blur(8px)",
        duration: 1.1,
        stagger: 0.08,
        ease: EASE,
        clearProps: "filter",
        scrollTrigger: { trigger: head[0] || section, start: "top 85%", once: true },
      });

      cards.forEach((card) => {
        const copy = [...card.querySelectorAll("[data-cf-tv-copy] > *")];
        gsap.set(copy, { visibility: "visible" });
        const intro = gsap.timeline({ paused: true, defaults: { ease: EASE } });
        intro.from(copy, { autoAlpha: 0, y: 22, filter: "blur(8px)", duration: 1.1, stagger: 0.09, clearProps: "filter" }, 0);
        intro.from(parts(card, "nimbi"), { scale: 0.4, autoAlpha: 0, rotate: -30, duration: 0.9, ease: "back.out(2)" }, 0.35);

        const loop = BUILDERS[card.dataset.cfTvCard]?.(card, intro) ?? null;
        let introDone = false;
        let inView = false;
        if (loop) {
          intro.eventCallback("onComplete", () => {
            introDone = true;
            if (inView) loop.play();
          });
        }

        ScrollTrigger.create({ trigger: card, start: "top 70%", once: true, onEnter: () => intro.play() });
        if (loop) {
          ScrollTrigger.create({
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => {
              inView = self.isActive;
              if (!introDone) return;
              if (inView) loop.play();
              else loop.pause();
            },
          });
        }
      });

      return () => {
        cards.forEach((card) => card.classList.remove("is-under"));
        section.querySelectorAll(".cf-tv__steps li:last-child").forEach((el) => el.classList.remove("is-done"));
        section.querySelectorAll("[data-cf-tv-countdown]").forEach((el) => (el.textContent = formatMinutes(Number(el.dataset.cfTvCountdown))));
      };
    },
  );

  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => mm.revert();
}

/* ---------- Pila: progresso di ogni card verso la sua posizione sticky ---------- */

function setupStack(stack, cards) {
  // quickSetter non accetta lo scorciatoio "scale": due setter, uno per asse
  const setters = cards.map((card) => {
    const sx = gsap.quickSetter(card, "scaleX");
    const sy = gsap.quickSetter(card, "scaleY");
    return (value) => {
      sx(value);
      sy(value);
    };
  });
  gsap.set(cards, { transformOrigin: "50% 0%" });
  let geometry = null;

  // Le card sticky non si misurano bene mentre sono ferme: si calcola tutto dalla lista, che scorre
  const measure = () => {
    const styles = getComputedStyle(stack);
    const listTop = stack.getBoundingClientRect().top + window.scrollY;
    const padTop = parseFloat(styles.paddingTop) || 0;
    const gap = parseFloat(styles.rowGap) || 0;
    const height = cards[0].offsetHeight;
    geometry = cards.map((card, i) => {
      const natural = listTop + padTop + i * (height + gap);
      const stickTop = parseFloat(getComputedStyle(card).top) || 0;
      return { enter: natural - window.innerHeight, stick: natural - stickTop };
    });
  };

  const render = (scroll) => {
    if (!geometry) measure();
    const progress = geometry.map(({ enter, stick }) => gsap.utils.clamp(0, 1, (scroll - enter) / Math.max(1, stick - enter)));
    cards.forEach((card, i) => {
      let covered = 0;
      for (let j = i + 1; j < cards.length; j += 1) covered += progress[j];
      setters[i](1 - SHRINK * covered);
      card.classList.toggle("is-under", (progress[i + 1] ?? 0) > 0.55);
    });
  };

  ScrollTrigger.create({
    trigger: stack,
    start: "top bottom",
    end: "bottom top",
    onRefresh: (self) => {
      measure();
      render(self.scroll());
    },
    onUpdate: (self) => render(self.scroll()),
  });
}

/* ---------- Mini interfacce: ingresso + ciclo in pausa ---------- */

const parts = (card, name) => [...card.querySelectorAll(`[data-cf-tv-part="${name}"]`)];

const formatMinutes = (total) => `${Math.floor(total / 60)}H ${total % 60}M`;

const BUILDERS = {
  pay(card, tl) {
    const typed = card.querySelector("[data-cf-tv-type]");
    const full = typed?.textContent ?? "";
    const orbit = parts(card, "orbit");
    const core = parts(card, "core");
    const steps = parts(card, "step");
    const state = { n: 0 };

    tl.from(parts(card, "rise"), { autoAlpha: 0, y: 40, duration: 1.2 }, 0.1)
      .from(parts(card, "float"), { autoAlpha: 0, x: -16, duration: 0.9 }, 0.45)
      .from(core, { scale: 0, duration: 0.9, ease: "back.out(2)" }, 0.5)
      .from(steps, { autoAlpha: 0, x: -10, duration: 0.7, stagger: 0.1 }, 0.7)
      .fromTo(
        state,
        { n: 0 },
        {
          n: full.length,
          duration: full.length * 0.035,
          ease: "none",
          onUpdate: () => typed && (typed.textContent = full.slice(0, Math.round(state.n))),
        },
        0.75,
      )
      .from(parts(card, "toast"), { autoAlpha: 0, y: 12, scale: 0.92, duration: 0.8, ease: "back.out(1.8)" }, ">-0.1");

    // L'orbita gira, il nucleo respira, il terzo passo si completa e torna in attesa
    const loop = gsap.timeline({ paused: true });
    loop.to(orbit, { rotate: 360, duration: 6, ease: "none", repeat: -1 }, 0);
    loop.to(core, { scale: 1.08, duration: 1.4, ease: "sine.inOut", repeat: -1, yoyo: true }, 0);
    const third = steps[2];
    if (third) {
      const cycle = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
      cycle
        .call(() => third.classList.add("is-done"), null, 2.4)
        .call(() => third.classList.remove("is-done"), null, 4.6);
      loop.add(cycle, 0);
    }
    return loop;
  },

  treasury(card, tl) {
    const ping = parts(card, "ping");
    tl.from(parts(card, "rise"), { autoAlpha: 0, y: 48, duration: 1.2 }, 0.1).from(
      parts(card, "stop"),
      { autoAlpha: 0, y: 14, duration: 0.8, stagger: 0.1 },
      0.4,
    );

    // Il punto "adesso" manda un'onda
    return gsap
      .timeline({ paused: true, repeat: -1, repeatDelay: 0.6 })
      .fromTo(ping, { scale: 1, autoAlpha: 0.9 }, { scale: 2.6, autoAlpha: 0, duration: 1.6, ease: "power2.out" });
  },

  compliance(card, tl) {
    const dots = parts(card, "dot");
    tl.from(parts(card, "drop"), { autoAlpha: 0, y: -14, duration: 0.9 }, 0.1)
      .from(parts(card, "ctx"), { autoAlpha: 0, y: 8, scale: 0.94, duration: 0.7, stagger: 0.08 }, 0.25)
      .from(parts(card, "rise"), { autoAlpha: 0, y: 36, duration: 1.1 }, 0.3)
      .from(parts(card, "me"), { autoAlpha: 0, x: 24, duration: 0.8 }, 0.7)
      .from(parts(card, "reply"), { autoAlpha: 0, y: 12, duration: 0.8 }, 1.05)
      .from(parts(card, "place"), { autoAlpha: 0, y: 12, duration: 0.8 }, 1.3);

    // "Nimbo is checking…": the dots bounce
    return gsap
      .timeline({ paused: true, repeat: -1 })
      .to(dots, { y: -4, duration: 0.32, ease: "sine.out", stagger: 0.14, yoyo: true, repeat: 1 })
      .to({}, { duration: 0.4 });
  },

  analytics(card, tl) {
    const counter = card.querySelector("[data-cf-tv-countdown]");
    tl.from(parts(card, "drop"), { autoAlpha: 0, y: -12, duration: 0.8, stagger: 0.08 }, 0.1)
      .from(parts(card, "rise"), { autoAlpha: 0, y: 36, duration: 1.1 }, 0.2)
      .from(parts(card, "row"), { autoAlpha: 0, x: 22, duration: 0.8, stagger: 0.09 }, 0.45)
      .from(parts(card, "today"), { scale: 0, duration: 0.6, ease: "back.out(2.6)" }, 0.95);

    // Countdown to the next reconciliation: one minute every 4 seconds, then it starts again
    if (!counter) return null;
    const start = Number(counter.dataset.cfTvCountdown) || 0;
    let minutes = start;
    return gsap
      .timeline({ paused: true, repeat: -1 })
      .to({}, { duration: 4 })
      .call(() => {
        minutes = minutes > start - 9 ? minutes - 1 : start;
        counter.textContent = formatMinutes(minutes);
      });
  },

  api(card, tl) {
    const typed = card.querySelector("[data-cf-tv-type]");
    const full = typed?.textContent ?? "";
    const state = { n: 0 };
    tl.from(parts(card, "rise"), { autoAlpha: 0, y: 40, duration: 1.2 }, 0.1)
      .fromTo(
        state,
        { n: 0 },
        {
          n: full.length,
          duration: full.length * 0.05,
          ease: "none",
          onUpdate: () => typed && (typed.textContent = full.slice(0, Math.round(state.n))),
        },
        0.45,
      )
      .from(parts(card, "line"), { autoAlpha: 0, x: -8, duration: 0.5, stagger: 0.08 }, ">")
      .from(parts(card, "result"), { autoAlpha: 0, y: 10, duration: 0.7, stagger: 0.15 }, ">-0.1")
      .from(parts(card, "ctx"), { autoAlpha: 0, y: 8, duration: 0.6, stagger: 0.07 }, "<")
      .from(parts(card, "toast"), { autoAlpha: 0, y: 12, scale: 0.92, duration: 0.8, ease: "back.out(1.8)" }, ">-0.2");

    // the status dot breathes and the webhook toast nudges, as if new events kept arriving
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    loop
      .to(parts(card, "blink"), { opacity: 0.25, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 3 }, 0)
      .fromTo(parts(card, "toast"), { y: 0 }, { y: -6, duration: 0.35, ease: "power2.out", yoyo: true, repeat: 1 }, 2.4)
      .to({}, { duration: 1.2 });
    return loop;
  },
};
