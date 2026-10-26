import React from "react";
import { Sparkles } from "lucide-react";
import { Badge, Button, Text, Code } from "@ui";
import { CharacterPortrait } from "@game-menu/character";
import { useI18n } from "@context/I18nContext";
import type { PlayerThemeTokens } from "@styles/theme";
import type { AssetQuality } from "@/types/assets";
import { cn } from "@lib/utils";

export interface HUDPlayerHeaderProps {
  readonly characterId: string;
  readonly characterName: string;
  readonly playerNumber: 1 | 2;
  readonly attackPower: number;
  readonly assetQuality?: AssetQuality;
  readonly skillPoints?: number;
  readonly themeTokens: PlayerThemeTokens;
  readonly onOpenSkillTree?: () => void;
  readonly className?: string;
}

/**
 * Renders player identity header in HUD player status card: avatar portrait, quality badge,
 * player name, player number tag, attack power, and optional level-up / Co-op indicator.
 */
export const HUDPlayerHeader: React.FC<HUDPlayerHeaderProps> = React.memo(({
  characterId,
  characterName,
  playerNumber,
  attackPower,
  assetQuality = "mid",
  skillPoints = 0,
  themeTokens,
  onOpenSkillTree,
  className,
}) => {
  const { t } = useI18n();

  const qualityLabel =
    assetQuality === "low" ? "16b" : assetQuality === "mid" ? "32b" : "HD";

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "relative w-9 h-9 rounded-lg overflow-hidden border bg-black/60 shadow-inner shrink-0",
            themeTokens.avatarBorder
          )}
        >
          <CharacterPortrait
            characterId={characterId}
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
              {characterName}
            </Text>
            <Code
              size="2xs"
              className={cn(
                "px-1 rounded border",
                themeTokens.tagClass
              )}
            >
              P{playerNumber}
            </Code>
          </div>
          <Text size="2xs" variant="muted">
            {t("attackPower")}: {Math.round(attackPower)}
          </Text>
        </div>
      </div>

      {skillPoints > 0 && onOpenSkillTree ? (
        <Button
          size="sm"
          variant="accent"
          onClick={onOpenSkillTree}
          className="h-6 px-2 py-0.5 rounded-full animate-pulse gap-1"
          leftIcon={<Sparkles size={11} />}
        >
          +{skillPoints} {t("skillPointsUnit")}
        </Button>
      ) : playerNumber === 2 ? (
        <Badge variant="cyan" size="sm">
          Co-op
        </Badge>
      ) : null}
    </div>
  );
});

HUDPlayerHeader.displayName = "HUDPlayerHeader";
export default HUDPlayerHeader;
