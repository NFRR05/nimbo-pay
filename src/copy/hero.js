// Hero copy (layout from Collectify «ref-pelmatech-hero»).
export default {
  it: {
    title: ["Il denaro si muove.", "Con chiarezza."],
    lede: "Pagamenti istantanei, open banking e compliance in un'unica API per banche e fintech. Le prime 10.000 transazioni di ogni mese sono gratis.",
    primary: "Inizia gratis",
    secondary: "Come funziona",
    panelLabel: "Pagamenti di oggi",
    account: "Conto operativo · IBAN IT60 •••• 4821",
    slots: [
      { name: "Bonifico in uscita", kind: "SEPA Instant", from: ["Inviato", "09:41:02"], took: "4 s", to: ["Accreditato", "09:41:06"] },
      { name: "Incasso", kind: "SEPA Instant", from: ["Partito", "10:02:11"], took: "3 s", to: ["Ricevuto", "10:02:14"] },
    ],
    tookLabel: "Durata",
    featuresLabel: "Cosa fa Nimbo",
    features: [
      ["Accrediti istantanei,", "anche la domenica"],
      ["10.000 transazioni gratis", "ogni mese, per sempre"],
      ["KYC, KYB e AML", "già integrati"],
      ["Una ricevuta di CO₂", "per ogni pagamento"],
      ["API REST e webhook,", "sandbox gratuita"],
    ],
  },
  en: {
    title: ["Money moves.", "Clearly."],
    lede: "Instant payments, open banking and compliance in one API for banks and fintechs. Your first 10,000 transactions every month are free.",
    primary: "Start free",
    secondary: "How it works",
    panelLabel: "Today's payments",
    account: "Operating account · IBAN IT60 •••• 4821",
    slots: [
      { name: "Outgoing transfer", kind: "SEPA Instant", from: ["Sent", "09:41:02"], took: "4 s", to: ["Credited", "09:41:06"] },
      { name: "Incoming", kind: "SEPA Instant", from: ["Sent", "10:02:11"], took: "3 s", to: ["Received", "10:02:14"] },
    ],
    tookLabel: "Took",
    featuresLabel: "What Nimbo does",
    features: [
      ["Instant payments,", "even on Sundays"],
      ["10,000 free transactions", "every month, forever"],
      ["KYC, KYB and AML", "built in"],
      ["A CO₂ receipt", "for every payment"],
      ["REST API and webhooks,", "free sandbox"],
    ],
  },
};
