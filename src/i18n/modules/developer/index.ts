import { LanguageCode, DeveloperI18n } from "../../types";
import { dataStudioTranslations } from "./dataStudio";
import { testerTranslations } from "./tester";
import { debugTranslations } from "./debug";
import { atlasStudioTranslations } from "./atlasStudio";

export * from "./dataStudio";
export * from "./tester";
export * from "./debug";
export * from "./atlasStudio";

export const developerTranslations: Record<LanguageCode, DeveloperI18n> = {
  pl: {
    ...dataStudioTranslations.pl,
    ...testerTranslations.pl,
    ...debugTranslations.pl,
    ...atlasStudioTranslations.pl,
  },
  en: {
    ...dataStudioTranslations.en,
    ...testerTranslations.en,
    ...debugTranslations.en,
    ...atlasStudioTranslations.en,
  },
};
