import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  GameTranslationDictionary,
  translations,
  t as translateFn,
  getDomainI18n,
} from "@i18n";
import defaultGameEngine, { GameEngine } from "@game/loop/engine";
import { useEngineSubscription } from "./hooks/useEngineSubscription";
import { BaseProviderProps } from "./IContext";
import { MissingContextProviderError } from "@lib/errors";

/**
 * Context value interface for localization and string translations.
 */
export interface LocaleContextValue {
  language: LanguageCode;
  supportedLanguages: readonly LanguageCode[];
  setLanguage: (lang: LanguageCode) => void;
  isLanguage: (lang: LanguageCode) => boolean;
  t: (
    key: (keyof GameTranslationDictionary) | (string & {}),
    params?: Record<string, string | number>
  ) => string;
  dictionary: GameTranslationDictionary;
  domains: ReturnType<typeof getDomainI18n>;
  /** @deprecated Prefer `isLanguage("pl")` or `language === "pl"` */
  isPl: boolean;
  /** @deprecated Prefer `isLanguage("en")` or `language === "en"` */
  isEn: boolean;
}

/** Legacy alias for backwards compatibility */
export type I18nContextValue = LocaleContextValue;

export const LocaleContext = createContext<LocaleContextValue | null>(null);

export interface LocaleProviderProps extends BaseProviderProps {
  defaultLanguage?: LanguageCode;
  engine?: GameEngine;
}

/** Legacy alias for backwards compatibility */
export type I18nProviderProps = LocaleProviderProps;

/**
 * Context provider managing game localization, translations, language state,
 * and engine language synchronization. Canonical port for frontend_ui.md.
 */
export const LocaleProvider: React.FC<LocaleProviderProps> = ({
  children,
  defaultLanguage,
  engine = defaultGameEngine,
}) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    return defaultLanguage || engine.settings.language || "pl";
  });

  useEffect(() => {
    if (defaultLanguage && engine.settings.language !== defaultLanguage) {
      engine.setLanguage(defaultLanguage);
    }
  }, [defaultLanguage, engine]);

  const setLanguage = useCallback(
    (lang: LanguageCode) => {
      setLanguageState(lang);
      engine.setLanguage(lang);
    },
    [engine]
  );

  const isLanguage = useCallback(
    (lang: LanguageCode) => language === lang,
    [language]
  );

  useEngineSubscription(() => {
    if (engine.settings.language !== language) {
      setLanguageState(engine.settings.language);
    }
  }, engine);

  const dictionary = useMemo(
    () => translations[language] || translations.pl,
    [language]
  );
  const domains = useMemo(() => getDomainI18n(language), [language]);

  const t = useCallback(
    (
      key: (keyof GameTranslationDictionary) | (string & {}),
      params?: Record<string, string | number>
    ) => {
      return translateFn(language, key, params);
    },
    [language]
  );

  const value = useMemo<LocaleContextValue>(
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

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
};

/** Legacy alias for backwards compatibility */
export const I18nProvider = LocaleProvider;

/**
 * Hook providing access to translation functions, dictionary objects, and language switching.
 * Canonical hook complying with frontend_ui.md.
 *
 * @throws {MissingContextProviderError} when used outside a LocaleProvider.
 */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new MissingContextProviderError("useLocale", "LocaleProvider");
  }
  return context;
}

/**
 * Legacy hook for backwards compatibility.
 *
 * @throws {MissingContextProviderError} when used outside an I18nProvider.
 */
export function useI18n(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new MissingContextProviderError("useI18n", "I18nProvider");
  }
  return context;
}
