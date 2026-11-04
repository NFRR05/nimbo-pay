# Nimbo — landing

Landing page (IT su `/`, EN su `/en/`) per **Nimbo**, concept di brand per un'infrastruttura di pagamento B2B.
Online su https://nimbo-pay.vercel.app.

- Astro 7 + GSAP, tutto statico.
- Colori, font (Outfit, Inter, Geist Mono) e forme vengono dal design system Nimbo (`src/styles/nimbo.css`):
  interfaccia in bianco e nero, bordi sottili invece delle ombre, raggi 12/20/28, una sola testata di sezione
  (`.nb-head`) e un solo bottone (`.nb-btn`).
- Il colore è solo sui cinque marchi colorati, uno per prodotto, in 3D: cubi morbidi con gli angoli dell'icona dell'app
  e gli occhi bianchi (`src/lib/marks3d.js`, Three.js). Nella hero giocano dal vivo (saltelli, la moneta passata di testa
  in testa, la torre, la cavallina), guardano il puntatore, sbattono le palpebre e saltano se li tocchi, in qualsiasi
  momento, anche durante un gioco (il canvas non prende i clic: la pagina li controlla sul modello). Nella CTA sono in
  fila nel bagliore, tagliati dal bordo basso della card. Il canvas può salire oltre il suo riquadro (`--nb-head`), così
  i salti non vengono tagliati in alto. Three.js si carica a parte, dopo la pagina, e solo con il movimento attivo:
  senza, restano i poster in `public/media/marks/`. Sulle card prodotto stanno in piedi sul bordo alto, a sinistra, a
  scala (`markPerch` in `src/lib/brand.js`, saltello in CSS al passaggio sulla card, `src/lib/perch.js`); negli avatar
  del bento sono render piccoli (`mark3d`). Le palpebre si chiudono in CSS. I render si rigenerano con
  `scripts/render-marks.html`.
- Sezioni:
  - numeri e sicurezza: componenti Nimbo (`src/styles/sections.css`);
  - hero, bento, prodotti, domande, prezzi, invito finale e footer: layout dei componenti "da reference" di Collectify (`src/collectify/<slug>`):
    `ref-pelmatech-hero` (vetro rigato nero), `ref-finax-bento` (cinque card con una mini interfaccia ciascuna),
    `ref-travelora-features` (le card che si impilano),
    `ref-nexwealth-pricing` (il prezzo di Scale conta fino alla nuova stima), `ref-rumo-faq`,
    `ref-dark-cta` (card nera con puntini che scendono, bagliore e i cinque marchi colorati), `ref-schmidt-footer`,
    più `smart-navbar` e `fluid-tokens`.
- Animazioni semplici da Collectify: `stat-odometer` (i numeri sotto l'hero rotolano come un contachilometri),
  `hero-line-reveal` (i titoli di sezione salgono riga per riga) e `scroll-reveal` (testi, card e domande entrano in coda).
  Con movimento ridotto tutto è già al suo posto.
- Icone: il set Nimbo disegnato per il brand (`src/lib/icons.js`), lo stesso del componente Icon del design system;
  nessuna icona di altri set.
- Testi: `src/i18n.js` (meta e navbar) e `src/copy/<sezione>.js` (IT ed EN per ogni sezione).

```sh
npm install
npm run dev      # sviluppo
npm run build    # sito statico in dist/
```

Concept di brand: Nimbo non è un servizio di pagamento attivo e il sito non raccoglie dati.
