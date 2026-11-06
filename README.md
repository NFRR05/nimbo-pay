# Nimbo — landing

Landing page (IT su `/`, EN su `/en/`) per **Nimbo**, concept di brand per un'infrastruttura di pagamento B2B.
Online su https://nimbo-pay.vercel.app.

- Astro 7 + GSAP, tutto statico.
- Colori, font (Outfit per i titoli, Inter per tutto il resto) e forme vengono dal design system Nimbo (`src/styles/nimbo.css`):
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
  del bento sono render piccoli (`mark3d`). Le palpebre si chiudono in CSS. Nella sezione «Lasciamo che si
  presentino» (`Talk.astro`, dopo i numeri) ognuno sta accanto al suo fumetto, a destra e a sinistra a turno, e dice
  in prima persona cosa fa: cade in scena quando arriva la sua riga, le parole si accendono allo scroll (Collectify
  «scroll-word-fill») e lui saltella come se parlasse mentre scorri il suo testo. Qui i marchi sono render fermi
  (`talk-<colore>-<l|r>.webp`, con la variante a occhi chiusi) mossi in CSS da `src/lib/talk.js`: niente WebGL.
  I render si rigenerano con `scripts/render-marks.html`.
- Sezioni:
  - numeri, «Lasciamo che si presentino» e sicurezza: componenti Nimbo (`src/styles/sections.css`);
  - nel bento la riconciliazione è l'app Nimbo su un iPhone vero: la cornice è l'immagine dell'iPhone 12 Pro grafite
    del set gratuito di dispositivi di Meta (Facebook Design, preso da `fredyshox/ScreenFramer`), con lo schermo
    trasparente; lo schermo sotto è HTML misurato in punti iPhone (`--pt`). Quattro righe si abbinano da sole, due
    restano da abbinare col bottone, c'è il filtro (`src/lib/recon-app.js`). La tesoreria è un saldo grande e la
    lista degli ultimi movimenti: ogni pochi secondi ne arriva uno in cima e il saldo gli va dietro, sotto la
    previsione a 30 giorni (`src/lib/bento-live.js`). I costi sono la carta Nimbo nera in 3D CSS, che si inclina verso
    il puntatore e luccica ogni tanto (`src/lib/card3d.js`), e uno scontrino che si stampa, con il volume su un cursore;
  - hero, bento, prodotti, domande, prezzi, invito finale e footer: layout dei componenti "da reference" di Collectify (`src/collectify/<slug>`):
    `ref-pelmatech-hero` (vetro rigato nero), `ref-finax-bento` (cinque card con una mini interfaccia ciascuna),
    `ref-travelora-features` (le card che si impilano),
    `ref-nexwealth-pricing` (il prezzo di Scale conta fino alla nuova stima), `ref-rumo-faq`,
    `ref-dark-cta` (card nera con puntini che scendono, bagliore e i cinque marchi colorati), `ref-schmidt-footer`,
    più `smart-navbar` e `fluid-tokens`.
- Animazioni semplici da Collectify: `stat-odometer` (i numeri sotto l'hero rotolano come un contachilometri),
  `hero-line-reveal` (i titoli di sezione salgono riga per riga) e `scroll-reveal` (testi, card e domande entrano in coda).
  Con movimento ridotto tutto è già al suo posto.
- Leggerezza (provata con la CPU rallentata 4 volte): niente `backdrop-filter`, `filter: blur` o `mix-blend-mode`
  su aree grandi, niente animazioni che ridipingono l'hero (le coste del vetro sono ferme), niente
  `elementsFromPoint` allo scroll (la navbar sceglie il tema con un IntersectionObserver). Il 3D si carica quando il
  browser è libero, con densità di pixel al massimo 1,5 e antialias solo vicino a 1×; se i fotogrammi superano i 22 ms
  passa a 1× e disegna un fotogramma sì e uno no. Con 2 core o 2 GB di memoria al massimo restano i poster. Nella CTA
  i puntini sono raggruppati per tono, un solo colore per gruppo. Testi senza caratteri fuori dal latino base, così
  si scarica solo quel sottoinsieme dei font.
- Icone: il set Nimbo disegnato per il brand (`src/lib/icons.js`), lo stesso del componente Icon del design system;
  nessuna icona di altri set.
- Testi: `src/i18n.js` (meta e navbar) e `src/copy/<sezione>.js` (IT ed EN per ogni sezione).

```sh
npm install
npm run dev      # sviluppo
npm run build    # sito statico in dist/
```

Concept di brand: Nimbo non è un servizio di pagamento attivo e il sito non raccoglie dati.
