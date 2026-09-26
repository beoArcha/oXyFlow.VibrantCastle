import React from "react";
import { Skull, Crosshair, Zap, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "../../../ui";
import { Enemy, PlayerId } from "../../../../game/types";
import { useI18n } from "../../../../hooks/useI18n";
import gameEngine from "../../../../game/loop/engine";

export interface DebugEntityTableProps {
  enemies: Enemy[];
  onActionComplete?: () => void;
}

export const DebugEntityTableCard: React.FC<DebugEntityTableProps> = ({
  enemies,
  onActionComplete,
}) => {
  const { t } = useI18n();

  const handleTeleportToEnemy = (enemy: Enemy) => {
    if (!Number.isFinite(enemy.x) || !Number.isFinite(enemy.y)) return;
    gameEngine.teleportPlayer(PlayerId.Player1, Math.round(enemy.x), Math.round(enemy.y - 40));
    onActionComplete?.();
  };

  const handleDamageEnemy = (enemyId: string) => {
    gameEngine.damageEnemy(enemyId, 50);
    onActionComplete?.();
  };

  const handleRemoveEnemy = (enemyId: string) => {
    gameEngine.removeEnemy(enemyId);
    onActionComplete?.();
  };

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Skull className="w-4 h-4 text-rose-400" />}>
          {t("debugEntityTableTitle")}
        </CardTitle>
        <Badge variant="red">{enemies.length}</Badge>
      </CardHeader>
      <CardContent>
        {enemies.length === 0 ? (
          <div className="p-4 text-center text-xs text-stone-500 font-mono">
            {t("debugNoEnemies")}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-stone-400 uppercase bg-[#140602] border-b border-stone-800">
                <tr>
                  <th className="py-2 px-3">{t("debugTableId")}</th>
                  <th className="py-2 px-3">{t("debugTableCoords")}</th>
                  <th className="py-2 px-3">{t("debugTableHp")}</th>
                  <th className="py-2 px-3 text-right">{t("debugTableActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {enemies.map((enemy) => (
                  <tr key={enemy.id} className="hover:bg-white/5 transition-colors">
                    {/* ID / Name */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-200">
                          {enemy.defaultName || enemy.id}
                        </span>
                        <span className="text-[10px] text-stone-500">{enemy.id}</span>
                      </div>
                    </td>

                    {/* Coordinates */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-amber-300">
                      X: {Math.round(enemy.x)}, Y: {Math.round(enemy.y)}
                    </td>

                    {/* HP */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          enemy.health <= 0
                            ? "text-stone-500"
                            : enemy.health < enemy.maxHealth * 0.3
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {Math.round(enemy.health)} / {enemy.maxHealth}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Crosshair size={11} />}
                          onClick={() => handleTeleportToEnemy(enemy)}
                          title={t("debugActionTeleport")}
                          className="h-6 text-[10px] px-2 py-0"
                        >
                          TP
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<Zap size={11} />}
                          onClick={() => handleDamageEnemy(enemy.id)}
                          title={t("debugActionDamage")}
                          className="h-6 text-[10px] px-2 py-0"
                        >
                          -50
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Trash2 size={11} />}
                          onClick={() => handleRemoveEnemy(enemy.id)}
                          title={t("debugActionRemove")}
                          className="h-6 text-[10px] px-1.5 py-0 text-stone-500 hover:text-rose-400"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugEntityTableCard;
