import { DisplaySettings } from "../game/types";
import { IContext } from "./IContext";

export interface HudQuickKeysSettings {
  primarySpell: string;
  secondarySpell: string;
  potionsRange: string;
}

export interface HudSettings {
  p1CharacterName: string;
  p2CharacterName: string;
  p1ThemeColor: "red" | "cyan";
  p2ThemeColor: "red" | "cyan";
  p1AttackFallback: number;
  p2AttackFallback: number;
  p1QuickKeys: HudQuickKeysSettings;
  p2QuickKeys: HudQuickKeysSettings;
  showRpgButtons: boolean;
  showControlsHint: boolean;
  showNarratorSubtitles: boolean;
  showCreationTab: boolean;
  hudScale: "compact" | "normal" | "large";
}

export interface GameSettingsState {
  version: number;
  language: "pl" | "en";
  volumeMusic: number;
  volumeSFX: number;
  isTwoPlayer: boolean;
  display: DisplaySettings;
  hud: HudSettings;
}

export const DEFAULT_SETTINGS: GameSettingsState = {
  version: 1,
  language: "pl",
  volumeMusic: 0.45,
  volumeSFX: 0.65,
  isTwoPlayer: false,
  display: {
    aspectRatio: "16:10",
    scalingFilter: "pixel",
    assetQuality: "high",
    targetFps: 60,
    showFpsCounter: false,
  },
  hud: {
    p1CharacterName: "Valen",
    p2CharacterName: "Aurelia",
    p1ThemeColor: "red",
    p2ThemeColor: "cyan",
    p1AttackFallback: 20,
    p2AttackFallback: 20,
    p1QuickKeys: {
      primarySpell: "U",
      secondarySpell: "O",
      potionsRange: "1-3",
    },
    p2QuickKeys: {
      primarySpell: "Num4",
      secondarySpell: "Num5",
      potionsRange: "Num7-9",
    },
    showRpgButtons: true,
    showControlsHint: true,
    showNarratorSubtitles: true,
    showCreationTab: true,
    hudScale: "normal",
  },
};

/**
 * Settings Context Value interface extending IContext.
 */
export interface SettingsContextValue extends IContext<GameSettingsState> {
  settings: GameSettingsState;
  displaySettings: DisplaySettings;
  volumeMusic: number;
  volumeSFX: number;
  isTwoPlayer: boolean;
  hudSettings: HudSettings;

  // Granular mutation actions
  setDisplaySettings: (display: Partial<DisplaySettings>) => void;
  setVolumeMusic: (val: number) => void;
  setVolumeSFX: (val: number) => void;
  setTwoPlayer: (val: boolean) => void;
  setHudSettings: (hud: Partial<HudSettings>) => void;
  updateSettings: (partial: Partial<GameSettingsState>) => void;

  // File I/O for settings
  exportSettingsToFile: () => void;
  importSettingsFromFile: (file: File) => Promise<boolean>;
}
