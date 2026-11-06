/* book.rankwit.ai · RankWit Meet
   Legge config.js, chiede a cal.com gli orari liberi di ogni persona, li unisce
   e per ogni orario sceglie chi prende la call. Il modulo è nostro: la
   prenotazione parte verso cal.com, che crea l'evento con Google Meet e manda
   l'invito. */
(() => {
  "use strict";

  const BASE = window.RW_BASE || ""; // "" sul Mac e su book.rankwit.ai, "/repo" su GitHub Pages
  const routePath = () => (BASE && location.pathname.startsWith(BASE) ? location.pathname.slice(BASE.length) : location.pathname);
  // La lingua la dice l'indirizzo: /en/... è la versione inglese, tutto il resto è in italiano.
  const LANG = /^\/en(\/|$)/i.test(routePath()) ? "en" : "it";
  const EN = LANG === "en";
  const LOCALE = EN ? "en-GB" : "it-IT";
  document.documentElement.lang = LANG;
  const C = window.RW_LOCALIZE(window.RW_BOOK, LANG);
  const app = document.getElementById("app");
  const API = "https://api.cal.com/v2";
  // Parametri nell'indirizzo. `da` dice da dove arriva la persona e finisce nei
  // metadati della prenotazione. nome (o name), email, azienda, ruolo, sito e
  // nota precompilano il modulo «I tuoi dati», così chi ha già scritto i suoi
  // dati in un form non li riscrive: il link nell'email di grazie li porta qui.
  // Si leggono una volta e poi si tolgono dall'indirizzo: restano nella pagina,
  // non nella barra né nella cronologia.
  const params = new URLSearchParams(location.search);
  const source = params.get("da") || "";
  const PREFILL = {
    name: params.get("nome") || params.get("name") || "",
    email: params.get("email") || "",
    organisation: params.get("azienda") || "",
    role: params.get("ruolo") || "",
    site: params.get("sito") || "",
    notes: params.get("nota") || "",
  };
  if (Object.values(PREFILL).some(Boolean)) {
    history.replaceState(history.state, "", `${location.pathname}${source ? `?da=${encodeURIComponent(source)}` : ""}${location.hash}`);
  }
  // Dominio pulito di un sito scritto in qualsiasi modo: https://www.hotel.it/camere diventa hotel.it.
  const domainOf = (u) => (u || "").trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0].toLowerCase();
  // Valori iniziali del modulo: quelli arrivati nell'indirizzo, altrimenti vuoti.
  // Senza azienda si propone il dominio del sito; senza nota, una riga sul report del sito.
  const prefillValues = () => {
    const site = domainOf(PREFILL.site);
    return {
      name: PREFILL.name.trim(),
      email: PREFILL.email.trim(),
      organisation: PREFILL.organisation.trim() || site,
      role: PREFILL.role.trim(),
      notes: PREFILL.notes.trim() || (site ? T.prefillNotes(site) : ""),
      newsletter: false,
    };
  };
  let current = "/"; // l'indirizzo della pagina senza base e senza /en, per il cambio lingua

  /* ---------- testi dell'interfaccia ---------- */

  const T = EN ? {
    tzItaly: "Italian time", tzCET: "Central European time", tzCity: (c) => `${c} time`, tzFair: "local time at the fair",
    or: "or", and: "and",
    copyFail: "Could not copy", copied: "Link copied", detailsCopied: "Details copied",
    bookACall: "Book a call", allCallsAria: "RankWit Meet, all calls", switchAria: "Versione italiana",
    free: "free, no commitment", minutes: "minutes", example: "Example", callWith: "Call with", bookWith: "Book a call with", callTypes: "call types",
    chooseTime: "Choose a time", chooseTimeLower: "choose a time",
    homeTitle: "Book a call | RankWit", homeH1: "What would you like to talk about?",
    homeLead: "Not sure who to write to? Book half an hour with the team. Whoever is on duty answers and, if needed, passes you to the right person. Every call is on Google Meet, at the times of your time zone.",
    bookTeam: "Book a call with the team", facesAria: "The team, pick who to talk to", facesNote: "Or pick who you want to talk to.",
    search: "Search a topic or a person", filterAria: "Filter the calls", allCalls: "All calls", teamH2: "Book a call with whoever you prefer", progsH2: "All programmes in one place",
    results: (n, q) => `${n} results for "${q}"`, noResults: (q) => `No results for "${q}"`, calls: "Calls", people: "People",
    noCall: (q) => `No call for "${q}".`, tryAgain: "Try another word, or book the call with the team. Whoever is on duty answers and points you to the right person.",
    inPerson: "in person", inPersonCap: "In person", meetLink: "Google Meet, the link comes with the invitation", duration: "Duration",
    range: (a, b) => `${a} to ${b}`, copyLink: "Copy link", share: "Share", bookWithOf: (n, o) => `Book a call with ${n} of ${o}`,
    stepOf: (n) => `Step ${n} of 2`, loading: "Loading free times",
    timesIn: "Times in", auto: "Set automatically", byYou: "Chosen by you", change: "Change", timeZone: "Time zone",
    noneThoseDays: "There are no free times left on those days.", noneNext: (n) => `No free times in the next ${n} days.`,
    writeUs: (c) => `Write to us at <a href="mailto:${c}">${c}</a> and we will find a time.`,
    prevMonth: "Previous month", nextMonth: "Next month", gridAria: "Days with free times. Use the arrow keys to move.",
    dow: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], today: ", today", freeTimes: "Free times", next: "Next",
    cantRead: (who) => `I cannot read the times of ${who}, so they are not shown for now.`,
    changeTime: "Change time", yourDetails: "Your details", fullName: "Full name", email: "Email", org: "Hotel, organisation or company", role: "Role", optional: "(optional)", website: "Website", leaveEmpty: "Leave this field empty",
    confirm: "Confirm the booking", confirming: "Confirming the booking",
    fine: (u) => `We use these details to set up this call, under <a href="${u}" target="_blank" rel="noopener">RankWit's privacy policy</a>.`,
    vName: "Enter your full name.", vEmail: "Enter your email.", vEmailBad: "This email is incomplete. It should look like name@hotel.com.",
    vOrg: "Enter the name of your hotel, organisation or company.", vNotes: "Tell us in a line or two what you would like to talk about.",
    prefillNotes: (site) => `Looking at the report on ${site} together.`,
    taken: "This time is no longer free. Choose another one, your details are kept.", failed: (c) => `We could not confirm the booking. Try again in a moment or write to us at ${c}.`,
    confirmed: "Booking confirmed", seeYouStand: "See you at the stand", talkSoon: "Talk soon",
    inviteVenue: (e) => `The invitation with the venue is on its way to <strong>${e}</strong>.`,
    inviteWith: (n, e) => `The call is with ${n}. The invitation with the Google Meet link is on its way to <strong>${e}</strong>.`,
    invite: (e) => `The invitation with the Google Meet link is on its way to <strong>${e}</strong>.`,
    moveCancel: "From the confirmation email you can reschedule or cancel the call.",
    demoNote: (who) => `This is a test. ${who} has not connected cal.com yet, so no booking was created.`, theHost: "The host",
    shareColleague: "Want a colleague to join? Send them the day, time and link of the call.", shareBtn: "Share with a colleague", icsBtn: "Add to calendar", backAll: "Back to all calls",
    callWithOf: (n, o) => `Call with ${n} of ${o}`, meetInInvite: "The Google Meet link is in the cal.com invitation, which you can forward.",
    personTitle: (n) => `Book a call with ${n} | RankWit`, personPrompt: "What would you like to talk about?",
    personPrepare: "If you like, reply to the invitation with the website or the material to look at together.",
    personLead: "We meet on Google Meet, on the day and at the time you prefer.",
    nfTitle: "Page not found | RankWit", nfH1: "This link is not valid", nfLead: "The link may be incomplete. From here you can choose a topic or a person.", nfBtn: "See all calls",
  } : {
    tzItaly: "ora italiana", tzCET: "ora dell'Europa centrale", tzCity: (c) => `ora di ${c}`, tzFair: "ora locale della fiera",
    or: "o", and: "e",
    copyFail: "Non riesco a copiare", copied: "Link copiato", detailsCopied: "Dettagli copiati",
    bookACall: "Prenota una call", allCallsAria: "RankWit Meet, tutte le call", switchAria: "English version",
    free: null, minutes: "minuti", example: "Esempio", callWith: "Call con", bookWith: "Prenota una call con", callTypes: "tipi di call",
    chooseTime: "Scegli un orario", chooseTimeLower: "scegli un orario",
    homeTitle: "Prenota una call | RankWit", homeH1: "Di cosa vuoi parlare?",
    homeLead: "Non sai a chi scrivere? Prenota mezz'ora con il team. Ti risponde chi è di turno e, se serve, ti passa la persona giusta. Ogni call si fa su Google Meet, negli orari del tuo fuso.",
    bookTeam: "Prenota una call con il team", facesAria: "Il team, scegli tu con chi parlare", facesNote: "Oppure scegli tu con chi parlare.",
    search: "Cerca un tema o una persona", filterAria: "Filtra le call", allCalls: "Tutte le call", teamH2: "Prenota una call con chi preferisci", progsH2: "Tutti i programmi in un posto",
    results: (n, q) => `${n} risultati per «${q}»`, noResults: (q) => `Nessun risultato per «${q}»`, calls: "Call", people: "Persone",
    noCall: (q) => `Nessuna call per «${q}».`, tryAgain: "Prova con un'altra parola, oppure prenota la call con il team. Ti risponde chi è di turno e ti indirizza.",
    inPerson: "di persona", inPersonCap: "Di persona", meetLink: "Google Meet, il link arriva con l'invito", duration: "Durata",
    range: (a, b) => `dalle ${a} alle ${b}`, copyLink: "Copia link", share: "Condividi", bookWithOf: (n, o) => `Prenota una call con ${n} di ${o}`,
    stepOf: (n) => `Passo ${n} di 2`, loading: "Carico gli orari liberi",
    timesIn: "Orari nell'", auto: "Impostato in automatico", byYou: "Scelto da te", change: "Cambia", timeZone: "Fuso orario",
    noneThoseDays: "In quei giorni non ci sono più orari liberi.", noneNext: (n) => `Nei prossimi ${n} giorni non ci sono orari liberi.`,
    writeUs: (c) => `Scrivici a <a href="mailto:${c}">${c}</a> e troviamo un momento.`,
    prevMonth: "Mese precedente", nextMonth: "Mese successivo", gridAria: "Giorni con orari liberi. Usa le frecce per spostarti.",
    dow: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"], today: ", oggi", freeTimes: "Orari liberi", next: "Avanti",
    cantRead: (who) => `Non riesco a leggere gli orari di ${who}, per ora non li vedi.`,
    changeTime: "Cambia orario", yourDetails: "I tuoi dati", fullName: "Nome e cognome", email: "Email", org: "Hotel, ente o azienda", role: "Ruolo", optional: "(facoltativo)", website: "Sito", leaveEmpty: "Lascia vuoto questo campo",
    confirm: "Conferma la prenotazione", confirming: "Confermo la prenotazione",
    fine: (u) => `I dati servono a organizzare questa call e sono trattati secondo la <a href="${u}" target="_blank" rel="noopener">privacy di RankWit</a>.`,
    vName: "Scrivi nome e cognome.", vEmail: "Scrivi la tua email.", vEmailBad: "Questa email non è completa, deve essere come nome@hotel.it.",
    vOrg: "Scrivi il nome dell'hotel, dell'ente o dell'azienda.", vNotes: "Scrivi in una o due righe di cosa vuoi parlare.",
    prefillNotes: (site) => `Vedere insieme il report di ${site}.`,
    taken: "Questo orario non è più libero. Scegline un altro, i tuoi dati restano salvati.", failed: (c) => `Non sono riuscito a confermare la prenotazione. Riprova tra poco o scrivici a ${c}.`,
    confirmed: "Prenotazione confermata", seeYouStand: "Ci vediamo allo stand", talkSoon: "Ci sentiamo presto",
    inviteVenue: (e) => `L'invito con il luogo è in arrivo a <strong>${e}</strong>.`,
    inviteWith: (n, e) => `La call è con ${n}. L'invito con il link Google Meet è in arrivo a <strong>${e}</strong>.`,
    invite: (e) => `L'invito con il link Google Meet è in arrivo a <strong>${e}</strong>.`,
    moveCancel: "Dall'email di conferma puoi spostare o cancellare la call.",
    demoNote: (who) => `È una prova. ${who} non ha ancora collegato cal.com, quindi nessuna prenotazione è stata creata.`, theHost: "Chi farà la call",
    shareColleague: "Vuoi che venga anche un collega? Mandagli giorno, ora e link della call.", shareBtn: "Condividi con un collega", icsBtn: "Scarica per il calendario", backAll: "Torna a tutte le call",
    callWithOf: (n, o) => `Call con ${n} di ${o}`, meetInInvite: "Il link Google Meet è nell'invito di cal.com, che puoi inoltrare.",
    personTitle: (n) => `Prenota una call con ${n} | RankWit`, personPrompt: "Di cosa vuoi parlare?",
    personPrepare: "Se vuoi, rispondi all'invito con il sito o i materiali da guardare insieme.",
    personLead: "Ci sentiamo su Google Meet, nel giorno e all'ora che preferisci.",
    nfTitle: "Pagina non trovata | RankWit", nfH1: "Questo link non è valido", nfLead: "Il link potrebbe essere incompleto. Da qui puoi scegliere il tema o la persona.", nfBtn: "Vedi tutte le call",
  };

  /* ---------- utilità ---------- */

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* niente */ } },
  };
  const hash = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const validTz = (z) => { try { new Intl.DateTimeFormat("it-IT", { timeZone: z }); return true; } catch { return false; } };

  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let userTz = store.get("rw-meet-tz");
  const tzAuto = !userTz || !validTz(userTz);
  if (tzAuto) userTz = validTz(browserTz) ? browserTz : C.rules.timeZone;

  const CITY = {
    Rome: "Roma", London: "Londra", Berlin: "Berlino", Paris: "Parigi", Madrid: "Madrid", Zurich: "Zurigo",
    Vienna: "Vienna", Brussels: "Bruxelles", Amsterdam: "Amsterdam", Lisbon: "Lisbona", Athens: "Atene",
    Luxembourg: "Lussemburgo", Warsaw: "Varsavia", Prague: "Praga", Copenhagen: "Copenaghen", Stockholm: "Stoccolma",
    New_York: "New York", Los_Angeles: "Los Angeles", Dubai: "Dubai", Tokyo: "Tokyo", UTC: "UTC",
  };
  const tzCity = (z) => (EN ? "" : CITY[z.split("/").pop()]) || z.split("/").pop().replace(/_/g, " ");
  const tzOffset = (z, d = new Date()) => {
    try {
      const p = new Intl.DateTimeFormat("en-US", { timeZone: z, timeZoneName: "shortOffset" }).formatToParts(d);
      return (p.find((x) => x.type === "timeZoneName") || {}).value || "";
    } catch { return ""; }
  };

  // Nome del fuso per chi legge: «ora italiana», «ora dell'Europa centrale»
  // per chi ha lo stesso orario di Roma, altrimenti «ora di <città>».
  const tzLabel = (z, d = new Date()) => {
    if (z === "Europe/Rome") return T.tzItaly;
    if (z.startsWith("Europe/") && tzOffset(z, d) === tzOffset("Europe/Rome", d)) return T.tzCET;
    return T.tzCity(tzCity(z));
  };

  const dayKey = (d, z) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: z, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const fmtTime = (d, z) => new Intl.DateTimeFormat(LOCALE, { timeZone: z, hour: "2-digit", minute: "2-digit" }).format(d);
  const keyDate = (key) => { const [y, m, d] = key.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); };
  const fmtDay = (key, opts) => new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...opts }).format(keyDate(key));
  const fmtMonth = (y, m) => cap(new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(Date.UTC(y, m, 1, 12))));
  const ymd = (d) => d.toISOString().slice(0, 10);

  const person = (id) => C.people[id];
  const isDemo = (id) => !person(id)?.cal;
  const list = (ids, last = T.or) => {
    const n = ids.map((id) => person(id)?.name).filter(Boolean);
    return n.length <= 1 ? n.join("") : `${n.slice(0, -1).join(", ")} ${last} ${n[n.length - 1]}`;
  };
  const initials = (name) => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const avatar = (id, cls = "") => {
    const p = person(id);
    if (!p) return "";
    return p.photo
      ? `<img class="avatar ${cls}" src="${esc(p.photo)}" alt="" width="96" height="96" loading="lazy" decoding="async">`
      : `<span class="avatar ${cls} ini" aria-hidden="true">${esc(initials(p.name))}</span>`;
  };
  const stack = (ids, cls = "") => `<span class="stack" aria-hidden="true">${ids.map((id) => avatar(id, cls)).join("")}</span>`;

  const I = (d, w = 16) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    arrow: I('<path d="M5 12h14M12 5l7 7-7 7"/>'),
    back: I('<path d="M19 12H5M12 19l-7-7 7-7"/>', 14),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    video: I('<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8Z"/>'),
    pin: I('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>'),
    search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 18),
    globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', 14),
    left: I('<path d="m15 18-6-6 6-6"/>'),
    right: I('<path d="m9 18 6-6-6-6"/>'),
    check: I('<path d="M20 6 9 17l-5-5"/>', 20),
    ok: I('<path d="M20 6 9 17l-5-5"/>'),
    link: I('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>', 16),
    share: I('<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>', 16),
    cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', 16),
  };

  /* ---------- copia e condividi ---------- */

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* sotto, il vecchio modo */ }
    const t = Object.assign(document.createElement("textarea"), { value: text });
    t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;opacity:0";
    document.body.append(t); t.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    t.remove();
    return ok;
  }

  // Cambia per un attimo la scritta del bottone e lo dice anche ai lettori di schermo.
  function flash(btn, text) {
    const label = btn.querySelector("span");
    const was = btn.dataset.label || (btn.dataset.label = label.textContent);
    label.textContent = text;
    btn.classList.add("is-done");
    const live = document.getElementById("live");
    if (live) live.textContent = text;
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { label.textContent = was; btn.classList.remove("is-done"); }, 2400);
  }

  // Il telefono apre WhatsApp, email e le altre app; altrimenti si copia.
  async function shareOrCopy(btn, data, copied) {
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const text = [data.text, data.url].filter(Boolean).join("\n");
    flash(btn, (await copyText(text)) ? copied : T.copyFail);
  }

  const pageUrl = () => `${location.origin}${location.pathname}`;

  // File .ics della call, da aprire in qualunque calendario.
  function icsFile({ start, minutes, title, details, url }) {
    const f = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const s = new Date(start);
    const e = new Date(s.getTime() + minutes * 60e3);
    const x = (t) => String(t).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
    const body = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RankWit AI//RankWit Meet//IT", "METHOD:PUBLISH",
      "BEGIN:VEVENT", `UID:${f(s)}-${Math.random().toString(36).slice(2)}@rankwit.ai`, `DTSTAMP:${f(new Date())}`,
      `DTSTART:${f(s)}`, `DTEND:${f(e)}`, `SUMMARY:${x(title)}`, `DESCRIPTION:${x(details)}`,
      `LOCATION:${x(url || "Google Meet")}`, ...(url ? [`URL:${url}`] : []),
      "END:VEVENT", "END:VCALENDAR", "",
    ].join("\r\n");
    return new File([body], "call-rankwit.ics", { type: "text/calendar" });
  }

  /* ---------- catalogo ---------- */

  const brand = (k) => C.brands.find((b) => b.key === k);
  const typeOf = (bk, tk) => brand(bk)?.types.find((t) => t.key === tk);
  const allTypes = C.brands.flatMap((b) => b.types.map((t) => ({ b, t })));
  const href = (path) => `${BASE}${EN ? "/en" : ""}${path}${source ? `?da=${encodeURIComponent(source)}` : ""}`;
  // La stessa pagina nell'altra lingua (link vero, non data-link: la lingua si legge al caricamento).
  const switchHref = () => `${BASE}${EN ? "" : "/en"}${current}${source ? `?da=${encodeURIComponent(source)}` : ""}`;
  // Solo sul Mac le persone senza cal.com hanno orari di esempio: online restano senza orari.
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  const tile = (b) => {
    if (b.tile === "rankwit") return `<span class="tile tile-dark"><img src="assets/brand/rankwit-mark-white.svg" alt=""></span>`;
    if (b.tile === "lab") return `<span class="tile tile-soft"><img src="assets/brand/rankwit-mark-black.svg" alt=""></span>`;
    return `<span class="tile tile-line">${I('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>', 22)}</span>`;
  };

  // Logo del programma in cima al riepilogo: `logo` in config.js vince,
  // il Lab ha il simbolo con il nome, tutto il resto il logo RankWit AI.
  const brandMark = (b) => {
    if (b.logo) return `<img class="sum-logo" src="${esc(b.logo)}" alt="${esc(b.name)}">`;
    if (b.tile === "lab") return `<span class="sum-lab"><img src="assets/brand/rankwit-mark-black.svg" alt="" width="18" height="18">${esc(b.name)}</span>`;
    return `<img class="sum-logo" src="assets/brand/rankwit-ai-black.svg" alt="RankWit AI" width="130" height="20">`;
  };

  const haystack = ({ b, t }) =>
    fold([t.title, t.eyebrow, t.summary, b.name, ...(t.keywords || [])].join(" "));

  /* ---------- orari ---------- */

  const slotCache = new Map();

  // Orari di esempio per chi non ha ancora cal.com: giorni feriali, 9:30-17:30
  // ora italiana, circa metà occupati, sempre gli stessi per la stessa persona.
  function demoSlots(id, duration, from, to, dates) {
    const out = [];
    const step = duration <= 20 ? 20 : 30;
    const minStart = Date.now() + 4 * 3600e3;
    for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 86400e3)) {
      const key = ymd(d);
      const wd = d.getUTCDay();
      if (!dates && (wd === 0 || wd === 6)) continue;
      const offset = tzOffset("Europe/Rome", new Date(`${key}T12:00:00Z`)) === "GMT+2" ? 2 : 1;
      for (let min = 9 * 60 + 30; min + duration <= 17 * 60 + 30; min += step) {
        if (min >= 13 * 60 && min < 14 * 60) continue;
        if (hash(`${id}|${key}|${min}`) % 100 < 48) continue;
        const t = Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10), 0, min) - offset * 3600e3;
        if (t > minStart) out.push(new Date(t).toISOString());
      }
    }
    return out;
  }

  function slotsFor(id, slug, duration, dates) {
    // Gli eventi hanno le loro date; le call normali i prossimi windowDays giorni.
    let from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    let to = new Date(from.getTime() + C.rules.windowDays * 86400e3);
    if (dates) { from = new Date(`${dates[0]}T00:00:00Z`); to = new Date(`${dates[1]}T00:00:00Z`); }
    const key = `${id}|${slug}|${duration}`;
    if (slotCache.has(key)) return slotCache.get(key);
    let job;
    if (isDemo(id)) {
      job = Promise.resolve(LOCAL ? demoSlots(id, duration, from, to, dates) : []);
    } else {
      const q = new URLSearchParams({ username: person(id).cal, eventTypeSlug: slug, start: ymd(from), end: ymd(to), timeZone: "UTC" });
      job = fetch(`${API}/slots?${q}`, { headers: { "cal-api-version": "2024-09-04" } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`cal.com ${r.status}`))))
        .then((j) => Object.values(j.data || {}).flat().map((s) => new Date(s.start).toISOString()))
        .catch((err) => { console.warn(`Orari di ${id} non disponibili`, err); return null; });
    }
    slotCache.set(key, job);
    return job;
  }

  // Unisce gli orari: per ogni inizio, chi è libero.
  async function mergedSlots(ids, slugOf, duration, dates) {
    // Chi non ha un evento per questa durata resta fuori, senza avvisi.
    const lists = await Promise.all(ids.map((id) => {
      const slug = slugOf(id, duration);
      return slug ? slotsFor(id, slug, duration, dates) : Promise.resolve([]);
    }));
    const map = new Map();
    const failed = [];
    lists.forEach((l, i) => {
      if (!l) { failed.push(ids[i]); return; }
      l.forEach((iso) => { if (!map.has(iso)) map.set(iso, []); map.get(iso).push(ids[i]); });
    });
    return { map, failed };
  }

  // Sceglie chi prende la call fra le persone libere, in proporzione al peso.
  // La scelta dipende dall'orario, così lo stesso orario dà sempre la stessa persona.
  function pickHost(iso, free, salt) {
    if (free.length === 1) return free[0];
    const sorted = [...free].sort();
    const total = sorted.reduce((s, id) => s + (person(id).weight || 1), 0);
    let r = (hash(`${salt}|${iso}`) / 4294967296) * total;
    for (const id of sorted) { r -= person(id).weight || 1; if (r < 0) return id; }
    return sorted[sorted.length - 1];
  }

  async function createBooking({ host, slug, iso, tz, name, email, notes, metadata }) {
    if (isDemo(host)) { await wait(700); return { demo: true }; }
    const res = await fetch(`${API}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "cal-api-version": "2024-08-13" },
      body: JSON.stringify({
        start: iso,
        eventTypeSlug: slug,
        username: person(host).cal,
        attendee: { name, email, timeZone: tz, language: LANG },
        bookingFieldsResponses: { notes },
        metadata,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(j?.error?.message || `cal.com ${res.status}`);
      err.taken = /available|booked|conflict|busy/i.test(err.message);
      throw err;
    }
    return j.data || {};
  }

  /* ---------- pezzi comuni ---------- */

  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = () => window.matchMedia("(max-width: 900px)").matches;
  let booker = null; // la prenotazione aperta, per gestire Indietro e Avanti del browser

  function shell(main, right = T.bookACall) {
    app.innerHTML = `
      <header class="site-head">
        <div class="wrap head-in">
          <a class="logo" href="${href("/")}" data-link aria-label="${T.allCallsAria}">
            <img src="assets/brand/rankwit-ai-white.svg" alt="RankWit AI" width="150" height="23">
          </a>
          <span class="head-right">
            <span class="head-meta">${esc(right)}</span>
            <a class="lang-switch" href="${switchHref()}" hreflang="${EN ? "it" : "en"}" lang="${EN ? "it" : "en"}" aria-label="${T.switchAria}">${EN ? "IT" : "EN"}</a>
          </span>
        </div>
      </header>
      <main>${main}</main>
      <p class="sr-only" id="live" aria-live="polite"></p>
      <footer class="site-foot">
        <div class="wrap foot-in">
          <span class="foot-brand"><img src="assets/brand/rankwit-ai-black.svg" alt="${esc(C.site.organisation)}" width="104" height="16"></span>
          <span><a href="${esc(C.site.privacyUrl)}">Privacy</a> · <a href="${esc(C.site.website)}">rankwit.ai</a></span>
        </div>
      </footer>`;
    window.scrollTo(0, 0);
  }

  const free = (inPerson) => T.free || (inPerson ? "gratuito e senza impegno" : "gratuita e senza impegno");

  const callCard = ({ b, t }) => `
    <a class="call" href="${href(`/${b.key}/${t.key}`)}" data-link aria-label="${esc(t.title)}, ${t.duration} ${T.minutes}">
      ${tile(b)}
      <span class="call-body">
        <span class="call-title">${esc(t.title)}${b.example ? ` <span class="tag">${T.example}</span>` : ""}</span>
        <span class="call-sum">${esc(t.summary)}</span>
        <span class="call-dur m-only">${t.duration} min</span>
      </span>
      <span class="call-side"><span class="call-min">${t.duration} min</span><span class="go">${ICON.arrow}</span></span>
    </a>`;

  const genericCall = () => `
    <a class="call" href="${href(`/${C.generic.key}`)}" data-link aria-label="${esc(C.generic.title)}, ${C.generic.duration} ${T.minutes}">
      <span class="tile tile-dark"><img src="assets/brand/rankwit-mark-white.svg" alt=""></span>
      <span class="call-body">
        <span class="call-title">${esc(C.generic.title)}</span>
        <span class="call-sum">${esc(C.generic.summary)}</span>
        <span class="call-dur m-only">${C.generic.duration} min</span>
      </span>
      <span class="call-side"><span class="call-min">${C.generic.duration} min</span><span class="go">${ICON.arrow}</span></span>
    </a>`;

  const durLabel = (id) => { const ds = durationsOf(id); return ds.length > 1 ? `${ds[0]}-${ds[ds.length - 1]}` : ds[0]; };

  const personRow = (id) => {
    const p = person(id);
    return `
    <a class="call" href="${href(`/${id}`)}" data-link aria-label="${T.callWith} ${esc(p.name)}, ${esc(p.role)}">
      ${avatar(id, "tile-av")}
      <span class="call-body">
        <span class="call-title">${T.callWith} ${esc(p.name)}</span>
        <span class="call-role">${esc(p.role)}</span>
        <span class="call-sum">${esc(p.bio)}</span>
      </span>
      <span class="call-side"><span class="call-min">${durLabel(id)} min</span><span class="go">${ICON.arrow}</span></span>
    </a>`;
  };

  const teamCard = (id) => {
    const p = person(id);
    const img = p.portrait || p.photo
      ? `<img class="team-img" src="${esc(p.portrait || p.photo)}" alt="" loading="lazy">`
      : `<span class="team-img ini" aria-hidden="true">${esc(initials(p.name))}</span>`;
    return `
    <a class="team-card" href="${href(`/${id}`)}" data-link aria-label="${T.bookWith} ${esc(p.name)}, ${esc(p.role)}">
      ${img}
      <span class="team-body">
        <span class="team-name">${esc(p.name)}</span>
        <span class="team-role">${esc(p.role)}</span>
        <span class="team-bio">${esc(p.bio)}</span>
        <span class="link">${T.bookACall} ${ICON.arrow}</span>
      </span>
    </a>`;
  };

  const progCard = (b) => {
    const n = b.types.length;
    const foot = n > 1 ? `${n} ${T.callTypes}` : `${esc(b.types[0].title)} · ${b.types[0].duration} min`;
    const head = b.tile === "rankwit"
      ? `<img class="prog-logo" src="assets/brand/rankwit-ai-white.svg" alt="${esc(b.name)}">`
      : `<span class="prog-name">${tile(b)}${esc(b.name)}</span>`;
    return `
    <a class="prog prog-${b.card || "paper"}" href="${href(`/${b.key}`)}" data-link aria-label="${esc(b.name)}, ${foot}">
      ${head}
      <span class="prog-meta">${esc(b.meta)}</span>
      <span class="prog-intro">${esc(b.intro)}</span>
      <span class="prog-foot">${foot} ${ICON.arrow}</span>
    </a>`;
  };

  /* ---------- call generica ---------- */

  const G = C.generic;
  const O = window.RW_ORCHESTRATOR;

  const genericCard = () => `
    <a class="feature" href="${href(`/${G.key}`)}" data-link aria-label="${esc(G.title)}, ${T.chooseTimeLower}">
      <span class="feature-body">
        <span class="feature-title">${esc(G.title)}</span>
        <span class="feature-sum">${esc(G.summary)}</span>
        <span class="feature-facts">${G.duration} ${T.minutes} · Google Meet · ${free(false)}</span>
      </span>
      <span class="btn light">${T.chooseTime} ${ICON.arrow}</span>
    </a>`;

  function renderGeneric() {
    document.title = `${G.title} | RankWit`;
    renderBooking({
      brand: { short: "RankWit" }, title: G.book, name: G.title, lead: G.summary,
      people: G.people, durations: [G.duration], prepare: G.prepare,
      slugOf: (id, d) => slugFor(id, d), topic: G.key, prompt: G.prompt, headMeta: G.title,
      assign: (iso, freeIds) => O.assign(iso, freeIds, G, (id) => person(id)?.weight),
    });
  }

  /* ---------- home ---------- */

  const homeState = { q: "", filter: "all" };

  // Le sezioni fatte solo di esempi (la fiera finta) vanno in fondo, anche nei filtri.
  const navOrder = () => {
    const onlyExample = (n) => n.options.every(([bk]) => brand(bk)?.example);
    return [...C.navigator].sort((a, b) => onlyExample(a) - onlyExample(b));
  };

  function renderHome() {
    document.title = T.homeTitle;
    const ids = Object.keys(C.people);
    shell(`
      <section class="hero-band">
        <div class="wrap hero-grid">
          <div class="hero-copy">
            <h1 class="title display">${T.homeH1}</h1>
            <p class="lead">${T.homeLead}</p>
            <div class="hero-action">
              <a class="btn big" href="${href(`/${G.key}`)}" data-link>${T.bookTeam} ${ICON.arrow}</a>
              <p class="hero-facts">${ICON.ok}<span>${G.duration} ${T.minutes}, ${free(false)}</span></p>
            </div>
          </div>
          <div class="faces-wrap">
            <ul class="faces" aria-label="${T.facesAria}">
              ${ids.map((id) => {
                const p = person(id);
                const img = p.photo
                  ? `<img src="${esc(p.photo)}" alt="" width="160" height="160" decoding="async">`
                  : `<span class="face-ini" aria-hidden="true">${esc(initials(p.name))}</span>`;
                return `<li><a class="face" href="${href(`/${id}`)}" data-link aria-label="${T.bookWith} ${esc(p.name)}, ${esc(p.role)}">${img}<span class="face-name">${esc(p.name)}</span></a></li>`;
              }).join("")}
            </ul>
            <p class="faces-note">${T.facesNote}</p>
          </div>
        </div>
      </section>
      <section class="wrap finder">
        <label class="search">${ICON.search}<input id="q" type="search" placeholder="${T.search}" autocomplete="off" value="${esc(homeState.q)}" aria-label="${T.search}" aria-describedby="list-status"></label>
        <div class="chips" role="group" aria-label="${T.filterAria}">
          <button type="button" class="chip" data-f="all">${T.allCalls}</button>
          ${navOrder().map((n) => `<button type="button" class="chip" data-f="${n.key}">${esc(n.label)}</button>`).join("")}
        </div>
        <p class="sr-only" id="list-status" aria-live="polite"></p>
      </section>
      <section class="wrap" id="list"></section>
      <section class="wrap block" id="team">
        <h2 class="h-sec">${T.teamH2}</h2>
        <div class="team-grid">${ids.map(teamCard).join("")}</div>
      </section>
      <section class="wrap block">
        <h2 class="h-sec">${T.progsH2}</h2>
        <div class="prog-grid">${C.brands.map(progCard).join("")}</div>
      </section>`);

    const input = document.getElementById("q");
    input.addEventListener("input", () => { homeState.q = input.value; drawList(); });
    app.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => { homeState.filter = b.dataset.f; drawList(); }));
    drawList();
  }

  function drawList() {
    const el = document.getElementById("list");
    const status = document.getElementById("list-status");
    app.querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === homeState.filter && !homeState.q.trim())));
    const q = fold(homeState.q.trim());
    if (q) {
      const words = q.split(/\s+/);
      const hits = allTypes.filter((x) => words.every((w) => haystack(x).includes(w)));
      const gHit = words.every((w) => fold([G.title, G.summary, ...(G.keywords || [])].join(" ")).includes(w));
      const ppl = Object.keys(C.people).filter((id) => words.every((w) => fold(`${person(id).name} ${person(id).role} ${person(id).bio}`).includes(w)));
      const n = hits.length + (gHit ? 1 : 0) + ppl.length;
      status.textContent = n ? T.results(n, homeState.q.trim()) : T.noResults(homeState.q.trim());
      el.innerHTML = n
        ? `${hits.length || gHit ? `<h2 class="sec">${T.calls}</h2><div class="calls">${gHit ? genericCall() : ""}${hits.map(callCard).join("")}</div>` : ""}
           ${ppl.length ? `<h2 class="sec">${T.people}</h2><div class="calls">${ppl.map(personRow).join("")}</div>` : ""}`
        : `<div class="empty"><p><strong>${T.noCall(esc(homeState.q.trim()))}</strong></p>
             <p>${T.tryAgain}</p></div>
           <div class="calls">${genericCall()}</div>`;
      return;
    }
    status.textContent = "";
    const all = homeState.filter === "all";
    const seen = new Set();
    el.innerHTML = navOrder()
      .filter((n) => all || n.key === homeState.filter)
      .map((n) => {
        const items = n.options
          .filter(([bk, tk]) => { const k = `${bk}/${tk}`; if (all && seen.has(k)) return false; seen.add(k); return typeOf(bk, tk); })
          .map(([bk, tk]) => ({ b: brand(bk), t: typeOf(bk, tk) }));
        return items.length ? `<h2 class="sec">${esc(n.label)}</h2><div class="calls">${items.map(callCard).join("")}</div>` : "";
      })
      .join("");
  }

  /* ---------- pagina di un programma ---------- */

  function renderBrand(b) {
    if (b.types.length === 1) { history.replaceState(null, "", href(`/${b.key}/${b.types[0].key}`)); return route(); }
    document.title = `${b.name} | RankWit`;
    shell(`
      <section class="hero wrap">
        <h1 class="title">${T.bookACall}</h1>
        <p class="lead">${esc(b.intro)}</p>
      </section>
      <section class="wrap">
        <div class="type-grid">
          ${b.types.map((t) => `
            <a class="type" href="${href(`/${b.key}/${t.key}`)}" data-link aria-label="${esc(t.title)}, ${t.duration} ${T.minutes}">
              <span class="type-title">${esc(t.title)}</span>
              <span class="type-sum">${esc(t.summary)}</span>
              <span class="type-foot"><span>${t.duration} ${T.minutes} · ${t.inPerson ? T.inPerson : "Google Meet"}</span><span class="link">${T.chooseTime} ${ICON.arrow}</span></span>
            </a>`).join("")}
        </div>
      </section>`, b.tile === "rankwit" ? T.bookACall : b.name);
  }

  /* ---------- prenotazione ---------- */

  function renderBooking(spec) {
    // spec: { brand, title, name, lead, people, durations, duration, slugOf, topic,
    //         prompt, prepare, dates, inPerson, place, placeName, timeZone, hero,
    //         headMeta, assign (chi prende l'orario), personal (pagina di una persona) }
    const st = { duration: spec.duration || spec.durations[0], step: "pick", day: null, slot: null, host: null, month: null, data: null, err: "", values: prefillValues() };
    const tz = () => spec.timeZone || userTz;
    const zoneText = (d) => (spec.timeZone ? T.tzFair : tzLabel(tz(), d));

    shell(`
      ${spec.hero || `
      <section class="hero wrap">
        <h1 class="title">${esc(spec.title)}</h1>
        ${spec.lead ? `<p class="lead">${esc(spec.lead)}</p>` : ""}
      </section>`}
      <section class="wrap">
        <div class="booker">
          <aside class="summary" id="summary"></aside>
          <div class="panel" id="panel"></div>
        </div>
      </section>`, spec.headMeta);

    const summary = document.getElementById("summary");
    const panel = document.getElementById("panel");
    const heroTitle = app.querySelector(".hero .title");
    const heroText = heroTitle?.textContent;

    const whenText = () => {
      const s = new Date(st.slot);
      const e = new Date(s.getTime() + st.duration * 60e3);
      return {
        day: cap(fmtDay(dayKey(s, tz()), { weekday: "long", day: "numeric", month: "long" })),
        dayYear: cap(fmtDay(dayKey(s, tz()), { weekday: "long", day: "numeric", month: "long", year: "numeric" })),
        range: T.range(fmtTime(s, tz()), fmtTime(e, tz())),
        zone: `${zoneText(s)} (${tzOffset(tz(), s)})`,
      };
    };

    function drawSummary() {
      // Chi fa la call si vede solo nelle pagine personali; altrove lo dice l'invito.
      const hosts = spec.personal
        ? `<div class="host">${avatar(spec.people[0])}<span><strong>${esc(person(spec.people[0]).name)}</strong><span>${esc(person(spec.people[0]).role)}</span></span></div>`
        : "";
      const choose = spec.durations.length > 1 && st.step === "pick";
      const w = st.slot ? whenText() : null;
      summary.innerHTML = `
        ${brandMark(spec.brand)}
        <h2 class="h2">${esc(spec.name)}</h2>
        ${choose
          ? `<div class="durs" role="group" aria-label="${T.duration}">${spec.durations.map((d) => `<button type="button" class="dur" data-d="${d}" aria-pressed="${d === st.duration}">${d} min</button>`).join("")}</div>`
          : ""}
        <ul class="facts">
          ${choose ? "" : `<li>${ICON.clock}<span>${st.duration} ${T.minutes}</span></li>`}
          ${spec.inPerson
            ? `<li>${ICON.pin}<span>${T.inPersonCap}, ${esc(spec.place)}${spec.placeName ? ` · ${esc(spec.placeName)}` : ""}</span></li>`
            : `<li>${ICON.video}<span>${T.meetLink}</span></li>`}
          <li>${ICON.ok}<span>${cap(free(spec.inPerson))}</span></li>
        </ul>
        ${hosts}
        ${w ? `<div class="chosen"><strong>${esc(w.dayYear)}</strong><span>${esc(w.range)} · ${esc(w.zone)}</span></div>` : ""}
        ${st.step === "done" ? "" : `
        <div class="share">
          <button type="button" class="share-btn" data-copy>${ICON.link}<span>${T.copyLink}</span></button>
          ${navigator.share ? `<button type="button" class="share-btn" data-share>${ICON.share}<span>${T.share}</span></button>` : ""}
        </div>`}`;
      const shareText = spec.personal
        ? T.bookWithOf(person(spec.people[0]).name, C.site.organisation)
        : `${spec.name}, ${C.site.organisation}`;
      summary.querySelector("[data-copy]")?.addEventListener("click", async (ev) => {
        const btn = ev.currentTarget;
        flash(btn, (await copyText(pageUrl())) ? T.copied : T.copyFail);
      });
      summary.querySelector("[data-share]")?.addEventListener("click", (ev) =>
        shareOrCopy(ev.currentTarget, { title: document.title, text: shareText, url: pageUrl() }, T.copied));
      summary.querySelectorAll(".dur").forEach((b) =>
        b.addEventListener("click", () => { st.duration = Number(b.dataset.d); st.slot = null; st.host = null; drawSummary(); load(b.dataset.d); }));
    }

    const panelHead = (title, step) =>
      `<div class="panel-head"><h2 class="h2" tabindex="-1">${title}</h2>${step ? `<span class="step-of">${T.stepOf(step)}</span>` : ""}</div>`;

    async function load(refocusDur) {
      panel.innerHTML = `${panelHead(T.chooseTime, 1)}<div class="loading" role="status"><span class="spin" aria-hidden="true"></span>${T.loading}</div>`;
      st.data = await mergedSlots(spec.people, spec.slugOf, st.duration, spec.dates);
      computeDays();
      st.day = st.days[0] || null;
      const first = st.day || ymd(new Date());
      st.month = [+first.slice(0, 4), +first.slice(5, 7) - 1];
      drawPick();
      if (refocusDur) summary.querySelector(`.dur[data-d="${refocusDur}"]`)?.focus();
    }

    function computeDays() {
      st.days = [...new Set([...st.data.map.keys()].map((iso) => dayKey(new Date(iso), tz())))].sort();
    }

    function tzLine() {
      const off = tzOffset(tz());
      const timesIn = (label) => `${T.timesIn}${EN ? " " : ""}<strong>${label}</strong>`;
      if (spec.timeZone) return `<div class="tz"><p class="tz-line">${ICON.globe}<span>${timesIn(T.tzFair)} <span class="tz-off">${esc(off)}</span></span></p></div>`;
      return `<div class="tz">
        <p class="tz-line">${ICON.globe}<span>${timesIn(esc(tzLabel(userTz)))} <span class="tz-off">${esc(off)}</span></span></p>
        <p class="tz-sub"><span class="quiet">${tzAuto && !st.tzChanged ? T.auto : T.byYou}</span> <button type="button" class="tz-change" id="tz-change" aria-expanded="false" aria-controls="tz-pick">${T.change}</button></p>
        <label class="tz-pick" id="tz-pick" hidden><span class="sr-only">${T.timeZone}</span><select id="tz-select">${tzOptions()}</select></label>
      </div>`;
    }

    function tzOptions() {
      let zones = [];
      try { zones = Intl.supportedValuesOf("timeZone"); } catch { zones = ["Europe/Rome", "Europe/London", "Europe/Berlin", "America/New_York", "UTC"]; }
      if (!zones.includes(userTz)) zones = [userTz, ...zones];
      return zones.map((z) => `<option value="${esc(z)}"${z === userTz ? " selected" : ""}>${esc(z.replace(/_/g, " "))}</option>`).join("");
    }

    function setDay(key) {
      st.day = key; st.slot = null; st.host = null;
      st.month = [+key.slice(0, 4), +key.slice(5, 7) - 1];
      drawSummary(); drawPick();
    }

    // focus: dove rimettere il fuoco dopo aver ridisegnato ("day", "slot", "next", "mo:-1", "mo:1")
    function drawPick(focus) {
      st.step = "pick";
      // Scorrimento della lista degli orari prima del ridisegno, da rimettere se il giorno è lo stesso.
      const prevList = panel.querySelector(".slot-list");
      const keepScroll = prevList && panel.querySelector(".day-name")?.dataset.day === st.day ? prevList.scrollTop : 0;
      const { map, failed } = st.data;
      if (!map.size) {
        panel.innerHTML = `${panelHead(T.chooseTime, 1)}<div class="empty"><p><strong>${spec.dates ? T.noneThoseDays : T.noneNext(C.rules.windowDays)}</strong></p>
          <p>${T.writeUs(esc(C.site.contact))}</p></div>`;
        return;
      }
      const [y, m] = st.month;
      const lead = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;
      const daysIn = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const open = new Set(st.days);
      const today = dayKey(new Date(), tz());
      const tabDay = open.has(st.day) && st.day.startsWith(`${y}-${String(m + 1).padStart(2, "0")}`) ? st.day : st.days.find((k) => k.startsWith(`${y}-${String(m + 1).padStart(2, "0")}`));
      let cells = "";
      for (let i = 0; i < lead; i++) cells += `<span class="day pad" aria-hidden="true"></span>`;
      for (let d = 1; d <= daysIn; d++) {
        const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const cls = `day${open.has(key) ? " open" : ""}${key === st.day ? " sel" : ""}${key === today ? " today" : ""}`;
        cells += open.has(key)
          ? `<button type="button" class="${cls}" data-day="${key}" aria-pressed="${key === st.day}" tabindex="${key === tabDay ? 0 : -1}" aria-label="${esc(fmtDay(key, { weekday: "long", day: "numeric", month: "long" }))}${key === today ? T.today : ""}">${d}</button>`
          : `<span class="${cls}">${d}</span>`;
      }
      const months = [...new Set(st.days.map((k) => k.slice(0, 7)))];
      const idx = months.indexOf(`${y}-${String(m + 1).padStart(2, "0")}`);
      const times = [...map.entries()].filter(([iso]) => dayKey(new Date(iso), tz()) === st.day).sort(([a], [b]) => (a < b ? -1 : 1));

      panel.innerHTML = `
        ${panelHead(T.chooseTime, 1)}
        <div class="picker">
          <div class="cal">
            <div class="cal-head">
              <button type="button" class="nav-btn" data-mo="-1" ${idx <= 0 ? "disabled" : ""} aria-label="${T.prevMonth}">${ICON.left}</button>
              <span class="month" aria-live="polite">${esc(fmtMonth(y, m))}</span>
              <button type="button" class="nav-btn" data-mo="1" ${idx < 0 || idx >= months.length - 1 ? "disabled" : ""} aria-label="${T.nextMonth}">${ICON.right}</button>
            </div>
            <div class="cal-grid" role="group" aria-label="${T.gridAria}">${T.dow.map((w) => `<span class="dow" aria-hidden="true">${w}</span>`).join("")}${cells}</div>
            ${tzLine()}
          </div>
          <div class="times" id="times">
            <p class="day-name" data-day="${esc(st.day || "")}">${st.day ? esc(cap(fmtDay(st.day, { weekday: "long", day: "numeric", month: "long" }))) : ""}</p>
            <div class="slot-list" role="group" aria-label="${T.freeTimes}">
              ${times.map(([iso, freeIds]) => `
                <div class="slot-row${iso === st.slot ? " sel" : ""}">
                  <button type="button" class="slot" data-slot="${iso}" data-free="${freeIds.join(",")}" aria-pressed="${iso === st.slot}">${fmtTime(new Date(iso), tz())}</button>
                  ${iso === st.slot ? `<button type="button" class="btn" data-next>${T.next}</button>` : ""}
                </div>`).join("")}
            </div>
          </div>
        </div>
        ${failed.length ? `<p class="warn">${T.cantRead(esc(list(failed, T.and)))}</p>` : ""}`;

      panel.querySelectorAll("[data-day]").forEach((b) => b.addEventListener("click", () => {
        setDay(b.dataset.day);
        focusAfter("day");
        // Su telefono gli orari stanno sotto il calendario: portali in vista.
        if (narrow()) document.getElementById("times")?.scrollIntoView({ block: "start", behavior: reduceMotion() ? "auto" : "smooth" });
      }));
      panel.querySelector(".cal-grid").addEventListener("keydown", (e) => {
        const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        const cur = e.target.closest("[data-day]");
        if (!cur || !(e.key in steps || e.key === "Home" || e.key === "End")) return;
        e.preventDefault();
        let target = null;
        if (e.key === "Home") target = st.days[0];
        else if (e.key === "End") target = st.days[st.days.length - 1];
        else {
          const base = keyDate(cur.dataset.day).getTime();
          for (let i = 1; i <= 62 && !target; i++) {
            const k = ymd(new Date(base + steps[e.key] * i * 86400e3));
            if (st.days.includes(k)) target = k;
          }
        }
        if (target) { setDay(target); focusAfter("day"); }
      });
      panel.querySelectorAll("[data-mo]").forEach((b) =>
        b.addEventListener("click", () => {
          const next = months[idx + Number(b.dataset.mo)];
          if (!next) return;
          st.month = [+next.slice(0, 4), +next.slice(5, 7) - 1];
          st.day = st.days.find((k) => k.startsWith(next)) || st.day;
          st.slot = null; st.host = null;
          drawSummary(); drawPick();
          focusAfter(`mo:${b.dataset.mo}`);
        }));
      const goNext = () => {
        history.pushState({ rw: "dati" }, "", `${location.pathname}${location.search}#dati`);
        drawForm();
      };
      panel.querySelectorAll(".slot").forEach((b) =>
        b.addEventListener("click", () => {
          st.slot = b.dataset.slot;
          const freeIds = b.dataset.free.split(",");
          st.host = spec.assign ? spec.assign(st.slot, freeIds) : pickHost(st.slot, freeIds, spec.topic);
          drawSummary();
          // Si aggiorna solo la riga scelta: ridisegnare tutto il pannello riportava
          // la lista degli orari in cima, e l'orario appena scelto spariva dalla vista.
          panel.querySelectorAll(".slot-row").forEach((row) => {
            row.classList.remove("sel");
            row.querySelector(".slot").setAttribute("aria-pressed", "false");
            row.querySelector("[data-next]")?.remove();
          });
          const row = b.closest(".slot-row");
          row.classList.add("sel");
          b.setAttribute("aria-pressed", "true");
          row.insertAdjacentHTML("beforeend", `<button type="button" class="btn" data-next>${T.next}</button>`);
          row.querySelector("[data-next]").addEventListener("click", goNext);
          keepInView(row);
          focusAfter("next");
        }));
      panel.querySelector("[data-next]")?.addEventListener("click", goNext);
      const listEl = panel.querySelector(".slot-list");
      if (listEl) {
        listEl.scrollTop = keepScroll;
        keepInView(listEl.querySelector(".slot-row.sel"));
      }
      const change = document.getElementById("tz-change");
      if (change) {
        change.addEventListener("click", () => {
          const pick = document.getElementById("tz-pick");
          pick.hidden = !pick.hidden;
          change.setAttribute("aria-expanded", String(!pick.hidden));
          if (!pick.hidden) document.getElementById("tz-select").focus();
        });
        document.getElementById("tz-select").addEventListener("change", (e) => {
          userTz = e.target.value; st.tzChanged = true; store.set("rw-meet-tz", userTz);
          computeDays();
          if (!st.days.includes(st.day)) st.day = st.days[0];
          st.slot = null; st.host = null;
          drawSummary(); drawPick();
          document.getElementById("tz-change")?.focus();
        });
      }
      if (focus) focusAfter(focus);
    }

    // Tiene una riga dentro la parte visibile della lista degli orari, senza muovere la pagina.
    function keepInView(row) {
      const listEl = row?.closest(".slot-list");
      if (!listEl || listEl.scrollHeight <= listEl.clientHeight) return;
      const top = row.getBoundingClientRect().top - listEl.getBoundingClientRect().top + listEl.scrollTop;
      if (top < listEl.scrollTop) listEl.scrollTop = top;
      else if (top + row.offsetHeight > listEl.scrollTop + listEl.clientHeight) listEl.scrollTop = top + row.offsetHeight - listEl.clientHeight;
    }

    function focusAfter(what) {
      const pick = {
        day: () => panel.querySelector(".day.sel"),
        slot: () => panel.querySelector('.slot[aria-pressed="true"]') || panel.querySelector(".day.sel"),
        next: () => panel.querySelector("[data-next]"),
        "mo:-1": () => (panel.querySelector('[data-mo="-1"]:not(:disabled)') || panel.querySelector(".day.sel")),
        "mo:1": () => (panel.querySelector('[data-mo="1"]:not(:disabled)') || panel.querySelector(".day.sel")),
      }[what];
      pick?.()?.focus({ preventScroll: true });
    }

    // Torna agli orari tenendo quello che è stato scritto nel modulo.
    function backToPick() {
      st.err = "";
      drawSummary();
      drawPick("slot");
    }

    function drawForm() {
      st.step = "form";
      drawSummary();
      const values = st.values;
      const v = (k) => esc(values[k] || "");
      panel.innerHTML = `
        <button type="button" class="back" id="back">${ICON.back} ${T.changeTime}</button>
        ${panelHead(T.yourDetails, 2)}
        <form class="form" novalidate>
          <div class="row2">
            <div class="field"><label for="f-name">${T.fullName}</label><input id="f-name" name="name" autocomplete="name" required value="${v("name")}"></div>
            <div class="field"><label for="f-email">${T.email}</label><input id="f-email" name="email" type="email" inputmode="email" autocomplete="email" required value="${v("email")}"></div>
          </div>
          <div class="row2">
            <div class="field"><label for="f-org">${T.org}</label><input id="f-org" name="organisation" autocomplete="organization" required value="${v("organisation")}"></div>
            <div class="field"><label for="f-role">${T.role} <span class="opt">${T.optional}</span></label><input id="f-role" name="role" autocomplete="organization-title" value="${v("role")}"></div>
          </div>
          <div class="field"><label for="f-notes">${esc(spec.prompt)}</label><textarea id="f-notes" name="notes" required>${v("notes")}</textarea></div>
          <label class="check"><input type="checkbox" name="newsletter"${values.newsletter ? " checked" : ""}><span>${esc(C.site.newsletterLabel)}</span></label>
          <div class="hp" hidden aria-hidden="true"><label>${T.leaveEmpty}<input name="extra_field" tabindex="-1" autocomplete="off"></label></div>
          ${st.err ? `<p class="form-err" role="alert">${esc(st.err)}</p>` : ""}
          <div class="actions">
            <button class="btn" type="submit">${T.confirm}</button>
            <span class="free">${ICON.ok}${st.duration} ${T.minutes}, ${free(spec.inPerson)}</span>
          </div>
          <p class="fine">${T.fine(esc(C.site.privacyUrl))}</p>
        </form>`;
      panel.querySelector(".h2").focus({ preventScroll: true });
      if (narrow()) panel.scrollIntoView({ block: "start", behavior: reduceMotion() ? "auto" : "smooth" });
      const form = panel.querySelector("form");
      form.addEventListener("input", () => {
        const d = Object.fromEntries(new FormData(form).entries());
        st.values = { name: d.name, email: d.email, organisation: d.organisation, role: d.role, notes: d.notes, newsletter: !!d.newsletter };
      });
      document.getElementById("back").addEventListener("click", () => {
        if (history.state?.rw === "dati") history.back(); // il popstate riporta agli orari
        else backToPick();
      });
      form.addEventListener("submit", submit);
    }

    async function submit(ev) {
      ev.preventDefault();
      const form = ev.target;
      const data = Object.fromEntries(new FormData(form).entries());
      form.querySelectorAll(".field").forEach((f) => {
        f.classList.remove("bad");
        f.querySelector(".msg")?.remove();
        f.querySelector("input, textarea")?.removeAttribute("aria-invalid");
        f.querySelector("input, textarea")?.removeAttribute("aria-describedby");
      });
      const bad = [];
      const mark = (name, msg) => {
        const input = form.querySelector(`[name="${name}"]`);
        const f = input.closest(".field");
        f.classList.add("bad");
        f.insertAdjacentHTML("beforeend", `<span class="msg" id="${input.id}-msg">${msg}</span>`);
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", `${input.id}-msg`);
        bad.push(name);
      };
      const email = (data.email || "").trim();
      if (!data.name?.trim()) mark("name", T.vName);
      if (!email) mark("email", T.vEmail);
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) mark("email", T.vEmailBad);
      if (!data.organisation?.trim()) mark("organisation", T.vOrg);
      if (!data.notes?.trim()) mark("notes", T.vNotes);
      if (bad.length) { form.querySelector(`[name="${bad[0]}"]`).focus(); return; }

      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = `<span class="spin light" aria-hidden="true"></span>${T.confirming}`;
      const slug = spec.slugOf(st.host, st.duration);
      const notes = `${spec.prompt}\n${data.notes.trim()}\n\n${data.organisation.trim()}${data.role?.trim() ? ` · ${data.role.trim()}` : ""}`;
      const metadata = { tema: spec.topic, fonte: "book.rankwit.ai", lingua: LANG, organizzazione: data.organisation.trim().slice(0, 500) };
      if (data.role?.trim()) metadata.ruolo = data.role.trim().slice(0, 500);
      if (data.newsletter) metadata.newsletter = "si";
      if (source) metadata.provenienza = source.slice(0, 100);

      try {
        // campo trappola per i bot: se è pieno fingiamo che sia andata
        const res = data.extra_field ? { demo: true } : await createBooking({ host: st.host, slug, iso: st.slot, tz: tz(), name: data.name.trim(), email, notes, metadata });
        st.err = "";
        drawDone(data, res);
      } catch (err) {
        console.warn(err);
        if (err.taken) {
          slotCache.clear();
          st.err = "";
          st.slot = null; st.host = null;
          if (history.state?.rw === "dati") history.replaceState(null, "", `${location.pathname}${location.search}`);
          await load();
          panel.insertAdjacentHTML("afterbegin", `<p class="form-err" role="alert">${T.taken}</p>`);
          drawSummary();
          return;
        }
        st.err = T.failed(C.site.contact);
        drawForm();
      }
    }

    function drawDone(data, res) {
      st.step = "done";
      history.replaceState(null, "", `${location.pathname}${location.search}`);
      drawSummary();
      const host = person(st.host);
      const w = whenText();
      if (heroTitle) heroTitle.textContent = T.confirmed;
      panel.innerHTML = `
        <div class="done">
          <span class="done-icon" aria-hidden="true">${ICON.check}</span>
          <h2 class="h2" tabindex="-1">${spec.inPerson ? T.seeYouStand : T.talkSoon}</h2>
          <p class="done-when"><strong>${esc(w.day)}, ${esc(w.range)}</strong> <span>${esc(w.zone)}</span></p>
          <p>${spec.inPerson
            ? T.inviteVenue(esc(data.email))
            : spec.personal
              ? T.inviteWith(esc(host.name), esc(data.email))
              : T.invite(esc(data.email))}</p>
          ${spec.prepare ? `<p>${esc(spec.prepare)}</p>` : ""}
          <p class="quiet">${T.moveCancel}</p>
          ${res.demo ? `<p class="demo-note">${T.demoNote(spec.personal ? esc(host.name) : T.theHost)}</p>` : ""}
          ${spec.inPerson ? "" : `
          <div class="done-share">
            <p class="done-share-text">${T.shareColleague}</p>
            <div class="done-share-btns">
              <button type="button" class="btn" data-share-done>${ICON.share}<span>${T.shareBtn}</span></button>
              <button type="button" class="btn ghost" data-ics>${ICON.cal}<span>${T.icsBtn}</span></button>
            </div>
          </div>`}
          <a class="btn ghost" href="${href("/")}" data-link>${T.backAll}</a>
        </div>`;
      if (!spec.inPerson) {
        // Il link Meet arriva da cal.com nella risposta, se Google l'ha già creato.
        const meet = [res.meetingUrl, res.location].find((u) => /^https:\/\/meet\.google\.com\//.test(u || "")) || "";
        const title = spec.personal ? T.callWithOf(host.name, C.site.organisation) : `${spec.name}, ${C.site.organisation}`;
        const lines = [title, `${w.day}, ${w.range}, ${w.zone}`, meet ? `Google Meet ${meet}` : T.meetInInvite];
        const ics = () => icsFile({ start: st.slot, minutes: st.duration, title, details: lines.slice(1).join("\n"), url: meet });
        panel.querySelector("[data-share-done]").addEventListener("click", async (ev) => {
          const btn = ev.currentTarget;
          const file = ics();
          const data = { title, text: lines.join("\n") };
          if (navigator.canShare?.({ files: [file] })) {
            try { await navigator.share({ ...data, files: [file] }); return; } catch (e) { if (e.name === "AbortError") return; }
          }
          shareOrCopy(btn, data, T.detailsCopied);
        });
        panel.querySelector("[data-ics]").addEventListener("click", () => {
          const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(ics()), download: "call-rankwit.ics" });
          document.body.append(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        });
      }
      panel.querySelector(".h2").focus({ preventScroll: true });
      if (narrow()) panel.scrollIntoView({ block: "start", behavior: reduceMotion() ? "auto" : "smooth" });
    }

    // Indietro e Avanti del browser fra orario e dati, senza uscire dalla pagina.
    booker = {
      onPop() {
        if (st.step === "form" && location.hash !== "#dati") { backToPick(); return true; }
        if (st.step === "pick" && location.hash === "#dati" && st.slot) { drawForm(); return true; }
        return false;
      },
    };

    drawSummary();
    load();
  }

  /* ---------- pagine ---------- */

  // Evento cal.com di una persona per una durata (o per un evento speciale
  // come «fiera»). Chi è in prova usa gli slug di esempio; chi ha cal.com solo
  // gli eventi che ha davvero, altrimenti null.
  const slugFor = (id, d, special) => {
    if (isDemo(id)) return special || C.slugs[d] || `call-${d}`;
    const ev = person(id).events || {};
    return (special ? ev[special] : ev[d]) || null;
  };
  const durationsOf = (id) => {
    if (isDemo(id)) return C.personalDurations;
    const ds = Object.keys(person(id).events || {}).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
    return ds.length ? ds : C.personalDurations;
  };

  function renderType(b, t) {
    document.title = `${t.title} | RankWit`;
    renderBooking({
      brand: b, title: t.book, name: t.title, lead: t.summary,
      people: t.people, durations: [t.duration], prepare: t.prepare,
      slugOf: (id, d) => slugFor(id, d, t.slug), topic: `${b.key}/${t.key}`, prompt: t.prompt,
      dates: t.dates, inPerson: t.inPerson, place: t.place, placeName: b.example || !b.logo ? b.name : "",
      timeZone: t.timeZone, headMeta: b.tile === "rankwit" ? T.bookACall : b.name,
    });
  }

  function renderPerson(id) {
    const p = person(id);
    const ds = durationsOf(id);
    document.title = T.personTitle(p.name);
    const img = p.portrait || p.photo
      ? `<img class="portrait" src="${esc(p.portrait || p.photo)}" alt="">`
      : `<span class="portrait ini" aria-hidden="true">${esc(initials(p.name))}</span>`;
    renderBooking({
      brand: { short: "RankWit" }, name: `${T.callWith} ${p.name}`, people: [id], personal: true,
      durations: ds, duration: ds.includes(C.personalDefault) ? C.personalDefault : ds[0],
      slugOf: (pid, d) => slugFor(pid, d), topic: `persona/${id}`, prompt: T.personPrompt,
      prepare: T.personPrepare,
      headMeta: T.bookACall,
      hero: `
        <section class="hero wrap person-hero">
          ${img}
          <div class="person-text">
            <h1 class="title">${T.bookWith} ${esc(p.name)}</h1>
            <p class="person-role">${esc(p.role)}</p>
            <p class="lead">${esc(p.bio)} ${T.personLead}</p>
            <p class="url">${ICON.globe}<span>book.rankwit.ai/${EN ? "en/" : ""}${esc(id)}</span></p>
          </div>
        </section>`,
    });
  }

  function renderNotFound() {
    document.title = T.nfTitle;
    shell(`<section class="hero wrap"><h1 class="title">${T.nfH1}</h1>
      <p class="lead">${T.nfLead}</p>
      <p class="hero-cta"><a class="btn" href="${href("/")}" data-link>${T.nfBtn}</a></p></section>`);
  }

  /* ---------- router ---------- */

  function route() {
    booker = null;
    if (location.hash === "#dati") history.replaceState(null, "", `${location.pathname}${location.search}`);
    // Un indirizzo malformato (per esempio /%E0%A4%A) non deve lasciare la pagina bianca.
    let decoded;
    try { decoded = decodeURIComponent(routePath()); } catch (e) { current = "/"; return renderNotFound(); }
    const parts = decoded.replace(/\/+$/, "").split("/").filter(Boolean).map((s) => s.toLowerCase());
    if (parts[0] === "en") parts.shift(); // la lingua è già stata letta al caricamento
    if (parts[parts.length - 1] === "index.html") parts.pop();
    current = `/${parts.join("/")}`;
    if (!parts.length) return renderHome();
    const [a, b] = parts;
    if (parts.length === 1 && C.people[a]) return renderPerson(a);
    if (parts.length === 1 && a === G.key) return renderGeneric();
    const br = brand(a);
    if (br && parts.length === 1) return renderBrand(br);
    if (br && parts.length === 2) { const t = typeOf(a, b); if (t) return renderType(br, t); }
    return renderNotFound();
  }

  document.addEventListener("click", (ev) => {
    const a = ev.target.closest("a[data-link]");
    if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
    ev.preventDefault();
    history.pushState(null, "", a.getAttribute("href"));
    route();
  });
  window.addEventListener("popstate", () => { if (booker?.onPop()) return; route(); });
  route();
})();
