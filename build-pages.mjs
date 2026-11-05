// Crea una pagina HTML vera per ogni indirizzo del sito (team.html, marta.html,
// rankwit/demo.html...), più sitemap.xml, robots.txt e 404.html.
// Serve ai motori di ricerca e agli assistenti AI: ogni indirizzo risponde 200
// e ha già nel codice titolo, descrizione e testo, anche senza JavaScript.
// La pagina poi si costruisce come sempre con app.js.
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
const C = sandbox.window.RW_BOOK;
const SITE = C.site.url.replace(/\/$/, "");
const G = C.generic;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const abs = (p) => `${SITE}${p === "/" ? "/" : p}`;

// Il modello è index.html: si cambiano solo testa e contenuto di #app.
const template = read("index.html")
  .replace(/\n  <!-- seo -->[\s\S]*?<!-- \/seo -->/, "")
  .replace(/<div id="app">[\s\S]*?<\/div>\n  <noscript>/, '<div id="app"></div>\n  <noscript>');

const people = Object.entries(C.people);

// Ogni call deve avere almeno una persona con cal.com e un evento della sua durata,
// altrimenti online non mostra orari.
const bookable = (ids, d, slug) => ids.filter((id) => C.people[id]?.cal && C.people[id].events?.[slug || d]);
const missing = [
  ...(bookable(C.generic.people, C.generic.duration).length ? [] : [C.generic.title]),
  ...C.brands.filter((b) => !b.example).flatMap((b) => b.types.filter((t) => !bookable(t.people, t.duration, t.slug).length).map((t) => `${t.title} (${t.duration} min)`)),
];
if (missing.length) console.warn(`ATTENZIONE, queste call non hanno nessuno prenotabile:\n- ${missing.join("\n- ")}`);
const realBrands = C.brands.filter((b) => !b.example);
const calls = realBrands.flatMap((b) => b.types.map((t) => ({ b, t })));

// Elenco di tutte le pagine, uguale ovunque: aiuta chi legge senza JavaScript.
const allLinks = () => `
      <nav class="wrap static-nav" aria-label="Tutte le call">
        <ul>
          <li><a href="${abs(`/${G.key}`)}">${esc(G.title)}</a></li>
          ${calls.map(({ b, t }) => `<li><a href="${abs(`/${b.key}/${t.key}`)}">${esc(t.title)}</a></li>`).join("\n          ")}
          ${people.map(([id, p]) => `<li><a href="${abs(`/${id}`)}">Call con ${esc(p.name)}, ${esc(p.role)}</a></li>`).join("\n          ")}
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

const pages = [];
const add = (route, o) => pages.push({ route, ...o });

const homeDesc = "Scegli il tema o la persona e prenota una call con il team RankWit AI su Google Meet.";
add("/", { title: "Prenota una call · RankWit AI", desc: homeDesc, h1: "Di cosa vuoi parlare?", lead: `${G.summary} ${G.duration} minuti, gratuita e senza impegno.` });
add(`/${G.key}`, { title: `${G.title} · RankWit Meet`, desc: G.summary, h1: G.book, lead: G.summary });

for (const b of realBrands) {
  if (b.types.length === 1) {
    // La pagina del programma porta subito all'unica call: in sitemap va solo quella.
    const t = b.types[0];
    add(`/${b.key}`, { title: `${b.name} · RankWit Meet`, desc: b.intro, h1: b.name, lead: b.intro, canonical: `/${b.key}/${t.key}`, sitemap: false });
  } else {
    add(`/${b.key}`, { title: `${b.name} · RankWit Meet`, desc: b.intro, h1: "Prenota una call", lead: b.intro });
  }
  for (const t of b.types) {
    add(`/${b.key}/${t.key}`, { title: `${t.title} · RankWit Meet`, desc: t.summary, h1: t.book || t.title, lead: `${t.summary} ${t.duration} minuti su Google Meet, gratuita e senza impegno.` });
  }
}

for (const [id, p] of people) {
  const lead = `${p.bio} Ci sentiamo su Google Meet, nel giorno e all'ora che preferisci.`;
  add(`/${id}`, {
    title: `Prenota una call con ${p.name} · RankWit Meet`,
    desc: `${p.bio} Prenota una call con ${p.name}, ${p.role} di ${C.site.organisation}, su Google Meet.`,
    h1: `Prenota una call con ${p.name}`, lead, image: p.portrait || p.photo,
    extra: `\n        <p class="person-role">${esc(p.role)}</p>`,
  });
}

const head = (pg) => {
  const url = abs(pg.canonical || pg.route);
  const img = pg.image ? `\n  <meta property="og:image" content="${abs(`/${pg.image}`)}">` : "";
  return `
  <!-- seo -->
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(C.site.organisation)}">
  <meta property="og:locale" content="it_IT">
  <meta property="og:title" content="${esc(pg.title)}">
  <meta property="og:description" content="${esc(pg.desc)}">
  <meta property="og:url" content="${url}">${img}
  <meta name="twitter:card" content="summary">
  <!-- /seo -->`;
};

const render = (pg) =>
  template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(pg.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(pg.desc)}">`)
    .replace(/(<link rel="icon")/, `${head(pg).trimStart()}\n  $1`)
    .replace('<div id="app"></div>', `<div id="app">${body(pg.h1, pg.lead, pg.extra)}</div>`);

const written = [];
const write = (rel, html) => {
  const f = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
  written.push(rel);
};

for (const pg of pages) {
  const html = render(pg);
  if (pg.route === "/") { write("index.html", html); continue; }
  const rel = pg.route.slice(1);
  write(`${rel}.html`, html);
  // Se un indirizzo è anche una cartella (rankwit e rankwit/demo), GitHub Pages
  // può rimandare a rankwit/: la stessa pagina sta anche lì.
  if (pages.some((o) => o.route.startsWith(`${pg.route}/`))) write(`${rel}/index.html`, html);
}

// 404.html: lo stesso sito per gli indirizzi sbagliati, fuori dai motori di ricerca.
write("404.html", template
  .replace(/<title>[\s\S]*?<\/title>/, "<title>Pagina non trovata · RankWit Meet</title>")
  .replace(/(<link rel="icon")/, '<meta name="robots" content="noindex">\n  $1'));

const today = new Date().toISOString().slice(0, 10);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter((p) => p.sitemap !== false).map((p) => `  <url><loc>${abs(p.route)}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);

write("robots.txt", `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

console.log(`${written.length} file scritti per ${SITE}`);
console.log(written.join("\n"));
