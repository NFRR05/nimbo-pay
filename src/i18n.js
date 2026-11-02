// Page-level copy (meta and navbar) in Italian (default, at /) and English (at /en/).
// Each section keeps its own copy in src/copy/<section>.js.
export const copy = {
  it: {
    locale: "it-IT",
    path: "/",
    meta: {
      title: "Nimbo — infrastruttura di pagamento per banche e fintech",
      description:
        "Pagamenti SEPA istantanei, conti virtuali, verifiche KYC e riconciliazione per banche e fintech, con un'unica API. Gratis fino a 10.000 transazioni al mese.",
    },
    nav: {
      label: "Principale",
      products: "Prodotti",
      security: "Sicurezza",
      pricing: "Prezzi",
      faq: "Domande",
      cta: "Apri una sandbox",
      menu: "Menu",
      close: "Chiudi",
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
        "Instant SEPA payments, virtual accounts, KYC checks and reconciliation for banks and fintechs, through one API. Free up to 10,000 transactions a month.",
    },
    nav: {
      label: "Main",
      products: "Products",
      security: "Security",
      pricing: "Pricing",
      faq: "FAQ",
      cta: "Open a sandbox",
      menu: "Menu",
      close: "Close",
      langLabel: "Leggi in italiano",
      langShort: "IT",
    },
  },
};
