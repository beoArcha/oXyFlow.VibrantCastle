import React, { useState, useEffect } from "react";
import {
  Clock,
  Swords,
  Skull,
  Zap,
  Sparkles,
  Shield,
  FlaskConical,
  Award,
  Flame,
  Target,
  BarChart3,
  RotateCcw,
  HardDrive,
  CheckCircle2,
} from "lucide-react";
import { statsManager } from "@game/logic/stats";
import { Card, CardHeader, CardTitle, CardContent, StatRow, Button, Badge, ProgressBar } from "@components/ui";
import { useI18n } from "@hooks/useI18n";
import { useSettings, useGameSession, useSaveGame } from "@hooks/useGame";
import { ITEM_REGISTRY } from "@game/logic/inventory";
import { SPELL_REGISTRY } from "@game/logic/magic";

export const StatsPanel: React.FC = () => {
  const { t } = useI18n();
  const { isTwoPlayer } = useSettings();
  const { p1, p2 } = useGameSession();
  const { setSaveNotification } = useSaveGame();
  const [stats, setStats] = useState(() => statsManager.getStats());
  const [resetConfirm, setResetConfirm] = useState(false);

  // Keep stats in sync in real-time
  useEffect(() => {
    const unsubscribe = statsManager.subscribe(() => {
      setStats({ ...statsManager.getStats() });
    });
    return () => unsubscribe();
  }, []);

  const handleResetStats = () => {
    statsManager.clearLocalStorage();
    setStats({ ...statsManager.getStats() });
    setResetConfirm(false);
    setSaveNotification(t("statsResetNotification"));
  };

  const formatPlayTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return `${hours} ${t("hoursUnit")} ${minutes} ${t("minutesUnit")} ${seconds} ${t("secondsUnit")}`;
    }
    if (minutes > 0) {
      return `${minutes} ${t("minutesUnit")} ${seconds} ${t("secondsUnit")}`;
    }
    return `${seconds} ${t("secondsUnit")}`;
  };

  const p1Stats = stats.p1;
  const p2Stats = stats.p2;

  const getWeaponOrSpellName = (key: string) => {
    if (ITEM_REGISTRY[key]) {
      return t(ITEM_REGISTRY[key].nameKey);
    }
    if (SPELL_REGISTRY[key]) {
      return t(SPELL_REGISTRY[key].nameKey);
    }
    if (key === "solar_rapier") return t("itemSolarRapierName");
    if (key === "frost_rapier") return t("itemFrostRapierName");
    if (key === "aether_staff") return t("itemAetherStaffName");
    return key;
  };

  // Find most effective weapon / spell across players
  const combinedDamageBySource: Record<string, number> = {};
  [p1Stats, p2Stats].forEach((p) => {
    Object.entries(p.damageByWeaponOrSpell).forEach(([src, dmg]) => {
      const numDmg = typeof dmg === "number" ? dmg : 0;
      combinedDamageBySource[src] = (combinedDamageBySource[src] || 0) + numDmg;
    });
  });

  const bestDamageSource = Object.entries(combinedDamageBySource).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const totalPotionsConsumed =
    p1Stats.potionsDrunkTotal + (isTwoPlayer ? p2Stats.potionsDrunkTotal : 0);

  const totalKills = p1Stats.kills + (isTwoPlayer ? p2Stats.kills : 0);

  const totalDamageDealt =
    p1Stats.damageDealt + (isTwoPlayer ? p2Stats.damageDealt : 0);

  const combinedKillsByType = {
    dummy: p1Stats.killsByEnemyType.dummy + (isTwoPlayer ? p2Stats.killsByEnemyType.dummy : 0),
    automaton: p1Stats.killsByEnemyType.automaton + (isTwoPlayer ? p2Stats.killsByEnemyType.automaton : 0),
    gargoyle: p1Stats.killsByEnemyType.gargoyle + (isTwoPlayer ? p2Stats.killsByEnemyType.gargoyle : 0),
    crawler: p1Stats.killsByEnemyType.crawler + (isTwoPlayer ? p2Stats.killsByEnemyType.crawler : 0),
  };

  const combinedPotionsByType = {
    health: p1Stats.potionsByType.health + (isTwoPlayer ? p2Stats.potionsByType.health : 0),
    mana: p1Stats.potionsByType.mana + (isTwoPlayer ? p2Stats.potionsByType.mana : 0),
    stamina: p1Stats.potionsByType.stamina + (isTwoPlayer ? p2Stats.potionsByType.stamina : 0),
  };

  return (
    <div id="game-statistics-panel" className="flex flex-col gap-4 animate-in fade-in duration-150">
      {/* Session Header Card */}
      <Card variant="subtle" className="border-amber-500/40 bg-[#1c0c07]/90">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle icon={<BarChart3 className="w-5 h-5 text-amber-400" />}>
              {t("gameStatsTitle")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="amber" className="text-[10px] flex items-center gap-1">
                <HardDrive size={10} className="text-amber-400" />
                localStorage
              </Badge>
              {!resetConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResetConfirm(true)}
                  icon={<RotateCcw size={12} />}
                  className="text-xs h-7 px-2.5 border-stone-700 text-stone-300 hover:text-red-300 hover:border-red-700"
                >
                  {t("resetStatsBtn")}
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleResetStats}
                    icon={<RotateCcw size={12} />}
                    className="text-xs h-7 px-2.5"
                  >
                    {t("resetStatsBtn")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResetConfirm(false)}
                    className="text-xs h-7 px-2"
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[#fed7aa] mb-3 leading-relaxed">
            {t("gameStatsSubtitle")}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#140602]/90 border border-amber-500/30 rounded-xl p-2.5 flex flex-col">
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <Clock size={12} className="text-amber-400" />
                {t("playTime")}
              </span>
              <span className="font-mono font-bold text-sm text-amber-200 mt-1">
                {formatPlayTime(stats.totalPlayTimeSeconds)}
              </span>
            </div>

            <div className="bg-[#140602]/90 border border-amber-500/30 rounded-xl p-2.5 flex flex-col">
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <Skull size={12} className="text-red-400" />
                {t("totalKills")}
              </span>
              <span className="font-mono font-bold text-sm text-red-300 mt-1">
                {totalKills}
              </span>
            </div>

            <div className="bg-[#140602]/90 border border-amber-500/30 rounded-xl p-2.5 flex flex-col">
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <Swords size={12} className="text-amber-400" />
                {t("damageDealt")}
              </span>
              <span className="font-mono font-bold text-sm text-amber-300 mt-1">
                {Math.round(totalDamageDealt)}
              </span>
            </div>

            <div className="bg-[#140602]/90 border border-amber-500/30 rounded-xl p-2.5 flex flex-col">
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <FlaskConical size={12} className="text-cyan-400" />
                {t("potionsConsumed")}
              </span>
              <span className="font-mono font-bold text-sm text-cyan-300 mt-1">
                {totalPotionsConsumed}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Performance Breakdown */}
      <div className={isTwoPlayer ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex flex-col gap-4"}>
        {/* Player 1 (Valen) */}
        <Card variant="subtle" className="border-red-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle icon={<Swords className="w-4 h-4 text-red-400" />}>
                {t("p1Status")}
              </CardTitle>
              <Badge variant="red" className="text-[10px]">
                {p1?.score || 0} XP
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <StatRow
              label={t("totalKills")}
              value={p1Stats.kills}
              icon={<Skull size={13} className="text-red-400" />}
              variant="red"
            />
            <StatRow
              label={t("damageDealt")}
              value={Math.round(p1Stats.damageDealt)}
              icon={<Flame size={13} className="text-amber-400" />}
              variant="amber"
            />
            <StatRow
              label={t("damageTaken")}
              value={Math.round(p1Stats.damageTaken)}
              icon={<Shield size={13} className="text-stone-400" />}
            />
            <StatRow
              label={t("meleeAttack")}
              value={p1Stats.swordStrikes}
              icon={<Swords size={13} className="text-stone-300" />}
            />
            <StatRow
              label={t("magicPrimary")}
              value={p1Stats.spellsCast}
              icon={<Sparkles size={13} className="text-cyan-400" />}
              variant="cyan"
            />
            <StatRow
              label={t("potionsConsumed")}
              value={p1Stats.potionsDrunkTotal}
              icon={<FlaskConical size={13} className="text-amber-300" />}
              variant="amber"
            />
          </CardContent>
        </Card>

        {/* Player 2 (Aurelia) if 2P enabled */}
        {isTwoPlayer && (
          <Card variant="subtle" className="border-cyan-900/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle icon={<Sparkles className="w-4 h-4 text-cyan-400" />}>
                  {t("p2Status")}
                </CardTitle>
                <Badge variant="cyan" className="text-[10px]">
                  {p2?.score || 0} XP
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <StatRow
                label={t("totalKills")}
                value={p2Stats.kills}
                icon={<Skull size={13} className="text-cyan-400" />}
                variant="cyan"
              />
              <StatRow
                label={t("damageDealt")}
                value={Math.round(p2Stats.damageDealt)}
                icon={<Flame size={13} className="text-amber-400" />}
                variant="amber"
              />
              <StatRow
                label={t("damageTaken")}
                value={Math.round(p2Stats.damageTaken)}
                icon={<Shield size={13} className="text-stone-400" />}
              />
              <StatRow
                label={t("meleeAttack")}
                value={p2Stats.swordStrikes}
                icon={<Swords size={13} className="text-stone-300" />}
              />
              <StatRow
                label={t("magicPrimary")}
                value={p2Stats.spellsCast}
                icon={<Sparkles size={13} className="text-cyan-400" />}
                variant="cyan"
              />
              <StatRow
                label={t("potionsConsumed")}
                value={p2Stats.potionsDrunkTotal}
                icon={<FlaskConical size={13} className="text-cyan-300" />}
                variant="cyan"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Breakdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Enemies Slain Breakdown */}
        <Card variant="subtle">
          <CardHeader>
            <CardTitle icon={<Target className="w-4 h-4 text-amber-400" />}>
              {t("killsBreakdown")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300">{t("trainingDummiesKilled")}</span>
                <span className="font-mono font-bold text-amber-300">
                  {combinedKillsByType.dummy}
                </span>
              </div>
              <ProgressBar
                value={combinedKillsByType.dummy}
                max={Math.max(1, totalKills)}
                variant="stamina"
                heightClass="h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300">{t("automatonsKilled")}</span>
                <span className="font-mono font-bold text-amber-300">
                  {combinedKillsByType.automaton}
                </span>
              </div>
              <ProgressBar
                value={combinedKillsByType.automaton}
                max={Math.max(1, totalKills)}
                variant="stamina"
                heightClass="h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300">{t("gargoylesKilled")}</span>
                <span className="font-mono font-bold text-amber-300">
                  {combinedKillsByType.gargoyle}
                </span>
              </div>
              <ProgressBar
                value={combinedKillsByType.gargoyle}
                max={Math.max(1, totalKills)}
                variant="stamina"
                heightClass="h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300">{t("crawlersKilled")}</span>
                <span className="font-mono font-bold text-amber-300">
                  {combinedKillsByType.crawler}
                </span>
              </div>
              <ProgressBar
                value={combinedKillsByType.crawler}
                max={Math.max(1, totalKills)}
                variant="stamina"
                heightClass="h-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Potions Consumed Breakdown */}
        <Card variant="subtle">
          <CardHeader>
            <CardTitle icon={<FlaskConical className="w-4 h-4 text-cyan-400" />}>
              {t("potionsBreakdown")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {t("healthPotionStat")}
                </span>
                <span className="font-mono font-bold text-red-300">
                  {combinedPotionsByType.health}
                </span>
              </div>
              <ProgressBar
                value={combinedPotionsByType.health}
                max={Math.max(1, totalPotionsConsumed)}
                variant="health"
                heightClass="h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {t("manaPotionStat")}
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  {combinedPotionsByType.mana}
                </span>
              </div>
              <ProgressBar
                value={combinedPotionsByType.mana}
                max={Math.max(1, totalPotionsConsumed)}
                variant="mana"
                heightClass="h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {t("staminaPotionStat")}
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {combinedPotionsByType.stamina}
                </span>
              </div>
              <ProgressBar
                value={combinedPotionsByType.stamina}
                max={Math.max(1, totalPotionsConsumed)}
                variant="stamina"
                heightClass="h-1.5"
              />
            </div>

            <div className="mt-2 pt-2 border-t border-[#3a1a0f] flex justify-between text-xs">
              <span className="text-stone-400">{t("leversActivatedCount")}:</span>
              <span className="font-mono font-bold text-amber-300">{stats.leversPulled}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weapon & Spell Efficacy */}
      <Card variant="subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Award className="w-4 h-4 text-amber-400" />}>
              {t("weaponsBreakdown")}
            </CardTitle>
            {bestDamageSource && (
              <Badge variant="amber" className="text-[10px]">
                {t("mostEffectiveSpell")}: {getWeaponOrSpellName(bestDamageSource[0])}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(combinedDamageBySource).length === 0 ? (
            <div className="text-center py-4 text-xs text-stone-500 italic">
              {t("narratorIdlePrompt")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(combinedDamageBySource).map(([srcKey, dmg]) => {
                const totalDmg = Math.max(1, totalDamageDealt);
                const pct = Math.round((dmg / totalDmg) * 100);
                return (
                  <div
                    key={srcKey}
                    className="p-2 rounded-xl bg-[#140602]/80 border border-[#5c2d18] flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-200">
                        {getWeaponOrSpellName(srcKey)}
                      </span>
                      <span className="font-mono text-stone-300">
                        {Math.round(dmg)} ({pct}%)
                      </span>
                    </div>
                    <ProgressBar value={dmg} max={totalDmg} variant="stamina" heightClass="h-1.5" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsPanel;
