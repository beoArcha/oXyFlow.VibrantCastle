import type { GameSessionStats } from "../logic/stats/statsTypes";
import type { AssetQuality } from "../../types/assets";
import type { SupportedLanguage } from "./common";
import type { InventoryState } from "./items";

export interface InputMap {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  action1: boolean;
  action2: boolean;
  magic1: boolean;
  magic2: boolean;
  potion1: boolean;
  potion2: boolean;
  potion3: boolean;
}

export interface GamepadBindingMap {
  jump: number;
  action1: number;
  action2: number;
  magic1: number;
  magic2: number;
  potion1: number;
  potion2: number;
  potion3: number;
}

export type { AssetQuality };
export type AspectRatioMode = "16:10" | "16:9" | "4:3" | "auto";
export type ScalingFilterMode = "smooth" | "pixel";
export type TargetFps = 30 | 60 | 90 | 120;

export interface DisplaySettings {
  aspectRatio: AspectRatioMode;
  scalingFilter: ScalingFilterMode;
  assetQuality: AssetQuality;
  targetFps: TargetFps;
  showFpsCounter?: boolean;
  hardwareAcceleration?: boolean;
}

export interface GameSettings {
  language: SupportedLanguage;
  volumeMusic: number;
  volumeSFX: number;
  isTwoPlayer: boolean;
  display: DisplaySettings;
}

export type KeyAction = keyof InputMap;

export interface SaveState {
  timestamp: string;
  p1Health: number;
  p1Mana: number;
  p1Stamina: number;
  p1Score: number;
  p1SkillPoints: number;
  p1UnlockedSkills: string[];
  p1PrimarySpellId?: string;
  p1SecondarySpellId?: string;
  p1Inventory?: InventoryState;
  p2Health: number;
  p2Mana: number;
  p2Stamina: number;
  p2Score: number;
  p2SkillPoints?: number;
  p2UnlockedSkills?: string[];
  p2PrimarySpellId?: string;
  p2SecondarySpellId?: string;
  p2Inventory?: InventoryState;
  levelId: string;
  activatedLevers: string[];
  defeatedEnemies: string[];
  checkpointX: number;
  checkpointY: number;
  stats?: GameSessionStats;
}
