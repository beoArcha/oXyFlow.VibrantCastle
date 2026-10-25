import React, { useMemo } from "react";
import { PlayerId } from "@game/types";
import { Tabs, TabItem } from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import { PlayerTabSelectorProps } from "./types";

export type { PlayerTabSelectorProps };

/**
 * Standardized player selector tabs component for controls configuration (P1 vs P2).
 * Composes the generic Tabs design system primitive with localized player labels.
 *
 * @example
 * ```tsx
 * <PlayerTabSelector
 *   selectedPlayer={selectedPlayer}
 *   onSelectPlayer={setSelectedPlayer}
 * />
 * ```
 */
export const PlayerTabSelector: React.FC<PlayerTabSelectorProps> = React.memo(
  function PlayerTabSelector({
    selectedPlayer,
    onSelectPlayer,
    className,
    id = "player-tab-selector",
  }) {
    const { t } = useI18n();

    const items: TabItem[] = useMemo(
      () => [
        { id: PlayerId.Player1, label: t("p1Tag") },
        { id: PlayerId.Player2, label: t("p2Tag") },
      ],
      [t]
    );

    return (
      <div id={id} className={cn("w-full", className)}>
        <Tabs
          items={items}
          activeId={selectedPlayer}
          onChange={(newId) => onSelectPlayer(newId as PlayerId)}
        />
      </div>
    );
  }
);

PlayerTabSelector.displayName = "PlayerTabSelector";

export default PlayerTabSelector;
