# BPS Hodoňovice – provozní přehled (dashboard pro tablet)

Statická stránka pro GitHub Pages. Čte data přímo z Google Tabulky
„Denní evidence na BPS Hodoňovice“ a z veřejného ThingSpeak kanálu 3149723.
Žádný server, žádné klíče, žádné knihovny. Psáno v ES5, takže běží i na Androidu 6.

## Co stránka ukazuje (posledních 7 dní)
- **% instalovaného výkonu** (1 186 kW) – Ø za týden, poslední den, srovnání s minulým týdnem
- **Výroba elektřiny** (MWh) a **krmení celkem** (t bez kejdy, kejda m³)
- **Měrná výroba** (kWh na tunu krmiva) – ukazatel účinnosti
- **Teplota a vlhkost** z ThingSpeaku (aktuálně + hodinový průběh za týden)
- Graf **% výkonu po dnech** pro obě KJ (549 a 637 kW) s cílovou čárou
- Graf **krmné dávky po dnech** podle skupin složek
- **Fermentory F1, F2 a vstup do motoru**: teplota, CH₄, O₂, H₂, H₂S (+ Ø 7 dní, upozornění při překročení limitů)
- **Kogenerační jednotky**: využití a motohodiny za týden
- Doba zdržení, denní dávka F1, sušina dávky
- **Dnešní obsluha, pohotovost a poslední události** z listu „docházka+události“

Na sloupec nebo do grafu počasí lze ťuknout – ukáže se detail.

## Druhá stránka: `info.html` (počasí + krmná dávka + výkon)
Velké písmo pro čtení z dálky. Nahoře čas a datum, vlevo teplota a vlhkost z ThingSpeaku,
uprostřed 3denní předpověď (Open-Meteo) a meteoradar za poslední hodinu (RainViewer),
vpravo aktuální výkon (poslední odečet KGJ) a složení krmné dávky (poslední zápis).
Adresa: `https://<vas-ucet>.github.io/bps-dashboard/info.html`.
Mezi stránkami se přepíná tlačítkem ☁ / ▦ vpravo nahoře.
Stránka potřebuje i soubory `leaflet.js` a `leaflet.css` (mapa) – nahrajte je do repozitáře.

## Nasazení na GitHub Pages
1. Na github.com vytvořte nový repozitář (např. `bps-dashboard`), klidně veřejný.
2. **Add file → Upload files** a nahrajte všechny soubory z této složky
   (`index.html`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `README.md`).
3. **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save**.
4. Za 1–2 minuty bude stránka na `https://<vas-ucet>.github.io/bps-dashboard/`.

## Nastavení tabletu (Android 6)
1. Aktualizujte **Google Chrome** v Obchodě Play (Android 6 podporuje Chrome až do verze 119).
2. Otevřete adresu stránky v Chrome → menu ⋮ → **Přidat na plochu**.
   Spuštěná z plochy běží přes celou obrazovku bez lišty prohlížeče.
3. Nastavení → Displej → Režim spánku: nejdelší možný (nebo **Možnosti pro vývojáře → Nevypínat obrazovku** při nabíjení).
4. Tablet nechte na nabíječce.

## Podmínky
- Google Tabulka musí být sdílená **„Kdokoli s odkazem – čtenář“** (teď je).
- Nepřejmenovávejte listy `KGJ`, `Krmení`, `Fermentory` a neměňte pořadí sloupců.
  Když se to změní, upravte blok `CONFIG` / `FEED_GROUPS` na začátku skriptu v `index.html`.

## Úpravy
Vše podstatné je v bloku `CONFIG` na začátku `<script>` v `index.html`:
cílové % výkonu, intervaly obnovy, limity CH₄/O₂/H₂/H₂S, název listů.

Data z tabulky se obnovují každých 10 min, aktuální počasí každou minutu.
Při výpadku internetu zůstanou zobrazena poslední data (uložená v prohlížeči)
a stavový štítek v hlavičce zčervená.

**Pozor:** Stránka na GitHub Pages je veřejná a čte Tabulku přímo,
takže kdokoli s adresou uvidí stejná data (včetně jmen obsluhy a událostí).
