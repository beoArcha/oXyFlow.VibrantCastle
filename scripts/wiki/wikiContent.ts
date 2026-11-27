/**
 * Bilingual (PL / EN) content for the Vibrant Castle GitHub Pages wiki portal.
 *
 * - Articles are the Markdown files in docs/wiki/{pl,en}/, read at build time.
 * - Navigation and tab labels come from docs/wiki/i18n/{pl,en}.json.
 * - The shell strings below (splash, champions, buttons) are local to the portal.
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export type WikiLang = "pl" | "en";

/** Article keys in navigation order. Each maps to docs/wiki/{lang}/{key}.md. */
export const WIKI_ARTICLE_KEYS = [
  "intro",
  "characters",
  "world",
  "bestiary",
  "controls",
  "graphics",
  "architecture",
  "news",
] as const;

export interface WikiI18nDictionary {
  readonly siteTitle: string;
  readonly wikiNavGame: string;
  readonly wikiTabIntro: string;
  readonly wikiTabCharacters: string;
  readonly wikiTabWorld: string;
  readonly wikiTabBestiary: string;
  readonly wikiTabControls: string;
  readonly wikiTabGraphics: string;
  readonly wikiTabArchitecture: string;
  readonly wikiTabNews: string;
  readonly wikiLaunchCta: string;
  readonly wikiSplashEyebrow: string;
  readonly wikiSplashTitle: string;
  readonly wikiSplashLead: string;
  readonly wikiSplashMeta: string;
  readonly wikiFullscreen: string;
  readonly wikiReloadGame: string;
  readonly wikiOpenDirect: string;
  readonly wikiPlayGameLink: string;
  readonly wikiRepoDocsLink: string;
  readonly wikiReturnToGame: string;
  readonly wikiLoadingArticle: string;
  readonly wikiErrorArticle: string;
  readonly wikiHeroValenRole: string;
  readonly wikiHeroValenPassive: string;
  readonly wikiHeroValenSummary: string;
  readonly wikiHeroAureliaRole: string;
  readonly wikiHeroAureliaPassive: string;
  readonly wikiHeroAureliaSummary: string;
  readonly wikiFooterCopyright: string;
  readonly wikiFooterRepo: string;
  readonly wikiFooterSource: string;
  readonly wikiFooterIssues: string;
}

/** Shell strings owned by this module. The rest comes from docs/wiki/i18n. */
type WikiLocalDictionary = Omit<
  WikiI18nDictionary,
  | "wikiNavGame"
  | "wikiTabIntro"
  | "wikiTabCharacters"
  | "wikiTabWorld"
  | "wikiTabBestiary"
  | "wikiTabControls"
  | "wikiTabGraphics"
  | "wikiTabArchitecture"
  | "wikiTabNews"
  | "wikiFooterCopyright"
  | "wikiFooterRepo"
  | "wikiFooterSource"
  | "wikiFooterIssues"
>;

const WIKI_SOURCE_DIR = resolve(import.meta.dirname, "../../docs/wiki");

const LOCAL_DICTIONARIES: Readonly<Record<WikiLang, WikiLocalDictionary>> = {
  pl: {
    siteTitle: "Vibrant Castle — Kronika Cytadeli Aetheru",
    wikiLaunchCta: "Uruchom Grę",
    wikiSplashEyebrow: "Cytadela Wiecznej Jesieni",
    wikiSplashTitle: "Vibrant Castle",
    wikiSplashLead:
      "Gotycka metroidvania 2D w zawieszonej w czasie Cytadeli Aetheru. Prowadź Valena lub Aurelię solo albo w lokalnej kooperacji 2P przez osiem połączonych światów.",
    wikiSplashMeta: "8 światów · mapa 1 z 8 w każdym · Solo i 2P · Klawiatura i pad",
    wikiFullscreen: "Pełny ekran",
    wikiReloadGame: "Restart sesji",
    wikiOpenDirect: "Otwórz samą grę",
    wikiPlayGameLink: "Zagraj w grę",
    wikiRepoDocsLink: "Dokumentacja w repozytorium",
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
  },
  en: {
    siteTitle: "Vibrant Castle — Chronicle of the Aether Citadel",
    wikiLaunchCta: "Launch Game",
    wikiSplashEyebrow: "Citadel of Eternal Autumn",
    wikiSplashTitle: "Vibrant Castle",
    wikiSplashLead:
      "A gothic 2D metroidvania set inside the time-fractured Citadel of Aether. Guide Valen or Aurelia solo or in local 2-player co-op through eight linked worlds.",
    wikiSplashMeta: "8 worlds · map 1 of 8 in each · Solo & 2P · Keyboard & pad",
    wikiFullscreen: "Fullscreen",
    wikiReloadGame: "Reload session",
    wikiOpenDirect: "Open standalone",
    wikiPlayGameLink: "Play the game",
    wikiRepoDocsLink: "Repository docs",
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
  },
};

function readRequiredText(path: string): string {
  return readFileSync(path, "utf8");
}

function loadDocDictionary(lang: WikiLang): Partial<WikiI18nDictionary> {
  const path = join(WIKI_SOURCE_DIR, "i18n", `${lang}.json`);
  return JSON.parse(readRequiredText(path)) as Partial<WikiI18nDictionary>;
}

function buildDictionary(lang: WikiLang): WikiI18nDictionary {
  const merged = { ...LOCAL_DICTIONARIES[lang], ...loadDocDictionary(lang) };
  const required: readonly (keyof WikiI18nDictionary)[] = [
    "wikiNavGame",
    "wikiTabIntro",
    "wikiTabCharacters",
    "wikiTabWorld",
    "wikiTabBestiary",
    "wikiTabControls",
    "wikiTabGraphics",
    "wikiTabArchitecture",
    "wikiTabNews",
    "wikiFooterCopyright",
    "wikiFooterRepo",
    "wikiFooterSource",
    "wikiFooterIssues",
  ];
  for (const key of required) {
    if (typeof merged[key] !== "string" || merged[key].length === 0) {
      throw new Error(`[wiki] docs/wiki/i18n/${lang}.json is missing "${key}"`);
    }
  }
  return merged as WikiI18nDictionary;
}

export const WIKI_DICTIONARIES: Readonly<Record<WikiLang, WikiI18nDictionary>> = {
  pl: buildDictionary("pl"),
  en: buildDictionary("en"),
};

function loadArticles(lang: WikiLang): Readonly<Record<string, string>> {
  const articles: Record<string, string> = {};
  for (const key of WIKI_ARTICLE_KEYS) {
    const path = join(WIKI_SOURCE_DIR, lang, `${key}.md`);
    articles[`${key}.md`] = readRequiredText(path);
  }
  return articles;
}

/** Markdown articles keyed by file name ("intro.md", ...), in navigation order. */
export const WIKI_ARTICLES: Readonly<Record<WikiLang, Readonly<Record<string, string>>>> = {
  pl: loadArticles("pl"),
  en: loadArticles("en"),
};
