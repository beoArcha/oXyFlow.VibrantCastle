import React from "react";
import { I18nProvider } from "@context/I18nContext";
import { GameProvider } from "@context/GameContext";
import { LanguageCode } from "@i18n";

export interface TestProvidersProps {
  children: React.ReactNode;
  defaultLanguage?: LanguageCode;
}

/**
 * Lightweight provider for isolated UI unit tests.
 * Only mounts presentation-layer contexts (I18n) without spinning up
 * the GameEngine, sound, loop, or session subscriptions.
 */
export const UiTestProviders: React.FC<TestProvidersProps> = ({
  children,
  defaultLanguage,
}) => (
  <I18nProvider defaultLanguage={defaultLanguage}>
    {children}
  </I18nProvider>
);

/**
 * Full integration provider mounting both I18n and GameEngine contexts
 * (Settings, SaveGame, GameSession, Inventory, Skills).
 * Use for cross-system, engine-dependent, or modal integration tests.
 */
export const IntegrationTestProviders: React.FC<TestProvidersProps> = ({
  children,
  defaultLanguage,
}) => (
  <I18nProvider defaultLanguage={defaultLanguage}>
    <GameProvider>
      {children}
    </GameProvider>
  </I18nProvider>
);

/**
 * Backward-compatible alias pointing to IntegrationTestProviders.
 */
export const TestProviders = IntegrationTestProviders;
