import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Bento from Collectify «ref-finax-bento», restyled for Nimbo: same motion, the amount counts in euro
 * with the page locale, and the heading above the grid comes in with blur.
 * Original notes — Bento «Finax».
 * Ingresso allo scroll delle card a cascata, poi in ogni card:
 * - mappa: il bonifico sale, le puntine con le bandiere spuntano e i percorsi tratteggiati scorrono;
 * - infinito: gli anelli girano piano in versi opposti e la lancetta dell'orologio fa il giro;
 * - abbonamenti: le righe entrano e la scheda «Trial» arriva ruotando, poi ondeggia;
 * - grafico: la linea si disegna, il punto e il riquadro compaiono, l'importo conta fino a $25,312, il telefono sale;
 * - commissioni: le etichette barrate cadono dall'alto e rimbalzano.
 * I cicli si fermano fuori dallo schermo. Con movimento ridotto tutto è fermo e visibile.
 */
export default function initFinaxBento(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-fx]")];
  if (!sections.length) return () => {};
  const cleanups = sections.map(setup);
  return () => cleanups.forEach((fn) => fn());
}

function setup(section) {
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const loops = [];
    const cards = [...section.querySelectorAll('[data-cf-fx-in="card"]')];
    const onEnter = (el, fn, start = "top 82%") => ScrollTrigger.create({ trigger: el, start, once: true, onEnter: fn });

    gsap.from(cards, {
      autoAlpha: 0,
      y: 36,
      duration: 1.05,
      ease: "power3.out",
      stagger: 0.1,
      scrollTrigger: { trigger: section.querySelector(".cf-fx__grid"), start: "top 85%", once: true },
    });

    const q = (sel) => [...section.querySelectorAll(sel)];

    const head = q('[data-cf-fx-in="head"]');
    gsap.from(head, {
      autoAlpha: 0,
      y: 18,
      filter: "blur(8px)",
      duration: 1.05,
      ease: "power3.out",
      stagger: 0.08,
      clearProps: "filter",
      scrollTrigger: { trigger: head[0] || section, start: "top 88%", once: true },
    });

    // 1. Mappa
    const bank = section.querySelector("[data-cf-fx-bank]");
    const pins = q("[data-cf-fx-pin]");
    const routes = q("[data-cf-fx-route]");
    if (bank) {
      const tl = gsap.timeline({ paused: true });
      tl.from(bank, { y: 30, autoAlpha: 0, duration: 0.9, ease: "power3.out" }, 0.25)
        .from(pins, { scale: 0, autoAlpha: 0, duration: 0.6, ease: "back.out(2)", stagger: 0.12 }, 0.45)
        .from(routes, { autoAlpha: 0, duration: 0.6, stagger: 0.1 }, 0.8);
      onEnter(bank.closest(".cf-fx__card"), () => tl.play());
      routes.forEach((p) => loops.push(gsap.to(p, { strokeDashoffset: -12, duration: 1.2, ease: "none", repeat: -1, paused: true })));
    }

    // 2. Infinito
    q("[data-cf-fx-spin]").forEach((g) => {
      const dir = Number(g.dataset.cfFxSpin) || 1;
      loops.push(gsap.to(g, { rotation: 360 * dir, svgOrigin: g.style.transformOrigin.replace(/px/g, ""), duration: 26, ease: "none", repeat: -1, paused: true }));
    });
    const hand = section.querySelector("[data-cf-fx-hand]");
    if (hand) loops.push(gsap.to(hand, { rotation: 360, svgOrigin: "122.5 248.5", duration: 8, ease: "none", repeat: -1, paused: true }));

    // 3. Abbonamenti
    const plans = q("[data-cf-fx-plan]");
    const trial = section.querySelector("[data-cf-fx-trial]");
    if (trial) {
      const tl = gsap.timeline({ paused: true });
      tl.from(plans, { x: -24, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.12 }, 0.2).from(
        trial,
        { x: 60, y: -10, rotate: -6, autoAlpha: 0, duration: 1.1, ease: "back.out(1.4)" },
        0.45,
      );
      tl.add(() => loops.push(gsap.to(trial, { y: -4, rotate: "+=1.5", duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 })));
      onEnter(trial.closest(".cf-fx__card"), () => tl.play());
    }

    // 4. Grafico
    const line = section.querySelector("[data-cf-fx-line]");
    if (line) {
      const card = line.closest(".cf-fx__card");
      const area = card.querySelector(".cf-fx-chart__area");
      const dot = card.querySelector("[data-cf-fx-dot]");
      const tip = card.querySelector("[data-cf-fx-tip]");
      const phone = card.querySelector("[data-cf-fx-phone]");
      const amount = card.querySelector("[data-cf-fx-amount]");
      const target = Number(amount?.dataset.cfFxAmount) || 0;
      const euro = new Intl.NumberFormat(amount?.dataset.cfFxLocale || "it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
      const box = { v: 0 };
      gsap.set(line, { strokeDasharray: 1, strokeDashoffset: 1 });
      const tl = gsap.timeline({ paused: true, onComplete: () => gsap.set(line, { clearProps: "strokeDasharray,strokeDashoffset" }) });
      tl.to(line, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" }, 0.2)
        .from(area, { autoAlpha: 0, duration: 1.2 }, 0.8)
        .from(phone, { y: 70, autoAlpha: 0, duration: 1.2, ease: "power3.out" }, 0.3)
        .from(dot, { scale: 0, duration: 0.5, ease: "back.out(2.5)" }, 1.2)
        .from(tip, { y: 10, autoAlpha: 0, duration: 0.6, ease: "power3.out" }, 1.3)
        .to(box, { v: target, duration: 1.4, ease: "power3.out", onUpdate: () => amount && (amount.textContent = euro.format(Math.round(box.v))) }, 1.3);
      onEnter(card, () => tl.play());
    }

    // 5. Commissioni
    const fees = q("[data-cf-fx-fee]");
    if (fees.length) {
      const tl = gsap.timeline({ paused: true });
      tl.from(fees, {
        yPercent: -260,
        y: -40,
        autoAlpha: 0,
        rotate: () => gsap.utils.random(-30, 30),
        duration: 1.1,
        ease: "bounce.out",
        stagger: { each: 0.08, from: "random" },
      });
      onEnter(fees[0].closest(".cf-fx__card"), () => tl.play());
    }

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => loops.forEach((t) => (self.isActive ? t.resume() : t.pause())),
    });

    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      st.kill();
      loops.forEach((t) => t.kill());
      const amount = section.querySelector("[data-cf-fx-amount]");
      if (amount)
        amount.textContent = new Intl.NumberFormat(amount.dataset.cfFxLocale || "it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(amount.dataset.cfFxAmount));
    };
  });

  return () => mm.revert();
}
