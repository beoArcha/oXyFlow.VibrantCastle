import React, { useCallback, useMemo } from "react";
import {
  resolvePlayerDerivedStats,
  resolvePlayerStatusVM,
  resolveQuickBeltVM,
} from "./hud.mapper";
import { useGameSession, useSettings } from "@context/GameContext";
import { HUDOverlayLayout } from "./HUDOverlayLayout";
import { HUDViewportCanvas } from "./HUDViewportCanvas";
import { HUDStatusOverlay } from "./HUDStatusOverlay";
import { HUDPlayerStatusCard } from "./HUDPlayerStatusCard";
import { HUDQuickBelt } from "./HUDQuickBelt";
import { HUDNarratorBanner } from "./HUDNarratorBanner";
import { HUDControlsHint } from "./HUDControlsHint";
import type { HUDOverlayProps } from "./types";

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  onOpenInventory,
  onOpenSkillTree,
  onOpenHelp,
  onOpenMenu,
  isModalOpen = false,
}) => {
  const {
    p1,
    p2,
    isVictory,
    isDefeat,
    isPaused,
    setPaused,
    narration,
    subAnim,
    restart,
    advanceLocation,
    useQuickPotion,
    isAudioInitialized,
    initializeAudio,
  } = useGameSession();

  const { isTwoPlayer, displaySettings, hudSettings } = useSettings();

  const p1Stats = useMemo(() => resolvePlayerDerivedStats(p1), [p1]);
  const p2Stats = useMemo(() => resolvePlayerDerivedStats(p2), [p2]);

  const p1StatusVM = useMemo(
    () =>
      resolvePlayerStatusVM(p1, p1Stats, {
        characterName: hudSettings.p1CharacterName,
        theme: hudSettings.p1ThemeColor,
        playerNumber: 1,
        attackFallback: hudSettings.p1AttackFallback,
      }),
    [p1, p1Stats, hudSettings.p1CharacterName, hudSettings.p1ThemeColor, hudSettings.p1AttackFallback]
  );

  const p2StatusVM = useMemo(
    () =>
      resolvePlayerStatusVM(p2, p2Stats, {
        characterName: hudSettings.p2CharacterName,
        theme: hudSettings.p2ThemeColor,
        playerNumber: 2,
        attackFallback: hudSettings.p2AttackFallback,
      }),
    [p2, p2Stats, hudSettings.p2CharacterName, hudSettings.p2ThemeColor, hudSettings.p2AttackFallback]
  );

  const p1QuickBeltVM = useMemo(
    () =>
      resolveQuickBeltVM(p1, {
        playerNumber: 1,
        primaryKeyLabel: hudSettings.p1QuickKeys.primarySpell,
        secondaryKeyLabel: hudSettings.p1QuickKeys.secondarySpell,
        primarySpellId: p1?.primarySpellId,
        secondarySpellId: p1?.secondarySpellId,
      }),
    [p1, hudSettings.p1QuickKeys]
  );

  const p2QuickBeltVM = useMemo(
    () =>
      resolveQuickBeltVM(p2, {
        playerNumber: 2,
        primaryKeyLabel: hudSettings.p2QuickKeys.primarySpell,
        secondaryKeyLabel: hudSettings.p2QuickKeys.secondarySpell,
        primarySpellId: p2?.primarySpellId,
        secondarySpellId: p2?.secondarySpellId,
      }),
    [p2, hudSettings.p2QuickKeys]
  );

  const handlePotionClick = useCallback(
    (playerIndex: number, slotIndex: number) => {
      useQuickPotion(playerIndex, slotIndex);
    },
    [useQuickPotion]
  );

  const handleResume = useCallback(() => {
    setPaused(false);
  }, [setPaused]);

  const handleP1Potion = useCallback((slot: number) => handlePotionClick(0, slot), [handlePotionClick]);
  const handleP2Potion = useCallback((slot: number) => handlePotionClick(1, slot), [handlePotionClick]);

  return (
    <HUDOverlayLayout
      viewportSlot={<HUDViewportCanvas displaySettings={displaySettings} />}
      statusOverlaySlot={
        !isModalOpen && (isPaused || isVictory || isDefeat) && (
          <HUDStatusOverlay
            isPaused={isPaused}
            isVictory={isVictory}
            isDefeat={isDefeat}
            onResume={handleResume}
            onOpenHelp={onOpenHelp}
            onOpenMenu={onOpenMenu}
            onOpenInventory={onOpenInventory}
            onOpenSkillTree={onOpenSkillTree}
            onNextLocation={advanceLocation}
            onRestart={restart}
          />
        )
      }
      topLeftSlot={
        p1StatusVM && (
          <HUDPlayerStatusCard
            status={p1StatusVM}
            assetQuality={displaySettings.assetQuality}
            onOpenSkillTree={onOpenSkillTree}
          />
        )
      }
      topRightSlot={
        isTwoPlayer && p2StatusVM ? (
          <HUDPlayerStatusCard
            status={p2StatusVM}
            assetQuality={displaySettings.assetQuality}
          />
        ) : null
      }
      rightFlankSlot={
        hudSettings.showControlsHint ? (
          <HUDControlsHint
            isAudioInitialized={isAudioInitialized}
            onInitializeAudio={initializeAudio}
          />
        ) : null
      }
      bottomSlot={
        hudSettings.showNarratorSubtitles ? (
          <HUDNarratorBanner narration={narration} isAnimating={subAnim} />
        ) : null
      }
      bottomDockSlot={
        (p1QuickBeltVM || (isTwoPlayer && p2QuickBeltVM)) ? (
          <>
            {p1QuickBeltVM && (
              <HUDQuickBelt
                belt={p1QuickBeltVM}
                onUsePotion={handleP1Potion}
                onOpenInventory={onOpenInventory}
                onOpenSkillTree={onOpenSkillTree}
                showRpgButtons={hudSettings.showRpgButtons}
              />
            )}
            {isTwoPlayer && p2QuickBeltVM && (
              <HUDQuickBelt
                belt={p2QuickBeltVM}
                onUsePotion={handleP2Potion}
                showRpgButtons={false}
              />
            )}
          </>
        ) : null
      }
    />
  );
};

export default HUDOverlay;
