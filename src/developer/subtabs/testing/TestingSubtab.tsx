import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Shield,
  Sword,
  Sparkles,
  Skull,
  Gauge,
  Box,
  Layers,
  Volume2,
  Play,
  Flag,
  Crosshair,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  Switch,
  Text,
  Badge,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import { useGameEngine } from "@context/GameEngineContext";
import { debugManager, DebugState } from "@game/debug/debugManager";
import { PlayerId, ParticleBurstType } from "@game/types";
import { ALL_LOCATIONS } from "@game/locations";
import { BackgroundLayerTier } from "@game/locations/schema/locationSchema";

const TIME_SCALE_PRESETS = [0.25, 0.5, 1.0, 2.0, 4.0] as const;

const PARALLAX_TIERS: readonly BackgroundLayerTier[] = [
  "far",
  "mid_far",
  "mid",
  "mid_close",
  "close",
];

const SPAWNABLE_MONSTERS = [
  { value: "training_dummy", labelKey: "enemyTrainingDummy" },
  { value: "court_sentinel", labelKey: "enemyCourtSentinel" },
  { value: "chasm_crawler", labelKey: "enemyChasmCrawler" },
  { value: "bastion_gargoyle", labelKey: "enemyBastionGargoyle" },
  { value: "bastion_sentinel_boss", labelKey: "enemyBastionSentinelBoss" },
  { value: "clockwork_automaton", labelKey: "enemyClockworkAutomaton" },
  { value: "aether_wisp", labelKey: "enemyAetherWisp" },
] as const;

const MUSIC_PRESETS = [
  { value: 0.1, labelKey: "testerMusicChill" },
  { value: 0.4, labelKey: "testerMusicSuspense" },
  { value: 0.7, labelKey: "testerMusicCombat" },
  { value: 1.0, labelKey: "testerMusicClimax" },
] as const;

const PARTICLE_PRESETS: ReadonlyArray<{ type: ParticleBurstType; labelKey: string }> = [
  { type: "spark", labelKey: "testerParticleSpark" },
  { type: "magic", labelKey: "testerParticleMagic" },
  { type: "dust", labelKey: "testerParticleDust" },
];

export const TestingSubtab: React.FC = () => {
  const { t, language } = useI18n();
  const { engine, currentLocationId, loadLocation, p1 } = useGameEngine();

  const [debugState, setDebugState] = useState<DebugState>(() => ({
    ...debugManager.state,
    parallaxTiers: { ...debugManager.state.parallaxTiers },
  }));
  const [teleportX, setTeleportX] = useState<string>(() =>
    String(Math.round(p1?.x ?? 140))
  );
  const [teleportY, setTeleportY] = useState<string>(() =>
    String(Math.round(p1?.y ?? 640))
  );
  const [selectedMonster, setSelectedMonster] = useState<string>("court_sentinel");
  const [activeMusic, setActiveMusic] = useState<number>(0.4);

  useEffect(() => {
    return debugManager.subscribe(() => {
      setDebugState({
        ...debugManager.state,
        parallaxTiers: { ...debugManager.state.parallaxTiers },
      });
    });
  }, []);

  const checkpoints = debugManager.getSpawnPresets(currentLocationId);

  const handleManualTeleport = useCallback(() => {
    const x = Number(teleportX);
    const y = Number(teleportY);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      engine.teleportPlayer(PlayerId.Player1, x, y);
    }
  }, [engine, teleportX, teleportY]);

  return (
    <div id="subtab-content-testing" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Spawn Points & Teleportation */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<MapPin className="w-4 h-4 text-amber-400" />}>
            {t("testerSpawnPointsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Text size="xs" variant="muted">
              {t("testerCheckpointsLabel")}
            </Text>
            <div className="flex flex-wrap gap-2">
              {checkpoints.map((cp) => (
                <Button
                  key={cp.id}
                  size="sm"
                  variant="secondary"
                  className="whitespace-nowrap shrink-0 px-3"
                  onClick={() => {
                    engine.teleportPlayer(PlayerId.Player1, cp.x, cp.y);
                    setTeleportX(String(cp.x));
                    setTeleportY(String(cp.y));
                  }}
                >
                  {language === "pl" ? cp.namePl : cp.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-stone-800/80">
            <Input
              label="X"
              type="number"
              value={teleportX}
              onChange={(e) => setTeleportX(e.target.value)}
              containerClassName="w-28"
              family="mono"
            />
            <Input
              label="Y"
              type="number"
              value={teleportY}
              onChange={(e) => setTeleportY(e.target.value)}
              containerClassName="w-28"
              family="mono"
            />
            <Button
              size="sm"
              variant="primary"
              icon={<Crosshair size={14} />}
              className="whitespace-nowrap shrink-0 px-3 h-9"
              onClick={handleManualTeleport}
            >
              {t("testerTeleportBtn")}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-800/80">
            <Text size="xs">{t("testerClickTeleportLabel")}</Text>
            <div className="flex items-center gap-2">
              <Badge variant={debugState.clickToTeleport ? "green" : "stone"}>
                {debugState.clickToTeleport ? t("testerStatusOn") : t("testerStatusOff")}
              </Badge>
              <Switch
                checked={debugState.clickToTeleport}
                onCheckedChange={() => debugManager.toggleClickToTeleport()}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800/80">
            <Text size="xs" variant="muted">
              {t("testerSwitchLocationLabel")}
            </Text>
            <div className="flex flex-wrap gap-2">
              {ALL_LOCATIONS.map((loc) => (
                <Button
                  key={loc.id}
                  size="sm"
                  variant={currentLocationId === loc.id ? "primary" : "secondary"}
                  className="whitespace-nowrap shrink-0 px-3"
                  onClick={() => loadLocation(loc.id, undefined, true)}
                >
                  {t(loc.nameKey)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Cheats & Stat Modifiers */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<Shield className="w-4 h-4 text-emerald-400" />}>
            {t("testerCheatsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                label: t("testerGodModeLabel"),
                checked: debugState.godMode,
                toggle: () => debugManager.toggleGodMode(),
              },
              {
                label: t("testerInfManaLabel"),
                checked: debugState.infiniteMana,
                toggle: () => debugManager.toggleInfiniteMana(),
              },
              {
                label: t("testerInfStaminaLabel"),
                checked: debugState.infiniteStamina,
                toggle: () => debugManager.toggleInfiniteStamina(),
              },
              {
                label: t("testerNoClipLabel"),
                checked: debugState.noClip,
                toggle: () => debugManager.toggleNoClip(),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-stone-800 bg-black/30"
              >
                <Text size="xs" weight="semibold">
                  {item.label}
                </Text>
                <Switch checked={item.checked} onCheckedChange={item.toggle} />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800/80">
            <Text size="xs" variant="muted">
              {t("testerHpControlsLabel")}
            </Text>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="danger"
                className="whitespace-nowrap shrink-0 px-3"
                onClick={() => engine.setPlayerStat(0, "health", 1)}
              >
                {t("tester1HpBtn")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="whitespace-nowrap shrink-0 px-3"
                onClick={() => engine.setPlayerStat(0, "health", 50)}
              >
                {t("tester50HpBtn")}
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="whitespace-nowrap shrink-0 px-3"
                onClick={() => {
                  engine.refillVitals(0);
                  engine.refillVitals(1);
                }}
              >
                {t("testerRefillAllBtn")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Items, Weapons & Magic */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<Sword className="w-4 h-4 text-amber-400" />}>
            {t("testerItemsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="whitespace-nowrap shrink-0 px-3"
              onClick={() => engine.giveAllWeapons(0)}
            >
              {t("testerGiveWeaponsBtn")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="whitespace-nowrap shrink-0 px-3"
              onClick={() => engine.unlockAllSkills(0)}
            >
              {t("testerUnlockSpellsBtn")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="whitespace-nowrap shrink-0 px-3"
              onClick={() => engine.givePotions(0)}
            >
              {t("testerGivePotionsBtn")}
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="whitespace-nowrap shrink-0 px-3"
              onClick={() => engine.clearInventory(0)}
            >
              {t("testerClearInventoryBtn")}
            </Button>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800/80">
            <Text size="xs" variant="muted">
              {t("testerAddGoldLabel")}
            </Text>
            <div className="flex flex-wrap gap-2">
              {[100, 500, 2000].map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  className="whitespace-nowrap shrink-0 px-3 font-mono tabular-nums"
                  onClick={() => engine.addGold(amount)}
                >
                  +{amount}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Combat & Enemy AI */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<Skull className="w-4 h-4 text-red-400" />}>
            {t("testerCombatTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-stone-800 bg-black/30">
            <Text size="xs" weight="semibold">
              {t("testerFreezeAiLabel")}
            </Text>
            <Switch
              checked={debugState.freezeAI}
              onCheckedChange={() => debugManager.toggleFreezeAI()}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="danger"
              className="whitespace-nowrap shrink-0 px-3"
              onClick={() => engine.killAllEnemies()}
            >
              {t("testerKillEnemiesBtn")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Flag size={13} />}
              className="whitespace-nowrap shrink-0 px-3"
              onClick={() => engine.forceVictory()}
            >
              {t("testerForceVictoryBtn")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="whitespace-nowrap shrink-0 px-3"
              onClick={() => engine.forceDefeat()}
            >
              {t("testerForceDefeatBtn")}
            </Button>
          </div>

          <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-stone-800/80">
            <Select
              label={t("testerSpawnMonsterLabel")}
              value={selectedMonster}
              onChange={(e) => setSelectedMonster(e.target.value)}
              options={SPAWNABLE_MONSTERS.map((m) => ({
                value: m.value,
                label: t(m.labelKey),
              }))}
              containerClassName="flex-1 min-w-[200px]"
              size="sm"
            />
            <Button
              size="sm"
              variant="primary"
              className="whitespace-nowrap shrink-0 px-3 h-9"
              onClick={() => engine.spawnEnemy(selectedMonster)}
            >
              {t("testerSpawnNearPlayerBtn")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5. Simulation Speed & Step */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<Gauge className="w-4 h-4 text-cyan-400" />}>
            {t("testerSpeedTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {TIME_SCALE_PRESETS.map((scale) => (
              <Button
                key={scale}
                size="sm"
                variant={debugState.timeScale === scale ? "primary" : "secondary"}
                className="whitespace-nowrap shrink-0 px-3 font-mono tabular-nums"
                onClick={() => debugManager.setTimeScale(scale)}
              >
                {scale === 1.0 ? t("testerNormalSpeed") : `${scale}x`}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-800/80">
            <Button
              size="sm"
              variant="outline"
              icon={<Play size={13} />}
              className="whitespace-nowrap shrink-0 px-3"
              onClick={() => engine.stepSingleFrame()}
            >
              {t("testerStepFrameBtn")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 6. Hitboxes & Diagnostic HUD */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<Box className="w-4 h-4 text-amber-400" />}>
            {t("testerHitboxesTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-stone-800 bg-black/30">
            <Text size="xs" weight="semibold">
              {t("testerHitboxesLabel")}
            </Text>
            <div className="flex items-center gap-2">
              <Badge variant={debugState.showHitboxes ? "green" : "stone"}>
                {debugState.showHitboxes ? t("testerStatusOn") : t("testerStatusOff")}
              </Badge>
              <Switch
                checked={debugState.showHitboxes}
                onCheckedChange={() => debugManager.toggleHitboxes()}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-stone-800 bg-black/30">
            <Text size="xs" weight="semibold">
              {t("testerProfilerLabel")}
            </Text>
            <div className="flex items-center gap-2">
              <Badge variant={debugState.showProfiler ? "green" : "stone"}>
                {debugState.showProfiler ? t("testerStatusOn") : t("testerStatusOff")}
              </Badge>
              <Switch
                checked={debugState.showProfiler}
                onCheckedChange={() => debugManager.toggleProfiler()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. Parallax Layers & Environment */}
      <Card variant="subtle" className="lg:col-span-2">
        <CardHeader>
          <CardTitle icon={<Layers className="w-4 h-4 text-amber-400" />}>
            {t("testerParallaxTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Text size="xs" variant="muted">
              {t("testerParallaxTiersLabel")}
            </Text>
            <div className="flex flex-wrap gap-2">
              {PARALLAX_TIERS.map((tier) => {
                const enabled = debugState.parallaxTiers[tier];
                return (
                  <Button
                    key={tier}
                    size="sm"
                    variant={enabled ? "primary" : "secondary"}
                    className="whitespace-nowrap shrink-0 px-3 font-mono"
                    onClick={() => debugManager.toggleParallaxTier(tier)}
                  >
                    {tier}: {enabled ? t("testerStatusOn") : t("testerStatusOff")}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-stone-800/80">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Volume2 size={14} className="text-amber-400" />
                <Text size="xs" variant="muted">
                  {t("testerMusicIntensityLabel")}
                </Text>
              </div>
              <div className="flex flex-wrap gap-2">
                {MUSIC_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    size="sm"
                    variant={activeMusic === preset.value ? "primary" : "secondary"}
                    className="whitespace-nowrap shrink-0 px-3"
                    onClick={() => {
                      setActiveMusic(preset.value);
                      engine.setMusicIntensity(preset.value);
                    }}
                  >
                    {t(preset.labelKey)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-cyan-400" />
                <Text size="xs" variant="muted">
                  {t("testerParticlesTestLabel")}
                </Text>
              </div>
              <div className="flex flex-wrap gap-2">
                {PARTICLE_PRESETS.map((p) => (
                  <Button
                    key={p.type}
                    size="sm"
                    variant="secondary"
                    className="whitespace-nowrap shrink-0 px-3"
                    onClick={() => engine.triggerParticleBurst(p.type, 30)}
                  >
                    {t(p.labelKey)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

TestingSubtab.displayName = "TestingSubtab";
export default TestingSubtab;
