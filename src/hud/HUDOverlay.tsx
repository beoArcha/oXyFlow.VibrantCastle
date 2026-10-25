import React, { useCallback, useMemo } from "react";
import {
  resolvePlayerDerivedStats,
  resolvePlayerStatusVM,
  resolveQuickBeltVM,
} from "./hud.mapper";
import { useGameSession, useSettings } from "@context/GameContext";
import { useI18n } from "@context/I18nContext";
import { HUDOverlayLayout } from "./HUDOverlayLayout";
import { HUDViewportCanvas } from "./HUDViewportCanvas";
import { HUDStatusOverlay } from "./HUDStatusOverlay";
import { HUDPlayerStatusCard } from "./HUDPlayerStatusCard";
import { HUDTopControls } from "./HUDTopControls";
import { HUDQuickBelt } from "./HUDQuickBelt";
import { HUDControlsHint } from "./HUDControlsHint";
import { HUDNarratorBanner } from "./HUDNarratorBanner";
import type { HUDOverlayProps } from "./types";

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  onOpenInventory,
  onOpenSkillTree,
  onOpenHelp,
  onOpenMenu,
  onOpenCreation,
  onTogglePause,
}) => {
  const {
    p1,
    p2,
    isVictory,
    isDefeat,
    isPaused,
    setPaused,
    togglePause,
    currentLocation,
    narration,
    subAnim,
    isAudioInitialized,
    restart,
    advanceLocation,
    initializeAudio,
    useQuickPotion,
  } = useGameSession();

  const { isTwoPlayer, displaySettings, hudSettings } = useSettings();
  const { t } = useI18n();

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
        potionKeyRangeLabel: hudSettings.p1QuickKeys.potionsRange,
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
        potionKeyRangeLabel: hudSettings.p2QuickKeys.potionsRange,
        primarySpellId: p2?.primarySpellId,
        secondarySpellId: p2?.secondarySpellId,
      }),
    [p2, hudSettings.p2QuickKeys]
  );

  const currentLocationName = currentLocation ? t(currentLocation.nameKey) : "";

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
        (isPaused || isVictory || isDefeat) && (
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
      topCenterSlot={
        <HUDTopControls
          isPaused={isPaused}
          onTogglePause={onTogglePause || togglePause}
          onOpenHelp={onOpenHelp}
          onOpenMenu={onOpenMenu}
          onOpenCreation={onOpenCreation}
          locationName={currentLocationName}
        />
      }
      topRightSlot={
        isTwoPlayer && p2StatusVM ? (
          <HUDPlayerStatusCard
            status={p2StatusVM}
            assetQuality={displaySettings.assetQuality}
          />
        ) : null
      }
      leftFlankSlot={
        p1QuickBeltVM && (
          <HUDQuickBelt
            belt={p1QuickBeltVM}
            onUsePotion={handleP1Potion}
            onOpenInventory={onOpenInventory}
            onOpenSkillTree={onOpenSkillTree}
            showRpgButtons={hudSettings.showRpgButtons}
          />
        )
      }
      rightFlankSlot={
        isTwoPlayer && p2QuickBeltVM ? (
          <HUDQuickBelt
            belt={p2QuickBeltVM}
            onUsePotion={handleP2Potion}
          />
        ) : hudSettings.showControlsHint ? (
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
    />
  );
};

export default HUDOverlay;
