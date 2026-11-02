// Copy for the FAQ section (Collectify «ref-rumo-faq» layout).
export default {
  it: {
    lines: ["Domande", "frequenti"],
    sub: "Le risposte rapide su prezzi, tempi, integrazione e dati.",
    nimbiLabel: "I cinque colori di Nimbo, uno per prodotto",
    items: [
      { q: "Nimbo è davvero gratis?", a: "Sì, fino a 10.000 transazioni al mese, per sempre. Oltre la soglia paghi 0,05 € a transazione, senza canone e senza minimi." },
      { q: "Quanto ci vuole a integrare Nimbo?", a: "La sandbox è pronta in un minuto. La maggior parte dei team va live in due settimane, compresa la verifica dell'azienda." },
      { q: "Come funziona la ricevuta di CO₂?", a: "Per ogni transazione stimiamo l'energia usata da server, rete e archiviazione e la convertiamo in grammi di CO₂ equivalente. Il valore arriva nella risposta dell'API e nel report mensile." },
      { q: "Dove sono i miei dati?", a: "In data center nell'Unione Europea, cifrati a riposo e in transito. Non vendiamo e non condividiamo i dati dei tuoi clienti." },
      { q: "Nimbo funziona con il mio core banking?", a: "Sì: abbiamo connettori pronti per i core banking più diffusi e un'API REST per tutti gli altri. Puoi provarli gratis in sandbox, prima di firmare qualsiasi cosa." },
    ],
  },
  en: {
    lines: ["Frequently", "asked questions"],
    sub: "Quick answers about pricing, timing, integration and data.",
    nimbiLabel: "Nimbo's five colours, one per product",
    items: [
      { q: "Is Nimbo really free?", a: "Yes, up to 10,000 transactions a month, forever. Above that you pay €0.05 per transaction, with no monthly fee and no minimums." },
      { q: "How long does it take to integrate?", a: "The sandbox is ready in a minute. Most teams go live in two weeks, company verification included." },
      { q: "How does the CO₂ receipt work?", a: "For each transaction we estimate the energy used by servers, network and storage and convert it into grams of CO₂ equivalent. The figure comes back in the API response and in the monthly report." },
      { q: "Where is my data?", a: "In data centres in the European Union, encrypted at rest and in transit. We don't sell or share your customers' data." },
      { q: "Does Nimbo work with my core banking?", a: "Yes: we have ready-made connectors for the most common core banking systems and a REST API for everything else. You can try them for free in the sandbox before you sign anything." },
    ],
  },
};
