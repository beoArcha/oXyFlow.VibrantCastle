import React from "react";
import { Crosshair, Zap, Trash2 } from "lucide-react";
import { TableRow, TableCell, Button, IconButton } from "@ui";
import { useI18n } from "@context/I18nContext";
import { DebugEntityTableRowProps } from "./types";

export const DebugEntityTableRow: React.FC<DebugEntityTableRowProps> = React.memo(
  function DebugEntityTableRow({ enemy, onTeleport, onDamage, onRemove }) {
    const { t } = useI18n();

    const posX = Number.isFinite(enemy.x) ? Math.round(enemy.x) : 0;
    const posY = Number.isFinite(enemy.y) ? Math.round(enemy.y) : 0;
    const currentHp = Number.isFinite(enemy.health) ? Math.max(0, Math.round(enemy.health)) : 0;
    const maxHp = Number.isFinite(enemy.maxHealth) && enemy.maxHealth > 0 ? Math.round(enemy.maxHealth) : 100;

    const hpColorClass =
      currentHp <= 0
        ? "text-stone-500"
        : currentHp < maxHp * 0.3
          ? "text-rose-400"
          : "text-emerald-400";

    const displayName = enemy.defaultName || enemy.id;

    return (
      <TableRow className="font-mono text-xs">
        <TableCell className="py-2 px-3">
          <div className="flex flex-col">
            <span className="font-bold text-stone-200">{displayName}</span>
            <span className="text-[10px] text-stone-500">{enemy.id}</span>
          </div>
        </TableCell>

        <TableCell className="py-2 px-3 whitespace-nowrap text-amber-300">
          X: {posX}, Y: {posY}
        </TableCell>

        <TableCell className="py-2 px-3 whitespace-nowrap">
          <span className={`font-bold ${hpColorClass}`}>
            {currentHp} / {maxHp}
          </span>
        </TableCell>

        <TableCell className="py-2 px-3 whitespace-nowrap text-right">
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              icon={<Crosshair size={11} />}
              onClick={() => onTeleport?.(enemy)}
              title={t("debugActionTeleport")}
              aria-label={`${t("debugActionTeleport")}: ${displayName}`}
              className="h-6 text-[10px] px-2 py-0"
            >
              {t("debugActionTeleportShort")}
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Zap size={11} />}
              onClick={() => onDamage?.(enemy.id, 50)}
              title={t("debugActionDamage")}
              aria-label={`${t("debugActionDamage")}: ${displayName}`}
              className="h-6 text-[10px] px-2 py-0"
            >
              {t("debugActionDamageShort")}
            </Button>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Trash2 size={11} />}
              onClick={() => onRemove?.(enemy.id)}
              title={t("debugActionRemove")}
              aria-label={`${t("debugActionRemove")}: ${displayName}`}
              className="h-6 w-6 text-stone-500 hover:text-rose-400"
            />
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

DebugEntityTableRow.displayName = "DebugEntityTableRow";

export default DebugEntityTableRow;
