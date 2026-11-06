// "Let them introduce themselves": each colour mark says, in its own words, what its product does.
// The order and colours are the products' (src/copy/products.js).
export default {
  it: {
    title: "Lasciamo che si presentino",
    lede: "Ogni colore di Nimbo è un prodotto. Scorri, e ognuno ti dice cosa fa.",
    items: [
      { mark: "coral", name: "Pagamenti", say: "Faccio arrivare i tuoi bonifici in meno di dieci secondi, anche di domenica. Prima di ogni invio controllo che non sia una frode." },
      { mark: "amber", name: "Tesoreria", say: "Ti dico quanto c'è su tutti i tuoi conti adesso e quanto ci sarà fra trenta giorni. Se il conto operativo è troppo pieno, sposto il resto in riserva." },
      { mark: "mint", name: "Conformità", say: "Verifico persone e aziende mentre si registrano e guardo ogni transazione. Tengo un registro firmato per il giorno in cui arriva un'ispezione." },
      { mark: "lavender", name: "Analisi", say: "Ogni notte abbino i pagamenti alle fatture, così la mattina la contabilità trova tutto in ordine. Su ogni pagamento segno anche i grammi di CO₂." },
      { mark: "blue", name: "API", say: "Sono quello con cui parlano i tuoi sviluppatori: un'API REST, webhook firmati e una sandbox gratuita per provare rifiuti e rimborsi senza soldi veri." },
    ],
  },
  en: {
    title: "Let them introduce themselves",
    lede: "Every Nimbo colour is a product. Scroll, and each one tells you what it does.",
    items: [
      { mark: "coral", name: "Payments", say: "I get your transfers there in under ten seconds, Sundays included. Before anything leaves, I check it isn't fraud." },
      { mark: "amber", name: "Treasury", say: "I tell you what's in all your accounts right now and what will be there in thirty days. When the operating account gets too full, I move the rest to reserve." },
      { mark: "mint", name: "Compliance", say: "I verify people and companies while they sign up and I watch every transaction. I keep a signed log for the day an inspection comes." },
      { mark: "lavender", name: "Analytics", say: "Every night I match payments to invoices, so in the morning your accountants find everything in order. I also note the grams of CO₂ on every payment." },
      { mark: "blue", name: "API", say: "I'm the one your developers talk to: one REST API, signed webhooks and a free sandbox to try declines and refunds without real money." },
    ],
  },
};
