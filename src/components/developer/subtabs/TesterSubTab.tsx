import React, { useSyncExternalStore } from "react";
import { useGameSession } from "@context/GameContext";
import { debugManager, DebugState } from "@game/debug/debugManager";
import {
  TesterTeleportCard,
  TesterCheatsCard,
  TesterInventoryCard,
  TesterCombatCard,
  TesterSimulationSpeedCard,
  TesterDiagnosticsCard,
  TesterParallaxCard,
  useTesterActions,
} from "./tester";

const subscribeDebugManager = (onStoreChange: () => void): (() => void) => {
  return debugManager.subscribe(onStoreChange);
};

const getDebugSnapshot = (): DebugState => debugManager.state;

/**
 * Developer tester subtab orchestrator integrating specialized control cards in a responsive two-column grid.
 */
export const TesterSubTab: React.FC = () => {
  const { p1, currentLocationId, loadLocation } = useGameSession();
  const debugState = useSyncExternalStore(subscribeDebugManager, getDebugSnapshot, getDebugSnapshot);
  const actions = useTesterActions();

  return (
    <div id="subtab-content-tester" className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-150 text-sm">
      <div className="flex flex-col gap-4">
        <TesterTeleportCard
          currentLocationId={currentLocationId}
          onLoadLocation={loadLocation}
          onTeleportPlayer={actions.teleportPlayer}
          playerX={p1?.x}
          playerY={p1?.y}
          clickToTeleport={debugState.clickToTeleport}
          onToggleClickToTeleport={actions.toggleClickToTeleport}
        />
        <TesterCheatsCard
          godMode={debugState.godMode}
          infiniteMana={debugState.infiniteMana}
          infiniteStamina={debugState.infiniteStamina}
          noClip={debugState.noClip}
          onToggleGodMode={actions.toggleGodMode}
          onToggleInfiniteMana={actions.toggleInfiniteMana}
          onToggleInfiniteStamina={actions.toggleInfiniteStamina}
          onToggleNoClip={actions.toggleNoClip}
          onSetPlayerHp={actions.setPlayerHp}
          onRefillVitals={actions.refillVitals}
        />
        <TesterInventoryCard
          onGiveAllWeapons={actions.giveAllWeapons}
          onUnlockAllSkills={actions.unlockAllSkills}
          onGivePotions={actions.givePotions}
          onClearInventory={actions.clearInventory}
          onAddGold={actions.addGold}
        />
      </div>

      <div className="flex flex-col gap-4">
        <TesterCombatCard
          freezeAI={debugState.freezeAI}
          onToggleFreezeAI={actions.toggleFreezeAI}
          onKillAllEnemies={actions.killAllEnemies}
          onForceVictory={actions.forceVictory}
          onForceDefeat={actions.forceDefeat}
          onSpawnEnemy={actions.spawnEnemy}
        />
        <TesterSimulationSpeedCard
          timeScale={debugState.timeScale}
          onSetTimeScale={actions.setTimeScale}
          onStepSingleFrame={actions.stepSingleFrame}
        />
        <TesterDiagnosticsCard
          showHitboxes={debugState.showHitboxes}
          showProfiler={debugState.showProfiler}
          onToggleHitboxes={actions.toggleHitboxes}
          onToggleProfiler={actions.toggleProfiler}
        />
        <TesterParallaxCard
          parallaxTiers={debugState.parallaxTiers}
          onToggleParallaxTier={actions.toggleParallaxTier}
          onSetMusicIntensity={actions.setMusicIntensity}
          onTriggerParticleBurst={actions.triggerParticleBurst}
        />
      </div>
    </div>
  );
};

export default TesterSubTab;
