import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { LanguageCode, GameTranslationDictionary, translations, t as translateFn, getDomainI18n } from "../game/i18n";
import gameEngine from "../game/loop/engine";

export interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof GameTranslationDictionary | string, params?: Record<string, string | number>) => string;
  dictionary: GameTranslationDictionary;
  domains: ReturnType<typeof getDomainI18n>;
  isPl: boolean;
  isEn: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(gameEngine.settings.language || "pl");

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    gameEngine.setLanguage(lang);
  }, []);

  useEffect(() => {
    const unbind = gameEngine.registerStateListener(() => {
      if (gameEngine.settings.language !== language) {
        setLanguageState(gameEngine.settings.language);
      }
    });
    return () => unbind();
  }, [language]);

  const dictionary = useMemo(() => translations[language] || translations.pl, [language]);
  const domains = useMemo(() => getDomainI18n(language), [language]);

  const t = useCallback(
    (key: keyof GameTranslationDictionary | string, params?: Record<string, string | number>) => {
      return translateFn(language, key, params);
    },
    [language]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      dictionary,
      domains,
      isPl: language === "pl",
      isEn: language === "en",
    }),
    [language, setLanguage, t, dictionary, domains]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
