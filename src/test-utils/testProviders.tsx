import React from "react";
import { I18nProvider } from "@context/I18nContext";
import { GameProvider } from "@context/GameContext";
import { LanguageCode } from "@i18n";

export const TestProviders: React.FC<{ children: React.ReactNode; defaultLanguage?: LanguageCode }> = ({
  children,
  defaultLanguage,
}) => (
  <I18nProvider defaultLanguage={defaultLanguage}>
    <GameProvider>
      {children}
    </GameProvider>
  </I18nProvider>
);
