import React, { useState, useEffect } from "react";
import { useGameSession } from "@hooks/useGame";
import { debugManager } from "@game/debug/debugManager";
import gameEngine from "@game/loop/engine";
import {
  TesterTeleportCard,
  TesterCheatsCard,
  TesterInventoryCard,
  TesterCombatCard,
  TesterTimeAndDiagnosticsCard,
  TesterParallaxCard,
} from "./tester";

/**
 * TesterSubTab Orchestrator Component.
 *
 * Responsibilities:
 * - Reactive state subscription from debugManager.
 * - Integration of specialized tester cards (Teleport, Cheats, Inventory, Combat, Time, Parallax).
 * - Conforms to Single Responsibility Principle (SRP) with concise orchestration (<90 lines).
 */
export const TesterSubTab: React.FC = () => {
  const { p1, currentLocationId, loadLocation } = useGameSession();

  // Reactive debug state from debugManager
  const [debugState, setDebugState] = useState(debugManager.state);
  useEffect(() => {
    return debugManager.subscribe(() => {
      setDebugState({ ...debugManager.state });
    });
  }, []);

  return (
    <div id="subtab-content-tester" className="flex flex-col gap-4 animate-in fade-in duration-150 text-sm">
      {/* 1. Spawn & Teleportation */}
      <TesterTeleportCard
        currentLocationId={currentLocationId}
        onLoadLocation={loadLocation}
        playerX={p1?.x}
        playerY={p1?.y}
        clickToTeleport={debugState.clickToTeleport}
        onToggleClickToTeleport={() => debugManager.toggleClickToTeleport()}
      />

      {/* 2. Cheats & Vitals */}
      <TesterCheatsCard
        godMode={debugState.godMode}
        infiniteMana={debugState.infiniteMana}
        infiniteStamina={debugState.infiniteStamina}
        noClip={debugState.noClip}
        onToggleGodMode={() => debugManager.toggleGodMode()}
        onToggleInfiniteMana={() => debugManager.toggleInfiniteMana()}
        onToggleInfiniteStamina={() => debugManager.toggleInfiniteStamina()}
        onToggleNoClip={() => debugManager.toggleNoClip()}
        onSetPlayerHp={(amount) => gameEngine.setPlayerStat(0, "health", amount)}
        onRefillVitals={() => gameEngine.refillVitals(0)}
      />

      {/* 3. Inventory, Items & Gold */}
      <TesterInventoryCard
        onGiveAllWeapons={() => gameEngine.giveAllWeapons(0)}
        onUnlockAllSkills={() => gameEngine.unlockAllSkills(0)}
        onGivePotions={() => gameEngine.givePotions(0)}
        onClearInventory={() => gameEngine.clearInventory(0)}
        onAddGold={(amount) => gameEngine.addGold(amount)}
      />

      {/* 4. Combat & AI Management */}
      <TesterCombatCard
        freezeAI={debugState.freezeAI}
        onToggleFreezeAI={() => debugManager.toggleFreezeAI()}
        onKillAllEnemies={() => gameEngine.killAllEnemies()}
        onForceVictory={() => gameEngine.forceVictory()}
        onForceDefeat={() => gameEngine.forceDefeat()}
        onSpawnEnemy={(enemyTypeId) => gameEngine.spawnEnemy(enemyTypeId)}
      />

      {/* 5. Simulation Speed & Sensor Toggles */}
      <TesterTimeAndDiagnosticsCard
        timeScale={debugState.timeScale}
        showHitboxes={debugState.showHitboxes}
        showProfiler={debugState.showProfiler}
        onSetTimeScale={(scale) => debugManager.setTimeScale(scale)}
        onStepSingleFrame={() => gameEngine.stepSingleFrame()}
        onToggleHitboxes={() => debugManager.toggleHitboxes()}
        onToggleProfiler={() => debugManager.toggleProfiler()}
      />

      {/* 6. Parallax Layers, Audio & Particles */}
      <TesterParallaxCard
        parallaxTiers={debugState.parallaxTiers}
        onToggleParallaxTier={(tier) => debugManager.toggleParallaxTier(tier)}
        onSetMusicIntensity={(intensity) => gameEngine.setMusicIntensity(intensity)}
        onTriggerParticleBurst={(type) => gameEngine.triggerParticleBurst(type)}
      />
    </div>
  );
};

export default TesterSubTab;
