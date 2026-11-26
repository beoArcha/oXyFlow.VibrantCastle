import {
  DisplaySettings,
  GameSettings,
  AspectRatioMode,
  ScalingFilterMode,
  TargetFps,
  AssetQuality,
} from "@game/types";
import type { PlayerTheme } from "@styles/theme";
import { IContext } from "../IContext";

export type {
  AspectRatioMode,
  ScalingFilterMode,
  TargetFps,
  AssetQuality,
};

export type HudThemeColor = PlayerTheme | "red";

export interface HudQuickKeysSettings {
  primarySpell: string;
  secondarySpell: string;
  potionsRange: string;
}

export interface HudSettings {
  showRpgButtons: boolean;
  showControlsHint: boolean;
  showNarratorSubtitles: boolean;
  p1CharacterName: string;
  p2CharacterName: string;
  p1ThemeColor: HudThemeColor;
  p2ThemeColor: HudThemeColor;
  p1AttackFallback: number;
  p2AttackFallback: number;
  p1QuickKeys: HudQuickKeysSettings;
  p2QuickKeys: HudQuickKeysSettings;
}

export interface GameSettingsState extends GameSettings {
  primaryCharacter: "valen" | "aurelia";
  hud: HudSettings;
}

export const DEFAULT_HUD_SETTINGS: HudSettings = {
  showRpgButtons: true,
  showControlsHint: true,
  showNarratorSubtitles: true,
  p1CharacterName: "Valen",
  p2CharacterName: "Aurelia",
  p1ThemeColor: "crimson",
  p2ThemeColor: "cyan",
  p1AttackFallback: 35,
  p2AttackFallback: 28,
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
};

export const DEFAULT_SETTINGS: GameSettingsState = {
  language: "pl",
  volumeMusic: 0.4,
  volumeSFX: 0.6,
  isTwoPlayer: false,
  primaryCharacter: "valen",
  display: {
    aspectRatio: "16:10",
    scalingFilter: "pixel",
    assetQuality: "high",
    targetFps: 60,
    showFpsCounter: false,
    hardwareAcceleration: true,
  },
  hud: DEFAULT_HUD_SETTINGS,
};

export interface SettingsContextValue extends IContext {
  settings: GameSettingsState;
  displaySettings: DisplaySettings;
  volumeMusic: number;
  volumeSFX: number;
  isTwoPlayer: boolean;
  primaryCharacter: "valen" | "aurelia";
  hudSettings: HudSettings;

  setDisplaySettings: (displayUpdates: Partial<DisplaySettings>) => void;
  setVolumeMusic: (val: number) => void;
  setVolumeSFX: (val: number) => void;
  setTwoPlayer: (val: boolean) => void;
  setPrimaryCharacter: (charId: "valen" | "aurelia") => void;
  setHudSettings: (hudUpdates: Partial<HudSettings>) => void;
  updateSettings: (partial: Partial<GameSettingsState>) => void;

  exportSettingsToFile: () => void;
  importSettingsFromFile: (file: File) => Promise<boolean>;
}
