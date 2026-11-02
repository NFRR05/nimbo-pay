# Nimbo — landing

Landing page (IT su `/`, EN su `/en/`) per **Nimbo**, concept di brand per un'infrastruttura di pagamento B2B.
Online su https://nimbo-pay.vercel.app.

- Astro 7 + GSAP, tutto statico.
- Colori, font (Outfit, Inter, Geist Mono) e forme vengono dal design system Nimbo (`src/styles/nimbo.css`):
  interfaccia in bianco e nero, bordi sottili invece delle ombre, raggi 12/20/28, una sola testata di sezione
  (`.nb-head`) e un solo bottone (`.nb-btn`).
- Il colore è solo sui cinque marchi colorati (`src/lib/brand.js`), uno per prodotto, accanto al nome del prodotto.
  Ogni tanto sbattono le palpebre (`src/lib/mark-life.js`); con movimento ridotto non si muove niente.
- Sezioni:
  - sicurezza e invito finale: componenti Nimbo (`src/styles/sections.css`);
  - hero, prodotti, prezzi, domande e footer: layout dei componenti "da reference" di Collectify (`src/collectify/<slug>`):
    `ref-pelmatech-hero` (vetro rigato nero e i cinque punti in fila), `ref-travelora-features` (le card che si impilano),
    `ref-nexwealth-pricing`, `ref-rumo-faq`, `ref-schmidt-footer`, più `smart-navbar` e `fluid-tokens`.
- Testi: `src/i18n.js` (meta e navbar) e `src/copy/<sezione>.js` (IT ed EN per ogni sezione).

```sh
npm install
npm run dev      # sviluppo
npm run build    # sito statico in dist/
```

Concept di brand: Nimbo non è un servizio di pagamento attivo e il sito non raccoglie dati.
