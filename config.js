// Configurazione di book.rankwit.ai. Persone, programmi, call ed eventi si
// cambiano solo qui: la pagina si ricostruisce da sola.
//
// Ogni persona ha un account cal.com gratuito: `cal` è il nome utente (quello
// nel link cal.com/nome) ed `events` dice quale evento usare per ogni durata.
// Chi non ha l'evento di una durata non compare nelle call di quella durata.
// Finché `cal` è vuoto, la pagina mostra orari di esempio e non crea
// prenotazioni vere.

window.RW_BOOK = {
  site: {
    name: "RankWit Meet",
    // Indirizzo pubblico del sito, per i link nei motori di ricerca e la sitemap.
    // Quando c'è book.rankwit.ai va scritto qui e si rifà build-pages.mjs.
    url: "https://gherybeans-rankwit.github.io/rankwit-meet",
    organisation: "RankWit AI",
    website: "https://www.rankwit.ai",
    privacyUrl: "https://www.rankwit.ai/legal/privacy-policy-webapp",
    newsletterLabel: "Voglio ricevere la newsletter di RankWit",
    newsletterLabel_en: "Send me the RankWit newsletter",
    contact: "info@rankwit.ai",
  },

  rules: {
    windowDays: 30, // quanti giorni avanti si può prenotare
    timeZone: "Europe/Rome", // fuso di riferimento se il browser non ne dà uno
  },

  // Slug degli eventi per durata, usati solo per gli orari di esempio.
  slugs: { 15: "call-15", 30: "call-30", 45: "call-45", 60: "call-60" },

  // weight: quante volte in più tocca a questa persona quando più persone sono
  // libere nello stesso orario (1 = come gli altri, 2 = il doppio).
  // photo: foto piccola quadrata; portrait: foto verticale per la pagina personale.
  people: {
    dario: {
      name: "Dario", role: "CEO e co-founder", weight: 1,
      bio: "Per gli aspetti tecnici della piattaforma.",
      role_en: "CEO and co-founder", bio_en: "For the technical side of the platform.",
      photo: "assets/team/dario.webp", portrait: "",
      cal: "dario-valastro", events: { 15: "15min", 30: "30min", 45: "45-min-meeting", 60: "60-min-meeting" },
    },
    davide: {
      name: "Davide", role: "COO e co-founder", weight: 2,
      bio: "Per il primo contatto, le demo e i primi passi.",
      role_en: "COO and co-founder", bio_en: "For a first contact, demos and the first steps.",
      photo: "assets/team/davide.webp", portrait: "",
      cal: "davide-filiaggi", events: { 15: "15min", 30: "30min" },
    },
    gherardo: {
      name: "Gherardo", role: "CMO", weight: 1,
      bio: "Per marketing e partnership.",
      role_en: "CMO", bio_en: "For marketing and partnerships.",
      photo: "assets/team/gherardo.webp", portrait: "",
      cal: "gherardo-fagioli-xox0se", events: { 30: "30min" },
    },
    marco: {
      name: "Marco", role: "Head of Growth", weight: 1,
      bio: "Per sales e scalabilità.",
      role_en: "Head of Growth", bio_en: "For sales and scaling.",
      photo: "assets/team/marco.webp", portrait: "",
      cal: "marco-amodio-rzvm9e", events: { 15: "15min", 30: "30min" },
    },
    marta: {
      name: "Marta", role: "Business Development", weight: 1,
      bio: "Per demo e presentazioni della piattaforma.",
      role_en: "Business Development", bio_en: "For demos and presentations of the platform.",
      photo: "assets/team/marta.webp", portrait: "",
      cal: "marta-bausani-8awkz2", events: { 15: "15min", 30: "30min" },
    },
    elvio: {
      name: "Elvio", role: "SEO Specialist", weight: 1,
      bio: "Per la SEO e il sito.",
      role_en: "SEO Specialist", bio_en: "For SEO and the website.",
      photo: "assets/team/elvio-viso.webp", portrait: "assets/team/elvio.webp",
      cal: "elvio-leonardi-avr1vq", events: { 15: "15min", 30: "30min" },
    },
  },

  // La call generica, la prima cosa della home (book.rankwit.ai/team).
  // L'orchestratore (orchestrator.js) la assegna a turno fra `people`:
  //   turn: "call"      ogni orario passa alla persona dopo
  //         "giorno"    una persona di turno per ogni giorno feriale
  //         "settimana" una persona di turno per ogni settimana
  // Se chi è di turno è occupato a quell'ora, la call va al primo libero dopo
  // di lui nel giro. Nel giro ognuno compare tante volte quanto il suo weight.
  generic: {
    key: "team",
    eyebrow: "Call con il team",
    title: "Call con il team",
    book: "Prenota una call con il team",
    duration: 30,
    summary: "Non sai a chi scrivere? Prenota mezz'ora con il team. Ti risponde chi è di turno e, se serve, ti passa la persona giusta.",
    prompt: "Di cosa vuoi parlare?",
    eyebrow_en: "Call with the team",
    title_en: "Call with the team",
    book_en: "Book a call with the team",
    summary_en: "Not sure who to write to? Book half an hour with the team. Whoever is on duty answers and, if needed, passes you to the right person.",
    prompt_en: "What would you like to talk about?",
    people: ["dario", "davide", "gherardo", "marco", "marta"],
    turn: "call",
    start: "2026-11-02", // da qui parte il conto dei turni (un lunedì)
    keywords: ["generica", "informazioni", "contatto", "team", "chiunque", "prezzo", "prezzi", "costo", "costi", "preventivo", "offerta", "listino", "abbonamento"],
    keywords_en: ["general", "information", "contact", "team", "anyone", "price", "prices", "cost", "costs", "quote", "offer", "pricing", "subscription"],
    prepare: "Se hai un sito, tienilo a portata di mano e lo guardiamo insieme.",
    prepare_en: "If you have a website, keep it at hand and we will look at it together.",
  },

  // Durate offerte nelle pagine personali (book.rankwit.ai/davide).
  personalDurations: [15, 30, 45, 60],
  personalDefault: 30,

  // Programmi: ognuno ha la sua pagina (book.rankwit.ai/rankwit) e le sue call
  // (book.rankwit.ai/rankwit/audit-hotel). tile: rankwit, lab o pin.
  brands: [
    {
      key: "rankwit",
      name: "RankWit AI",
      short: "RankWit",
      meta: "Audit · Piattaforma · SEO · Collaborazioni",
      meta_en: "Audit · Platform · SEO · Partnerships",
      intro: "Audit, demo e collaborazioni con il team di RankWit AI, per hotel e destinazioni.",
      intro_en: "Audits, demos and partnerships with the RankWit AI team, for hotels and destinations.",
      tile: "rankwit",
      card: "dark",
      types: [
        {
          key: "audit-hotel",
          prepare_en: "Keep your hotel's website at hand, so we can look at it together.",
          eyebrow_en: "AI audit · Hotels",
          title_en: "AI audit of your hotel",
          book_en: "Book the AI audit of your hotel",
          summary_en: "We look together at what ChatGPT, Gemini and Perplexity answer when a traveler looks for a hotel like yours, and where to start.",
          prompt_en: "Which hotel is it? Write the name and the website.",
          keywords_en: ["hotel", "property", "report", "visibility", "chatgpt", "gemini", "perplexity", "b&b", "bed and breakfast", "farm stay", "camping", "resort", "villa", "apartments", "holiday home", "accommodation"],
          prepare: "Tieni a portata di mano il sito dell'hotel, così lo guardiamo insieme.",
          eyebrow: "Audit AI · Hotel",
          title: "Audit AI del tuo hotel",
          book: "Prenota l'audit AI del tuo hotel",
          duration: 30,
          summary: "Guardiamo insieme cosa rispondono ChatGPT, Gemini e Perplexity quando un viaggiatore cerca un hotel come il tuo, e da dove conviene partire.",
          prompt: "Qual è il tuo hotel? Scrivi il nome e il sito.",
          people: ["davide", "gherardo"],
          keywords: ["albergo", "struttura", "report", "visibilità", "chatgpt", "gemini", "perplexity", "b&b", "bed and breakfast", "agriturismo", "camping", "campeggio", "resort", "villa", "appartamenti", "casa vacanze", "struttura ricettiva"],
        },
        {
          key: "audit-destinazione",
          prepare_en: "Keep the destination's website at hand, so we can look at it together.",
          eyebrow_en: "AI audit · Destinations",
          title_en: "AI audit of your destination",
          book_en: "Book the AI audit of your destination",
          summary_en: "For DMOs, municipalities and consortia. We see how AI tells the story of your territory, which sources it uses and where information is missing.",
          prompt_en: "Which destination do you work on, and for which organisation?",
          keywords_en: ["dmo", "municipality", "consortium", "territory", "tourism", "region", "destination"],
          prepare: "Tieni a portata di mano il sito della destinazione, così lo guardiamo insieme.",
          eyebrow: "Audit AI · Destinazioni",
          title: "Audit AI della destinazione",
          book: "Prenota l'audit AI della destinazione",
          duration: 30,
          summary: "Per DMO, comuni e consorzi. Vediamo come l'AI racconta il tuo territorio, quali fonti usa e dove mancano informazioni.",
          prompt: "Di quale destinazione ti occupi, e con quale ente?",
          people: ["gherardo", "davide"],
          keywords: ["dmo", "comune", "consorzio", "territorio", "turismo", "regione"],
        },
        {
          key: "demo",
          prepare_en: "Think of two or three questions a traveler would ask about you and we will try them together.",
          eyebrow_en: "Platform",
          title_en: "Platform demo",
          book_en: "Book a demo of the platform",
          summary_en: "We show you how we measure the AI engines' answers about hotels and destinations every week, and what you find in the dashboard.",
          prompt_en: "What would you like to see in the demo?",
          keywords_en: ["trial", "dashboard", "software", "platform"],
          prepare: "Pensa a due o tre domande che un viaggiatore farebbe su di te e le proviamo insieme.",
          eyebrow: "Piattaforma",
          title: "Demo della piattaforma",
          book: "Prenota una demo della piattaforma",
          duration: 30,
          summary: "Ti mostriamo come misuriamo ogni settimana le risposte dei motori AI su hotel e destinazioni, e cosa trovi nel pannello.",
          prompt: "Cosa vorresti vedere nella demo?",
          people: ["davide", "gherardo"],
          keywords: ["prova", "pannello", "software", "dashboard"],
        },
        {
          key: "partnership",
          prepare_en: "If you have a presentation of your agency or product, attach it when you reply to the invitation.",
          eyebrow_en: "Partnerships",
          title_en: "Partnership",
          book_en: "Book a call about partnerships",
          summary_en: "For agencies, consultants and hospitality software companies that want to work with us.",
          prompt_en: "What kind of partnership do you have in mind?",
          keywords_en: ["agency", "consultant", "reseller", "integration", "partner"],
          prepare: "Se hai una presentazione dell'agenzia o del prodotto, allegala rispondendo all'invito.",
          eyebrow: "Collaborazioni",
          title: "Partnership",
          book: "Prenota una call sulle partnership",
          duration: 30,
          summary: "Per agenzie, consulenti e software per l'ospitalità che vogliono lavorare con noi.",
          prompt: "Che tipo di collaborazione hai in mente?",
          people: ["gherardo", "davide"],
          keywords: ["agenzia", "consulente", "rivenditore", "integrazione", "partner"],
        },
        {
          key: "seo",
          prepare_en: "Keep the website at hand and, if you have it, access to Google Search Console.",
          eyebrow_en: "SEO",
          title_en: "SEO of your website",
          book_en: "Book a call about SEO",
          summary_en: "We look together at how Google and AI assistants read your website, what is missing and what to fix first.",
          prompt_en: "Which website is it? Tell us what you would like to improve.",
          keywords_en: ["seo", "website", "google", "ranking", "structured data", "schema", "pages"],
          prepare: "Tieni a portata di mano il sito e, se ce l'hai, l'accesso a Google Search Console.",
          eyebrow: "SEO",
          title: "SEO del sito",
          book: "Prenota una call sulla SEO",
          duration: 30,
          summary: "Guardiamo insieme come Google e gli assistenti AI leggono il tuo sito, cosa manca e cosa sistemare per primo.",
          prompt: "Qual è il sito? Raccontaci cosa vorresti migliorare.",
          people: ["elvio"],
          keywords: ["seo", "sito", "google", "posizionamento", "dati strutturati", "schema", "pagine"],
        },
        {
          key: "pratiche",
          prepare_en: "If it is about an invoice or a contract, keep the number at hand.",
          eyebrow_en: "Practical matters",
          title_en: "Practical matters",
          book_en: "Book a call about practical matters",
          summary_en: "Invoices, contracts, access to the platform and everything organisational.",
          prompt_en: "What is it about?",
          keywords_en: ["invoice", "payment", "contract", "access", "password", "admin", "billing"],
          prepare: "Se si tratta di una fattura o di un contratto, tieni a portata di mano il numero.",
          eyebrow: "Questioni pratiche",
          title: "Questioni pratiche",
          book: "Prenota una call per questioni pratiche",
          duration: 15,
          summary: "Fatture, contratti, accessi alla piattaforma e tutto quello che è organizzativo.",
          prompt: "Di cosa si tratta?",
          people: ["marco"],
          keywords: ["fattura", "pagamento", "contratto", "accesso", "password", "amministrazione"],
        },
      ],
    },
    {
      key: "lab",
      name: "AI Visibility Lab",
      short: "Lab",
      meta: "Per territori e associazioni",
      meta_en: "For territories and associations",
      intro: "Il percorso per le strutture di un territorio, fatto di incontri, esercizi e misure su come l'AI le racconta.",
      intro_en: "The programme for the properties of a territory: meetings, exercises and measurements of how AI tells their story.",
      tile: "lab",
      card: "soft",
      types: [
        {
          key: "presentazione",
          prepare_en: "If you already have the territory and the number of properties in mind, bring them to the call.",
          eyebrow_en: "Presentation · AI Visibility Lab",
          title_en: "Presentation of the Lab",
          book_en: "Book a presentation of the Lab",
          summary_en: "How a Lab is organised for the properties of a territory, who takes part and what each one keeps.",
          prompt_en: "Which territory or association are you thinking of the Lab for?",
          keywords_en: ["lab", "workshop", "training", "properties", "territory"],
          prepare: "Se hai già in mente il territorio e quante strutture coinvolgere, portalo in call.",
          eyebrow: "Presentazione · AI Visibility Lab",
          title: "Presentazione del Lab",
          book: "Prenota una presentazione del Lab",
          duration: 30,
          summary: "Come si organizza un Lab per le strutture di un territorio, chi partecipa e cosa resta a ciascuna.",
          prompt: "Per quale territorio o associazione pensi al Lab?",
          people: ["gherardo", "marco"],
          keywords: ["laboratorio", "formazione", "workshop", "strutture"],
        },
      ],
    },
  ],

  // Le sezioni della home e i filtri. Nella vista «Tutte le call» ogni call
  // compare una volta sola, nella prima sezione che la contiene.
  navigator: [
    { key: "hotel", label: "Hotel", label_en: "Hotels", options: [["rankwit", "audit-hotel"], ["rankwit", "demo"]] },
    { key: "destinazioni", label: "Destinazioni", label_en: "Destinations", options: [["rankwit", "audit-destinazione"], ["lab", "presentazione"], ["rankwit", "demo"]] },
    { key: "seo", label: "SEO e sito", label_en: "SEO and website", options: [["rankwit", "seo"]] },
    { key: "collaborazioni", label: "Collaborazioni", label_en: "Partnerships", options: [["rankwit", "partnership"]] },
    { key: "pratiche", label: "Questioni pratiche", label_en: "Practical matters", options: [["rankwit", "pratiche"]] },
  ],
};

// Inglese: ogni testo può avere un gemello con il suffisso `_en` (title_en,
// bio_en, keywords_en...). RW_LOCALIZE(config, "en") restituisce una copia con
// i testi inglesi al posto di quelli italiani; con "it" una copia senza i `_en`.
// Lo usano app.js (dall'indirizzo /en/...) e build-pages.mjs.
window.RW_LOCALIZE = function (obj, lang) {
  if (Array.isArray(obj)) return obj.map(function (v) { return window.RW_LOCALIZE(v, lang); });
  if (!obj || typeof obj !== "object") return obj;
  var out = {};
  Object.keys(obj).forEach(function (k) {
    if (k.slice(-3) === "_en") return;
    var v = obj[k];
    if (lang === "en" && Object.prototype.hasOwnProperty.call(obj, k + "_en")) v = obj[k + "_en"];
    out[k] = window.RW_LOCALIZE(v, lang);
  });
  return out;
};
