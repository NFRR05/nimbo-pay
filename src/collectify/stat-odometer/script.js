import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Numeri che rotolano come un contachilometri quando entrano nel viewport.
 * <span data-cf-odometer="1250" data-cf-suffix="+"></span>
 * Il valore viene formattato con Intl.NumberFormat (separatori della lingua della pagina).
 */
export default function initOdometer(root = document) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const triggers = [];

  root.querySelectorAll("[data-cf-odometer]").forEach((el) => {
    const strips = build(el);
    if (reduce || !strips.length) return;

    const tl = gsap.timeline({ paused: true });
    strips.forEach(({ strip, digit }, i) => {
      // Ogni striscia contiene 0–9 due volte: la cifra finale è nel secondo giro
      tl.fromTo(
        strip,
        { yPercent: 0 },
        { yPercent: -((10 + digit) / 20) * 100, duration: 1.6 + (strips.length - 1 - i) * 0.12, ease: "power4.out" },
        (strips.length - 1 - i) * 0.06,
      );
    });

    triggers.push(
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => tl.play(),
      }),
    );
  });

  return () => triggers.forEach((t) => t.kill());
}

function build(el) {
  const value = parseFloat(el.dataset.cfOdometer);
  const decimals = parseInt(el.dataset.cfDecimals || "0", 10);
  const locale = el.dataset.cfLocale || document.documentElement.lang || "it-IT";
  const number = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: "always", // in italiano 1250 resterebbe senza punto
  }).format(Number.isFinite(value) ? value : 0);
  const text = `${el.dataset.cfPrefix ?? ""}${number}${el.dataset.cfSuffix ?? ""}`;

  const label = document.createElement("span");
  label.className = "cf-odo__sr";
  label.textContent = text;

  const visual = document.createElement("span");
  visual.className = "cf-odo__visual";
  visual.setAttribute("aria-hidden", "true");

  const strips = [];
  for (const char of text) {
    if (/\d/.test(char)) {
      const col = document.createElement("span");
      col.className = "cf-odo__digit";
      const strip = document.createElement("span");
      strip.className = "cf-odo__strip";
      for (let n = 0; n < 20; n++) {
        const d = document.createElement("span");
        d.textContent = String(n % 10);
        strip.append(d);
      }
      col.append(strip);
      visual.append(col);
      strips.push({ strip, digit: Number(char) });
    } else {
      const span = document.createElement("span");
      span.className = "cf-odo__char";
      span.textContent = char;
      visual.append(span);
    }
  }

  // Senza animazione le strisce mostrano subito la cifra finale
  strips.forEach(({ strip, digit }) => gsap.set(strip, { yPercent: -((10 + digit) / 20) * 100 }));
  el.replaceChildren(label, visual);
  return strips;
}
