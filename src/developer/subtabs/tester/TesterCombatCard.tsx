import React, { useState, useMemo } from "react";
import { Skull, Ghost, Trophy, AlertTriangle, Plus } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Select, Switch } from "@ui";
import { useI18n } from "@context/I18nContext";
import { MONSTER_ID_LIST } from "./constants";
import { TesterCombatCardProps } from "./types";

/**
 * Presentation card for enemy wipes, AI freeze toggling, win/loss triggers and monster spawning.
 */
export const TesterCombatCard: React.FC<TesterCombatCardProps> = ({
  freezeAI,
  onToggleFreezeAI,
  onKillAllEnemies,
  onForceVictory,
  onForceDefeat,
  onSpawnEnemy,
}) => {
  const { t } = useI18n();
  const [selectedEnemy, setSelectedEnemy] = useState<string>("court_sentinel");

  const monsterOptions = useMemo(
    () =>
      MONSTER_ID_LIST.map((m) => ({
        value: m.id,
        label: t(m.translationKey),
      })),
    [t]
  );

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Skull className="w-4 h-4 text-amber-400" />}>
          {t("testerCombatTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
          <Button
            variant="secondary"
            icon={<Skull size={14} />}
            onClick={onKillAllEnemies}
            className="text-red-400 hover:text-red-300"
          >
            {t("testerKillEnemiesBtn")}
          </Button>
          <div className="flex items-center justify-between px-3 py-1.5 bg-stone-900/70 border border-stone-800 rounded-lg h-9">
            <div className="flex items-center gap-1.5">
              <Ghost size={14} className={freezeAI ? "text-amber-400" : "text-stone-400"} />
              <span className="text-xs font-semibold text-stone-200">{t("testerFreezeAiLabel")}</span>
            </div>
            <Switch
              checked={freezeAI}
              onCheckedChange={onToggleFreezeAI}
              size="sm"
              aria-label={t("testerFreezeAiLabel")}
            />
          </div>
          <Button
            variant="secondary"
            icon={<Trophy size={14} />}
            onClick={onForceVictory}
            className="text-amber-400"
          >
            {t("testerForceVictoryBtn")}
          </Button>
          <Button
            variant="secondary"
            icon={<AlertTriangle size={14} />}
            onClick={onForceDefeat}
            className="text-stone-400"
          >
            {t("testerForceDefeatBtn")}
          </Button>
        </div>

        <Card variant="dark" className="p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Plus size={15} className="text-amber-400" />
            <span className="text-xs font-bold text-stone-200">
              {t("testerSpawnMonsterLabel")}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              size="sm"
              variant="castle"
              value={selectedEnemy}
              onChange={(e) => setSelectedEnemy(e.target.value)}
              options={monsterOptions}
              className="w-48 font-semibold text-xs"
            />
            <Button
              size="sm"
              variant="primary"
              icon={<Plus size={13} />}
              onClick={() => onSpawnEnemy(selectedEnemy)}
            >
              {t("testerSpawnNearPlayerBtn")}
            </Button>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};

export default TesterCombatCard;
