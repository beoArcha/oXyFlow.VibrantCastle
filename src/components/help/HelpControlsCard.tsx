import React, { useMemo } from "react";
import { PlayerId } from "@game/types";
import { KbdGroup, Badge } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { useKeyboard, formatKeyLabel } from "@components/controls";
import { cn } from "@lib/utils";
import { HelpControlsCardProps } from "./types";

export type { HelpControlsCardProps };

/**
 * Reusable Player Controls Card.
 * Dynamically resolves real keyboard bindings from the input engine via useKeyboard,
 * guaranteeing the guide is always in sync with player customization.
 */
export const HelpControlsCard: React.FC<HelpControlsCardProps> = React.memo(
  function HelpControlsCard({
    playerId,
    title,
    icon,
    flankBadge,
    theme,
    className = "",
  }) {
    const { t } = useI18n();
    const { bindings } = useKeyboard(playerId);

    const isCrimson = theme === "crimson";
    const borderColor = isCrimson ? "border-red-900/60" : "border-cyan-900/60";
    const headerBorder = isCrimson ? "border-red-950" : "border-cyan-950";
    const titleColor = isCrimson ? "text-red-400" : "text-cyan-400";

    type KeyVariant = "amber" | "cyan" | "purple" | "stone";
    const keyVariant: KeyVariant = isCrimson ? "amber" : "cyan";
    const defaultMoveVariant: KeyVariant = isCrimson ? "stone" : "cyan";
    const secondarySpellVariant: KeyVariant = isCrimson ? "purple" : "cyan";

    interface ControlRow {
      readonly label: string;
      readonly keys: readonly string[];
      readonly variant: KeyVariant;
      readonly separator?: string;
    }

    const controlRows: readonly ControlRow[] = useMemo(() => {
      const getFormattedKeys = (keys: readonly string[] | undefined, max: number = 2): readonly string[] => {
        if (!keys || keys.length === 0) return [];
        return keys.slice(0, max).map((k) => formatKeyLabel(k, t("spaceKey")));
      };

      const moveKeys: readonly string[] = [
        ...(bindings.up?.[0] ? [formatKeyLabel(bindings.up[0], t("spaceKey"))] : []),
        ...(bindings.left?.[0] ? [formatKeyLabel(bindings.left[0], t("spaceKey"))] : []),
        ...(bindings.down?.[0] ? [formatKeyLabel(bindings.down[0], t("spaceKey"))] : []),
        ...(bindings.right?.[0] ? [formatKeyLabel(bindings.right[0], t("spaceKey"))] : []),
      ];

      return [
        {
          label: t("moveAndCrouch"),
          keys: moveKeys,
          variant: defaultMoveVariant,
        },
        {
          label: t("jumpAction"),
          keys: getFormattedKeys(bindings.jump),
          variant: defaultMoveVariant,
          separator: "/",
        },
        {
          label: t("meleeAttack"),
          keys: getFormattedKeys(bindings.action1, 1),
          variant: keyVariant,
        },
        {
          label: t("dashAction"),
          keys: getFormattedKeys(bindings.action2, 1),
          variant: keyVariant,
        },
        {
          label: t("primarySpell"),
          keys: getFormattedKeys(bindings.magic1, 1),
          variant: "cyan" as KeyVariant,
        },
        {
          label: t("secondarySpell"),
          keys: getFormattedKeys(bindings.magic2, 1),
          variant: secondarySpellVariant,
        },
      ];
    }, [bindings, defaultMoveVariant, keyVariant, secondarySpellVariant, t]);

    return (
      <div
        className={cn(
          "bg-stone-950/80 border rounded-xl p-3.5 flex flex-col gap-3 shadow-inner",
          borderColor,
          className
        )}
      >
        <div className={cn("flex items-center justify-between border-b pb-2", headerBorder)}>
          <span className={cn("font-bold text-xs flex items-center gap-1.5", titleColor)}>
            {icon}
            {title}
          </span>
          <Badge variant={isCrimson ? "red" : "cyan"} className="text-[10px]">
            {flankBadge}
          </Badge>
        </div>

        <div className="flex flex-col gap-2 text-xs">
          {controlRows.map((row) => (
            <div key={row.label} className="flex justify-between items-center gap-2">
              <span className="text-stone-300">{row.label}</span>
              <KbdGroup
                keys={row.keys as string[]}
                variant={row.variant}
                separator={row.separator}
                className="gap-1 shrink-0"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

HelpControlsCard.displayName = "HelpControlsCard";

export default HelpControlsCard;
