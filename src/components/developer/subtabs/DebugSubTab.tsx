import React, { useCallback, useMemo } from "react";
import {
  DebugTelemetryCard,
  DebugPlayerInspectorCard,
  DebugTogglesCard,
  DebugEntityTableCard,
  DebugStateDumpCard,
  DebugGameSnapshot,
  useDebugTelemetry,
  useDebugManagerState,
} from "./debug";
import { useGameSession, useSettings } from "@context/GameContext";
import gameEngine from "@game/loop/engine";
import { debugManager } from "@game/debug/debugManager";
import { PlayerId, Enemy } from "@game/types";

export const DebugSubTab: React.FC = () => {
  const { p1, p2, currentLocationId } = useGameSession();
  const { isTwoPlayer } = useSettings();

  const debugState = useDebugManagerState();
  const telemetry = useDebugTelemetry(250);

  const handleToggleHitboxes = useCallback(() => {
    debugManager.toggleHitboxes();
  }, []);

  const handleToggleProfiler = useCallback(() => {
    debugManager.toggleProfiler();
  }, []);

  const handleToggleClickToTeleport = useCallback(() => {
    debugManager.toggleClickToTeleport();
  }, []);

  const handleToggleFreezeAI = useCallback(() => {
    debugManager.toggleFreezeAI();
  }, []);

  const handleTeleportToEnemy = useCallback((enemy: Enemy) => {
    const controller = gameEngine.debugController;
    if (controller) {
      controller.teleportPlayer(PlayerId.Player1, Math.round(enemy.x), Math.round(enemy.y - 40));
    } else {
      gameEngine.teleportPlayer(PlayerId.Player1, Math.round(enemy.x), Math.round(enemy.y - 40));
    }
  }, []);

  const handleDamageEnemy = useCallback((enemyId: string, amount: number) => {
    const controller = gameEngine.debugController;
    if (controller) {
      controller.damageEnemy(enemyId, amount);
    } else {
      gameEngine.damageEnemy(enemyId, amount);
    }
  }, []);

  const handleRemoveEnemy = useCallback((enemyId: string) => {
    const controller = gameEngine.debugController;
    if (controller) {
      controller.removeEnemy(enemyId);
    } else {
      gameEngine.removeEnemy(enemyId);
    }
  }, []);

  const stateSnapshot: DebugGameSnapshot = useMemo(() => {
    return {
      currentLocationId,
      timeScale: debugState.timeScale,
      godMode: debugState.godMode,
      infiniteMana: debugState.infiniteMana,
      infiniteStamina: debugState.infiniteStamina,
      noClip: debugState.noClip,
      freezeAI: debugState.freezeAI,
      showHitboxes: debugState.showHitboxes,
      p1: p1
        ? {
            x: Math.round(p1.x),
            y: Math.round(p1.y),
            health: p1.health,
            mana: p1.mana,
            stamina: p1.stamina,
            isGrounded: p1.isGrounded,
            facingLeft: p1.facingLeft,
            activeAnimation: p1.animationState,
          }
        : null,
      enemiesCount: telemetry.enemies.length,
      particlesCount: telemetry.particleCount,
      projectilesCount: telemetry.projectileCount,
    };
  }, [
    currentLocationId,
    debugState,
    p1,
    telemetry.enemies.length,
    telemetry.particleCount,
    telemetry.projectileCount,
  ]);

  return (
    <div id="subtab-content-debug" className="flex flex-col gap-4 animate-in fade-in duration-150">
      <DebugTelemetryCard
        measuredFps={telemetry.measuredFps}
        targetFps={telemetry.targetFps}
        frameTimeMs={telemetry.frameTimeMs}
        particleCount={telemetry.particleCount}
        projectileCount={telemetry.projectileCount}
        enemyCount={telemetry.enemies.length}
        entityCount={telemetry.entityCount}
        cameraX={telemetry.cameraX}
        cameraY={telemetry.cameraY}
        levelWidth={telemetry.levelWidth}
        levelHeight={telemetry.levelHeight}
      />

      <DebugPlayerInspectorCard p1={p1 ?? null} p2={p2 ?? null} isTwoPlayer={isTwoPlayer} />

      <DebugTogglesCard
        showHitboxes={debugState.showHitboxes}
        showProfiler={debugState.showProfiler}
        clickToTeleport={debugState.clickToTeleport}
        freezeAI={debugState.freezeAI}
        onToggleHitboxes={handleToggleHitboxes}
        onToggleProfiler={handleToggleProfiler}
        onToggleClickToTeleport={handleToggleClickToTeleport}
        onToggleFreezeAI={handleToggleFreezeAI}
      />

      <DebugEntityTableCard
        enemies={telemetry.enemies}
        onTeleportToEnemy={handleTeleportToEnemy}
        onDamageEnemy={handleDamageEnemy}
        onRemoveEnemy={handleRemoveEnemy}
        onActionComplete={telemetry.refresh}
      />

      <DebugStateDumpCard stateObject={stateSnapshot} />
    </div>
  );
};

export default DebugSubTab;
