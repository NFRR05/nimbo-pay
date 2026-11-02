import gsap from "gsap";

/**
 * Hero from Collectify «ref-cryptoharbor-hero», restyled for Nimbo (the menu is the site navbar, so it is not here).
 * Original notes — Hero «CryptoHarbor».
 * Ingresso: il fascio lime si accende, poi barra e link, badge, titolo riga per riga con sfocatura,
 * testo e bottone; le card dell'app salgono dal basso a ventaglio (la foto gialla per prima) e la linea
 * del grafico si disegna. Dopo l'ingresso le card ondeggiano piano, ognuna col suo ritmo, e il fascio pulsa.
 * Sul telefono il menu diventa una tendina (Esc e clic fuori la chiudono).
 * Con movimento ridotto non c'è nessun ingresso né movimento continuo.
 */
export default function initCryptoHarborHero(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-ch]")];
  if (!sections.length) return () => {};

  const cleanups = sections.map((section) => {
    const offs = [setupMotion(section)];
    return () => offs.forEach((fn) => fn());
  });

  return () => cleanups.forEach((fn) => fn());
}

function setupMotion(section) {
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const pick = (name) => [...section.querySelectorAll(`[data-cf-ch-in="${name}"]`)];
    const all = [...section.querySelectorAll("[data-cf-ch-in], [data-cf-ch-card]")];
    const cards = [...section.querySelectorAll("[data-cf-ch-card]")];
    const photo = section.querySelector(".cf-ch__slot--photo");
    const others = cards.filter((c) => c !== photo);
    const line = section.querySelector("[data-cf-ch-draw]");

    gsap.set(all, { visibility: "visible" });

    const blurIn = { autoAlpha: 0, y: 18, filter: "blur(10px)", duration: 0.9, ease: "power3.out", clearProps: "filter" };
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(pick("beam"), { autoAlpha: 0, scaleY: 0.4, duration: 1.6, ease: "power2.out" }, 0)
      .from(pick("bar"), { autoAlpha: 0, y: -12, duration: 0.6, stagger: 0.06 }, 0.1)
      .from(pick("nav"), { autoAlpha: 0, y: -12, duration: 0.6, stagger: 0.05 }, 0.18)
      .from(pick("badge"), { ...blurIn, y: 10 }, 0.3)
      .from(pick("line"), { ...blurIn, y: 30, duration: 1, stagger: 0.12 }, 0.38)
      .from(pick("lede"), blurIn, 0.62)
      .from(pick("cta"), { ...blurIn, scale: 0.94 }, 0.74);

    if (photo) tl.from(photo, { autoAlpha: 0, y: 120, duration: 1.1, ease: "expo.out" }, 0.8);
    tl.from(others, { autoAlpha: 0, y: 160, rotate: (i) => (i % 2 ? 7 : -7), duration: 1.2, ease: "expo.out", stagger: { each: 0.08, from: "center" } }, 0.9);
    if (line) tl.fromTo(line, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, 1.3);

    // Dopo l'ingresso: le card ondeggiano piano, il fascio pulsa
    const loops = cards.map((card, i) =>
      gsap.to(card, { y: i % 2 ? -8 : -12, duration: 2.6 + i * 0.35, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2.2 + i * 0.2 }),
    );
    loops.push(gsap.to(pick("beam"), { opacity: 0.6, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2 }));

    return () => loops.forEach((t) => t.kill());
  });

  return () => mm.revert();
}
