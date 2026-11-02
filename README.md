# Nimbo — landing

Landing page (IT su `/`, EN su `/en/`) per **Nimbo**, concept di brand per un'infrastruttura di pagamento B2B.
Online su https://nimbo-pay.vercel.app.

- Astro 7 + GSAP + Lenis, tutto statico.
- Layout e animazioni vengono dai componenti di Collectify (`src/collectify/<slug>`):
  hero da `ref-cryptoharbor-hero`, bento da `ref-finax-bento`, numeri da `ref-webyansh-stats`,
  CTA finale da `ref-dark-cta`, più navbar, marquee, tab, timeline, word-fill, FAQ e footer.
- Colori, font (Outfit, Inter, Geist Mono) e forme vengono dal design system Nimbo (`src/styles/nimbo.css`):
  interfaccia in bianco e nero, il colore è solo sui Nimbi (`src/lib/brand.js`), che sbattono le palpebre
  e seguono il puntatore (`src/lib/nimbi-life.js`).
- Testi in `src/i18n.js`.

```sh
npm install
npm run dev      # sviluppo
npm run build    # sito statico in dist/
```

Concept di brand: Nimbo non è un servizio di pagamento attivo e il sito non raccoglie dati.
