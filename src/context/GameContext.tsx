import React from "react";
import gameEngine from "@game/loop/engine";
import { SettingsProvider } from "./SettingsContext";
import { SaveGameProvider } from "./SaveGameContext";
import { GameSessionProvider } from "./GameSessionContext";
import { InventoryProvider } from "./InventoryContext";
import { SkillsProvider } from "./SkillsContext";

export interface GameProviderProps {
  children: React.ReactNode;
}

/**
 * Main GameProvider composing modular domain-specific providers hierarchically:
 * SettingsProvider -> SaveGameProvider -> GameSessionProvider -> InventoryProvider -> SkillsProvider
 *
 * Each domain manages its own state and subscription to avoid unnecessary re-rendering
 * across decoupled systems (SRP & ISP).
 */
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  return (
    <SettingsProvider>
      <SaveGameProvider>
        <GameSessionProvider>
          <InventoryProvider engine={gameEngine}>
            <SkillsProvider engine={gameEngine}>
              {children}
            </SkillsProvider>
          </InventoryProvider>
        </GameSessionProvider>
      </SaveGameProvider>
    </SettingsProvider>
  );
};

// Re-export modular domain contexts and hooks for convenient barrel imports
export * from "./IContext";
export * from "./settingsTypes";
export * from "./SettingsContext";
export * from "./SaveGameContext";
export * from "./GameSessionContext";
export * from "./InventoryContext";
export * from "./SkillsContext";
