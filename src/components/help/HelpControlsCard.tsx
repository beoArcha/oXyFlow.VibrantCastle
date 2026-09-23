import React from "react";
import { PlayerId } from "../../game/types";
import gameInputs from "../../game/loop/input";
import { KbdKey, Badge } from "../ui";
import { useI18n } from "../../hooks/useI18n";
import { formatKeyLabel } from "./types";
import { cn } from "../../lib/utils";

export interface HelpControlsCardProps {
  playerId: PlayerId;
  title: string;
  icon: React.ReactNode;
  flankBadge: string;
  theme: "crimson" | "cyan";
  className?: string;
}

/**
 * Reusable Player Controls Card.
 * Dynamically resolves real keyboard bindings from the input engine,
 * guaranteeing the guide is always in sync with player customization.
 */
export const HelpControlsCard: React.FC<HelpControlsCardProps> = ({
  playerId,
  title,
  icon,
  flankBadge,
  theme,
  className = "",
}) => {
  const { t } = useI18n();
  const bindings = gameInputs.getKeyboardBindings(playerId);

  const isCrimson = theme === "crimson";
  const borderColor = isCrimson ? "border-red-900/60" : "border-cyan-900/60";
  const headerBorder = isCrimson ? "border-red-950" : "border-cyan-950";
  const titleColor = isCrimson ? "text-red-400" : "text-cyan-400";
  
  type KeyVariant = "amber" | "cyan" | "purple" | "stone";
  const keyVariant: KeyVariant = isCrimson ? "amber" : "cyan";
  const defaultMoveVariant: KeyVariant = isCrimson ? "stone" : "cyan";
  const secondarySpellVariant: KeyVariant = isCrimson ? "purple" : "cyan";

  const getFormattedKeys = (keys: string[] | undefined, max: number = 2): string[] => {
    if (!keys || keys.length === 0) return [];
    return keys.slice(0, max).map((k) => formatKeyLabel(k, t("spaceKey")));
  };

  // Movement directions
  const moveKeys: string[] = [
    ...(bindings.up?.[0] ? [formatKeyLabel(bindings.up[0], t("spaceKey"))] : []),
    ...(bindings.left?.[0] ? [formatKeyLabel(bindings.left[0], t("spaceKey"))] : []),
    ...(bindings.down?.[0] ? [formatKeyLabel(bindings.down[0], t("spaceKey"))] : []),
    ...(bindings.right?.[0] ? [formatKeyLabel(bindings.right[0], t("spaceKey"))] : []),
  ];

  interface ControlRow {
    label: string;
    keys: string[];
    variant: KeyVariant;
    separator?: string;
  }

  const controlRows: ControlRow[] = [
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
      variant: "cyan",
    },
    {
      label: t("secondarySpell"),
      keys: getFormattedKeys(bindings.magic2, 1),
      variant: secondarySpellVariant,
    },
  ];

  return (
    <div
      className={cn(
        "bg-[#1c0c07] border rounded-xl p-3.5 flex flex-col gap-3 shadow-inner",
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
            <div className="flex items-center gap-1 shrink-0">
              {row.keys.map((k, idx) => (
                <React.Fragment key={`${row.label}-${k}-${idx}`}>
                  <KbdKey variant={row.variant}>{k}</KbdKey>
                  {row.separator && idx < row.keys.length - 1 && (
                    <span className="text-[10px] text-stone-500">{row.separator}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpControlsCard;
