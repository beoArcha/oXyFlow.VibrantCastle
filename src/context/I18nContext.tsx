import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { LanguageCode, SUPPORTED_LANGUAGES, GameTranslationDictionary, translations, t as translateFn, getDomainI18n } from "@i18n";
import gameEngine from "@game/loop/engine";
import { useEngineSubscription } from "./hooks/useEngineSubscription";
import { BaseProviderProps } from "./IContext";
import { MissingContextProviderError } from "@lib/errors";

/**
 * Context value interface for localization and string translations.
 */
export interface I18nContextValue {
  language: LanguageCode;
  supportedLanguages: readonly LanguageCode[];
  setLanguage: (lang: LanguageCode) => void;
  isLanguage: (lang: LanguageCode) => boolean;
  t: (key: (keyof GameTranslationDictionary) | (string & {}), params?: Record<string, string | number>) => string;
  dictionary: GameTranslationDictionary;
  domains: ReturnType<typeof getDomainI18n>;
  /** @deprecated Prefer `isLanguage("pl")` or `language === "pl"` */
  isPl: boolean;
  /** @deprecated Prefer `isLanguage("en")` or `language === "en"` */
  isEn: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps extends BaseProviderProps {
  defaultLanguage?: LanguageCode;
}

/**
 * Context provider managing game localization, translations, language state,
 * and engine language synchronization.
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({ children, defaultLanguage }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (defaultLanguage) {
      gameEngine.setLanguage(defaultLanguage);
      return defaultLanguage;
    }
    return gameEngine.settings.language || "pl";
  });

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    gameEngine.setLanguage(lang);
  }, []);

  const isLanguage = useCallback((lang: LanguageCode) => language === lang, [language]);

  useEngineSubscription(() => {
    if (gameEngine.settings.language !== language) {
      setLanguageState(gameEngine.settings.language);
    }
  }, gameEngine);

  const dictionary = useMemo(() => translations[language] || translations.pl, [language]);
  const domains = useMemo(() => getDomainI18n(language), [language]);

  const t = useCallback(
    (key: (keyof GameTranslationDictionary) | (string & {}), params?: Record<string, string | number>) => {
      return translateFn(language, key, params);
    },
    [language]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      supportedLanguages: SUPPORTED_LANGUAGES,
      setLanguage,
      isLanguage,
      t,
      dictionary,
      domains,
      isPl: language === "pl",
      isEn: language === "en",
    }),
    [language, setLanguage, isLanguage, t, dictionary, domains]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

/**
 * Hook providing access to translation functions, dictionary objects, and language switching.
 *
 * @throws {MissingContextProviderError} when used outside an I18nProvider.
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new MissingContextProviderError("useI18n", "I18nProvider");
  }
  return context;
}
