import { useCallback, useMemo } from "react";
import gameEngine from "@game/loop/engine";
import { debugManager } from "@game/debug/debugManager";
import { PlayerId } from "@game/types";
import { BackgroundLayerTier } from "@game/locations/schema/locationSchema";
import { TesterActions, TesterParticleType } from "./types";

function getPlayerIndex(playerId: PlayerId = PlayerId.Player1): number {
  return playerId === PlayerId.Player2 ? 1 : 0;
}

/**
 * Action facade providing safe command dispatch from developer UI to GameEngine and DebugManager.
 */
export function useTesterActions(): TesterActions {
  const teleportPlayer = useCallback((x: number, y: number, playerId: PlayerId = PlayerId.Player1) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    gameEngine.teleportPlayer(playerId, Math.round(x), Math.round(y));
  }, []);

  const toggleClickToTeleport = useCallback((): boolean => {
    return debugManager.toggleClickToTeleport();
  }, []);

  const toggleGodMode = useCallback((): boolean => {
    return debugManager.toggleGodMode();
  }, []);

  const toggleInfiniteMana = useCallback((): boolean => {
    return debugManager.toggleInfiniteMana();
  }, []);

  const toggleInfiniteStamina = useCallback((): boolean => {
    return debugManager.toggleInfiniteStamina();
  }, []);

  const toggleNoClip = useCallback((): boolean => {
    return debugManager.toggleNoClip();
  }, []);

  const setPlayerHp = useCallback((amount: number, playerId: PlayerId = PlayerId.Player1) => {
    if (!Number.isFinite(amount) || amount < 0) return;
    gameEngine.setPlayerStat(getPlayerIndex(playerId), "health", Math.round(amount));
  }, []);

  const refillVitals = useCallback((playerId: PlayerId = PlayerId.Player1) => {
    gameEngine.refillVitals(getPlayerIndex(playerId));
  }, []);

  const giveAllWeapons = useCallback((playerId: PlayerId = PlayerId.Player1) => {
    gameEngine.giveAllWeapons(getPlayerIndex(playerId));
  }, []);

  const unlockAllSkills = useCallback((playerId: PlayerId = PlayerId.Player1) => {
    gameEngine.unlockAllSkills(getPlayerIndex(playerId));
  }, []);

  const givePotions = useCallback((playerId: PlayerId = PlayerId.Player1) => {
    gameEngine.givePotions(getPlayerIndex(playerId));
  }, []);

  const clearInventory = useCallback((playerId: PlayerId = PlayerId.Player1) => {
    gameEngine.clearInventory(getPlayerIndex(playerId));
  }, []);

  const addGold = useCallback((amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    gameEngine.addGold(Math.round(amount));
  }, []);

  const toggleFreezeAI = useCallback((): boolean => {
    return debugManager.toggleFreezeAI();
  }, []);

  const killAllEnemies = useCallback(() => {
    gameEngine.killAllEnemies();
  }, []);

  const forceVictory = useCallback(() => {
    gameEngine.forceVictory();
  }, []);

  const forceDefeat = useCallback(() => {
    gameEngine.forceDefeat();
  }, []);

  const spawnEnemy = useCallback((enemyTypeId: string) => {
    if (!enemyTypeId || typeof enemyTypeId !== "string") return;
    gameEngine.spawnEnemy(enemyTypeId);
  }, []);

  const setTimeScale = useCallback((scale: number) => {
    if (!Number.isFinite(scale) || scale <= 0) return;
    debugManager.setTimeScale(scale);
  }, []);

  const stepSingleFrame = useCallback(() => {
    gameEngine.stepSingleFrame();
  }, []);

  const toggleHitboxes = useCallback((): boolean => {
    return debugManager.toggleHitboxes();
  }, []);

  const toggleProfiler = useCallback((): boolean => {
    return debugManager.toggleProfiler();
  }, []);

  const toggleParallaxTier = useCallback((tier: BackgroundLayerTier): boolean => {
    return debugManager.toggleParallaxTier(tier);
  }, []);

  const setMusicIntensity = useCallback((intensity: number) => {
    if (!Number.isFinite(intensity)) return;
    const clamped = Math.max(0, Math.min(1.0, intensity));
    gameEngine.setMusicIntensity(clamped);
  }, []);

  const triggerParticleBurst = useCallback((type: TesterParticleType, count: number = 25) => {
    gameEngine.triggerParticleBurst(type, count);
  }, []);

  return useMemo<TesterActions>(
    () => ({
      teleportPlayer,
      toggleClickToTeleport,
      toggleGodMode,
      toggleInfiniteMana,
      toggleInfiniteStamina,
      toggleNoClip,
      setPlayerHp,
      refillVitals,
      giveAllWeapons,
      unlockAllSkills,
      givePotions,
      clearInventory,
      addGold,
      toggleFreezeAI,
      killAllEnemies,
      forceVictory,
      forceDefeat,
      spawnEnemy,
      setTimeScale,
      stepSingleFrame,
      toggleHitboxes,
      toggleProfiler,
      toggleParallaxTier,
      setMusicIntensity,
      triggerParticleBurst,
    }),
    [
      teleportPlayer,
      toggleClickToTeleport,
      toggleGodMode,
      toggleInfiniteMana,
      toggleInfiniteStamina,
      toggleNoClip,
      setPlayerHp,
      refillVitals,
      giveAllWeapons,
      unlockAllSkills,
      givePotions,
      clearInventory,
      addGold,
      toggleFreezeAI,
      killAllEnemies,
      forceVictory,
      forceDefeat,
      spawnEnemy,
      setTimeScale,
      stepSingleFrame,
      toggleHitboxes,
      toggleProfiler,
      toggleParallaxTier,
      setMusicIntensity,
      triggerParticleBurst,
    ]
  );
}
