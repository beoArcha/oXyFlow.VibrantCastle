import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  GameTranslationDictionary,
  translations,
  t as translateFn,
} from "@i18n";
import gameEngine from "@game/loop/engine";
import { MissingContextProviderError } from "@lib/errors";
import { BaseProviderProps } from "./IContext";

const STORAGE_LANG_KEY = "vibrant_castle_language";

function readInitialLanguage(defaultLanguage?: LanguageCode): LanguageCode {
  if (defaultLanguage && SUPPORTED_LANGUAGES.includes(defaultLanguage)) {
    return defaultLanguage;
  }
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_LANG_KEY);
      if (saved && SUPPORTED_LANGUAGES.includes(saved as LanguageCode)) {
        return saved as LanguageCode;
      }
    } catch {
      // Ignore storage access errors in sandboxed iframes
    }
  }
  return "pl";
}

export interface LocaleContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (
    key: (keyof GameTranslationDictionary) | (string & {}),
    params?: Record<string, string | number>
  ) => string;
  dict: GameTranslationDictionary;
  supportedLanguages: readonly LanguageCode[];
}

export type I18nContextValue = LocaleContextValue;

const LocaleContext = createContext<LocaleContextValue | null>(null);

export interface LocaleProviderProps extends BaseProviderProps {
  defaultLanguage?: LanguageCode;
}

export type I18nProviderProps = LocaleProviderProps;

/**
 * Provides reactive localization state synchronized with the game engine and localStorage.
 */
export const LocaleProvider: React.FC<LocaleProviderProps> = ({
  children,
  defaultLanguage,
}) => {
  const [language, setLanguageState] = useState<LanguageCode>(() =>
    readInitialLanguage(defaultLanguage)
  );

  useEffect(() => {
    gameEngine.setLanguage(language);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_LANG_KEY, language);
      } catch {
        // Ignore storage write failures
      }
    }
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
    }
  }, []);

  const translate = useCallback(
    (
      key: (keyof GameTranslationDictionary) | (string & {}),
      params?: Record<string, string | number>
    ): string => translateFn(language, key, params),
    [language]
  );

  const dict = useMemo<GameTranslationDictionary>(
    () => translations[language] || translations.pl,
    [language]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      setLanguage,
      t: translate,
      dict,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage, translate, dict]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

export const I18nProvider = LocaleProvider;

/**
 * Hook providing reactive translations and language switching.
 *
 * @throws {MissingContextProviderError} when used outside a LocaleProvider / I18nProvider.
 */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new MissingContextProviderError("useLocale", "LocaleProvider");
  }
  return context;
}

export const useI18n = useLocale;
