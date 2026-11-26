/**
 * Bilingual (PL / EN) dictionary and Markdown chronicles for the Vibrant Castle
 * GitHub Pages Gothic Wiki portal.
 */

export interface WikiI18nDictionary {
  readonly siteTitle: string;
  readonly wikiNavGame: string;
  readonly wikiNavIntro: string;
  readonly wikiNavHeroes: string;
  readonly wikiNavWorlds: string;
  readonly wikiNavControls: string;
  readonly wikiLaunchCta: string;
  readonly wikiSplashEyebrow: string;
  readonly wikiSplashTitle: string;
  readonly wikiSplashLead: string;
  readonly wikiSplashMeta: string;
  readonly wikiFullscreen: string;
  readonly wikiReloadGame: string;
  readonly wikiOpenDirect: string;
  readonly wikiReturnToGame: string;
  readonly wikiLoadingArticle: string;
  readonly wikiErrorArticle: string;
  readonly wikiHeroValenRole: string;
  readonly wikiHeroValenPassive: string;
  readonly wikiHeroValenSummary: string;
  readonly wikiHeroAureliaRole: string;
  readonly wikiHeroAureliaPassive: string;
  readonly wikiHeroAureliaSummary: string;
  readonly wikiFooterLicense: string;
  readonly wikiFooterRepo: string;
}

export const WIKI_DICTIONARIES: Readonly<Record<"pl" | "en", WikiI18nDictionary>> = {
  pl: {
    siteTitle: "Vibrant Castle — Kronika Cytadeli Aetheru",
    wikiNavGame: "Zagraj",
    wikiNavIntro: "Kronika",
    wikiNavHeroes: "Bohaterowie",
    wikiNavWorlds: "8 Światów",
    wikiNavControls: "Sterowanie",
    wikiLaunchCta: "Uruchom Grę",
    wikiSplashEyebrow: "Cytadela Wiecznej Jesieni",
    wikiSplashTitle: "Vibrant Castle",
    wikiSplashLead:
      "Gotycka metroidvania 2D w zawieszonej w czasie Cytadeli Aetheru. Prowadź Valena lub Aurelię solo albo w lokalnej kooperacji 2P przez osiem połączonych światów.",
    wikiSplashMeta: "8 Światów · 64 Plansze · Solo i 2P Co-op · Klasyczne sterowanie",
    wikiFullscreen: "Pełny ekran",
    wikiReloadGame: "Restart sesji",
    wikiOpenDirect: "Otwórz samą grę",
    wikiReturnToGame: "Wróć do gry",
    wikiLoadingArticle: "Wczytywanie kroniki...",
    wikiErrorArticle: "Nie udało się wczytać wybranego rozdziału kroniki.",
    wikiHeroValenRole: "Słoneczny Rycerz",
    wikiHeroValenPassive: "Solarny Hart",
    wikiHeroValenSummary:
      "Wyższe HP (115), stamina (115), obrona (7) i szybsze cięcie rapierem.",
    wikiHeroAureliaRole: "Uczona Arkanów",
    wikiHeroAureliaPassive: "Astralny Przepływ",
    wikiHeroAureliaSummary:
      "Głębsza mana (125), +15% mocy zaklęć, -10% kosztu MP i zwinniejsze uniki.",
    wikiFooterLicense: "Kod: MPL-2.0 · Fabuła i grafika: CC BY 4.0",
    wikiFooterRepo: "GitHub Pages · Vibrant Castle",
  },
  en: {
    siteTitle: "Vibrant Castle — Chronicle of the Aether Citadel",
    wikiNavGame: "Play",
    wikiNavIntro: "Chronicle",
    wikiNavHeroes: "Champions",
    wikiNavWorlds: "8 Worlds",
    wikiNavControls: "Controls",
    wikiLaunchCta: "Launch Game",
    wikiSplashEyebrow: "Citadel of Eternal Autumn",
    wikiSplashTitle: "Vibrant Castle",
    wikiSplashLead:
      "A gothic 2D metroidvania set inside the time-fractured Citadel of Aether. Guide Valen or Aurelia solo or in local 2-player co-op across eight interconnected worlds.",
    wikiSplashMeta: "8 Worlds · 64 Stages · Solo & 2P Co-op · Keyboard & Pad",
    wikiFullscreen: "Fullscreen",
    wikiReloadGame: "Reload session",
    wikiOpenDirect: "Open standalone",
    wikiReturnToGame: "Back to Game",
    wikiLoadingArticle: "Loading chronicle...",
    wikiErrorArticle: "Unable to load the selected chronicle chapter.",
    wikiHeroValenRole: "Solar Knight",
    wikiHeroValenPassive: "Solar Vigor",
    wikiHeroValenSummary:
      "Higher HP (115), stamina (115), defense (7), and swifter rapier cadence.",
    wikiHeroAureliaRole: "Scholar of Arcanum",
    wikiHeroAureliaPassive: "Astral Flow",
    wikiHeroAureliaSummary:
      "Deeper mana (125), +15% spell power, -10% MP cost, and agile evade.",
    wikiFooterLicense: "Engine: MPL-2.0 · Lore & Art: CC BY 4.0",
    wikiFooterRepo: "GitHub Pages · Vibrant Castle",
  },
};

export const WIKI_ARTICLES: Readonly<Record<"pl" | "en", Readonly<Record<string, string>>>> = {
  pl: {
    "intro.md": `# Kronika Cytadeli Aetheru

> *„Zegary stanęły w złotej godzinie jesieni, lecz mury pamiętają każdy krok tych, którzy ośmielili się przerwać ciszę.”*

**Vibrant Castle** to 2D metroidvania osadzona w melancholijnym świecie dark fantasy skąpanym w wiecznej, bursztynowej jesieni. Cytadela Aetheru — niegdyś siedziba zegarmistrzów, astronomów i mistrzów szermierki — została zamrożona po Katastrofie Zegara.

## Filary rozgrywki

- **Precyzyjny ruch platformowy**: zmienny skok, *coyote time*, buforowanie skoku, ślizgi i odskoki oparte na identycznej fizyce ruchu dla obu bohaterów.
- **Walka wręcz i magia Aetheru**: szybkie pchnięcia rapierem, tarcze ochronne, pociski słoneczne oraz zarządzanie staminą i maną.
- **Tryb Solo i Lokalny Co-Op (2P)**: przejdź kampanię samodzielnie wybranym bohaterem lub wspólnie z drugą osobą na jednym ekranie.
- **Narrator reagujący na wydarzenia**: komentuje kluczowe odkrycia, walki i momenty kryzysowe bez zasłaniania planszy.

---

## Struktura kampanii

Cała Cytadela została podzielona na **8 unikalnych światów**, z których każdy składa się z **8 plansz** (łącznie **64 poziomy**), ze współdzieloną wielowarstwową paralaksą i dedykowaną strefą bossa.
`,
    "heroes.md": `# Bohaterowie: Valen i Aurelia

Oboje bohaterowie dzielą identyczną fizykę biegu i skoku, dzięki czemu każda z 64 plansz jest w pełni przechodnia dla dowolnej postaci. Różnią się natomiast stylem walki, regeneracją oraz cechą pasywną zakorzenioną w lore.

| Atrybut | Valen · Słoneczny Rycerz | Aurelia · Uczona Arkanów |
| :--- | :---: | :---: |
| Zdrowie (HP) | 115 | 90 |
| Mana (MP) | 90 | 125 |
| Stamina (ST) | 115 | 95 |
| Atak bazowy (ATK) | 23 | 18 |
| Obrona bazowa (OBR) | 7 | 4 |
| Moc zaklęć (MAG) | 100% | 115% (+15%) |
| Koszt zaklęć (MP) | 100% | 90% (-10%) |
| Cecha pasywna | **Solarny Hart** | **Astralny Przepływ** |

## Valen — Słoneczny Rycerz

Wychowanek Zakonu Słońca i mistrz pojedynkowego rapiera. Jego cecha **Solarny Hart** zapewnia twardszą gardę, wyższą pulę zdrowia oraz staminy, szybszą regenerację sił i krótszy czas odnowienia ciosów wręcz. Idealny do ofensywnej gry na krótkim dystansie.

## Aurelia — Uczona Arkanów

Badaczka Aetheru i chronomancji. Dzięki cesze **Astralny Przepływ** dysponuje większą rezerwą i szybszą regeneracją many, rzuca silniejsze zaklęcia niższym kosztem MP oraz wykonuje tańsze i częstsze uniki (ślizg i odskok).
`,
    "worlds.md": `# Osiem Światów Cytadeli

Każdy świat posiada własną atmosferę, dalekie tło oraz unikalną kompozycję pośrednich warstw paralaksy i arenę bossa.

| # | Świat | Klimat i rola w Cytadeli |
| :---: | :--- | :--- |
| 01 | **Dziedziniec Przebudzenia** | Złota jesień, bramy bastionu i wprowadzenie do mechanik ruchu. |
| 02 | **Rozpadlina Cierni** | Zarośnięte przepaście, ruchome platformy i pułapki pod murami. |
| 03 | **Wieża Zegarowa** | Pionowa wspinaczka wśród mosiężnych kół zębatych i wahadeł. |
| 04 | **Sanktuarium Aetheru** | Podniebne arkady i kryształowe przęsła przesycone energią astralną. |
| 05 | **Wielki Bastion** | Potężne fortyfikacje strzeżone przez ciężkich strażników zakonu. |
| 06 | **Katakumby Popiołu** | Podziemne krypty i żarzące się katakumby zapomnianych rycerzy. |
| 07 | **Biblioteka Alchemika** | Labirynt regałów, alembików i zakazanych ksiąg chronomancji. |
| 08 | **Korona Zaćmienia** | Najwyższy szczyt Cytadeli pod podwójnym zaćmieniem — finał kampanii. |
`,
    "controls.md": `# Sterowanie i Interfejs

Interfejs gry został zaprojektowany z myślą o maksymalnej czytelności: wszystkie skróty nawigacji znajdują się w górnym pasku, a zaklęcia i eliksiry w kompaktowym dolnym doku.

## Gracz 1 (Domyślne skróty)

| Akcja | Klawisz |
| :--- | :--- |
| Ruch w lewo / prawo | \`A\` / \`D\` lub strzałki |
| Skok | \`W\` / \`Spacja\` |
| Atak rapierem | \`J\` |
| Ślizg / Unik | \`L\` / \`Shift\` |
| Zaklęcie główne / dodatkowe | \`Q\` / \`E\` (lub \`U\` / \`O\`) |
| Szybkie eliksiry | \`1\`, \`2\`, \`3\` |

## Nawigacja i okna gry

| Okno | Skrót |
| :--- | :--- |
| Ekwipunek | \`I\` |
| Drzewko umiejętności | \`K\` |
| Tryb Tworzenia (Poziomy i studia) | \`C\` |
| Pomoc i pełna ściąga sterowania | \`H\` lub \`?\` |
| Pauza | \`P\` |
| Menu główne i wybór bohatera | \`M\` lub \`Esc\` |
`,
  },
  en: {
    "intro.md": `# Chronicle of the Aether Citadel

> *"The clocks froze in the golden hour of autumn, yet the stonework remembers every step of those who dare to break the silence."*

**Vibrant Castle** is a 2D gothic metroidvania bathed in an eternal golden autumn. The Citadel of Aether—once home to horologists, astronomers, and fencing scholars—now rests suspended after the Great Clockwork Fracture.

## Core Pillars

- **Responsive Platforming**: variable jump height, coyote time, jump buffering, slides, and backsteps built on identical movement physics for both champions.
- **Rapier Combat & Aether Magic**: crisp melee thrusts, arcane projectiles, protective wards, and tactical stamina/mana management.
- **Solo & Local 2-Player Co-Op**: explore alone with your chosen champion or share one screen in local cooperative play.
- **Reactive Narrator**: atmospheric commentary that appears only when triggered, keeping the arena clear.

---

## Campaign Structure

The Citadel spans **8 distinct worlds**, each structured into **8 stages** (**64 levels total**) with layered parallax vistas and dedicated boss arenas.
`,
    "heroes.md": `# Champions: Valen & Aurelia

Both heroes share identical running and jumping envelopes so every stage across all 8 worlds stays 100% passable for either champion. Their differences express their lore through vitals, recovery, and passive traits.

| Attribute | Valen · Solar Knight | Aurelia · Scholar of Arcanum |
| :--- | :---: | :---: |
| Health (HP) | 115 | 90 |
| Mana (MP) | 90 | 125 |
| Stamina (ST) | 115 | 95 |
| Base Attack (ATK) | 23 | 18 |
| Base Defense (DEF) | 7 | 4 |
| Spell Power (MAG) | 100% | 115% (+15%) |
| Spell Cost (MP) | 100% | 90% (-10%) |
| Passive Trait | **Solar Vigor** | **Astral Flow** |

## Valen — Solar Knight

Champion of the Sun Order and master of the dueling rapier. **Solar Vigor** grants higher HP, stamina, defense, faster stamina recovery, and quicker melee cadence—rewarding resolute close-quarters fencing.

## Aurelia — Scholar of Arcanum

Researcher of Aether and chronomancy. **Astral Flow** deepens her mana pool and regeneration, amplifies spell damage by +15% while reducing MP cost by 10%, and makes her slides and backsteps swifter and lighter on stamina.
`,
    "worlds.md": `# The Eight Worlds of the Citadel

Each world pairs a signature distant horizon with curated mid-ground parallax layers and a dedicated boss encounter layer.

| # | World | Atmosphere & Role |
| :---: | :--- | :--- |
| 01 | **Courtyard of Awakening** | Golden autumn bastion gates introducing movement and combat. |
| 02 | **Chasm of Thorns** | Overgrown ravines, shifting stone ledges, and briar hazards. |
| 03 | **Clockwork Tower** | Vertical ascent through brass gears, pendulums, and chimes. |
| 04 | **Aether Sky Sanctuary** | High-altitude arcades steeped in celestial energy. |
| 05 | **Grand Bastion** | Heavy fortress ramparts guarded by corrupted knights. |
| 06 | **Ashen Catacombs** | Smoldering crypts beneath the citadel foundations. |
| 07 | **Alchemist's Library** | Labyrinth of towering shelves, alembics, and forbidden tomes. |
| 08 | **Eclipse Crown** | The summit beneath a twin eclipse—climax of the campaign. |
`,
    "controls.md": `# Controls & Interface

The interface keeps the arena unobstructed: all navigation sits in one quiet top bar, while spells and quick potions live in a compact bottom action dock.

## Player 1 (Defaults)

| Action | Key |
| :--- | :--- |
| Move Left / Right | \`A\` / \`D\` or Arrow Keys |
| Jump | \`W\` / \`Space\` |
| Rapier Strike | \`J\` |
| Slide / Evade | \`L\` / \`Shift\` |
| Primary / Secondary Spell | \`Q\` / \`E\` (or \`U\` / \`O\`) |
| Quick Potions | \`1\`, \`2\`, \`3\` |

## Navigation & Overlays

| Panel | Shortcut |
| :--- | :--- |
| Inventory | \`I\` |
| Skill Tree | \`K\` |
| Creation Suite (Worlds & Studios) | \`C\` |
| Help & Full Controls Reference | \`H\` or \`?\` |
| Pause | \`P\` |
| Main Menu & Hero Selection | \`M\` or \`Esc\` |
`,
  },
};
