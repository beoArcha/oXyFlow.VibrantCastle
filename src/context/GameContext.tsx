import React, { createContext, useContext, useMemo, useCallback } from "react";
import {
  Player,
  DisplaySettings,
  LocationDefinition,
  LocationId,
  SaveState,
} from "../game/types";
import {
  SettingsProvider,
  useSettings,
} from "./SettingsContext";
import {
  SaveGameProvider,
  useSaveGame,
} from "./SaveGameContext";
import {
  GameSessionProvider,
  useGameSession,
} from "./GameSessionContext";
import {
  InventoryProvider,
  useInventory,
  InventoryContextValue,
} from "./InventoryContext";
import { MissingContextProviderError } from "../lib/errors";
import {
  SkillsProvider,
  useSkills,
  SkillsContextValue,
} from "./SkillsContext";
import gameEngine from "../game/loop/engine";
import {
  GameSettingsState,
  HudSettings,
} from "./settingsTypes";
import {
  InventoryState,
  EquipmentState,
} from "../game/types";

export interface GameContextValue {
  // Session & World State
  p1: Player | undefined;
  p2: Player | undefined;
  isTwoPlayer: boolean;
  isVictory: boolean;
  isDefeat: boolean;
  isPaused: boolean;
  currentLocation: LocationDefinition;
  currentLocationId: LocationId;
  narration: string;
  subAnim: boolean;
  isAudioInitialized: boolean;
  tick: number;

  // Settings Slice
  settings: GameSettingsState;
  displaySettings: DisplaySettings;
  volumeMusic: number;
  volumeSFX: number;
  hudSettings: HudSettings;

  // Save / Persistence Slice
  saveNotification: string;
  lastSavedState: SaveState | null;

  // Inventory Slice
  activeInventoryPlayerIndex: number;
  setActiveInventoryPlayerIndex: (idx: number) => void;
  activeInventoryPlayer: Player | undefined;
  activeInventory: InventoryState | null;
  activeDerivedStats: {
    totalAttack: number;
    totalDefense: number;
    maxHp: number;
    maxMana: number;
    maxStamina: number;
    manaRegen: number;
    staminaRegen: number;
  };

  // Session Actions
  setPaused: (paused: boolean) => void;
  togglePause: (forceState?: boolean) => boolean;
  restart: () => void;
  loadLocation: (locId: LocationId) => void;
  advanceLocation: () => void;
  initializeAudio: () => void;
  notifyEngineUpdate: () => void;

  // Settings Actions
  setTwoPlayer: (enabled: boolean) => void;
  setDisplaySettings: (settings: Partial<DisplaySettings>) => void;
  setVolumeMusic: (val: number) => void;
  setVolumeSFX: (val: number) => void;
  setHudSettings: (hud: Partial<HudSettings>) => void;
  updateSettings: (partial: Partial<GameSettingsState>) => void;
  resetSettingsToDefaults: () => void;
  exportSettingsToFile: () => void;
  importSettingsFromFile: (file: File) => Promise<boolean>;

  // Save / Load Actions
  saveGame: () => void;
  loadGame: (fileEvent?: React.ChangeEvent<HTMLInputElement>) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  exportSaveToFile: () => void;
  importSaveFromFile: (file: File) => Promise<boolean>;
  exportSaveToJson: () => string;
  importSaveFromJson: (jsonStr: string) => boolean;
  setSaveNotification: (text: string) => void;

  // Inventory Actions
  equipItem: (backpackIndex: number, playerIndex?: number) => boolean;
  unequipItem: (slot: keyof EquipmentState, playerIndex?: number) => boolean;
  usePotion: (slotIndex: number, playerIndex?: number) => boolean;
  discardItem: (backpackIndex: number, playerIndex?: number) => boolean;

  // Orchestrator Helper Actions
  resetAll: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

/**
 * Inner bridge that unifies Settings, Save, Inventory, and Session into the single GameContext.
 */
const GameContextBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = useGameSession();
  const settingsCtx = useSettings();
  const saveCtx = useSaveGame();
  const inv = useInventory();
  const skillsCtx = useSkills();

  const resetAll = useCallback(() => {
    settingsCtx.resetToDefaults();
    saveCtx.resetToDefaults();
    inv.resetToDefaults();
    skillsCtx.resetToDefaults();
    session.restart();
  }, [
    settingsCtx.resetToDefaults,
    saveCtx.resetToDefaults,
    inv.resetToDefaults,
    skillsCtx.resetToDefaults,
    session.restart,
  ]);

  const value = useMemo<GameContextValue>(() => {
    return {
      // Session
      p1: session.p1,
      p2: session.p2,
      isVictory: session.isVictory,
      isDefeat: session.isDefeat,
      isPaused: session.isPaused,
      currentLocation: session.currentLocation,
      currentLocationId: session.currentLocationId,
      narration: session.narration,
      subAnim: session.subAnim,
      isAudioInitialized: session.isAudioInitialized,
      tick: session.tick,
      setPaused: session.setPaused,
      togglePause: session.togglePause,
      restart: session.restart,
      loadLocation: session.loadLocation,
      advanceLocation: session.advanceLocation,
      initializeAudio: session.initializeAudio,
      notifyEngineUpdate: session.notifyEngineUpdate,

      // Settings
      settings: settingsCtx.settings,
      displaySettings: settingsCtx.displaySettings,
      volumeMusic: settingsCtx.volumeMusic,
      volumeSFX: settingsCtx.volumeSFX,
      isTwoPlayer: settingsCtx.isTwoPlayer,
      hudSettings: settingsCtx.hudSettings,
      setTwoPlayer: settingsCtx.setTwoPlayer,
      setDisplaySettings: settingsCtx.setDisplaySettings,
      setVolumeMusic: settingsCtx.setVolumeMusic,
      setVolumeSFX: settingsCtx.setVolumeSFX,
      setHudSettings: settingsCtx.setHudSettings,
      updateSettings: settingsCtx.updateSettings,
      resetSettingsToDefaults: settingsCtx.resetToDefaults,
      exportSettingsToFile: settingsCtx.exportSettingsToFile,
      importSettingsFromFile: settingsCtx.importSettingsFromFile,

      // Save / Load
      saveNotification: saveCtx.saveNotification,
      lastSavedState: saveCtx.lastSavedState,
      setSaveNotification: saveCtx.setSaveNotification,
      saveGame: saveCtx.saveGame,
      loadGame: saveCtx.loadGame,
      saveToLocalStorage: saveCtx.saveToLocalStorage,
      loadFromLocalStorage: saveCtx.loadFromLocalStorage,
      exportSaveToFile: saveCtx.exportSaveToFile,
      importSaveFromFile: saveCtx.importSaveFromFile,
      exportSaveToJson: saveCtx.exportToJson,
      importSaveFromJson: saveCtx.importFromJson,

      // Inventory
      activeInventoryPlayerIndex: inv.activePlayerIndex,
      setActiveInventoryPlayerIndex: inv.setActivePlayerIndex,
      activeInventoryPlayer: inv.activePlayer,
      activeInventory: inv.activeInventory,
      activeDerivedStats: inv.activeDerivedStats,
      equipItem: inv.equipItem,
      unequipItem: inv.unequipItem,
      usePotion: inv.usePotion,
      discardItem: inv.discardItem,

      // Orchestrator Action
      resetAll,
    };
  }, [
    session.p1,
    session.p2,
    session.isVictory,
    session.isDefeat,
    session.isPaused,
    session.currentLocation,
    session.currentLocationId,
    session.narration,
    session.subAnim,
    session.isAudioInitialized,
    session.tick,
    session.setPaused,
    session.togglePause,
    session.restart,
    session.loadLocation,
    session.advanceLocation,
    session.initializeAudio,
    session.notifyEngineUpdate,

    settingsCtx.settings,
    settingsCtx.displaySettings,
    settingsCtx.volumeMusic,
    settingsCtx.volumeSFX,
    settingsCtx.isTwoPlayer,
    settingsCtx.hudSettings,
    settingsCtx.setTwoPlayer,
    settingsCtx.setDisplaySettings,
    settingsCtx.setVolumeMusic,
    settingsCtx.setVolumeSFX,
    settingsCtx.setHudSettings,
    settingsCtx.updateSettings,
    settingsCtx.resetToDefaults,
    settingsCtx.exportSettingsToFile,
    settingsCtx.importSettingsFromFile,

    saveCtx.saveNotification,
    saveCtx.lastSavedState,
    saveCtx.setSaveNotification,
    saveCtx.saveGame,
    saveCtx.loadGame,
    saveCtx.saveToLocalStorage,
    saveCtx.loadFromLocalStorage,
    saveCtx.exportSaveToFile,
    saveCtx.importSaveFromFile,
    saveCtx.exportToJson,
    saveCtx.importFromJson,

    inv.activePlayerIndex,
    inv.setActivePlayerIndex,
    inv.activePlayer,
    inv.activeInventory,
    inv.activeDerivedStats,
    inv.equipItem,
    inv.unequipItem,
    inv.usePotion,
    inv.discardItem,

    resetAll,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

/**
 * Main GameProvider composing modular contexts hierarchically:
 * SettingsProvider -> SaveGameProvider -> GameSessionProvider -> InventoryProvider -> SkillsProvider -> GameContextBridge.
 */
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SettingsProvider>
      <SaveGameProvider>
        <GameSessionProvider>
          <InventoryProvider engine={gameEngine}>
            <SkillsProvider engine={gameEngine}>
              <GameContextBridge>{children}</GameContextBridge>
            </SkillsProvider>
          </InventoryProvider>
        </GameSessionProvider>
      </SaveGameProvider>
    </SettingsProvider>
  );
};

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new MissingContextProviderError("useGame", "GameProvider");
  }
  return context;
}

export * from "./IContext";
export * from "./settingsTypes";
export * from "./SettingsContext";
export * from "./SaveGameContext";
export * from "./GameSessionContext";
export * from "./InventoryContext";
export * from "./SkillsContext";
