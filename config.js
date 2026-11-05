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
      photo: "assets/team/dario.webp", portrait: "",
      cal: "dario-valastro", events: { 15: "15min", 30: "30min", 45: "45-min-meeting", 60: "60-min-meeting" },
    },
    davide: {
      name: "Davide", role: "COO e co-founder", weight: 2,
      bio: "Per il primo contatto, le demo e i primi passi.",
      photo: "assets/team/davide.webp", portrait: "",
      cal: "davide-filiaggi", events: { 15: "15min", 30: "30min" },
    },
    gherardo: {
      name: "Gherardo", role: "CMO", weight: 1,
      bio: "Per marketing e partnership.",
      photo: "assets/team/gherardo.webp", portrait: "",
      cal: "gherardo-fagioli-xox0se", events: { 30: "30min" },
    },
    marco: {
      name: "Marco", role: "Head of Growth", weight: 1,
      bio: "Per sales e scalabilità.",
      photo: "assets/team/marco.webp", portrait: "",
      cal: "marco-amodio-rzvm9e", events: { 15: "15min", 30: "30min" },
    },
    marta: {
      name: "Marta", role: "Business Development", weight: 1,
      bio: "Per demo e presentazioni della piattaforma.",
      photo: "assets/team/marta.webp", portrait: "",
      cal: "marta-bausani-8awkz2", events: { 15: "15min", 30: "30min" },
    },
    elvio: {
      name: "Elvio", role: "SEO Specialist", weight: 1,
      bio: "Per la SEO e il sito.",
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
    people: ["dario", "davide", "gherardo", "marco", "marta"],
    turn: "call",
    start: "2026-11-02", // da qui parte il conto dei turni (un lunedì)
    keywords: ["generica", "informazioni", "contatto", "team", "chiunque", "prezzo", "prezzi", "costo", "costi", "preventivo", "offerta", "listino", "abbonamento"],
    prepare: "Se hai un sito, tienilo a portata di mano e lo guardiamo insieme.",
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
      intro: "Audit, demo e collaborazioni con il team di RankWit AI, per hotel e destinazioni.",
      tile: "rankwit",
      card: "dark",
      types: [
        {
          key: "audit-hotel",
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
          prepare: "Tieni a portata di mano il sito della destinazione, così lo guardiamo insieme.",
          eyebrow: "Audit AI · Destinazioni",
          title: "Audit AI della destinazione",
          book: "Prenota l'audit AI della destinazione",
          duration: 45,
          summary: "Per DMO, comuni e consorzi. Vediamo come l'AI racconta il tuo territorio, quali fonti usa e dove mancano informazioni.",
          prompt: "Di quale destinazione ti occupi, e con quale ente?",
          people: ["gherardo", "davide"],
          keywords: ["dmo", "comune", "consorzio", "territorio", "turismo", "regione"],
        },
        {
          key: "demo",
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
      intro: "Il percorso per le strutture di un territorio, fatto di incontri, esercizi e misure su come l'AI le racconta.",
      tile: "lab",
      card: "soft",
      types: [
        {
          key: "presentazione",
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
    { key: "hotel", label: "Hotel", options: [["rankwit", "audit-hotel"], ["rankwit", "demo"]] },
    { key: "destinazioni", label: "Destinazioni", options: [["rankwit", "audit-destinazione"], ["lab", "presentazione"], ["rankwit", "demo"]] },
    { key: "seo", label: "SEO e sito", options: [["rankwit", "seo"]] },
    { key: "collaborazioni", label: "Collaborazioni", options: [["rankwit", "partnership"]] },
    { key: "pratiche", label: "Questioni pratiche", options: [["rankwit", "pratiche"]] },
  ],
};
