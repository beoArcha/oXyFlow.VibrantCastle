import { LanguageCode, SettingsI18n } from "../../types";
import { settingsGameplayTranslations } from "./gameplay";
import { settingsControlsTranslations } from "./controls";
import { settingsDisplayTranslations } from "./display";
import { settingsAudioTranslations } from "./audio";
import { settingsStudioTranslations } from "./studio";

export * from "./gameplay";
export * from "./controls";
export * from "./display";
export * from "./audio";
export * from "./studio";

export const settingsTranslations: Record<LanguageCode, SettingsI18n> = {
  pl: {
    ...settingsGameplayTranslations.pl,
    ...settingsControlsTranslations.pl,
    ...settingsDisplayTranslations.pl,
    ...settingsAudioTranslations.pl,
    ...settingsStudioTranslations.pl,
  },
  en: {
    ...settingsGameplayTranslations.en,
    ...settingsControlsTranslations.en,
    ...settingsDisplayTranslations.en,
    ...settingsAudioTranslations.en,
    ...settingsStudioTranslations.en,
  },
};
