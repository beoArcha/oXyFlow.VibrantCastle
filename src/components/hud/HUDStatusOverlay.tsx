import React from "react";
import {
  PauseOverlayModal,
  VictoryOverlayModal,
  DefeatOverlayModal,
} from "./overlays";
import type { HUDStatusOverlayProps } from "./types";

export const HUDStatusOverlay: React.FC<HUDStatusOverlayProps> = React.memo(({
  isPaused,
  isVictory,
  isDefeat,
  onResume,
  onOpenHelp,
  onOpenMenu,
  onOpenInventory,
  onOpenSkillTree,
  onNextLocation,
  onRestart,
}) => {
  if (isPaused && !isVictory && !isDefeat) {
    return (
      <PauseOverlayModal
        onResume={onResume}
        onOpenHelp={onOpenHelp}
        onOpenMenu={onOpenMenu}
        onOpenInventory={onOpenInventory}
        onOpenSkillTree={onOpenSkillTree}
      />
    );
  }

  if (isVictory) {
    return (
      <VictoryOverlayModal
        onNextLocation={onNextLocation}
        onRestart={onRestart}
        onOpenMenu={onOpenMenu}
      />
    );
  }

  if (isDefeat) {
    return (
      <DefeatOverlayModal
        onRestart={onRestart}
        onOpenMenu={onOpenMenu}
      />
    );
  }

  return null;
});
