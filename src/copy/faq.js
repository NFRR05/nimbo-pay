// FAQ copy.
export default {
  it: {
    title: "Domande frequenti",
    sub: "Le cose che ci chiedono più spesso.",
    items: [
      { q: "Cosa succede quando supero le 10.000 transazioni?", a: "Passi da solo al piano Scale: a fine mese paghi 0,05 € per ogni transazione oltre la soglia. Niente canone, niente minimi, e il conteggio lo vedi in tempo reale." },
      { q: "Quanto ci vuole a integrare Nimbo?", a: "La sandbox è pronta in un minuto. La maggior parte delle aziende va in produzione in due settimane, compresa la verifica dell'azienda." },
      { q: "Nimbo funziona con il mio core banking?", a: "Abbiamo connettori pronti per i core banking più diffusi e un'API REST per tutti gli altri. Puoi provarli in sandbox prima di firmare." },
      { q: "Come si calcola la ricevuta di CO2?", a: "Per ogni pagamento stimiamo l'energia usata da server, rete e archiviazione e la convertiamo in grammi di CO2 equivalente. Il valore arriva nella risposta dell'API e nel resoconto mensile." },
      { q: "Serve essere una banca per usare Nimbo?", a: "No. Fintech, negozi online e aziende con molti pagamenti usano gli stessi prodotti e gli stessi piani." },
    ],
  },
  en: {
    title: "Frequently asked questions",
    sub: "The things people ask us most.",
    items: [
      { q: "What happens when I go over 10,000 transactions?", a: "You move to Scale on your own: at the end of the month you pay €0.05 for each transaction above the threshold. No monthly fee, no minimums, and you can watch the count in real time." },
      { q: "How long does it take to integrate Nimbo?", a: "The sandbox is ready in a minute. Most teams go live in two weeks, company verification included." },
      { q: "Does Nimbo work with my core banking?", a: "We have ready-made connectors for the most common core banking systems and a REST API for everything else. You can try them in the sandbox before you sign." },
      { q: "How is the CO2 receipt calculated?", a: "For each payment we estimate the energy used by servers, network and storage and convert it into grams of CO2 equivalent. The figure comes back in the API response and in the monthly report." },
      { q: "Do I need to be a bank to use Nimbo?", a: "No. Fintechs, marketplaces and companies with a lot of payments use the same products and the same plans." },
    ],
  },
};
