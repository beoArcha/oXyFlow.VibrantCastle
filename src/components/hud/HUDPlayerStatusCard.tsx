import React from "react";
import { Heart, Sparkles, Zap } from "lucide-react";
import { ProgressBar, Badge } from "@components/ui";
import { CharacterPortrait } from "@components/character";
import { useI18n } from "@context/I18nContext";
import { getPlayerThemeTokens } from "@styles/theme";
import type { HUDPlayerStatusCardProps } from "./types";
import { cn } from "@lib/utils";

export const HUDPlayerStatusCard: React.FC<HUDPlayerStatusCardProps> = React.memo(({
  player,
  playerNumber,
  characterName,
  themeColor,
  theme,
  assetQuality,
  attackPower,
  onOpenSkillTree,
}) => {
  const { t } = useI18n();
  const themeTokens = getPlayerThemeTokens(theme || themeColor);

  const qualityLabel =
    assetQuality === "low" ? "16b" : assetQuality === "mid" ? "32b" : "HD";

  const fallbackCharacterId = themeTokens.id === "crimson" ? "valen" : "aurelia";

  return (
    <div
      className={cn(
        "bg-[#140602]/85 backdrop-blur-md p-3 rounded-2xl border shadow-2xl flex flex-col gap-2 transition-all",
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
              characterId={player.characterId || fallbackCharacterId}
              className="w-full h-full"
            />
            <div
              className={cn(
                "absolute bottom-0 right-0 px-1 py-0.2 bg-black/80 text-[8px] font-mono font-bold rounded-tl",
                themeTokens.qualityBadgeColor
              )}
            >
              {qualityLabel}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={cn("text-xs font-bold leading-tight", themeTokens.nameColor)}>
                {characterName}
              </span>
              <span
                className={cn(
                  "text-[9px] font-mono px-1 rounded border",
                  themeTokens.tagClass
                )}
              >
                P{playerNumber}
              </span>
            </div>
            <span className="text-[10px] text-stone-400">
              {t("attackPower")}: {Math.round(attackPower)}
            </span>
          </div>
        </div>

        {typeof player.skillPoints === "number" && player.skillPoints > 0 && onOpenSkillTree ? (
          <button
            onClick={onOpenSkillTree}
            className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 rounded-full text-[10px] font-bold text-amber-300 animate-pulse hover:bg-amber-500/30 cursor-pointer"
          >
            <Sparkles size={11} />
            +{player.skillPoints} {t("skillPointsUnit")}
          </button>
        ) : playerNumber === 2 ? (
          <Badge variant="cyan" className="text-[10px]">
            Co-op
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <ProgressBar
          value={player.health}
          max={player.maxHealth}
          variant="health"
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
          value={player.mana}
          max={player.maxMana}
          variant="mana"
          label={t("mana")}
          icon={<Sparkles className="w-3 h-3 text-cyan-400" />}
          heightClass="h-2"
        />
        <ProgressBar
          value={player.stamina}
          max={player.maxStamina}
          variant="stamina"
          label={t("stamina")}
          icon={<Zap className="w-3 h-3 text-amber-400" />}
          heightClass="h-2"
        />
      </div>
    </div>
  );
});
