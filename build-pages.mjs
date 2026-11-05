// Crea una pagina HTML vera per ogni indirizzo del sito, in italiano (team.html,
// marta.html, rankwit/demo.html...) e in inglese (en/team.html, en/marta.html...),
// più sitemap.xml, robots.txt e 404.html.
// Serve ai motori di ricerca e agli assistenti AI: ogni indirizzo risponde 200
// e ha già nel codice titolo, descrizione e testo, anche senza JavaScript.
// La pagina poi si costruisce come sempre con app.js, che legge la lingua
// dall'indirizzo (/en/...).
//
// Si lancia dalla cartella del sito dopo ogni modifica a config.js:
//   node build-pages.mjs

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const sandbox = { window: {} };
vm.runInNewContext(read("config.js"), sandbox);
const RAW = sandbox.window.RW_BOOK;
const localize = sandbox.window.RW_LOCALIZE;
const SITE = RAW.site.url.replace(/\/$/, "");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Il modello è index.html: si cambiano solo testa e contenuto di #app.
const template = read("index.html")
  .replace(/\n  <!-- seo -->[\s\S]*?<!-- \/seo -->/, "")
  .replace(/<div id="app">[\s\S]*?<\/div>\n  <noscript>/, '<div id="app"></div>\n  <noscript>')
  .replace(/<noscript><p style="padding:24px">[^<]*<\/p><\/noscript>/, "<noscript><p style=\"padding:24px\">NOSCRIPT</p></noscript>");

// Testi fissi delle pagine statiche, per lingua. Quelli delle call, delle
// persone e dei programmi vengono da config.js (campi `_en` per l'inglese).
const TEXT = {
  it: {
    prefix: "", locale: "it_IT",
    noscript: "Per prenotare serve JavaScript. Puoi scriverci a info@rankwit.ai.",
    navAria: "Tutte le call", callWith: "Call con",
    homeTitle: "Prenota una call · RankWit AI",
    homeDesc: "Scegli il tema o la persona e prenota una call con il team RankWit AI su Google Meet.",
    homeH1: "Di cosa vuoi parlare?",
    homeLead: (G) => `${G.summary} ${G.duration} minuti, gratuita e senza impegno.`,
    bookACall: "Prenota una call",
    typeLead: (t) => `${t.summary} ${t.duration} minuti su Google Meet, gratuita e senza impegno.`,
    personTitle: (p) => `Prenota una call con ${p.name} · RankWit Meet`,
    personDesc: (p, org) => `${p.bio} Prenota una call con ${p.name}, ${p.role} di ${org}, su Google Meet.`,
    personH1: (p) => `Prenota una call con ${p.name}`,
    personLead: (p) => `${p.bio} Ci sentiamo su Google Meet, nel giorno e all'ora che preferisci.`,
  },
  en: {
    prefix: "/en", locale: "en_US",
    noscript: "JavaScript is needed to book. You can write to us at info@rankwit.ai.",
    navAria: "All calls", callWith: "Call with",
    homeTitle: "Book a call · RankWit AI",
    homeDesc: "Choose a topic or a person and book a call with the RankWit AI team on Google Meet.",
    homeH1: "What would you like to talk about?",
    homeLead: (G) => `${G.summary} ${G.duration} minutes, free and with no commitment.`,
    bookACall: "Book a call",
    typeLead: (t) => `${t.summary} ${t.duration} minutes on Google Meet, free and with no commitment.`,
    personTitle: (p) => `Book a call with ${p.name} · RankWit Meet`,
    personDesc: (p, org) => `${p.bio} Book a call with ${p.name}, ${p.role} at ${org}, on Google Meet.`,
    personH1: (p) => `Book a call with ${p.name}`,
    personLead: (p) => `${p.bio} We meet on Google Meet, on the day and at the time you prefer.`,
  },
};

// Ogni call deve avere almeno una persona con cal.com e un evento della sua durata,
// altrimenti online non mostra orari.
const bookable = (ids, d, slug) => ids.filter((id) => RAW.people[id]?.cal && RAW.people[id].events?.[slug || d]);
const missing = [
  ...(bookable(RAW.generic.people, RAW.generic.duration).length ? [] : [RAW.generic.title]),
  ...RAW.brands.filter((b) => !b.example).flatMap((b) => b.types.filter((t) => !bookable(t.people, t.duration, t.slug).length).map((t) => `${t.title} (${t.duration} min)`)),
];
if (missing.length) console.warn(`ATTENZIONE, queste call non hanno nessuno prenotabile:\n- ${missing.join("\n- ")}`);

const pages = [];
const written = [];
const write = (rel, html) => {
  const f = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
  written.push(rel);
};

for (const lang of ["it", "en"]) {
  const C = localize(RAW, lang);
  const W = TEXT[lang];
  const G = C.generic;
  const abs = (p) => `${SITE}${W.prefix}${p === "/" ? "/" : p}`;
  const absIn = (l, p) => `${SITE}${TEXT[l].prefix}${p === "/" ? "/" : p}`;
  const people = Object.entries(C.people);
  const realBrands = C.brands.filter((b) => !b.example);
  const calls = realBrands.flatMap((b) => b.types.map((t) => ({ b, t })));

  // Elenco di tutte le pagine, uguale ovunque: aiuta chi legge senza JavaScript.
  const allLinks = () => `
      <nav class="wrap static-nav" aria-label="${W.navAria}">
        <ul>
          <li><a href="${abs(`/${G.key}`)}">${esc(G.title)}</a></li>
          ${calls.map(({ b, t }) => `<li><a href="${abs(`/${b.key}/${t.key}`)}">${esc(t.title)}</a></li>`).join("\n          ")}
          ${people.map(([id, p]) => `<li><a href="${abs(`/${id}`)}">${W.callWith} ${esc(p.name)}, ${esc(p.role)}</a></li>`).join("\n          ")}
        </ul>
      </nav>`;

  const body = (h1, lead, extra = "") => `
    <main>
      <section class="hero wrap">
        <h1 class="title">${esc(h1)}</h1>
        <p class="lead">${esc(lead)}</p>${extra}
      </section>${allLinks()}
    </main>
  `;

  const add = (route, o) => pages.push({ lang, route, ...o });

  add("/", { title: W.homeTitle, desc: W.homeDesc, h1: W.homeH1, lead: W.homeLead(G) });
  add(`/${G.key}`, { title: `${G.title} · RankWit Meet`, desc: G.summary, h1: G.book, lead: G.summary });

  for (const b of realBrands) {
    if (b.types.length === 1) {
      // La pagina del programma porta subito all'unica call: in sitemap va solo quella.
      const t = b.types[0];
      add(`/${b.key}`, { title: `${b.name} · RankWit Meet`, desc: b.intro, h1: b.name, lead: b.intro, canonical: `/${b.key}/${t.key}`, sitemap: false });
    } else {
      add(`/${b.key}`, { title: `${b.name} · RankWit Meet`, desc: b.intro, h1: W.bookACall, lead: b.intro });
    }
    for (const t of b.types) {
      add(`/${b.key}/${t.key}`, { title: `${t.title} · RankWit Meet`, desc: t.summary, h1: t.book || t.title, lead: W.typeLead(t) });
    }
  }

  for (const [id, p] of people) {
    add(`/${id}`, {
      title: W.personTitle(p), desc: W.personDesc(p, C.site.organisation),
      h1: W.personH1(p), lead: W.personLead(p), image: p.portrait || p.photo,
      extra: `\n        <p class="person-role">${esc(p.role)}</p>`,
    });
  }

  const head = (pg) => {
    const url = abs(pg.canonical || pg.route);
    const other = lang === "it" ? "en" : "it";
    const img = pg.image ? `\n  <meta property="og:image" content="${SITE}/${pg.image}">` : "";
    return `
  <!-- seo -->
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="it" href="${absIn("it", pg.canonical || pg.route)}">
  <link rel="alternate" hreflang="en" href="${absIn("en", pg.canonical || pg.route)}">
  <link rel="alternate" hreflang="x-default" href="${absIn("it", pg.canonical || pg.route)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(C.site.organisation)}">
  <meta property="og:locale" content="${W.locale}">
  <meta property="og:locale:alternate" content="${TEXT[other].locale}">
  <meta property="og:title" content="${esc(pg.title)}">
  <meta property="og:description" content="${esc(pg.desc)}">
  <meta property="og:url" content="${url}">${img}
  <meta name="twitter:card" content="summary">
  <!-- /seo -->`;
  };

  const render = (pg) =>
    template
      .replace('<html lang="it">', `<html lang="${lang}">`)
      .replace("NOSCRIPT", W.noscript)
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(pg.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(pg.desc)}">`)
      .replace(/(<link rel="icon")/, `${head(pg).trimStart()}\n  $1`)
      .replace('<div id="app"></div>', `<div id="app">${body(pg.h1, pg.lead, pg.extra)}</div>`);

  const dir = W.prefix ? `${W.prefix.slice(1)}/` : "";
  const mine = pages.filter((o) => o.lang === lang);
  for (const pg of mine) {
    const html = render(pg);
    if (pg.route === "/") { write(`${dir}index.html`, html); continue; }
    const rel = `${dir}${pg.route.slice(1)}`;
    write(`${rel}.html`, html);
    // Se un indirizzo è anche una cartella (rankwit e rankwit/demo), GitHub Pages
    // può rimandare a rankwit/: la stessa pagina sta anche lì.
    if (mine.some((o) => o.route.startsWith(`${pg.route}/`))) write(`${rel}/index.html`, html);
  }

  // 404.html: lo stesso sito per gli indirizzi sbagliati, fuori dai motori di
  // ricerca. Ce n'è una sola, alla radice: app.js legge comunque la lingua dall'indirizzo.
  if (lang === "it") {
    write("404.html", template
      .replace("NOSCRIPT", W.noscript)
      .replace(/<title>[\s\S]*?<\/title>/, "<title>Pagina non trovata · RankWit Meet</title>")
      .replace(/(<link rel="icon")/, '<meta name="robots" content="noindex">\n  $1'));
  }
}

const today = new Date().toISOString().slice(0, 10);
const locOf = (p) => `${SITE}${TEXT[p.lang].prefix}${p.route === "/" ? "/" : p.route}`;
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.filter((p) => p.sitemap !== false).map((p) => `  <url>
    <loc>${locOf(p)}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="it" href="${SITE}${p.route === "/" ? "/" : p.route}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/en${p.route === "/" ? "/" : p.route}"/>
  </url>`).join("\n")}
</urlset>
`);

write("robots.txt", `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

console.log(`${written.length} file scritti per ${SITE}`);
console.log(written.join("\n"));
