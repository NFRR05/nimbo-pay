/**
 * The marks in "Let them introduce themselves" (Talk.astro): 3D renders moved with CSS, no WebGL.
 * - each mark drops in when its row comes up (.is-in, once);
 * - the row whose words are in the middle of the screen is "reading" (.is-reading), and while the page
 *   scrolls (.is-scrolling on the section) its mark bobs as if talking;
 * - a tap or click makes it hop (.is-hop, the same hop as the marks on the product cards).
 * With reduced motion the CSS does nothing; the script only adds classes.
 */
export default function initTalk(root = document) {
  const section = root.querySelector(".nb-talk");
  if (!section) return () => {};
  const marks = [...section.querySelectorAll("[data-nb-talk-mark]")];
  const rows = [...section.querySelectorAll("[data-nb-talk-row]")];
  const offs = [];

  const arrive = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        arrive.unobserve(e.target);
      });
    },
    { rootMargin: "0px 0px -18% 0px" },
  );
  marks.forEach((m) => arrive.observe(m));

  // a band across the middle of the screen: the row whose words cross it is the one talking
  const reading = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.closest("[data-nb-talk-row]")?.classList.toggle("is-reading", e.isIntersecting)),
    { rootMargin: "-30% 0px -30% 0px" },
  );
  rows.forEach((r) => {
    const text = r.querySelector("[data-nb-talk-text]");
    if (text) reading.observe(text);
  });

  let quiet = 0;
  const onScroll = () => {
    if (!section.classList.contains("is-scrolling")) section.classList.add("is-scrolling");
    clearTimeout(quiet);
    quiet = window.setTimeout(() => section.classList.remove("is-scrolling"), 180);
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  marks.forEach((m) => {
    const hop = () => m.classList.add("is-hop");
    const done = (e) => e.animationName === "nb-perch-hop" && m.classList.remove("is-hop");
    m.addEventListener("click", hop);
    m.addEventListener("animationend", done);
    offs.push(() => {
      m.removeEventListener("click", hop);
      m.removeEventListener("animationend", done);
    });
  });

  return () => {
    arrive.disconnect();
    reading.disconnect();
    clearTimeout(quiet);
    window.removeEventListener("scroll", onScroll);
    offs.forEach((fn) => fn());
  };
}
