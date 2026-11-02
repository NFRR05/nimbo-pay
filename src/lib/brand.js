// The Nimbi and the nimbo wordmark, from the Nimbo design system (flat 2D, same geometry).
const HEX = { coral: "#FE765C", coralShade: "#E25A40", amber: "#FEAD42", amberShade: "#F1962B", mint: "#A7E2BC", mintShade: "#82C99B",
  lavender: "#C6A7E8", lavenderShade: "#A786D4", lavenderLight: "#DCC9F4", blue: "#0259EE", blueShade: "#0146C4", eye: "#FFFFFF", pupil: "#111111" };
  // ---- The Nimbi: five flat characters on a 120×128 grid, ground line at y=120.
  // P maps palette keys to fills: body colors, their shades, eye and pupil.
  function nimbiTree(character, mood, P) {
    var shapes = [];
    function eye(cx, cy, s, side, lid) {
      var out = [];
      var big = mood === 'curious' ? 1.1 : 1;
      if (mood === 'happy') {
        out.push(['path', { d: 'M' + (cx - 5.4 * s) + ' ' + (cy + 1.8 * s) + 'Q' + cx + ' ' + (cy - 6.4 * s) + ' ' + (cx + 5.4 * s) + ' ' + (cy + 1.8 * s), fill: 'none', stroke: P.pupil, strokeWidth: 2.8 * s, strokeLinecap: 'round' }]);
        return out;
      }
      out.push(['ellipse', { cx: cx, cy: cy, rx: 6.6 * s * big, ry: 7.6 * s * big, fill: P.eye }]);
      var dx = 0, dy = 0.8 * s;
      if (mood === 'curious') { dx = 1.9 * s; dy = -1.8 * s; }
      if (mood === 'sad') { dy = 2.6 * s; }
      out.push(['circle', { cx: cx + dx, cy: cy + dy, r: 3.8 * s, fill: P.pupil }]);
      if (mood === 'sad') {
        // a lid in the body color, drooping toward the outer corner
        var o = side < 0 ? -1 : 1;
        var x1 = cx - 8.5 * s, x2 = cx + 8.5 * s;
        var yOuter = cy - 0.6 * s, yInner = cy - 3.8 * s;
        var yl = o < 0 ? yOuter : yInner, yr = o < 0 ? yInner : yOuter;
        out.push(['path', { d: 'M' + x1 + ' ' + yl + 'L' + x2 + ' ' + yr + 'L' + x2 + ' ' + (cy - 10 * s) + 'L' + x1 + ' ' + (cy - 10 * s) + 'Z', fill: lid }]);
      }
      return out;
    }
    function eyes(lx, rx, y, s, lid) { return eye(lx, y, s, -1, lid).concat(eye(rx, y, s, 1, lid)); }
    function feet(a, b, y, fill, w, hgt) {
      w = w || 11; hgt = hgt || 16;
      return [['rect', { x: a, y: y, width: w, height: hgt, rx: w / 2, fill: fill }], ['rect', { x: b, y: y, width: w, height: hgt, rx: w / 2, fill: fill }]];
    }
    if (character === 'coin') {
      shapes = feet(43, 66, 104, P.coralShade)
        .concat([
          ['circle', { cx: 60, cy: 62, r: 44, fill: P.coralShade }],
          ['circle', { cx: 60, cy: 62, r: 42.4, fill: 'none', stroke: P.coral, strokeWidth: 2.8, strokeDasharray: '2.6 2.5' }],
          ['circle', { cx: 60, cy: 62, r: 39.6, fill: P.coral }],
          ['circle', { cx: 60, cy: 62, r: 31.5, fill: 'none', stroke: P.coralShade, strokeWidth: 2.4 }]
        ])
        .concat(eyes(50, 70, 58, 1.1, P.coral));
    } else if (character === 'token') {
      shapes = feet(41, 68, 100, P.amberShade)
        .concat([
          ['rect', { x: 14, y: 23, width: 92, height: 84, rx: 24, fill: P.amberShade }],
          ['rect', { x: 14, y: 18, width: 92, height: 84, rx: 24, fill: P.amber }],
          ['rect', { x: 25, y: 29, width: 70, height: 62, rx: 15, fill: 'none', stroke: P.amberShade, strokeWidth: 2.4 }]
        ])
        .concat(eyes(50, 70, 56, 1.1, P.amber));
    } else if (character === 'card') {
      shapes = feet(41, 66, 104, P.mintShade)
        .concat([
          ['rect', { x: 26, y: 12, width: 68, height: 96, rx: 16, fill: P.mintShade }],
          ['rect', { x: 26, y: 12, width: 62, height: 96, rx: 16, fill: P.mint }]
        ])
        .concat(eyes(48, 68, 46, 1.05, P.mint));
    } else if (character === 'block') {
      shapes = feet(40, 66, 104, P.lavenderShade)
        .concat([
          ['path', { d: 'M92 40L106 26V88Q106 93 102 97L92 107Z', fill: P.lavenderShade, stroke: P.lavenderShade, strokeWidth: 3, strokeLinejoin: 'round' }],
          ['path', { d: 'M26 40L40 26H106L92 40Z', fill: P.lavenderLight, stroke: P.lavenderLight, strokeWidth: 3, strokeLinejoin: 'round' }],
          ['rect', { x: 22, y: 38, width: 72, height: 70, rx: 12, fill: P.lavender }]
        ])
        .concat(eyes(48, 68, 66, 1.1, P.lavender));
    } else { // capsule
      shapes = feet(45, 64, 104, P.blueShade)
        .concat([
          ['rect', { x: 36, y: 14, width: 48, height: 98, rx: 24, fill: P.blue }],
          ['path', { d: 'M36 63V38A24 24 0 0 1 84 38V63Z', fill: P.lavender }]
        ])
        .concat(eyes(52, 68, 42, 1, P.lavender));
    }
    var ground = ['ellipse', { cx: 60, cy: 121, rx: 30, ry: 3.2, fill: P.pupil, fillOpacity: 0.1 }];
    return ['svg', { viewBox: '0 0 120 128', xmlns: 'http://www.w3.org/2000/svg' }, ground].concat(shapes);
  }

const kebab = (s) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
function ser(n) {
  const [tag, attrs, ...kids] = n;
  const a = Object.entries(attrs).map(([k, v]) => ` ${kebab(k)}="${typeof v === "number" ? +v.toFixed(2) : v}"`).join("");
  return kids.length ? `<${tag}${a}>${kids.map(ser).join("")}</${tag}>` : `<${tag}${a}/>`;
}

export const NIMBI = ["coin", "token", "card", "block", "capsule"];

/** SVG markup for one Nimbi. size = height in px; label = accessible name (empty = decorative). */
export function nimbiSvg(character, { mood = "neutral", size = 120, label = "", className = "" } = {}) {
  const t = nimbiTree(character, mood, HEX);
  const a11y = label ? ` role="img" aria-label="${label}"` : ` aria-hidden="true" focusable="false"`;
  // Each open eye (white ellipse + pupil) gets a group, so the page can make the Nimbi blink and look around.
  const inner = t
    .slice(2)
    .map(ser)
    .join("")
    .replace(/(<ellipse [^>]*fill="#FFFFFF"\/>)(<circle [^>]*fill="#111111"\/>)/g, (_, eye, pupil) =>
      `<g class="nb-eye">${eye}${pupil.replace("<circle ", '<circle class="nb-pupil" ')}</g>`);
  return `<svg class="${className}" viewBox="0 0 120 128" width="${Math.round((size * 120) / 128)}" height="${size}"${a11y}>${inner}</svg>`;
}

export const WORDMARK = {"vb": "61 0 2682 730", "letters": "M390 720V443Q390 395 359.5 364.0Q329 333 281 333Q249 333 224.0 347.0Q199 361 185.0 386.0Q171 411 171 443L128 419Q128 364 152.0 321.5Q176 279 218.5 254.5Q261 230 314 230Q368 230 410.0 257.5Q452 285 476.0 328.5Q500 372 500 419V720ZM61 720V240H171V720ZM609 720V240H719V720ZM664 152Q636 152 617.5 133.0Q599 114 599 86Q599 58 617.5 39.0Q636 20 664 20Q693 20 711.0 39.0Q729 58 729 86Q729 114 711.0 133.0Q693 152 664 152ZM838 720V240H948V720ZM1157 720V434Q1157 386 1127.0 359.5Q1097 333 1053 333Q1023 333 999.5 345.0Q976 357 962.0 379.5Q948 402 948 434L905 410Q905 355 929.0 315.0Q953 275 994.0 252.5Q1035 230 1086 230Q1137 230 1178.0 252.0Q1219 274 1243.0 314.0Q1267 354 1267 410V720ZM1476 720V434Q1476 386 1446.0 359.5Q1416 333 1372 333Q1343 333 1319.0 345.0Q1295 357 1281.0 379.5Q1267 402 1267 434L1205 410Q1210 355 1237.0 315.0Q1264 275 1306.5 252.5Q1349 230 1400 230Q1452 230 1494.0 252.0Q1536 274 1561.0 314.0Q1586 354 1586 410V720ZM1952 730Q1897 730 1854.0 706.5Q1811 683 1786.5 642.0Q1762 601 1762 549V411Q1762 359 1787.0 318.0Q1812 277 1855.0 253.5Q1898 230 1952 230Q2017 230 2069.5 263.5Q2122 297 2152.5 353.5Q2183 410 2183 481Q2183 551 2152.5 607.5Q2122 664 2069.5 697.0Q2017 730 1952 730ZM1695 720V0H1805V358L1786 474L1805 591V720ZM1934 626Q1974 626 2004.5 607.5Q2035 589 2052.5 556.0Q2070 523 2070 480Q2070 437 2052.5 404.0Q2035 371 2004.5 352.5Q1974 334 1934 334Q1894 334 1863.0 352.5Q1832 371 1815.0 404.0Q1798 437 1798 480Q1798 523 1815.0 556.0Q1832 589 1863.0 607.5Q1894 626 1934 626Z", "ring": "M2240.0 480.0A251.5 250.0 0 1 1 2743.0 480.0A251.5 250.0 0 1 1 2240.0 480.0ZM2349.5 480.0A142.0 140.5 0 1 0 2633.5 480.0A142.0 140.5 0 1 0 2349.5 480.0Z", "eyes": [[2431.9, 480.0, 44.0], [2551.1, 480.0, 44.0]]};

/** The nimbo wordmark in currentColor. */
export function wordmarkSvg({ height = 28, className = "", label = "Nimbo" } = {}) {
  const [, , w, h] = WORDMARK.vb.split(" ").map(Number);
  const dots = WORDMARK.eyes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("");
  return `<svg class="${className}" viewBox="${WORDMARK.vb}" height="${height}" width="${Math.round((height * w) / h)}" role="img" aria-label="${label}"><g fill="currentColor"><path d="${WORDMARK.letters}"/><path fill-rule="evenodd" d="${WORDMARK.ring}"/>${dots}</g></svg>`;
}
