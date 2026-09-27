import React from "react";
import { I18nProvider } from "../context/I18nContext";
import { GameProvider } from "../context/GameContext";

export const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nProvider>
    <GameProvider>
      {children}
    </GameProvider>
  </I18nProvider>
);
