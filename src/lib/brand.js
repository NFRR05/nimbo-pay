// Nimbo brand marks: the coloured logo (rounded square with two eyes) and the nimbo wordmark.
// The marks replace the old mascots: same five colours, one per product, drawn as the app icon.

export const MARK_COLORS = { coral: "#FE765C", amber: "#FEAD42", mint: "#A7E2BC", lavender: "#C6A7E8", blue: "#0259EE", black: "#111111" };

/** The five colours in product order: payments, treasury, compliance, analytics, API. */
export const MARKS = ["coral", "amber", "mint", "lavender", "blue"];

// old mascot names and product ids map to the same colours
const ALIAS = {
  coin: "coral", token: "amber", card: "mint", block: "lavender", capsule: "blue",
  pay: "coral", treasury: "amber", compliance: "mint", analytics: "lavender", api: "blue",
};

/**
 * SVG for one coloured mark: the app icon (radius 28 at 128) in a brand colour, with two white eyes.
 * size = side in px; label = accessible name (empty = decorative). Each eye is a .nb-eye group with a
 * .nb-pupil dot. The page itself shows the marks in 3D (mark3d below and src/lib/marks3d.js).
 */
export function markSvg(color = "black", { size = 64, label = "", className = "" } = {}) {
  const fill = MARK_COLORS[ALIAS[color] || color] || color;
  const a11y = label ? ` role="img" aria-label="${label}"` : ` aria-hidden="true" focusable="false"`;
  const eye = (cx) => `<g class="nb-eye"><circle class="nb-pupil" cx="${cx}" cy="64" r="13" fill="#FFFFFF"/></g>`;
  return `<svg class="nb-mark ${className}" viewBox="0 0 128 128" width="${size}" height="${size}"${a11y}><rect width="128" height="128" rx="28" fill="${fill}"/>${eye(46)}${eye(82)}</svg>`;
}

export const WORDMARK = {"vb": "61 0 2682 730", "letters": "M390 720V443Q390 395 359.5 364.0Q329 333 281 333Q249 333 224.0 347.0Q199 361 185.0 386.0Q171 411 171 443L128 419Q128 364 152.0 321.5Q176 279 218.5 254.5Q261 230 314 230Q368 230 410.0 257.5Q452 285 476.0 328.5Q500 372 500 419V720ZM61 720V240H171V720ZM609 720V240H719V720ZM664 152Q636 152 617.5 133.0Q599 114 599 86Q599 58 617.5 39.0Q636 20 664 20Q693 20 711.0 39.0Q729 58 729 86Q729 114 711.0 133.0Q693 152 664 152ZM838 720V240H948V720ZM1157 720V434Q1157 386 1127.0 359.5Q1097 333 1053 333Q1023 333 999.5 345.0Q976 357 962.0 379.5Q948 402 948 434L905 410Q905 355 929.0 315.0Q953 275 994.0 252.5Q1035 230 1086 230Q1137 230 1178.0 252.0Q1219 274 1243.0 314.0Q1267 354 1267 410V720ZM1476 720V434Q1476 386 1446.0 359.5Q1416 333 1372 333Q1343 333 1319.0 345.0Q1295 357 1281.0 379.5Q1267 402 1267 434L1205 410Q1210 355 1237.0 315.0Q1264 275 1306.5 252.5Q1349 230 1400 230Q1452 230 1494.0 252.0Q1536 274 1561.0 314.0Q1586 354 1586 410V720ZM1952 730Q1897 730 1854.0 706.5Q1811 683 1786.5 642.0Q1762 601 1762 549V411Q1762 359 1787.0 318.0Q1812 277 1855.0 253.5Q1898 230 1952 230Q2017 230 2069.5 263.5Q2122 297 2152.5 353.5Q2183 410 2183 481Q2183 551 2152.5 607.5Q2122 664 2069.5 697.0Q2017 730 1952 730ZM1695 720V0H1805V358L1786 474L1805 591V720ZM1934 626Q1974 626 2004.5 607.5Q2035 589 2052.5 556.0Q2070 523 2070 480Q2070 437 2052.5 404.0Q2035 371 2004.5 352.5Q1974 334 1934 334Q1894 334 1863.0 352.5Q1832 371 1815.0 404.0Q1798 437 1798 480Q1798 523 1815.0 556.0Q1832 589 1863.0 607.5Q1894 626 1934 626Z", "ring": "M2240.0 480.0A251.5 250.0 0 1 1 2743.0 480.0A251.5 250.0 0 1 1 2240.0 480.0ZM2349.5 480.0A142.0 140.5 0 1 0 2633.5 480.0A142.0 140.5 0 1 0 2349.5 480.0Z", "eyes": [[2431.9, 480.0, 44.0], [2551.1, 480.0, 44.0]]};

/** The nimbo wordmark in currentColor. */
export function wordmarkSvg({ height = 28, className = "", label = "Nimbo" } = {}) {
  const [, , w, h] = WORDMARK.vb.split(" ").map(Number);
  const dots = WORDMARK.eyes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("");
  return `<svg class="${className}" viewBox="${WORDMARK.vb}" height="${height}" width="${Math.round((height * w) / h)}" role="img" aria-label="${label}"><g fill="currentColor"><path d="${WORDMARK.letters}"/><path fill-rule="evenodd" d="${WORDMARK.ring}"/>${dots}</g></svg>`;
}

/**
 * A coloured mark in 3D, for small places (labels, avatars): a still render of the soft cube with its eyes open,
 * and the same render with the eyes closed on top, shown for a moment now and then (the blink, in CSS).
 * The stills come from src/lib/marks3d.js (public/media/marks/). delay staggers the blinks.
 */
export function mark3d(color, { size = 24, className = "", label = "", delay = 0 } = {}) {
  const c = ALIAS[color] || color;
  const a11y = label ? ` role="img" aria-label="${label}"` : ` aria-hidden="true"`;
  return `<span class="nb-mark3d${className ? ` ${className}` : ""}" style="--s: ${size}px; --d: ${delay}s"${a11y}><img src="/media/marks/mark-${c}.webp" width="${size}" height="${size}" alt="" decoding="async" /><img class="nb-mark3d__blink" src="/media/marks/mark-${c}-blink.webp" width="${size}" height="${size}" alt="" decoding="async" loading="lazy" /></span>`;
}

/**
 * A coloured mark standing on a card (the product cards, beside the name): a still seen a little from above,
 * in its character's face and pose, its base on the bottom of the image, with a soft contact shadow (CSS).
 * It hops when the card is hovered or when it is clicked (src/lib/perch.js), and blinks now and then like the
 * small marks. Decorative.
 */
export function markPerch(color, { delay = 0, className = "" } = {}) {
  const c = ALIAS[color] || color;
  return `<span class="nb-perch${className ? ` ${className}` : ""}" style="--d: ${delay}s" aria-hidden="true" data-nb-perch><span class="nb-perch__body"><img src="/media/marks/perch-${c}.webp" width="160" height="157" alt="" decoding="async" loading="lazy" /><img class="nb-perch__blink" src="/media/marks/perch-${c}-blink.webp" width="160" height="157" alt="" decoding="async" loading="lazy" /></span></span>`;
}
