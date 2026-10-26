import React from "react";
import { Heart, Sparkles, Zap } from "lucide-react";
import { ProgressBar } from "@ui";
import { useI18n } from "@context/I18nContext";
import type { PlayerThemeTokens } from "@styles/theme";
import { cn } from "@lib/utils";

export interface HUDPlayerVitalsProps {
  readonly health: number;
  readonly maxHealth: number;
  readonly mana: number;
  readonly maxMana: number;
  readonly stamina: number;
  readonly maxStamina: number;
  readonly themeTokens: PlayerThemeTokens;
  readonly className?: string;
}

/**
 * Renders the health, mana, and stamina progress bars for a player with theme colors.
 */
export const HUDPlayerVitals: React.FC<HUDPlayerVitalsProps> = React.memo(({
  health,
  maxHealth,
  mana,
  maxMana,
  stamina,
  maxStamina,
  themeTokens,
  className,
}) => {
  const { t } = useI18n();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <ProgressBar
        value={health}
        max={maxHealth}
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
        value={mana}
        max={maxMana}
        variant="mana"
        label={t("mana")}
        icon={<Sparkles className="w-3 h-3 text-cyan-400" />}
        heightClass="h-2"
      />
      <ProgressBar
        value={stamina}
        max={maxStamina}
        variant="stamina"
        label={t("stamina")}
        icon={<Zap className="w-3 h-3 text-amber-400" />}
        heightClass="h-2"
      />
    </div>
  );
});

HUDPlayerVitals.displayName = "HUDPlayerVitals";
export default HUDPlayerVitals;
