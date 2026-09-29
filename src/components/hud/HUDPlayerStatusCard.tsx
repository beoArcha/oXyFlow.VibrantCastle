import React from "react";
import { Heart, Sparkles, Zap } from "lucide-react";
import { ProgressBar, Badge } from "@components/ui";
import { CharacterPortrait } from "@components/character";
import { useI18n } from "@context/I18nContext";
import { HUDPlayerStatusCardProps } from "./types";
import { cn } from "@lib/utils";

/**
 * Generic Player Status Card for HUD (supports both P1 Valen and P2 Aurelia).
 */
export const HUDPlayerStatusCard: React.FC<HUDPlayerStatusCardProps> = React.memo(({
  player,
  playerNumber,
  characterName,
  themeColor,
  assetQuality,
  attackPower,
  onOpenSkillTree,
}) => {
  const { t } = useI18n();

  const isRed = themeColor === "red";
  const borderColor = isRed ? "border-red-900/60" : "border-cyan-900/60";
  const avatarBorder = isRed ? "border-amber-500/50" : "border-cyan-500/50";
  const nameColor = isRed ? "text-red-400" : "text-cyan-400";
  const tagClass = isRed
    ? "text-amber-400/80 bg-amber-950/40 border-amber-600/30"
    : "text-cyan-400/80 bg-cyan-950/40 border-cyan-600/30";
  const qualityBadgeColor = isRed ? "text-amber-300" : "text-cyan-300";

  const qualityLabel =
    assetQuality === "low" ? "16b" : assetQuality === "mid" ? "32b" : "HD";

  return (
    <div
      className={cn(
        "bg-[#140602]/85 backdrop-blur-md p-3 rounded-2xl border shadow-2xl flex flex-col gap-2 transition-all",
        isRed ? "w-64 sm:w-76" : "w-60 sm:w-72",
        borderColor
      )}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Character Avatar with Quality Tag */}
          <div
            className={cn(
              "relative w-9 h-9 rounded-lg overflow-hidden border bg-black/60 shadow-inner shrink-0",
              avatarBorder
            )}
          >
            <CharacterPortrait
              characterId={player.characterId || (isRed ? "valen" : "aurelia")}
              quality={assetQuality}
              className="w-full h-full"
            />
            <div
              className={cn(
                "absolute bottom-0 right-0 px-1 py-0.2 bg-black/80 text-[8px] font-mono font-bold rounded-tl",
                qualityBadgeColor
              )}
            >
              {qualityLabel}
            </div>
          </div>

          {/* Name & Attack Power */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={cn("text-xs font-bold leading-tight", nameColor)}>
                {characterName}
              </span>
              <span
                className={cn(
                  "text-[9px] font-mono px-1 rounded border",
                  tagClass
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

        {/* Skill Points or Co-op Badge */}
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

      {/* Vital Bars */}
      <div className="flex flex-col gap-1.5">
        <ProgressBar
          value={player.health}
          max={player.maxHealth}
          variant={isRed ? "health" : "mana"}
          label={t("health")}
          icon={
            <Heart
              className={cn(
                "w-3 h-3",
                isRed
                  ? "text-red-500 fill-red-500"
                  : "text-cyan-400 fill-cyan-400"
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
