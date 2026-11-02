# Nimbo — landing

Landing page (IT su `/`, EN su `/en/`) per **Nimbo**, concept di brand per un'infrastruttura di pagamento B2B.
Online su https://nimbo-pay.vercel.app.

- Astro 7 + GSAP + Lenis, tutto statico.
- Layout e animazioni vengono dai componenti "da reference" di Collectify (`src/collectify/<slug>`):
  hero `ref-pelmatech-hero`, prodotti `ref-travelora-features`, numeri `ref-stepout-stats`,
  come funziona `ref-prime-steps`, prezzi `ref-nexwealth-pricing`, FAQ `ref-rumo-faq`,
  CTA `ref-widgets-cta`, footer `ref-schmidt-footer`, più `smart-navbar` e `smooth-scroll`.
- Colori, font (Outfit, Inter, Geist Mono) e forme vengono dal design system Nimbo (`src/styles/nimbo.css`):
  interfaccia in bianco e nero, il colore è solo sui Nimbi (`src/lib/brand.js`), che sbattono le palpebre
  e seguono il puntatore (`src/lib/nimbi-life.js`).
- Testi: `src/i18n.js` (meta e navbar) e `src/copy/<sezione>.js` (IT ed EN per ogni sezione).

```sh
npm install
npm run dev      # sviluppo
npm run build    # sito statico in dist/
```

Concept di brand: Nimbo non è un servizio di pagamento attivo e il sito non raccoglie dati.
