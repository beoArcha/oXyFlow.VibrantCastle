import React from "react";
import { Sparkles, Sun, Compass } from "lucide-react";
import { Button, Text, Code } from "@ui";
import { CharacterPortrait } from "@game-menu/character";
import { useI18n } from "@context/I18nContext";
import type { PlayerThemeTokens } from "@styles/theme";
import type { CharacterEmblemType } from "@game/characters";
import type { AssetQuality } from "@/types/assets";
import { cn } from "@lib/utils";

export interface HUDPlayerHeaderProps {
  readonly characterId: string;
  readonly characterName: string;
  readonly playerNumber: 1 | 2;
  readonly attackPower: number;
  readonly defensePower?: number;
  readonly spellPowerMultiplier?: number;
  readonly loreTitleKey?: string;
  readonly passiveNameKey?: string;
  readonly passiveDescKey?: string;
  readonly emblem?: CharacterEmblemType;
  readonly assetQuality?: AssetQuality;
  readonly skillPoints?: number;
  readonly themeTokens: PlayerThemeTokens;
  readonly onOpenSkillTree?: () => void;
  readonly className?: string;
}

/**
 * Renders player identity header in HUD player status card:
 * clean portrait, character name + lore emblem + P1/P2 tag, lore title,
 * compact combat/passive line, and optional skill-point level-up action.
 */
export const HUDPlayerHeader: React.FC<HUDPlayerHeaderProps> = React.memo(({
  characterId,
  characterName,
  playerNumber,
  attackPower,
  defensePower,
  spellPowerMultiplier = 1,
  loreTitleKey,
  passiveNameKey,
  passiveDescKey,
  emblem,
  skillPoints = 0,
  themeTokens,
  onOpenSkillTree,
  className,
}) => {
  const { t } = useI18n();

  const resolvedEmblem: CharacterEmblemType =
    emblem ?? (characterId === "aurelia" ? "astrolabe" : "sun");
  const isSpellcaster = spellPowerMultiplier > 1.001;
  const spellBonusPct = Math.round((spellPowerMultiplier - 1) * 100);
  const passiveTooltip = passiveDescKey ? t(passiveDescKey) : undefined;

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            "relative w-10 h-10 rounded-lg overflow-hidden border bg-black/60 shadow-inner shrink-0",
            themeTokens.avatarBorder
          )}
        >
          <CharacterPortrait
            characterId={characterId}
            className="w-full h-full"
          />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            {resolvedEmblem === "sun" ? (
              <Sun size={12} className={cn("shrink-0", themeTokens.emblemClass)} />
            ) : (
              <Compass size={12} className={cn("shrink-0", themeTokens.emblemClass)} />
            )}
            <Text
              weight="bold"
              size="xs"
              className={cn("leading-tight truncate", themeTokens.nameColor)}
            >
              {characterName}
            </Text>
            <Code
              size="2xs"
              className={cn(
                "px-1 rounded border shrink-0",
                themeTokens.tagClass
              )}
            >
              P{playerNumber}
            </Code>
          </div>

          {loreTitleKey && (
            <Text
              size="3xs"
              weight="semibold"
              className={cn("leading-tight truncate", themeTokens.loreTitleColor)}
            >
              {t(loreTitleKey)}
            </Text>
          )}

          <div
            title={passiveTooltip}
            className="flex items-center gap-1.5 mt-0.5 text-[10px] leading-tight whitespace-nowrap overflow-hidden"
          >
            <Text size="3xs" family="mono" variant="muted" className="tabular-nums">
              {t("statAttackShort")} {Math.round(attackPower)}
            </Text>
            {isSpellcaster ? (
              <Text size="3xs" family="mono" className="text-violet-300 tabular-nums">
                · {t("statSpellShort")} +{spellBonusPct}%
              </Text>
            ) : typeof defensePower === "number" ? (
              <Text size="3xs" family="mono" variant="muted" className="tabular-nums">
                · {t("statDefenseShort")} {Math.round(defensePower)}
              </Text>
            ) : null}
            {passiveNameKey && (
              <Text
                size="3xs"
                weight="semibold"
                className={cn("truncate", themeTokens.passiveColor)}
              >
                · {t(passiveNameKey)}
              </Text>
            )}
          </div>
        </div>
      </div>

      {skillPoints > 0 && onOpenSkillTree ? (
        <Button
          size="sm"
          variant="accent"
          onClick={onOpenSkillTree}
          className="h-6 px-2 py-0.5 rounded-full gap-1 shrink-0 whitespace-nowrap"
          leftIcon={<Sparkles size={11} />}
        >
          +{skillPoints} {t("skillPointsUnit")}
        </Button>
      ) : null}
    </div>
  );
});

HUDPlayerHeader.displayName = "HUDPlayerHeader";
export default HUDPlayerHeader;
