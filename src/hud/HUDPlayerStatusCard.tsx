import React from "react";
import { Heart, Sparkles, Zap } from "lucide-react";
import { ProgressBar, Badge, Button, Text, Code } from "@ui";
import { CharacterPortrait } from "@game-menu/character";
import { useI18n } from "@context/I18nContext";
import { getPlayerThemeTokens } from "@styles/theme";
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
  onOpenSkillTree,
}) => {
  const { t } = useI18n();

  const effectivePlayerNumber = status ? status.playerNumber : (playerNumber ?? 1);
  const effectiveName = status ? status.characterName : (characterName ?? "");
  const effectiveTheme = status ? status.theme : (theme || themeColor);
  const effectiveHealth = status ? status.health : (player?.health ?? 0);
  const effectiveMaxHealth = status ? status.maxHealth : (player?.maxHealth ?? 1);
  const effectiveMana = status ? status.mana : (player?.mana ?? 0);
  const effectiveMaxMana = status ? status.maxMana : (player?.maxMana ?? 1);
  const effectiveStamina = status ? status.stamina : (player?.stamina ?? 0);
  const effectiveMaxStamina = status ? status.maxStamina : (player?.maxStamina ?? 1);
  const effectiveAttackPower = status ? status.attackPower : (attackPower ?? 10);
  const effectiveSkillPoints = status ? status.skillPoints : (player?.skillPoints ?? 0);

  const themeTokens = getPlayerThemeTokens(effectiveTheme);
  const fallbackCharacterId = themeTokens.id === "crimson" ? "valen" : "aurelia";
  const effectiveCharacterId = (status ? status.characterId : player?.characterId) || fallbackCharacterId;

  const qualityLabel =
    assetQuality === "low" ? "16b" : assetQuality === "mid" ? "32b" : "HD";

  return (
    <div
      className={cn(
        "bg-stone-950/85 backdrop-blur-md p-3 rounded-2xl border shadow-2xl flex flex-col gap-2 transition-all",
        themeTokens.cardWidth,
        themeTokens.cardBorder
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "relative w-9 h-9 rounded-lg overflow-hidden border bg-black/60 shadow-inner shrink-0",
              themeTokens.avatarBorder
            )}
          >
            <CharacterPortrait
              characterId={effectiveCharacterId}
              className="w-full h-full"
            />
            <Text
              as="div"
              family="mono"
              weight="bold"
              size="3xs"
              className={cn(
                "absolute bottom-0 right-0 px-1 py-0.2 bg-black/80 rounded-tl",
                themeTokens.qualityBadgeColor
              )}
            >
              {qualityLabel}
            </Text>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Text
                weight="bold"
                size="xs"
                className={cn("leading-tight", themeTokens.nameColor)}
              >
                {effectiveName}
              </Text>
              <Code
                size="2xs"
                className={cn(
                  "px-1 rounded border",
                  themeTokens.tagClass
                )}
              >
                P{effectivePlayerNumber}
              </Code>
            </div>
            <Text size="2xs" variant="muted">
              {t("attackPower")}: {Math.round(effectiveAttackPower)}
            </Text>
          </div>
        </div>

        {effectiveSkillPoints > 0 && onOpenSkillTree ? (
          <Button
            size="sm"
            variant="accent"
            onClick={onOpenSkillTree}
            className="h-6 px-2 py-0.5 rounded-full animate-pulse gap-1"
            leftIcon={<Sparkles size={11} />}
          >
            +{effectiveSkillPoints} {t("skillPointsUnit")}
          </Button>
        ) : effectivePlayerNumber === 2 ? (
          <Badge variant="cyan" size="sm">
            Co-op
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <ProgressBar
          value={effectiveHealth}
          max={effectiveMaxHealth}
          variant="health"
          barClassName={themeTokens.healthBarClass}
          label={t("health")}
          icon={
            <Heart
              className={cn(
                "w-3 h-3",
                themeTokens.heartIconClass
              )}
            />
          }
          heightClass="h-2.5"
        />
        <ProgressBar
          value={effectiveMana}
          max={effectiveMaxMana}
          variant="mana"
          label={t("mana")}
          icon={<Sparkles className="w-3 h-3 text-cyan-400" />}
          heightClass="h-2"
        />
        <ProgressBar
          value={effectiveStamina}
          max={effectiveMaxStamina}
          variant="stamina"
          label={t("stamina")}
          icon={<Zap className="w-3 h-3 text-amber-400" />}
          heightClass="h-2"
        />
      </div>
    </div>
  );
});
