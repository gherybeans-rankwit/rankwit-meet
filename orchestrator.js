/* Orchestratore della call generica di book.rankwit.ai.
   Decide a chi va ogni orario, a turno, senza server e senza account a pagamento.

   1. Costruisce il giro: ogni persona compare tante volte quanto il suo weight,
      distribuita in modo uniforme (Davide con weight 2 su quattro persone:
      davide, gherardo, davide, marco, marta, e poi si ricomincia).
   2. Trova chi è di turno per quell'orario, secondo `turn`:
        "call"      ogni mezz'ora passa alla persona dopo, e ogni giorno
                    il giro parte una persona più avanti
        "giorno"    una persona per giorno feriale (ora italiana)
        "settimana" una persona per settimana, dal lunedì
      Il conto parte da `start`, quindi il turno è lo stesso per tutti i
      visitatori e non cambia ricaricando la pagina.
   3. Se chi è di turno non è libero a quell'ora, la call va al primo libero
      dopo di lui nel giro.

   Cosa non fa: non sa quante call ha già preso ciascuno, perché le
   prenotazioni stanno nei calendari cal.com di ognuno. Un giro «a chi ha
   preso meno call» chiede un posto dove contarle (Make, oppure i Team di
   cal.com a pagamento). */
(() => {
  "use strict";

  const ZONE = "Europe/Rome";

  // Giro pesato: le presenze di ognuno sono sparse lungo il giro, così chi ha
  // weight 2 non capita due volte di fila, nemmeno quando il giro ricomincia.
  function cycle(people, weightOf) {
    const n = people.length;
    const marks = [];
    people.forEach((id, i) => {
      const w = Math.max(1, Math.round(weightOf(id) || 1));
      for (let j = 0; j < w; j++) marks.push({ id, i, at: (j + i / n) / w });
    });
    return marks.sort((x, y) => x.at - y.at || x.i - y.i).map((m) => m.id);
  }

  // Data del giorno in ora italiana, come numero di giorni dal 1970.
  function romeDay(date) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    const [y, m, d] = key.split("-").map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400e3);
  }

  // Minuti dalla mezzanotte, in ora italiana.
  function romeMinutes(date) {
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
    const v = (k) => Number(p.find((x) => x.type === k).value);
    return v("hour") * 60 + v("minute");
  }

  // Giorni feriali fra due giorni (a escluso, b escluso).
  function workdaysBetween(a, b) {
    let n = 0;
    const sign = b >= a ? 1 : -1;
    for (let d = a; d !== b; d += sign) {
      const wd = (new Date(d * 86400e3).getUTCDay() + 6) % 7; // 0 = lunedì
      if (wd < 5) n += sign;
    }
    return n;
  }

  // Numero del turno per un orario.
  function turnIndex(iso, rules) {
    const t = new Date(iso);
    const start = new Date(`${rules.start || "2026-11-02"}T00:00:00Z`);
    const startDay = Math.floor(start.getTime() / 86400e3);
    const day = romeDay(t);
    // Ogni mezz'ora la persona dopo, e ogni giorno feriale il giro parte una
    // persona più avanti: così le 10:00 non toccano sempre alla stessa persona.
    if (rules.turn === "call") return workdaysBetween(startDay, day) + Math.floor(romeMinutes(t) / 30);
    if (rules.turn === "settimana") return Math.floor((day - startDay) / 7);
    return workdaysBetween(startDay, day); // "giorno"
  }

  const mod = (a, n) => ((a % n) + n) % n;

  // Chi è di turno per quell'orario, senza guardare chi è libero.
  function onDuty(iso, rules, weightOf) {
    const seq = cycle(rules.people, weightOf);
    return seq[mod(turnIndex(iso, rules), seq.length)];
  }

  // Chi prende la call: chi è di turno se è libero, altrimenti il primo libero dopo.
  function assign(iso, free, rules, weightOf) {
    if (!free.length) return null;
    const seq = cycle(rules.people, weightOf);
    const i0 = mod(turnIndex(iso, rules), seq.length);
    for (let k = 0; k < seq.length; k++) {
      const id = seq[(i0 + k) % seq.length];
      if (free.includes(id)) return id;
    }
    return free[0];
  }

  window.RW_ORCHESTRATOR = { cycle, turnIndex, onDuty, assign };
})();
