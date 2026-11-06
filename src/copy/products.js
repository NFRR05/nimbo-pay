// Products copy: one card per product area, each with its colour mark.
export default {
  it: {
    title: "Cinque prodotti dietro la stessa API",
    lede: "Attivi solo quelli che ti servono. Il contratto, le chiavi e i webhook restano gli stessi.",
    listLabel: "Prodotti",
    cards: [
      {
        id: "pay", mark: "coral", area: "Pagamenti",
        title: "Bonifici istantanei, anche di domenica",
        text: "SEPA Instant, bonifici ordinari, addebiti diretti e link di pagamento con una sola integrazione.",
        specs: [["Accredito", "Meno di 10 secondi, 24 ore su 24"], ["Schemi", "SCT Inst, SCT, SDD Core e B2B"], ["Antifrode", "Un controllo su ogni pagamento, prima dell'invio"]],
      },
      {
        id: "treasury", mark: "amber", area: "Tesoreria",
        title: "Il saldo di tutti i conti, in un posto solo",
        text: "Conti virtuali con un IBAN ciascuno, giroconti automatici e previsioni di cassa che si aggiornano a ogni movimento.",
        specs: [["Conti", "Virtuali e illimitati, un IBAN per conto"], ["Giroconti", "Automatici tra conto operativo e riserva"], ["Previsioni", "Cassa a 30 giorni, aggiornata in tempo reale"]],
      },
      {
        id: "compliance", mark: "mint", area: "Conformità",
        title: "Le verifiche dentro il flusso, non dopo",
        text: "KYC, KYB e monitoraggio AML girano mentre il cliente si registra e mentre paga, e lasciano un registro pronto per le ispezioni.",
        specs: [["Verifiche", "Persone e aziende, in pochi minuti"], ["AML", "Monitoraggio su ogni transazione"], ["Registro", "Firmato, immutabile, esportabile"]],
      },
      {
        id: "analytics", mark: "lavender", area: "Analisi",
        title: "La contabilità trova tutto già abbinato",
        text: "Ogni notte abbiniamo pagamenti e fatture e prepariamo i rendiconti per il gestionale. Ogni pagamento ha anche la sua ricevuta di CO2.",
        specs: [["Riconciliazione", "Ogni notte, con il tuo gestionale"], ["Rendiconti", "CSV e PDF per la contabilità"], ["CO2", "Grammi stimati su ogni pagamento"]],
      },
      {
        id: "api", mark: "blue", area: "API",
        title: "REST, webhook firmati e una sandbox vera",
        text: "Chiavi di test e di produzione, SDK ufficiali e IBAN di prova per simulare ritardi, rifiuti e rimborsi.",
        specs: [["SDK", "Node, Python e Java"], ["Webhook", "Firmati HMAC, con nuovi tentativi"], ["Sandbox", "Gratuita, senza carta di credito"]],
      },
    ],
  },
  en: {
    title: "Five products behind the same API",
    lede: "Turn on only the ones you need. The contract, the keys and the webhooks stay the same.",
    listLabel: "Products",
    cards: [
      {
        id: "pay", mark: "coral", area: "Payments",
        title: "Instant transfers, Sundays included",
        text: "SEPA Instant, standard transfers, direct debits and payment links through a single integration.",
        specs: [["Settlement", "Under 10 seconds, around the clock"], ["Schemes", "SCT Inst, SCT, SDD Core and B2B"], ["Fraud checks", "One check on every payment, before it leaves"]],
      },
      {
        id: "treasury", mark: "amber", area: "Treasury",
        title: "Every account balance, in one place",
        text: "Virtual accounts with an IBAN each, automatic sweeps and cash forecasts that update with every transaction.",
        specs: [["Accounts", "Virtual and unlimited, one IBAN each"], ["Sweeps", "Automatic, between operating and reserve"], ["Forecasts", "30-day cash, updated in real time"]],
      },
      {
        id: "compliance", mark: "mint", area: "Compliance",
        title: "Checks inside the flow, not after it",
        text: "KYC, KYB and AML monitoring run while customers sign up and while they pay, and leave an audit-ready log.",
        specs: [["Checks", "People and companies, in minutes"], ["AML", "Monitoring on every transaction"], ["Log", "Signed, immutable, exportable"]],
      },
      {
        id: "analytics", mark: "lavender", area: "Analytics",
        title: "Accounting finds everything already matched",
        text: "Every night we match payments to invoices and prepare the reports for your accounting system. Every payment also gets its CO2 receipt.",
        specs: [["Reconciliation", "Every night, with your accounting system"], ["Reports", "CSV and PDF for your accountants"], ["CO2", "Estimated grams on every payment"]],
      },
      {
        id: "api", mark: "blue", area: "API",
        title: "REST, signed webhooks and a real sandbox",
        text: "Test and live keys, official SDKs and test IBANs to simulate delays, rejections and refunds.",
        specs: [["SDKs", "Node, Python and Java"], ["Webhooks", "HMAC-signed, with retries"], ["Sandbox", "Free, no credit card"]],
      },
    ],
  },
};
