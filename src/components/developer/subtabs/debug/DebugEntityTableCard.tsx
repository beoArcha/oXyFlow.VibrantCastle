import React, { useState, useMemo } from "react";
import { Skull } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  EmptyState,
  SearchInput,
} from "@components/ui";
import { Enemy } from "@game/types";
import { useI18n } from "@context/I18nContext";
import { DebugEntityTableRow } from "./DebugEntityTableRow";

export interface DebugEntityTableProps {
  enemies: Enemy[];
  onTeleportToEnemy?: (enemy: Enemy) => void;
  onDamageEnemy?: (enemyId: string, amount: number) => void;
  onRemoveEnemy?: (enemyId: string) => void;
  onActionComplete?: () => void;
}

export const DebugEntityTableCard: React.FC<DebugEntityTableProps> = React.memo(
  function DebugEntityTableCard({
    enemies,
    onTeleportToEnemy,
    onDamageEnemy,
    onRemoveEnemy,
    onActionComplete,
  }) {
    const { t } = useI18n();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredEnemies = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return enemies;
      return enemies.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          (e.defaultName && e.defaultName.toLowerCase().includes(q))
      );
    }, [enemies, searchQuery]);

    const handleTeleport = (enemy: Enemy) => {
      if (!Number.isFinite(enemy.x) || !Number.isFinite(enemy.y)) return;
      onTeleportToEnemy?.(enemy);
      onActionComplete?.();
    };

    const handleDamage = (enemyId: string, amount: number) => {
      onDamageEnemy?.(enemyId, amount);
      onActionComplete?.();
    };

    const handleRemove = (enemyId: string) => {
      onRemoveEnemy?.(enemyId);
      onActionComplete?.();
    };

    return (
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <CardTitle icon={<Skull className="w-4 h-4 text-rose-400" />}>
                {t("debugEntityTableTitle")}
              </CardTitle>
              <Badge variant="red">{enemies.length}</Badge>
            </div>
            {enemies.length > 3 && (
              <div className="w-48">
                <SearchInput
                  value={searchQuery}
                  onChange={(val) => setSearchQuery(val)}
                  onClear={() => setSearchQuery("")}
                  placeholder={t("debugSearchEnemiesPlaceholder")}
                  className="h-7 text-xs"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {enemies.length === 0 ? (
            <EmptyState
              icon={<Skull size={24} className="text-stone-600" />}
              title={t("debugNoEnemies")}
              compact={true}
            />
          ) : filteredEnemies.length === 0 ? (
            <EmptyState
              title={t("debugNoFilterResults")}
              compact={true}
            />
          ) : (
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>{t("debugTableId")}</TableHead>
                    <TableHead>{t("debugTableCoords")}</TableHead>
                    <TableHead>{t("debugTableHp")}</TableHead>
                    <TableHead className="text-right">{t("debugTableActions")}</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredEnemies.map((enemy) => (
                    <DebugEntityTableRow
                      key={enemy.id}
                      enemy={enemy}
                      onTeleport={handleTeleport}
                      onDamage={handleDamage}
                      onRemove={handleRemove}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

DebugEntityTableCard.displayName = "DebugEntityTableCard";

export default DebugEntityTableCard;
