import { LanguageCode, DeveloperI18n } from "../../types";
import { dataStudioTranslations } from "./dataStudio";
import { testerTranslations } from "./tester";
import { debugTranslations } from "./debug";
import { atlasStudioTranslations } from "./atlasStudio";
import { devToolsTranslations } from "./devTools";
import { levelsMapTranslations } from "./levelsMap";

export * from "./dataStudio";
export * from "./tester";
export * from "./debug";
export * from "./atlasStudio";
export * from "./devTools";
export * from "./levelsMap";

export const developerTranslations: Record<LanguageCode, DeveloperI18n> = {
  pl: {
    ...dataStudioTranslations.pl,
    ...testerTranslations.pl,
    ...debugTranslations.pl,
    ...atlasStudioTranslations.pl,
    ...devToolsTranslations.pl,
    ...levelsMapTranslations.pl,
  },
  en: {
    ...dataStudioTranslations.en,
    ...testerTranslations.en,
    ...debugTranslations.en,
    ...atlasStudioTranslations.en,
    ...devToolsTranslations.en,
    ...levelsMapTranslations.en,
  },
};
