// Page-level copy (meta and navbar) in Italian (default, at /) and English (at /en/).
// Each section keeps its own copy in src/copy/<section>.js.
export const copy = {
  it: {
    locale: "it-IT",
    path: "/",
    meta: {
      title: "Nimbo — infrastruttura di pagamento per banche e fintech",
      description:
        "Pagamenti istantanei, open banking e compliance in un'unica API. Gratis fino a 10.000 transazioni al mese, con una ricevuta di CO₂ per ogni pagamento.",
    },
    nav: {
      label: "Principale",
      products: "Prodotti",
      how: "Come funziona",
      pricing: "Prezzi",
      faq: "Domande",
      cta: "Inizia gratis",
      menu: "Menu",
      langLabel: "Read in English",
      langShort: "EN",
    },
  },

  en: {
    locale: "en-IE",
    path: "/en/",
    meta: {
      title: "Nimbo — payment infrastructure for banks and fintechs",
      description:
        "Instant payments, open banking and compliance in one API. Free up to 10,000 transactions a month, with a CO₂ receipt for every payment.",
    },
    nav: {
      label: "Main",
      products: "Products",
      how: "How it works",
      pricing: "Pricing",
      faq: "FAQ",
      cta: "Start free",
      menu: "Menu",
      langLabel: "Leggi in italiano",
      langShort: "IT",
    },
  },
};
