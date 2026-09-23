import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DebugTelemetryCard } from "./debug/DebugTelemetryCard";
import { DebugPlayerInspectorCard } from "./debug/DebugPlayerInspectorCard";
import { DebugEntityTableCard } from "./debug/DebugEntityTableCard";
import { DebugCollisionsCard } from "./debug/DebugCollisionsCard";
import { DebugEventLogCard, LogEntry } from "./debug/DebugEventLogCard";
import { DebugStateDumpCard } from "./debug/DebugStateDumpCard";
import { useGameSession, useSettings } from "../../../hooks/useGame";
import gameEngine from "../../../game/loop/engine";
import { debugManager } from "../../../game/debug/debugManager";
import fpsManager from "../../../game/engine/fpsManager";

export const DebugSubTab: React.FC = () => {
  const { p1, p2, currentLocationId } = useGameSession();
  const { isTwoPlayer } = useSettings();

  // Reactive debug manager state
  const [debugState, setDebugState] = useState(debugManager.state);
  useEffect(() => {
    return debugManager.subscribe(() => {
      setDebugState({ ...debugManager.state });
    });
  }, []);

  // Periodic telemetry tick for live stats
  const [tick, setTick] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 10000);
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Event Log buffer
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "init-1",
      time: new Date().toLocaleTimeString(),
      type: "system",
      message: `Location loaded: ${currentLocationId}`,
    },
    {
      id: "init-2",
      time: new Date().toLocaleTimeString(),
      type: "magic",
      message: "Spell registry initialized (5 astral/elemental spells)",
    },
  ]);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Dynamic telemetry calculations
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

  // Snapshot JSON state
  const stateSnapshot = useMemo(() => {
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
      enemiesCount: enemies.length,
      particlesCount: particleCount,
      projectilesCount: projectileCount,
    };
  }, [
    currentLocationId,
    debugState,
    p1,
    enemies.length,
    particleCount,
    projectileCount,
    tick,
  ]);

  return (
    <div id="subtab-content-debug" className="flex flex-col gap-4 animate-in fade-in duration-150">
      {/* 1. Real-time Telemetry Card */}
      <DebugTelemetryCard
        measuredFps={measuredFps}
        targetFps={targetFps}
        frameTimeMs={frameTimeMs}
        particleCount={particleCount}
        projectileCount={projectileCount}
        enemyCount={enemies.length}
        entityCount={entityCount}
        cameraX={cameraX}
        cameraY={cameraY}
        levelWidth={levelWidth}
        levelHeight={levelHeight}
      />

      {/* 2. Player Inspector */}
      <DebugPlayerInspectorCard p1={p1 ?? null} p2={p2 ?? null} isTwoPlayer={isTwoPlayer} />

      {/* 3. Collision and Sensors toggles */}
      <DebugCollisionsCard
        showHitboxes={debugState.showHitboxes}
        showProfiler={debugState.showProfiler}
        clickToTeleport={debugState.clickToTeleport}
        freezeAI={debugState.freezeAI}
      />

      {/* 4. Active Entities and Enemies Table */}
      <DebugEntityTableCard
        enemies={enemies}
        onActionComplete={() => setTick((t) => t + 1)}
      />

      {/* 5. Live Event Stream Log */}
      <DebugEventLogCard logs={logs} onClearLogs={handleClearLogs} />

      {/* 6. JSON State Dump */}
      <DebugStateDumpCard stateObject={stateSnapshot} />
    </div>
  );
};

export default DebugSubTab;
