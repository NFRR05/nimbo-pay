// Pricing copy. The volume switch shows the Scale estimate: 0,05 € per transaction above the free 10.000.
export default {
  it: {
    title: "Paghi solo quando il denaro si muove",
    lede: "Le prime 10.000 transazioni di ogni mese sono gratis, per sempre. Oltre la soglia, 0,05 € l'una.",
    plansLabel: "Piani",
    volumeLabel: "Transazioni al mese",
    volumes: [10000, 50000, 200000],
    defaultVolume: 50000,
    included: "Cosa include",
    note: "Prezzi IVA esclusa. Nessun vincolo di durata.",
    plans: [
      { id: "start", name: "Start", kind: "fixed", price: 0, per: "al mese", desc: "Per partire e per i progetti piccoli.", features: ["10.000 transazioni al mese", "Sandbox illimitata", "Tutte le API e i webhook", "Supporto via email"], cta: "Apri una sandbox" },
      { id: "scale", name: "Scale", kind: "usage", per: "al mese", estimate: "stima con {n} transazioni", flag: "Consigliato", desc: "Per chi cresce ogni mese. Nessun canone.", features: ["Tutto quello che c'è in Start", "Conti virtuali illimitati", "Disponibilità garantita del 99,95%", "Supporto in chat entro un'ora"], cta: "Apri una sandbox" },
      { id: "bank", name: "Banca", kind: "custom", priceText: "Su misura", desc: "Per banche e istituti di pagamento.", features: ["Ambiente dedicato nell'UE", "Connettori per il tuo core banking", "Revisione di sicurezza congiunta", "Referente tecnico dedicato"], cta: "Parla con noi" },
    ],
  },
  en: {
    title: "You only pay when money moves",
    lede: "Your first 10,000 transactions every month are free, forever. Above that, €0.05 each.",
    plansLabel: "Plans",
    volumeLabel: "Transactions a month",
    volumes: [10000, 50000, 200000],
    defaultVolume: 50000,
    included: "What's included",
    note: "Prices exclude VAT. No lock-in.",
    plans: [
      { id: "start", name: "Start", kind: "fixed", price: 0, per: "a month", desc: "To get going, and for small projects.", features: ["10,000 transactions a month", "Unlimited sandbox", "Every API and webhook", "Email support"], cta: "Open a sandbox" },
      { id: "scale", name: "Scale", kind: "usage", per: "a month", estimate: "estimate for {n} transactions", flag: "Recommended", desc: "For teams that grow every month. No monthly fee.", features: ["Everything in Start", "Unlimited virtual accounts", "99.95% guaranteed uptime", "Chat support within an hour"], cta: "Open a sandbox" },
      { id: "bank", name: "Bank", kind: "custom", priceText: "Custom", desc: "For banks and payment institutions.", features: ["Dedicated environment in the EU", "Connectors for your core banking", "Joint security review", "Dedicated technical contact"], cta: "Talk to us" },
    ],
  },
};
