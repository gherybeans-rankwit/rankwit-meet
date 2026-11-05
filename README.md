# book.rankwit.ai

Clone di meet.thinkdigital.travel con i contenuti RankWit. Stesso impianto: home con ricerca e filtri, call per tema, team, programmi, pagina per ogni programma, pagina personale per ogni persona (`book.rankwit.ai/davide`) e incontri di persona in fiera. Colori e font sono quelli di RankWit AI: 29LT Bukra per i titoli, Plus Jakarta Sans per il testo e le etichette, caricati da `assets/fonts` senza Google Fonts. Stanno tutti in cima ad `app.css`.

Sotto c'è cal.com gratuito, un account per persona, ma chi prenota non lo vede mai. La pagina legge gli orari liberi di tutti, li unisce e per ogni orario sceglie chi prende la call. Il modulo con nome, email, organizzazione e note è nostro. Alla conferma la prenotazione parte verso cal.com, che crea l'evento nel Google Calendar della persona con il link Meet e manda l'invito. Promemoria, spostamento e cancellazione passano dalle email di cal.com.

## Inglese

Il sito esiste in due lingue sugli stessi indirizzi: `book.rankwit.ai/davide` è in italiano, `book.rankwit.ai/en/davide` in inglese, e così per ogni call e programma. La lingua la decide l'indirizzo: `app.js` legge `/en/` all'apertura e usa i testi inglesi dell'interfaccia (il dizionario `T` in cima ad `app.js`) e i testi inglesi di `config.js`. In `config.js` ogni testo può avere un gemello con il suffisso `_en` (`title_en`, `bio_en`, `summary_en`, `keywords_en`, `label_en`...): se manca, in inglese resta quello italiano. `RW_LOCALIZE`, in fondo a `config.js`, fa la sostituzione; la usano sia `app.js` sia `build-pages.mjs`, che scrive le pagine inglesi in `en/`. Nell'intestazione c'è il cambio lingua (EN / IT), che porta alla stessa pagina nell'altra lingua. La prenotazione manda a cal.com `language` nella lingua della pagina e `lingua` nei metadati, così le email di cal.com e Attio sanno in che lingua parlare. Il sito rankwit.ai manda al link inglese dalle pagine inglesi e a quello italiano dalle pagine italiane.

## Provarla sul Mac

```bash
python3 -I serve.py 8796
```

Poi apri http://localhost:8796. Finché una persona non ha `cal` in `config.js`, sul Mac i suoi orari sono di esempio e la conferma non crea nessuna prenotazione. Online quella persona non mostra orari.

## La call generica e l'orchestratore

La prima cosa della home è la call con il team (`book.rankwit.ai/team`). Gli orari sono quelli di tutte le persone in `generic.people`; chi prende la call lo decide `orchestrator.js`, a turno:

- il giro mette ognuno tante volte quanto il suo `weight` (oggi: Dario, Davide, Gherardo, Davide, Marco, Marta);
- `turn` dice ogni quanto cambia chi è di turno: `"call"` (ogni mezz'ora), `"giorno"` (ogni giorno feriale) o `"settimana"`;
- se chi è di turno è occupato a quell'ora, la call va al primo libero dopo di lui nel giro.

Oggi `turn` è `"call"`: ogni orario da mezz'ora va alla persona dopo nel giro, quindi chi sceglie le 10:00 e chi sceglie le 10:30 trova due persone diverse. Il giro segue gli orari del calendario, non l'ordine in cui arrivano le prenotazioni: due persone che prenotano lo stesso orario in giorni diversi possono finire alla stessa persona.

L'orchestratore non sa quante call ha già preso ciascuno. Un giro «a chi ne ha avute meno» chiede un posto dove contarle (Make, oppure i Team di cal.com a pagamento).

## Cosa fa ogni persona del team (una volta)

1. Apre un account gratuito su cal.com con l'email di lavoro e sceglie lo username, per esempio `davide-rankwit`.
2. Collega Google Calendar, in Impostazioni > Calendari, così cal.com vede gli impegni e scrive le call nel calendario.
3. Installa Google Meet, in App > Google Meet, e lo imposta come luogo predefinito.
4. Imposta gli orari di lavoro e il preavviso minimo.
5. Crea gli eventi delle durate che vuole offrire (per esempio `15min`, `30min`), con luogo Google Meet. In `config.js`, alla voce `events` della persona, va scritto quale evento usare per ogni durata. Chi non ha l'evento di una durata non compare nelle call di quella durata.
6. Per ogni fiera crea un evento con lo slug indicato in `config.js` (oggi `fiera`), luogo «di persona» e disponibilità solo nei giorni della fiera, e lo aggiunge a `events` con la stessa chiave.
7. Comunica il link cal.com: la parte dopo `cal.com/` va in `cal`, il nome dell'evento in `events`.

Le ferie vanno messe sul calendario come «Fuori sede» o come evento «Occupato». Un evento di un giorno intero segnato «Disponibile» non blocca gli orari.

## Cosa si cambia in config.js

- **people:** nome, ruolo, foto facoltativa, username cal.com e `weight`. Il peso decide quanto spesso tocca a quella persona quando più persone sono libere nello stesso orario: con 2 il doppio degli altri. Oggi Davide ha 2.
- **brands:** i programmi (RankWit AI, AI Visibility Lab, una fiera). Ognuno ha le sue call (`types`) con durata, testi, domanda del modulo (`prompt`) e chi può farle. Una fiera è un programma con una call `inPerson`, le date e il fuso del luogo. Va tolto `example: true` quando l'evento è vero.
- **navigator:** le sezioni della home e i filtri. Nella vista «Tutte le call» ogni call compare una volta sola.
- **rules.windowDays:** quanti giorni avanti si può prenotare.

## Dati che arrivano a cal.com

Ogni prenotazione porta con sé, nei metadati di cal.com, `tema`, `fonte`, `organizzazione`, `ruolo`, `newsletter` (solo se spuntata) e, se il link ha `?da=`, `provenienza`. Nelle note della call ci sono la risposta alla domanda del modulo e l'organizzazione. Per i biglietti da visita il QR punta a `book.rankwit.ai/nome?da=biglietto`, così in Attio si vede quanti contatti arrivano da lì.

Da verificare con un account gratuito: se i webhook di cal.com (Impostazioni > Developer > Webhooks) sono disponibili, così Make li manda in Attio.

## Pubblicazione

È una pagina statica: si pubblica la cartella così com'è, dopo aver lanciato `node build-pages.mjs`.

- **Cloudflare Pages o Netlify:** servono le pagine vere e usano `_redirects` per il resto.
- **GitHub Pages:** serve `marta.html` per `/marta` e `404.html` per gli indirizzi sbagliati.

## Motori di ricerca e assistenti AI

`build-pages.mjs` legge `config.js` e scrive una pagina HTML vera per ogni indirizzo (home, call con il team, ogni call, ogni persona), con titolo, descrizione, indirizzo canonico, anteprima per i social e il testo della pagina già nel codice. Così ogni indirizzo risponde 200 e si legge anche senza JavaScript, come fanno i crawler di ChatGPT, Perplexity e Claude. Scrive anche `sitemap.xml`, `robots.txt` e `404.html` (che resta fuori dagli indici).

Va rilanciato dopo ogni modifica a `config.js` o a `index.html`:

```bash
node build-pages.mjs
```

L'indirizzo pubblico sta in `config.js`, alla voce `site.url`. Quando c'è book.rankwit.ai si scrive lì e si rilancia lo script. Su GitHub Pages `robots.txt` conta solo alla radice del dominio, quindi sull'indirizzo github.io la sitemap va inviata a mano in Google Search Console.
- **DNS:** su Route 53 serve un record CNAME `book` verso l'hosting scelto. Su Webflow va aggiunto un redirect da `/book` a `https://book.rankwit.ai`.

## Limiti noti

- Se due persone scelgono lo stesso orario nello stesso momento, cal.com ricontrolla alla conferma e lo segnala al secondo.
- La prenotazione parte dal browser verso l'API pubblica di cal.com, che non chiede chiavi. L'ho provata con dati non validi, che cal.com ha rifiutato come previsto. Una prenotazione vera non l'ho ancora fatta: va provata con il primo account del team.
- Le email di conferma partono da cal.com, in italiano perché la pagina lo chiede, e portano il marchio cal.com: il piano gratuito non permette di toglierlo.

## Aggiungere una fiera

Le fiere si aggiungono una alla volta in `config.js`, quando sono confermate. Finché non ce n'è nessuna, nella pagina non compaiono né la sezione né il filtro.

1. Chi sarà allo stand crea su cal.com un evento solo per la fiera, per esempio `ttg-2027`, di persona, disponibile solo nei giorni della fiera. Lo aggiunge alle sue voci `events` con la stessa chiave: `events: { 30: "30min", "ttg-2027": "ttg-2027" }`.
2. In `brands` si aggiunge un blocco come questo:

```js
{
  key: "ttg-2027",                 // indirizzo: book.rankwit.ai/ttg-2027
  name: "TTG Travel Experience 2027",
  short: "TTG",
  meta: "Rimini · dal 14 al 16 ottobre 2027",
  intro: "Incontra il team RankWit di persona allo stand.",
  tile: "pin",
  card: "paper",
  // logo: "/assets/brand/ttg.svg",  // facoltativo: logo della fiera nel riepilogo
  types: [{
    key: "incontro",
    title: "Incontro in fiera",
    book: "Incontriamoci al TTG",
    duration: 20,
    slug: "ttg-2027",              // la chiave dell'evento cal.com al punto 1
    inPerson: true,
    place: "allo stand RankWit, padiglione da indicare",
    timeZone: "Europe/Rome",       // gli orari restano quelli locali della fiera
    dates: ["2027-10-14", "2027-10-16"],
    summary: "Venti minuti di persona allo stand, per vedere dal vivo cosa dicono i motori AI del tuo hotel o della tua destinazione.",
    prompt: "Su cosa vuoi confrontarti?",
    prepare: "Trovi lo stand nell'invito: passa all'orario che hai scelto.",
    people: ["davide", "gherardo"],
    keywords: ["fiera", "stand", "incontro", "di persona"],
  }],
},
```

3. In `navigator` si aggiunge `{ key: "eventi", label: "Fiere ed eventi", options: [["ttg-2027", "incontro"]] }`, in cima se la fiera deve comparire per prima.

Finita la fiera si toglie il blocco: il suo indirizzo smette di funzionare e nella pagina non resta nessun link.
