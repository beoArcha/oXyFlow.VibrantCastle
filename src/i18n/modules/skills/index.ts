import { LanguageCode, SkillsI18n } from "../../types";
import { skillsProgressionTranslations } from "./progression";
import { skillsSpellsTranslations } from "./spells";

export * from "./progression";
export * from "./spells";

export const skillsTranslations: Record<LanguageCode, SkillsI18n> = {
  pl: {
    ...skillsProgressionTranslations.pl,
    ...skillsSpellsTranslations.pl,
  },
  en: {
    ...skillsProgressionTranslations.en,
    ...skillsSpellsTranslations.en,
  },
};
