import { useState, useEffect, useCallback, useMemo } from "react";
import gameEngine from "@game/loop/engine";
import fpsManager from "@game/engine/fpsManager";
import { Enemy } from "@game/types";

export interface DebugTelemetryData {
  measuredFps: number;
  targetFps: number;
  frameTimeMs: number;
  particleCount: number;
  projectileCount: number;
  enemies: Enemy[];
  entityCount: number;
  cameraX: number;
  cameraY: number;
  levelWidth: number;
  levelHeight: number;
  refresh: () => void;
}

/**
 * Hook polling engine telemetry metrics at a throttled interval
 * with automatic timer cleanup on unmount.
 */
export function useDebugTelemetry(refreshIntervalMs: number = 250): DebugTelemetryData {
  const [, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (typeof process !== "undefined" && (process.env?.NODE_ENV === "test" || (globalThis as any).IS_REACT_ACT_ENVIRONMENT)) {
      return;
    }
    const timer = setInterval(refresh, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refreshIntervalMs, refresh]);

  const measuredFps = fpsManager.getMeasuredFps();
  const targetFps = fpsManager.getTargetFps();
  const frameTimeMs = measuredFps > 0 ? 1000 / measuredFps : 16.6;
  const particleCount = gameEngine.particleSystem.getParticles().length;
  const projectileCount = gameEngine.projectiles.length;
  const enemies = gameEngine.enemies;
  const entityCount = gameEngine.entities.length;
  const cameraX = gameEngine.cameraManager.x;
  const cameraY = gameEngine.cameraManager.y;
  const levelWidth = gameEngine.levelWidth;
  const levelHeight = gameEngine.levelHeight;

  return useMemo(
    () => ({
      measuredFps,
      targetFps,
      frameTimeMs,
      particleCount,
      projectileCount,
      enemies,
      entityCount,
      cameraX,
      cameraY,
      levelWidth,
      levelHeight,
      refresh,
    }),
    [
      measuredFps,
      targetFps,
      frameTimeMs,
      particleCount,
      projectileCount,
      enemies,
      entityCount,
      cameraX,
      cameraY,
      levelWidth,
      levelHeight,
      refresh,
    ]
  );
}

export default useDebugTelemetry;
