import React, { useCallback, useMemo } from "react";
import { SPELL_REGISTRY } from "@game/logic/magic";
import { useQuickPotion, calculatePlayerDerivedStats } from "@game/logic/inventory";
import { useGameSession, useSettings } from "@hooks/useGame";
import { useI18n } from "@hooks/useI18n";
import { HUDOverlayLayout } from "./HUDOverlayLayout";
import { HUDViewportCanvas } from "./HUDViewportCanvas";
import { HUDStatusOverlay } from "./HUDStatusOverlay";
import { HUDPlayerStatusCard } from "./HUDPlayerStatusCard";
import { HUDTopControls } from "./HUDTopControls";
import { HUDQuickBelt } from "./HUDQuickBelt";
import { HUDControlsHint } from "./HUDControlsHint";
import { HUDNarratorBanner } from "./HUDNarratorBanner";
import { HUDOverlayProps } from "./types";

/**
 * HUDOverlay Orchestrator Component.
 *
 * Responsibilities:
 * - Orchestrates subcomponents and handles high-level HUD state.
 * - Free of direct HTML tags and CSS styling classes.
 * - Delegates layout, canvas rendering, player cards, control pills, belts, and narration to dedicated components.
 */
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
    notifyEngineUpdate,
  } = useGameSession();

  const { isTwoPlayer, displaySettings, hudSettings } = useSettings();

  const { t } = useI18n();

  // Derived spell registry definitions memoized
  const p1PrimarySpell = useMemo(
    () => (p1 ? SPELL_REGISTRY[p1.primarySpellId] : null),
    [p1?.primarySpellId]
  );
  const p1SecondarySpell = useMemo(
    () => (p1 ? SPELL_REGISTRY[p1.secondarySpellId] : null),
    [p1?.secondarySpellId]
  );
  const p1Stats = useMemo(() => (p1 ? calculatePlayerDerivedStats(p1) : null), [p1]);

  const p2PrimarySpell = useMemo(
    () => (p2 ? SPELL_REGISTRY[p2.primarySpellId] : null),
    [p2?.primarySpellId]
  );
  const p2SecondarySpell = useMemo(
    () => (p2 ? SPELL_REGISTRY[p2.secondarySpellId] : null),
    [p2?.secondarySpellId]
  );
  const p2Stats = useMemo(() => (p2 ? calculatePlayerDerivedStats(p2) : null), [p2]);

  const currentLocationName = currentLocation ? t(currentLocation.nameKey) : "";

  const handlePotionClick = useCallback(
    (playerIndex: number, slotIndex: number) => {
      const targetPlayer = playerIndex === 0 ? p1 : p2;
      if (targetPlayer) {
        useQuickPotion(targetPlayer, slotIndex);
        notifyEngineUpdate();
      }
    },
    [p1, p2, notifyEngineUpdate]
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
        p1 && (
          <HUDPlayerStatusCard
            player={p1}
            playerNumber={1}
            characterName={hudSettings.p1CharacterName}
            themeColor={hudSettings.p1ThemeColor}
            assetQuality={displaySettings.assetQuality}
            attackPower={p1Stats?.totalAttack || hudSettings.p1AttackFallback}
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
        isTwoPlayer && p2 ? (
          <HUDPlayerStatusCard
            player={p2}
            playerNumber={2}
            characterName={hudSettings.p2CharacterName}
            themeColor={hudSettings.p2ThemeColor}
            assetQuality={displaySettings.assetQuality}
            attackPower={p2Stats?.totalAttack || hudSettings.p2AttackFallback}
          />
        ) : null
      }
      leftFlankSlot={
        p1 && (
          <HUDQuickBelt
            player={p1}
            playerNumber={1}
            primarySpell={p1PrimarySpell}
            secondarySpell={p1SecondarySpell}
            primarySpellName={p1PrimarySpell ? t(p1PrimarySpell.nameKey) : ""}
            secondarySpellName={p1SecondarySpell ? t(p1SecondarySpell.nameKey) : ""}
            primaryKeyLabel={hudSettings.p1QuickKeys.primarySpell}
            secondaryKeyLabel={hudSettings.p1QuickKeys.secondarySpell}
            potionKeyRangeLabel={hudSettings.p1QuickKeys.potionsRange}
            onUsePotion={handleP1Potion}
            onOpenInventory={onOpenInventory}
            onOpenSkillTree={onOpenSkillTree}
            showRpgButtons={hudSettings.showRpgButtons}
          />
        )
      }
      rightFlankSlot={
        isTwoPlayer && p2 ? (
          <HUDQuickBelt
            player={p2}
            playerNumber={2}
            primarySpell={p2PrimarySpell}
            secondarySpell={p2SecondarySpell}
            primarySpellName={p2PrimarySpell ? t(p2PrimarySpell.nameKey) : ""}
            secondarySpellName={p2SecondarySpell ? t(p2SecondarySpell.nameKey) : ""}
            primaryKeyLabel={hudSettings.p2QuickKeys.primarySpell}
            secondaryKeyLabel={hudSettings.p2QuickKeys.secondarySpell}
            potionKeyRangeLabel={hudSettings.p2QuickKeys.potionsRange}
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
