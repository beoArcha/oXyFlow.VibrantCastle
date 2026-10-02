import { LocationId } from "@game/locations";
import { BackgroundLayerTier } from "@game/locations/schema/locationSchema";
import { SpawnPreset } from "@game/debug/debugManager";
import { PlayerId } from "@game/types";

export type TesterParticleType = "spark" | "magic" | "dust";

export interface MusicIntensityPreset {
  labelKey: string;
  val: number;
}

export interface MonsterOption {
  id: string;
  translationKey: string;
}

export interface TesterTeleportCardProps {
  currentLocationId: LocationId;
  onLoadLocation: (locId: LocationId) => void;
  onTeleportPlayer?: (x: number, y: number) => void;
  playerX?: number;
  playerY?: number;
  clickToTeleport: boolean;
  onToggleClickToTeleport: () => void;
  presets?: SpawnPreset[];
}

export interface TesterCheatsCardProps {
  godMode: boolean;
  infiniteMana: boolean;
  infiniteStamina: boolean;
  noClip: boolean;
  onToggleGodMode: () => void;
  onToggleInfiniteMana: () => void;
  onToggleInfiniteStamina: () => void;
  onToggleNoClip: () => void;
  onSetPlayerHp: (amount: number) => void;
  onRefillVitals: () => void;
}

export interface TesterInventoryCardProps {
  onGiveAllWeapons: () => void;
  onUnlockAllSkills: () => void;
  onGivePotions: () => void;
  onClearInventory: () => void;
  onAddGold: (amount: number) => void;
}

export interface TesterCombatCardProps {
  freezeAI: boolean;
  onToggleFreezeAI: () => void;
  onKillAllEnemies: () => void;
  onForceVictory: () => void;
  onForceDefeat: () => void;
  onSpawnEnemy: (enemyTypeId: string) => void;
}

export interface TesterSimulationSpeedCardProps {
  timeScale: number;
  onSetTimeScale: (scale: number) => void;
  onStepSingleFrame: () => void;
}

export interface TesterDiagnosticsCardProps {
  showHitboxes: boolean;
  showProfiler: boolean;
  onToggleHitboxes: () => void;
  onToggleProfiler: () => void;
}

export interface TesterTimeAndDiagnosticsCardProps
  extends TesterSimulationSpeedCardProps,
    TesterDiagnosticsCardProps {}

export interface TesterParallaxCardProps {
  parallaxTiers: Record<BackgroundLayerTier, boolean>;
  onToggleParallaxTier: (tier: BackgroundLayerTier) => void;
  onSetMusicIntensity: (intensity: number) => void;
  onTriggerParticleBurst: (type: TesterParticleType) => void;
}

export interface TesterNavigationActions {
  teleportPlayer: (x: number, y: number, playerId?: PlayerId) => void;
  toggleClickToTeleport: () => boolean;
}

export interface TesterCheatActions {
  toggleGodMode: () => boolean;
  toggleInfiniteMana: () => boolean;
  toggleInfiniteStamina: () => boolean;
  toggleNoClip: () => boolean;
  setPlayerHp: (amount: number, playerId?: PlayerId) => void;
  refillVitals: (playerId?: PlayerId) => void;
}

export interface TesterInventoryActions {
  giveAllWeapons: (playerId?: PlayerId) => void;
  unlockAllSkills: (playerId?: PlayerId) => void;
  givePotions: (playerId?: PlayerId) => void;
  clearInventory: (playerId?: PlayerId) => void;
  addGold: (amount: number) => void;
}

export interface TesterCombatActions {
  toggleFreezeAI: () => boolean;
  killAllEnemies: () => void;
  forceVictory: () => void;
  forceDefeat: () => void;
  spawnEnemy: (enemyTypeId: string) => void;
}

export interface TesterSimulationActions {
  setTimeScale: (scale: number) => void;
  stepSingleFrame: () => void;
}

export interface TesterDiagnosticsActions {
  toggleHitboxes: () => boolean;
  toggleProfiler: () => boolean;
}

export interface TesterEnvironmentActions {
  toggleParallaxTier: (tier: BackgroundLayerTier) => boolean;
  setMusicIntensity: (intensity: number) => void;
  triggerParticleBurst: (type: TesterParticleType, count?: number) => void;
}

/**
 * Composite action facade for developer testing controls.
 */
export interface TesterActions
  extends TesterNavigationActions,
    TesterCheatActions,
    TesterInventoryActions,
    TesterCombatActions,
    TesterSimulationActions,
    TesterDiagnosticsActions,
    TesterEnvironmentActions {}
