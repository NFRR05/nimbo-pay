// Final call to action (layout from Collectify «ref-refit-contact»): heading, three facts and a form.
// The form is a demo: it sends nothing and says so.
export default {
  it: {
    title: "Sposta il primo euro oggi.",
    lede: "Scrivici due righe: ti mandiamo l'accesso alla sandbox o fissiamo una chiamata con i nostri tecnici.",
    facts: [
      ["Sandbox", "Gratuita, pronta in due minuti"],
      ["Risposta", "Entro un giorno lavorativo"],
      ["Dati", "Restano nell'Unione Europea"],
    ],
    formLabel: "Richiesta di contatto",
    fields: {
      name: { label: "Nome", placeholder: "Giulia Verdi" },
      email: { label: "Email di lavoro", placeholder: "nome@azienda.it" },
      company: { label: "Azienda", placeholder: "Verdi S.p.A." },
      message: { label: "Messaggio", placeholder: "Vorremmo provare i bonifici istantanei per…" },
    },
    required: "obbligatorio",
    submit: "Invia la richiesta",
    sent: "Grazie! Nimbo è un progetto dimostrativo: il messaggio non è stato inviato.",
  },
  en: {
    title: "Move your first euro today.",
    lede: "Drop us a line: we'll send you sandbox access or set up a call with our technical team.",
    facts: [
      ["Sandbox", "Free, ready in two minutes"],
      ["Reply", "Within one working day"],
      ["Data", "Stays in the European Union"],
    ],
    formLabel: "Contact request",
    fields: {
      name: { label: "Name", placeholder: "Emma Clarke" },
      email: { label: "Work email", placeholder: "name@company.com" },
      company: { label: "Company", placeholder: "Clarke Ltd" },
      message: { label: "Message", placeholder: "We'd like to try instant transfers for…" },
    },
    required: "required",
    submit: "Send request",
    sent: "Thanks! Nimbo is a demo project, so your message wasn't sent.",
  },
};
