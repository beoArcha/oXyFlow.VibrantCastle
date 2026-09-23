import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapPin,
  Shield,
  Zap,
  Ghost,
  Heart,
  Swords,
  Skull,
  FastForward,
  Eye,
  Activity,
  Layers,
  Music,
  Sparkles,
  Plus,
  Trash2,
  Crosshair,
  Compass,
  Trophy,
  AlertTriangle,
  Coins,
  StepForward,
} from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "../../ui";
import { useGameSession } from "../../../hooks/useGame";
import { useI18n } from "../../../hooks/useI18n";
import { debugManager, SpawnPreset } from "../../../game/debug/debugManager";
import gameEngine from "../../../game/loop/engine";
import { LocationId, PlayerId } from "../../../game/types";
import { BackgroundLayerTier } from "../../../game/locations/schema/locationSchema";
import { getLocation } from "../../../game/locations";

const LOCATION_IDS: LocationId[] = [
  "courtyard",
  "thorn_chasm",
  "grand_bastion",
  "clocktower",
  "aether_sanctuary",
];

const MONSTER_ID_LIST = [
  { id: "training_dummy", translationKey: "enemyTrainingDummy" },
  { id: "court_sentinel", translationKey: "enemyCourtSentinel" },
  { id: "chasm_crawler", translationKey: "enemyChasmCrawler" },
  { id: "bastion_gargoyle", translationKey: "enemyBastionGargoyle" },
  { id: "bastion_sentinel_boss", translationKey: "enemyBastionSentinelBoss" },
  { id: "clockwork_automaton", translationKey: "enemyClockworkAutomaton" },
  { id: "aether_wisp", translationKey: "enemyAetherWisp" },
];

export const TesterSubTab: React.FC = () => {
  const { p1, currentLocationId, loadLocation } = useGameSession();
  const { t } = useI18n();

  // Reactive debug state from debugManager
  const [debugState, setDebugState] = useState(debugManager.state);
  useEffect(() => {
    return debugManager.subscribe(() => {
      setDebugState({ ...debugManager.state });
    });
  }, []);

  // Teleport inputs
  const [customX, setCustomX] = useState<number>(p1 ? Math.round(p1.x) : 150);
  const [customY, setCustomY] = useState<number>(p1 ? Math.round(p1.y) : 450);

  // Selected enemy for spawner
  const [selectedEnemy, setSelectedEnemy] = useState<string>("court_sentinel");

  // Update coords if player position is available on initial open
  useEffect(() => {
    if (p1) {
      setCustomX(Math.round(p1.x));
      setCustomY(Math.round(p1.y));
    }
  }, [p1?.x, p1?.y]);

  const presets = useMemo(
    () => debugManager.getSpawnPresets(currentLocationId),
    [currentLocationId]
  );

  const handleCustomTeleport = useCallback(() => {
    gameEngine.teleportPlayer(PlayerId.Player1, customX, customY);
  }, [customX, customY]);

  const handlePresetTeleport = useCallback((x: number, y: number) => {
    setCustomX(x);
    setCustomY(y);
    gameEngine.teleportPlayer(PlayerId.Player1, x, y);
  }, []);

  const getPresetLabel = useCallback(
    (preset: SpawnPreset): string => {
      const pascalKey = `preset${preset.id.charAt(0).toUpperCase()}${preset.id.slice(1)}`;
      const localized = t(pascalKey);
      return localized !== pascalKey ? localized : preset.name;
    },
    [t]
  );

  return (
    <div id="subtab-content-tester" className="flex flex-col gap-4 animate-in fade-in duration-150 text-sm">
      {/* 1. SPAWN & TELEPORTATION */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<MapPin className="w-4 h-4 text-amber-400" />}>
            {t("testerSpawnPointsTitle")}
          </CardTitle>
          <Badge variant="amber">{currentLocationId}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Predefined Checkpoints */}
          <div>
            <div className="text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <Compass size={13} className="text-amber-400" />
              <span>{t("testerCheckpointsLabel")}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((preset: SpawnPreset) => (
                <Button
                  key={preset.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePresetTeleport(preset.x, preset.y)}
                  className="flex flex-col items-start py-2 px-3 text-left h-auto"
                >
                  <span className="font-bold text-amber-300 text-xs">
                    {getPresetLabel(preset)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    X: {preset.x}, Y: {preset.y}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Manual Teleport Coordinates */}
          <div className="p-3 bg-[#180904] rounded-lg border border-[#4a1d0d] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Crosshair size={15} className="text-amber-400" />
              <span className="text-xs font-bold text-stone-200">
                {t("testerCoordsLabel")}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-xs text-stone-400 font-mono">X:</span>
                <input
                  type="number"
                  value={customX}
                  onChange={(e) => setCustomX(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-stone-400 font-mono">Y:</span>
                <input
                  type="number"
                  value={customY}
                  onChange={(e) => setCustomY(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <Button size="sm" variant="primary" onClick={handleCustomTeleport}>
                {t("testerTeleportBtn")}
              </Button>
            </div>
          </div>

          {/* Click to Teleport & Location Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#4a1d0d]">
            <Button
              size="sm"
              variant={debugState.clickToTeleport ? "primary" : "secondary"}
              icon={<Crosshair size={14} />}
              onClick={() => debugManager.toggleClickToTeleport()}
            >
              {t("testerClickTeleportLabel")}{" "}
              {debugState.clickToTeleport ? t("testerStatusOn") : t("testerStatusOff")}
            </Button>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-stone-400 font-medium">
                {t("testerSwitchLocationLabel")}
              </span>
              {LOCATION_IDS.map((locId) => {
                const locDef = getLocation(locId);
                const locName = locDef ? t(locDef.nameKey) : locId;
                const shortName = locName.split(" ")[0];

                return (
                  <button
                    key={locId}
                    type="button"
                    onClick={() => loadLocation(locId)}
                    className={`px-2 py-1 text-[11px] font-bold rounded border transition-colors cursor-pointer ${
                      currentLocationId === locId
                        ? "bg-amber-600 text-white border-amber-400"
                        : "bg-stone-900 text-stone-300 border-stone-800 hover:border-amber-700"
                    }`}
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. CHEATS & STATS */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Shield className="w-4 h-4 text-amber-400" />}>
            {t("testerCheatsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant={debugState.godMode ? "primary" : "secondary"}
              icon={<Shield size={14} />}
              onClick={() => debugManager.toggleGodMode()}
            >
              {t("testerGodModeLabel")}{" "}
              {debugState.godMode ? t("testerStatusOn") : t("testerStatusOff")}
            </Button>
            <Button
              variant={debugState.infiniteMana ? "primary" : "secondary"}
              icon={<Zap size={14} />}
              onClick={() => debugManager.toggleInfiniteMana()}
            >
              {t("testerInfManaLabel")}{" "}
              {debugState.infiniteMana ? t("testerStatusOn") : t("testerStatusOff")}
            </Button>
            <Button
              variant={debugState.infiniteStamina ? "primary" : "secondary"}
              icon={<FastForward size={14} />}
              onClick={() => debugManager.toggleInfiniteStamina()}
            >
              {t("testerInfStaminaLabel")}{" "}
              {debugState.infiniteStamina ? t("testerStatusOn") : t("testerStatusOff")}
            </Button>
            <Button
              variant={debugState.noClip ? "primary" : "secondary"}
              icon={<Ghost size={14} />}
              onClick={() => debugManager.toggleNoClip()}
            >
              {t("testerNoClipLabel")}{" "}
              {debugState.noClip ? t("testerStatusOn") : t("testerStatusOff")}
            </Button>
          </div>

          {/* Vitals Quick Restores */}
          <div className="p-3 bg-[#180904] rounded-lg border border-[#4a1d0d] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Heart size={15} className="text-red-400" />
              <span className="text-xs font-bold text-stone-200">
                {t("testerHpControlsLabel")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="sm" variant="secondary" onClick={() => gameEngine.setPlayerStat(0, "health", 1)}>
                {t("tester1HpBtn")}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => gameEngine.setPlayerStat(0, "health", 50)}>
                {t("tester50HpBtn")}
              </Button>
              <Button size="sm" variant="primary" icon={<Heart size={13} />} onClick={() => gameEngine.refillVitals(0)}>
                {t("testerRefillAllBtn")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. SPAWNER (ITEMS, WEAPONS, GOLD) */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Swords className="w-4 h-4 text-amber-400" />}>
            {t("testerItemsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant="secondary"
              icon={<Swords size={14} />}
              onClick={() => gameEngine.giveAllWeapons(0)}
            >
              {t("testerGiveWeaponsBtn")}
            </Button>
            <Button
              variant="secondary"
              icon={<Sparkles size={14} />}
              onClick={() => gameEngine.unlockAllSkills(0)}
            >
              {t("testerUnlockSpellsBtn")}
            </Button>
            <Button
              variant="secondary"
              icon={<Heart size={14} />}
              onClick={() => gameEngine.givePotions(0)}
            >
              {t("testerGivePotionsBtn")}
            </Button>
            <Button
              variant="secondary"
              icon={<Trash2 size={14} />}
              onClick={() => gameEngine.clearInventory(0)}
            >
              {t("testerClearInventoryBtn")}
            </Button>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#180904] rounded-lg border border-[#4a1d0d] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Coins size={15} className="text-yellow-400" />
              <span className="text-xs font-bold text-stone-200">
                {t("testerAddGoldLabel")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => gameEngine.addGold(100)}>
                +100
              </Button>
              <Button size="sm" variant="secondary" onClick={() => gameEngine.addGold(1000)}>
                +1,000
              </Button>
              <Button size="sm" variant="primary" onClick={() => gameEngine.addGold(10000)}>
                +10,000
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. COMBAT & AI MANAGEMENT */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Skull className="w-4 h-4 text-amber-400" />}>
            {t("testerCombatTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant="secondary"
              icon={<Skull size={14} />}
              onClick={() => gameEngine.killAllEnemies()}
              className="text-red-400 hover:text-red-300"
            >
              {t("testerKillEnemiesBtn")}
            </Button>
            <Button
              variant={debugState.freezeAI ? "primary" : "secondary"}
              icon={<Ghost size={14} />}
              onClick={() => debugManager.toggleFreezeAI()}
            >
              {t("testerFreezeAiLabel")}{" "}
              {debugState.freezeAI ? t("testerStatusOn") : t("testerStatusOff")}
            </Button>
            <Button
              variant="secondary"
              icon={<Trophy size={14} />}
              onClick={() => gameEngine.forceVictory()}
              className="text-amber-400"
            >
              {t("testerForceVictoryBtn")}
            </Button>
            <Button
              variant="secondary"
              icon={<AlertTriangle size={14} />}
              onClick={() => gameEngine.forceDefeat()}
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
                className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-semibold"
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
                onClick={() => gameEngine.spawnEnemy(selectedEnemy)}
              >
                {t("testerSpawnNearPlayerBtn")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. SIMULATION SPEED & TIME SCALE */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<FastForward className="w-4 h-4 text-amber-400" />}>
            {t("testerSpeedTitle")}
          </CardTitle>
          <Badge variant="stone">{debugState.timeScale}x</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0.25, 0.5, 1.0, 2.0, 4.0].map((scale) => (
              <Button
                key={scale}
                size="sm"
                variant={debugState.timeScale === scale ? "primary" : "secondary"}
                onClick={() => debugManager.setTimeScale(scale)}
              >
                {scale === 1.0 ? t("testerNormalSpeed") : `${scale}x`}
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            variant="secondary"
            icon={<StepForward size={14} />}
            onClick={() => gameEngine.stepSingleFrame()}
          >
            {t("testerStepFrameBtn")}
          </Button>
        </CardContent>
      </Card>

      {/* 6. HITBOXES & DIAGNOSTICS */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Eye className="w-4 h-4 text-amber-400" />}>
            {t("testerHitboxesTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant={debugState.showHitboxes ? "primary" : "secondary"}
            icon={<Eye size={14} />}
            onClick={() => debugManager.toggleHitboxes()}
          >
            {t("testerHitboxesLabel")}{" "}
            {debugState.showHitboxes ? t("testerStatusOn") : t("testerStatusOff")}
          </Button>
          <Button
            variant={debugState.showProfiler ? "primary" : "secondary"}
            icon={<Activity size={14} />}
            onClick={() => debugManager.toggleProfiler()}
          >
            {t("testerProfilerLabel")}{" "}
            {debugState.showProfiler ? t("testerStatusOn") : t("testerStatusOff")}
          </Button>
        </CardContent>
      </Card>

      {/* 7. PARALLAX LAYERS & AUDIO/PARTICLES */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Layers className="w-4 h-4 text-amber-400" />}>
            {t("testerParallaxTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Parallax Layer Toggles */}
          <div>
            <div className="text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <Layers size={13} className="text-amber-400" />
              <span>{t("testerParallaxTiersLabel")}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(["far", "mid_far", "mid", "mid_close", "close"] as BackgroundLayerTier[]).map((tier) => (
                <Button
                  key={tier}
                  size="sm"
                  variant={debugState.parallaxTiers[tier] ? "primary" : "secondary"}
                  onClick={() => debugManager.toggleParallaxTier(tier)}
                  className="text-xs"
                >
                  {tier.toUpperCase()}:{" "}
                  {debugState.parallaxTiers[tier] ? t("testerStatusOn") : t("testerStatusOff")}
                </Button>
              ))}
            </div>
          </div>

          {/* Music Intensity & Particle Emitter Test */}
          <div className="p-3 bg-[#180904] rounded-lg border border-[#4a1d0d] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Music size={15} className="text-purple-400" />
              <span className="text-xs font-bold text-stone-200">
                {t("testerMusicIntensityLabel")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { labelKey: "testerMusicChill", val: 0.1 },
                { labelKey: "testerMusicSuspense", val: 0.4 },
                { labelKey: "testerMusicCombat", val: 0.7 },
                { labelKey: "testerMusicClimax", val: 1.0 },
              ].map((m) => (
                <Button key={m.val} size="sm" variant="secondary" onClick={() => gameEngine.setMusicIntensity(m.val)}>
                  {t(m.labelKey)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#180904] rounded-lg border border-[#4a1d0d] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" />
              <span className="text-xs font-bold text-stone-200">
                {t("testerParticlesTestLabel")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => gameEngine.triggerParticleBurst("spark")}>
                {t("testerParticleSpark")}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => gameEngine.triggerParticleBurst("magic")}>
                {t("testerParticleMagic")}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => gameEngine.triggerParticleBurst("dust")}>
                {t("testerParticleDust")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TesterSubTab;
