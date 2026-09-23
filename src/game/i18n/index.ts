import { LanguageCode, GameTranslationDictionary } from "./types";
import { hudTranslations } from "./modules/hud";
import { settingsTranslations } from "./modules/settings";
import { inventoryTranslations } from "./modules/inventory";
import { skillsTranslations } from "./modules/skills";
import { itemsTranslations } from "./modules/items";
import { locationsTranslations } from "./modules/locations";
import { narrationsTranslations } from "./modules/narrations";
import { dialoguesTranslations } from "./modules/dialogues";
import { loreTranslations } from "./modules/lore";
import { formatString } from "../../lib/utils";

export * from "./types";
export * from "./modules/hud";
export * from "./modules/settings";
export * from "./modules/inventory";
export * from "./modules/skills";
export * from "./modules/items";
export * from "./modules/locations";
export * from "./modules/narrations";
export * from "./modules/dialogues";
export * from "./modules/lore";

const buildCombinedDictionary = (lang: LanguageCode): GameTranslationDictionary => {
  return {
    ...hudTranslations[lang],
    ...settingsTranslations[lang],
    ...inventoryTranslations[lang],
    ...skillsTranslations[lang],
    ...itemsTranslations[lang],
    ...locationsTranslations[lang],
    ...narrationsTranslations[lang],
    ...dialoguesTranslations[lang],
    ...loreTranslations[lang],
  };
};

export const translations: Record<LanguageCode, GameTranslationDictionary> = {
  pl: buildCombinedDictionary("pl"),
  en: buildCombinedDictionary("en"),
};

/**
 * Type-safe translation getter with interpolation support.
 */
export function t(
  lang: LanguageCode,
  key: keyof GameTranslationDictionary | string,
  params?: Record<string, string | number>
): string {
  const dict = translations[lang] || translations.pl;
  const raw = (dict as unknown as Record<string, string>)[key] || (key as string);
  return params ? formatString(raw, params) : raw;
}

/**
 * Returns complete domain-segmented dictionary.
 */
export function getDomainI18n(lang: LanguageCode) {
  return {
    hud: hudTranslations[lang],
    settings: settingsTranslations[lang],
    inventory: inventoryTranslations[lang],
    skills: skillsTranslations[lang],
    items: itemsTranslations[lang],
    locations: locationsTranslations[lang],
    narrations: narrationsTranslations[lang],
    dialogues: dialoguesTranslations[lang],
    lore: loreTranslations[lang],
  };
}

export default translations;
