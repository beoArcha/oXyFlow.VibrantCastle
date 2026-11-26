import React from "react";
import { getPlayerThemeTokens } from "@styles/theme";
import { getCharacterProfile } from "@game/characters";
import { HUDPanel } from "./components/common/HUDPanel";
import { HUDPlayerHeader } from "./components/player/HUDPlayerHeader";
import { HUDPlayerVitals } from "./components/player/HUDPlayerVitals";
import type { HUDPlayerStatusCardProps } from "./types";
import { cn } from "@lib/utils";

export const HUDPlayerStatusCard: React.FC<HUDPlayerStatusCardProps> = React.memo(({
  status,
  player,
  playerNumber,
  characterName,
  themeColor,
  theme,
  assetQuality = "mid",
  attackPower,
  defensePower,
  spellPowerMultiplier,
  onOpenSkillTree,
}) => {
  const effectivePlayerNumber = status ? status.playerNumber : (playerNumber ?? 1);
  const effectiveName = status ? status.characterName : (characterName ?? "");
  const effectiveTheme = status ? status.theme : (theme || themeColor);
  const effectiveHealth = status ? status.health : (player?.health ?? 0);
  const effectiveMaxHealth = status ? status.maxHealth : (player?.maxHealth ?? 1);
  const effectiveMana = status ? status.mana : (player?.mana ?? 0);
  const effectiveMaxMana = status ? status.maxMana : (player?.maxMana ?? 1);
  const effectiveStamina = status ? status.stamina : (player?.stamina ?? 0);
  const effectiveMaxStamina = status ? status.maxStamina : (player?.maxStamina ?? 1);
  const effectiveSkillPoints = status ? status.skillPoints : (player?.skillPoints ?? 0);

  const themeTokens = getPlayerThemeTokens(effectiveTheme);
  const fallbackCharacterId = themeTokens.id === "crimson" ? "valen" : "aurelia";
  const effectiveCharacterId = (status ? status.characterId : player?.characterId) || fallbackCharacterId;
  const profile = getCharacterProfile(effectiveCharacterId);

  const effectiveAttackPower = status
    ? status.attackPower
    : (attackPower ?? profile.baseStats.baseAttack);
  const effectiveDefensePower = status
    ? status.defensePower
    : (defensePower ?? profile.baseStats.baseDefense);
  const effectiveSpellMultiplier = status
    ? status.spellPowerMultiplier
    : (spellPowerMultiplier ?? profile.baseStats.spellPowerMultiplier);

  return (
    <HUDPanel
      padding="sm"
      className={cn(
        "flex flex-col gap-2 transition-all px-3 py-2.5",
        themeTokens.cardWidth,
        themeTokens.cardBorder
      )}
    >
      <HUDPlayerHeader
        characterId={effectiveCharacterId}
        characterName={effectiveName || profile.displayName}
        playerNumber={effectivePlayerNumber}
        attackPower={effectiveAttackPower}
        defensePower={effectiveDefensePower}
        spellPowerMultiplier={effectiveSpellMultiplier}
        loreTitleKey={status?.loreTitleKey ?? profile.titleKey}
        passiveNameKey={status?.passiveNameKey ?? profile.passiveNameKey}
        passiveDescKey={status?.passiveDescKey ?? profile.passiveDescKey}
        emblem={status?.emblem ?? profile.emblem}
        assetQuality={assetQuality}
        skillPoints={effectiveSkillPoints}
        themeTokens={themeTokens}
        onOpenSkillTree={onOpenSkillTree}
      />

      <HUDPlayerVitals
        health={effectiveHealth}
        maxHealth={effectiveMaxHealth}
        mana={effectiveMana}
        maxMana={effectiveMaxMana}
        stamina={effectiveStamina}
        maxStamina={effectiveMaxStamina}
        themeTokens={themeTokens}
      />
    </HUDPanel>
  );
});

HUDPlayerStatusCard.displayName = "HUDPlayerStatusCard";
export default HUDPlayerStatusCard;
