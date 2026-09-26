import React, { useState } from "react";
import { Skull, Ghost, Trophy, AlertTriangle, Plus } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";

export const MONSTER_ID_LIST = [
  { id: "training_dummy", translationKey: "enemyTrainingDummy" },
  { id: "court_sentinel", translationKey: "enemyCourtSentinel" },
  { id: "chasm_crawler", translationKey: "enemyChasmCrawler" },
  { id: "bastion_gargoyle", translationKey: "enemyBastionGargoyle" },
  { id: "bastion_sentinel_boss", translationKey: "enemyBastionSentinelBoss" },
  { id: "clockwork_automaton", translationKey: "enemyClockworkAutomaton" },
  { id: "aether_wisp", translationKey: "enemyAetherWisp" },
];

export interface TesterCombatCardProps {
  freezeAI: boolean;
  onToggleFreezeAI: () => void;
  onKillAllEnemies: () => void;
  onForceVictory: () => void;
  onForceDefeat: () => void;
  onSpawnEnemy: (enemyTypeId: string) => void;
}

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

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Skull className="w-4 h-4 text-amber-400" />}>
          {t("testerCombatTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Combat actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            variant="secondary"
            icon={<Skull size={14} />}
            onClick={onKillAllEnemies}
            className="text-red-400 hover:text-red-300"
          >
            {t("testerKillEnemiesBtn")}
          </Button>
          <Button
            variant={freezeAI ? "primary" : "secondary"}
            icon={<Ghost size={14} />}
            onClick={onToggleFreezeAI}
          >
            {t("testerFreezeAiLabel")}{" "}
            {freezeAI ? t("testerStatusOn") : t("testerStatusOff")}
          </Button>
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

        {/* Enemy Spawner Controls */}
        <div className="p-3 bg-[#180904] rounded-lg border border-[#4a1d0d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Plus size={15} className="text-amber-400" />
            <span className="text-xs font-bold text-stone-200">
              {t("testerSpawnMonsterLabel")}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedEnemy}
              onChange={(e) => setSelectedEnemy(e.target.value)}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
            >
              {MONSTER_ID_LIST.map((m) => (
                <option key={m.id} value={m.id}>
                  {t(m.translationKey)}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="primary"
              icon={<Plus size={13} />}
              onClick={() => onSpawnEnemy(selectedEnemy)}
            >
              {t("testerSpawnNearPlayerBtn")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TesterCombatCard;
