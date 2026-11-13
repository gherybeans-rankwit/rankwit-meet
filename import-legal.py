"""Porta nella booking page i testi legali ufficiali di RankWit, così come sono.

Legge le pagine legali del sito (cartella con /legal e /it/legal, per esempio
"../../Website (4)/webflow") e scrive in legal/<lingua>/<pagina>.html solo il
testo: titoli, paragrafi, elenchi e link. Non cambia una parola.

  python3 import-legal.py "../../Website (4)/webflow"
  node build-pages.mjs
"""
import os, re, sys
from html import escape
from html.parser import HTMLParser

SRC = sys.argv[1].rstrip("/")
HERE = os.path.dirname(os.path.abspath(__file__))
PAGES = {"privacy": "privacy-policy-webapp", "termini": "terms-and-conditions", "cookie": "cookie-policy"}
LOCAL = {v: k for k, v in PAGES.items()}
KEEP = {"h2", "h3", "h4", "p", "ul", "ol", "li", "a", "strong", "em", "br", "table", "thead", "tbody", "tr", "th", "td"}
VOID = {"br", "img", "hr", "input", "meta", "link"}


def link(href, lang):
    """Link interni alle tre pagine legali restano nella booking page; gli altri vanno al sito."""
    m = re.match(r"^(?:https?://(?:www\.)?rankwit\.ai)?(/it)?/legal/([a-z0-9-]+)/?$", href)
    if m and m.group(2) in LOCAL:
        return "@@" + LOCAL[m.group(2)]
    if href.startswith("/"):
        return "https://www.rankwit.ai" + href
    return href


class Rich(HTMLParser):
    def __init__(self, lang):
        super().__init__(convert_charrefs=True)
        self.lang, self.depth, self.out, self.done = lang, 0, [], False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if self.done:
            return
        if not self.depth:
            if tag == "div" and "w-richtext" in (a.get("class") or ""):
                self.depth = 1
            return
        if tag == "div":
            self.depth += 1
        if tag in KEEP:
            if tag == "a":
                href = a.get("href") or ""
                if not href or href == "#":
                    self.out.append("<span>")
                    return
                href = link(href, self.lang)
                ext = "" if href.startswith(("@@", "mailto:")) else ' target="_blank" rel="noopener"'
                self.out.append(f'<a href="{escape(href)}"{ext}>')
            else:
                self.out.append(f"<{tag}>")

    def handle_endtag(self, tag):
        if self.done or not self.depth:
            return
        if tag == "div":
            self.depth -= 1
            if not self.depth:
                self.done = True
            return
        if tag in KEEP and tag not in VOID:
            self.out.append(f"</{tag}>")

    def handle_data(self, data):
        if self.depth and not self.done:
            self.out.append(escape(data, quote=False))


for lang, sub in (("it", "it/legal"), ("en", "legal")):
    os.makedirs(os.path.join(HERE, "legal", lang), exist_ok=True)
    for key, slug in PAGES.items():
        src = open(os.path.join(SRC, sub, slug + ".html"), encoding="utf-8").read()
        p = Rich(lang)
        p.feed(src)
        html = "".join(p.out)
        # un link senza indirizzo è diventato <span>: la chiusura </a> va sistemata
        html = re.sub(r"<span>(.*?)</a>", r"\1", html, flags=re.S)
        html = re.sub(r"<p>\s*(?:<br>)?\s*</p>", "", html)
        html = re.sub(r"\n\s*\n+", "\n", html).strip() + "\n"
        assert len(re.sub(r"<[^>]+>", " ", html).split()) > 500, (lang, key)
        open(os.path.join(HERE, "legal", lang, key + ".html"), "w", encoding="utf-8").write(html)
        print(lang, key, len(re.sub(r"<[^>]+>", " ", html).split()), "parole")
