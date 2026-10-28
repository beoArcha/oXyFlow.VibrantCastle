import React from "react";
import gameEngine from "@game/loop/engine";
import { SettingsProvider } from "./SettingsContext";
import { ControlsProvider } from "./ControlsContext";
import { SaveGameProvider } from "./SaveGameContext";
import { GameSessionProvider } from "./GameSessionContext";
import { InventoryProvider } from "./InventoryContext";
import { SkillsProvider } from "./SkillsContext";
import { BaseProviderProps } from "./IContext";

export interface GameProviderProps extends BaseProviderProps {}

/**
 * Main GameProvider composing modular domain-specific providers hierarchically:
 * SettingsProvider -> ControlsProvider -> SaveGameProvider -> GameSessionProvider -> InventoryProvider -> SkillsProvider
 *
 * Each domain manages its own state and subscription to avoid unnecessary re-rendering
 * across decoupled presentation layers.
 */
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  return (
    <SettingsProvider>
      <ControlsProvider>
        <SaveGameProvider>
          <GameSessionProvider>
            <InventoryProvider engine={gameEngine}>
              <SkillsProvider engine={gameEngine}>
                {children}
              </SkillsProvider>
            </InventoryProvider>
          </GameSessionProvider>
        </SaveGameProvider>
      </ControlsProvider>
    </SettingsProvider>
  );
};

// Re-export modular domain contexts and hooks for convenient barrel imports
export * from "./IContext";
export * from "./settingsTypes";
export * from "./SettingsContext";
export * from "./ControlsContext";
export * from "./SaveGameContext";
export * from "./GameSessionContext";
export * from "./InventoryContext";
export * from "./SkillsContext";
