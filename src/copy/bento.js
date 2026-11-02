// Bento copy (layout from Collectify «ref-finax-bento»): five cards, each with one small interface.
export default {
  it: {
    title: "Tutto quello che serve per muovere denaro",
    lede: "Bonifici, conti, tesoreria e riconciliazione nello stesso pannello, senza costi nascosti.",
    sepa: {
      title: "Bonifici istantanei in tutta Europa",
      text: "Da Milano a Berlino in meno di dieci secondi, 24 ore su 24, festivi compresi.",
      name: "Bonifico SEPA Instant",
      amount: 2700,
      eta: "Arrivato in 4 secondi",
    },
    recon: {
      title: "Riconciliazione automatica, ogni notte",
      text: "Abbiniamo ogni movimento alla sua fattura mentre dormi.",
      invoice: "Fattura",
      rows: [[118, 1250], [119, 2700], [120, 480]],
    },
    accounts: {
      title: "Un conto per ogni uso",
      text: "Conti virtuali illimitati, ciascuno con il suo IBAN, aperti in un secondo.",
      rows: [["Operativo", "IT60 •••• 3456"], ["Riserva", "IT12 •••• 7781"]],
      chip: ["Nuovo conto", "IBAN in un secondo"],
    },
    treasury: {
      title: "Tesoreria in tempo reale",
      text: "Il saldo di tutti i conti e le previsioni di cassa a 30 giorni, in un colpo d'occhio.",
      label: "Saldo totale",
      amount: 2418930,
      delta: "+0,9% su ottobre",
      axis: ["2,6 Mln", "2,4 Mln", "2,2 Mln"],
    },
    fees: {
      title: "Nessun costo nascosto",
      text: "Niente canone, niente attivazione, niente minimi. Paghi solo quando il denaro si muove.",
      label: "Costi che con Nimbo non paghi",
      items: ["Canone mensile", "Commissioni sui bonifici", "Costi di attivazione", "Minimi di volume", "Penali di uscita", "Vincoli di durata"],
    },
  },
  en: {
    title: "Everything you need to move money",
    lede: "Transfers, accounts, treasury and reconciliation in the same dashboard, with no hidden costs.",
    sepa: {
      title: "Instant transfers across Europe",
      text: "From Milan to Berlin in under ten seconds, around the clock, holidays included.",
      name: "SEPA Instant transfer",
      amount: 2700,
      eta: "Arrived in 4 seconds",
    },
    recon: {
      title: "Automatic reconciliation, every night",
      text: "We match every transaction to its invoice while you sleep.",
      invoice: "Invoice",
      rows: [[118, 1250], [119, 2700], [120, 480]],
    },
    accounts: {
      title: "An account for every use",
      text: "Unlimited virtual accounts, each with its own IBAN, opened in a second.",
      rows: [["Operating", "IT60 •••• 3456"], ["Reserve", "IT12 •••• 7781"]],
      chip: ["New account", "IBAN in a second"],
    },
    treasury: {
      title: "Real-time treasury",
      text: "Every account balance and 30-day cash forecasts, at a glance.",
      label: "Total balance",
      amount: 2418930,
      delta: "+0.9% vs October",
      axis: ["€2.6M", "€2.4M", "€2.2M"],
    },
    fees: {
      title: "No hidden costs",
      text: "No monthly fee, no setup, no minimums. You only pay when money moves.",
      label: "Costs you don't pay with Nimbo",
      items: ["Monthly fees", "Transfer commissions", "Activation costs", "Volume minimums", "Exit penalties", "Lock-in periods"],
    },
  },
};
