import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Products from Collectify «ref-travelora-features», reduced for Nimbo: only the stack is left.
 * From 900px up the cards are sticky (CSS); here each card that arrives shrinks the ones below it by 3,6%
 * and greys their name. No entrances and no loops. With reduced motion the stack stays (it is only CSS)
 * but nothing shrinks.
 */
export default function initTravelora(root = document) {
  const sections = [...root.querySelectorAll("[data-cf-tv]")];
  if (!sections.length) return () => {};
  const cleanups = sections.map((section) => setup(section));
  return () => cleanups.forEach((fn) => fn());
}

const SHRINK = 0.036;

function setup(section) {
  const stack = section.querySelector(".cf-tv__stack");
  const cards = [...section.querySelectorAll("[data-cf-tv-card]")];
  if (!stack || !cards.length) return () => {};

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference) and (min-width: 900px)", () => {
    const off = setupStack(stack, cards);
    return () => {
      off();
      cards.forEach((card) => card.classList.remove("is-under"));
    };
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  return () => mm.revert();
}

/* Progress of each card toward its sticky position */
function setupStack(stack, cards) {
  // quickSetter does not take the "scale" shorthand: one setter per axis
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

  // sticky cards cannot be measured while they are stuck: everything comes from the list, which scrolls
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

  const trigger = ScrollTrigger.create({
    trigger: stack,
    start: "top bottom",
    end: "bottom top",
    onRefresh: (self) => {
      measure();
      render(self.scroll());
    },
    onUpdate: (self) => render(self.scroll()),
  });

  return () => {
    trigger.kill();
    gsap.set(cards, { clearProps: "transform" });
  };
}
