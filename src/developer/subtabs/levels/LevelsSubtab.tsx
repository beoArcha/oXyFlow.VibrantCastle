import React, { useMemo, useState, useCallback } from "react";
import {
  Map as MapIcon,
  Layers,
  AlertTriangle,
  Play,
  Crown,
  Flame,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  Camera,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Text,
  Heading,
  Slider,
  ProgressBar,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import { useGameEngine } from "@context/GameEngineContext";
import {
  WORLD_CAMPAIGN_REGISTRY,
  PARALLAX_LAYER_CATALOG,
  getLocation,
  StageBlueprint,
  WorldId,
} from "@game/locations";
import { BackgroundLayerTier } from "@game/locations/schema/locationSchema";
import {
  buildAssetReadinessAudit,
  AuditCategory,
} from "./assetReadinessAudit";
import {
  LevelPreviewCanvas,
  LevelOverlayOptions,
} from "./LevelPreviewCanvas";

type LevelsViewMode = "matrix" | "audit" | "layers";
type AuditFilter = "all" | "critical" | AuditCategory;

const ALL_TIERS: readonly BackgroundLayerTier[] = [
  "far",
  "mid_far",
  "mid",
  "mid_close",
  "close",
  "boss_stage",
  "boss_world",
];

const TIER_LABELS: Record<BackgroundLayerTier, string> = {
  far: "far",
  mid_far: "mid_far",
  mid: "mid",
  mid_close: "mid_close",
  close: "close",
  boss_stage: "boss_stage",
  boss_world: "boss_world",
};

export const LevelsSubtab: React.FC = () => {
  const { language, t } = useI18n();
  const { currentLocationId, loadLocation } = useGameEngine();
  const isPl = language === "pl";

  const [viewMode, setViewMode] = useState<LevelsViewMode>("matrix");
  const [selectedWorldId, setSelectedWorldId] = useState<WorldId>(() => {
    const match = WORLD_CAMPAIGN_REGISTRY.find((w) => w.id === currentLocationId);
    return match ? match.id : "courtyard";
  });
  const [selectedStageNumber, setSelectedStageNumber] = useState<number>(1);
  const [cameraX, setCameraX] = useState<number>(0);
  const [cameraY, setCameraY] = useState<number>(0);
  const [bossPreviewMode, setBossPreviewMode] = useState<
    "auto" | "stage" | "world" | "off"
  >("auto");
  const [disabledTiers, setDisabledTiers] = useState<
    Partial<Record<BackgroundLayerTier, boolean>>
  >({});
  const [overlays, setOverlays] = useState<LevelOverlayOptions>({
    showSolids: true,
    showHazardsAndLevers: true,
    showPortalsAndSpawn: true,
    showEnemiesAndBossZones: true,
  });
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");
  const [layerFilter, setLayerFilter] = useState<"all" | "world" | "shared" | "boss">("all");

  const auditReport = useMemo(() => buildAssetReadinessAudit(), []);

  const selectedWorld = useMemo(
    () =>
      WORLD_CAMPAIGN_REGISTRY.find((w) => w.id === selectedWorldId) ??
      WORLD_CAMPAIGN_REGISTRY[0],
    [selectedWorldId]
  );

  const selectedStage: StageBlueprint = useMemo(
    () =>
      selectedWorld.stages.find((s) => s.stageNumber === selectedStageNumber) ??
      selectedWorld.stages[0],
    [selectedWorld, selectedStageNumber]
  );

  const activeLocation = useMemo(
    () => getLocation(selectedStage.locationId ?? selectedWorld.primaryLocationId),
    [selectedStage.locationId, selectedWorld.primaryLocationId]
  );

  const maxCamX = Math.max(0, activeLocation.width - 960);
  const maxCamY = Math.max(0, activeLocation.height - 480);

  const handleSelectStage = useCallback(
    (worldId: WorldId, stageNumber: number) => {
      setSelectedWorldId(worldId);
      setSelectedStageNumber(stageNumber);
      setCameraX(0);
      setCameraY(0);
      if (stageNumber === 4) {
        setBossPreviewMode("stage");
      } else if (stageNumber === 8) {
        setBossPreviewMode("world");
      } else {
        setBossPreviewMode("auto");
      }
    },
    []
  );

  const handleFocusBossZone = useCallback(() => {
    const zone = activeLocation.bossZones?.[0];
    if (!zone) return;
    const targetX = Math.max(0, Math.min(maxCamX, Math.round(zone.x + zone.width * 0.5 - 480)));
    const targetY = Math.max(0, Math.min(maxCamY, Math.round(zone.y + zone.height * 0.5 - 240)));
    setCameraX(targetX);
    setCameraY(targetY);
    setBossPreviewMode("auto");
  }, [activeLocation, maxCamX, maxCamY]);

  const toggleTier = useCallback((tier: BackgroundLayerTier) => {
    setDisabledTiers((prev) => ({ ...prev, [tier]: !prev[tier] }));
  }, []);

  const filteredAuditItems = useMemo(() => {
    if (auditFilter === "all") return auditReport.items;
    if (auditFilter === "critical") {
      return auditReport.items.filter((item) => item.priority === "critical");
    }
    return auditReport.items.filter((item) => item.category === auditFilter);
  }, [auditFilter, auditReport.items]);

  const filteredLayers = useMemo(() => {
    if (layerFilter === "all") return PARALLAX_LAYER_CATALOG;
    return PARALLAX_LAYER_CATALOG.filter((l) => l.namespace === layerFilter);
  }, [layerFilter]);

  return (
    <div id="subtab-content-levels" className="flex flex-col gap-4">
      {/* Compact Real-Data Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-stone-800 bg-stone-950/70 px-3.5 py-2.5 flex flex-col gap-0.5">
          <Text size="xs" variant="muted">
            {isPl ? "Światy kampanii" : "Campaign Worlds"}
          </Text>
          <div className="flex items-baseline justify-between gap-2">
            <Text size="lg" weight="bold" className="font-mono tabular-nums text-amber-300">
              {auditReport.summary.playableWorlds}/{auditReport.summary.totalWorlds}
            </Text>
            <Badge variant="green">{isPl ? "+3 nowe" : "+3 new"}</Badge>
          </div>
        </div>

        <div className="rounded-lg border border-stone-800 bg-stone-950/70 px-3.5 py-2.5 flex flex-col gap-0.5">
          <Text size="xs" variant="muted">
            {isPl ? "Plansze 8×8 (grywalne)" : "8×8 Stages (playable)"}
          </Text>
          <div className="flex items-baseline justify-between gap-2">
            <Text size="lg" weight="bold" className="font-mono tabular-nums text-stone-100">
              {auditReport.summary.playableStages}/{auditReport.summary.totalCampaignStages}
            </Text>
            <Badge variant="amber">
              {Math.round(
                (auditReport.summary.playableStages /
                  auditReport.summary.totalCampaignStages) *
                  100
              )}
              %
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border border-stone-800 bg-stone-950/70 px-3.5 py-2.5 flex flex-col gap-0.5">
          <Text size="xs" variant="muted">
            {isPl ? "Warstwy paralaksy i bossów" : "Parallax & Boss Layers"}
          </Text>
          <div className="flex items-baseline justify-between gap-2">
            <Text size="lg" weight="bold" className="font-mono tabular-nums text-cyan-300">
              {auditReport.summary.registeredParallaxLayers}
            </Text>
            <Badge variant="cyan">
              {auditReport.summary.totalBossZones} {isPl ? "stref bossa" : "boss zones"}
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border border-stone-800 bg-stone-950/70 px-3.5 py-2.5 flex flex-col gap-0.5">
          <Text size="xs" variant="muted">
            {isPl ? "Wrogowie z atlasem sprite" : "Enemies with Sprite Atlas"}
          </Text>
          <div className="flex items-baseline justify-between gap-2">
            <Text size="lg" weight="bold" className="font-mono tabular-nums text-rose-300">
              {auditReport.summary.enemiesWithAtlas}/{auditReport.summary.totalEnemies}
            </Text>
            <Badge variant="red">
              {auditReport.summary.enemiesMissingAtlas.length}{" "}
              {isPl ? "brakuje" : "missing"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Mode Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={viewMode === "matrix" ? "primary" : "secondary"}
            icon={<MapIcon size={14} />}
            className="whitespace-nowrap shrink-0 px-3"
            onClick={() => setViewMode("matrix")}
          >
            {isPl ? "Mapa 8×8 i Podgląd" : "8×8 Map & Preview"}
          </Button>
          <Button
            size="sm"
            variant={viewMode === "audit" ? "primary" : "secondary"}
            icon={<AlertTriangle size={14} />}
            className="whitespace-nowrap shrink-0 px-3"
            onClick={() => setViewMode("audit")}
          >
            {isPl ? "Audyt Brakujących Assetów" : "Missing Assets Audit"}
          </Button>
          <Button
            size="sm"
            variant={viewMode === "layers" ? "primary" : "secondary"}
            icon={<Layers size={14} />}
            className="whitespace-nowrap shrink-0 px-3"
            onClick={() => setViewMode("layers")}
          >
            {t("levelsLayerLibraryView")}
          </Button>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={<Play size={14} />}
          className="whitespace-nowrap shrink-0 px-3"
          onClick={() => loadLocation(activeLocation.id, undefined, true)}
        >
          {t("levelsTeleportPlayer", { world: selectedWorld.code })}
        </Button>
      </div>

      {/* VIEW 1: 8x8 Campaign Matrix + Live Parallax & Camera Simulator */}
      {viewMode === "matrix" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Left: 8x8 World & Stage Matrix */}
          <Card variant="subtle" className="xl:col-span-5">
            <CardHeader>
              <CardTitle icon={<MapIcon className="w-4 h-4 text-amber-400" />}>
                {isPl ? "Mapa Kampanii 8 Światów × 8 Plansz" : "8 Worlds × 8 Stages Matrix"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-stone-800/80">
                <Badge variant="green">{isPl ? "1: Grywalna" : "1: Playable"}</Badge>
                <Badge variant="amber">{isPl ? "4: Boss Poziomu" : "4: Level Boss"}</Badge>
                <Badge variant="red">{isPl ? "8: Boss Świata" : "8: World Boss"}</Badge>
                <Badge variant="stone">{isPl ? "Szkic" : "Planned"}</Badge>
              </div>

              <div className="flex flex-col gap-2">
                {WORLD_CAMPAIGN_REGISTRY.map((world) => {
                  const isWorldSelected = world.id === selectedWorldId;
                  return (
                    <div
                      key={world.id}
                      className={`rounded-lg border px-2.5 py-2 transition-colors ${
                        isWorldSelected
                          ? "border-amber-500/70 bg-amber-950/20"
                          : "border-stone-800/80 bg-stone-950/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: world.accentHex }}
                          />
                          <Text size="xs" weight="semibold" className="font-mono text-amber-300 shrink-0">
                            {world.code}
                          </Text>
                          <Text size="xs" weight="semibold" className="truncate">
                            {isPl ? world.namePl : world.nameEn}
                          </Text>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {world.isNewWorld && (
                            <Badge variant="purple">{isPl ? "NOWY" : "NEW"}</Badge>
                          )}
                          {currentLocationId === world.primaryLocationId && (
                            <Badge variant="green">{isPl ? "TU GRASZ" : "ACTIVE"}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-8 gap-1">
                        {world.stages.map((stage) => {
                          const isSelected =
                            isWorldSelected && stage.stageNumber === selectedStageNumber;
                          const isPlayable = stage.status === "playable";
                          const isStageBoss = stage.bossScope === "stage";
                          const isWorldBoss = stage.bossScope === "world";

                          const variant = isSelected
                            ? "primary"
                            : isPlayable
                              ? "secondary"
                              : "ghost";

                          return (
                            <Button
                              key={stage.code}
                              size="sm"
                              variant={variant}
                              title={`${stage.code}: ${isPl ? stage.titlePl : stage.titleEn}`}
                              className={`h-7 px-0 font-mono tabular-nums justify-center ${
                                isWorldBoss
                                  ? "border border-rose-500/50 text-rose-300"
                                  : isStageBoss
                                    ? "border border-amber-500/40 text-amber-300"
                                    : isPlayable
                                      ? "border border-emerald-500/50 text-emerald-300"
                                      : "border border-stone-800/70 text-stone-500"
                              }`}
                              onClick={() => handleSelectStage(world.id, stage.stageNumber)}
                            >
                              {stage.stageNumber}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Stage Spec Box */}
              <div className="rounded-lg border border-stone-800 bg-black/40 p-3 flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between gap-2">
                  <Text size="sm" weight="bold" className="font-mono text-amber-300">
                    {selectedStage.code} · {isPl ? selectedStage.titlePl : selectedStage.titleEn}
                  </Text>
                  <Badge variant={selectedStage.status === "playable" ? "green" : "stone"}>
                    {selectedStage.status === "playable"
                      ? isPl
                        ? "Grywalna"
                        : "Playable"
                      : isPl
                        ? "Plan 64"
                        : "Planned"}
                  </Badge>
                </div>
                <Text size="xs" variant="muted">
                  {isPl ? selectedWorld.themePl : selectedWorld.themeEn}
                </Text>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="cyan">{selectedStage.farLayerKey}</Badge>
                  {selectedStage.bossLayerKey && (
                    <Badge variant={selectedStage.bossScope === "world" ? "red" : "amber"}>
                      {selectedStage.bossLayerKey}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Live Parallax & Level Camera Simulator */}
          <Card variant="subtle" className="xl:col-span-7">
            <CardHeader>
              <CardTitle icon={<Camera className="w-4 h-4 text-cyan-400" />}>
                {isPl ? "Podgląd Paralaksy i Geometrii:" : "Parallax & Level Preview:"}{" "}
                {t(activeLocation.nameKey)}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <LevelPreviewCanvas
                location={activeLocation}
                cameraX={cameraX}
                cameraY={cameraY}
                disabledTiers={disabledTiers}
                bossPreviewMode={bossPreviewMode}
                overlays={overlays}
              />

              {/* Camera Scrub Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-stone-800 bg-black/35 p-3">
                <Slider
                  label={isPl ? "Pozycja kamery X" : "Camera X"}
                  min={0}
                  max={Math.max(1, maxCamX)}
                  step={10}
                  value={Math.min(cameraX, Math.max(1, maxCamX))}
                  onChange={setCameraX}
                  formatValue={(v) => `${v} / ${maxCamX} px`}
                />
                <Slider
                  label={isPl ? "Pozycja kamery Y" : "Camera Y"}
                  min={0}
                  max={Math.max(1, maxCamY)}
                  step={5}
                  value={Math.min(cameraY, Math.max(1, maxCamY))}
                  onChange={setCameraY}
                  formatValue={(v) => `${v} / ${maxCamY} px`}
                />
              </div>

              {/* Boss Layer Simulator & Quick Focus */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-800 bg-black/35 px-3 py-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Text size="xs" variant="muted" className="mr-1">
                    {isPl ? "Warstwa Bossa:" : "Boss Layer:"}
                  </Text>
                  {(
                    [
                      ["auto", isPl ? "Auto (strefa)" : "Auto (zone)"],
                      ["stage", isPl ? "Boss Poziomu" : "Level Boss"],
                      ["world", isPl ? "Boss Świata" : "World Boss"],
                      ["off", isPl ? "Wyłączona" : "Off"],
                    ] as const
                  ).map(([mode, label]) => (
                    <Button
                      key={mode}
                      size="sm"
                      variant={bossPreviewMode === mode ? "primary" : "secondary"}
                      className="whitespace-nowrap shrink-0 px-2.5"
                      onClick={() => setBossPreviewMode(mode)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                {(activeLocation.bossZones?.length ?? 0) > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Crown size={12} />}
                    className="whitespace-nowrap shrink-0 px-2.5"
                    onClick={handleFocusBossZone}
                  >
                    {isPl ? "Skocz kamerą na strefę bossa" : "Focus Boss Zone"}
                  </Button>
                )}
              </div>

              {/* Parallax Tier Visibility Toggles */}
              <div className="flex flex-col gap-1.5">
                <Text size="xs" variant="muted">
                  {isPl ? "Widoczność warstw paralaksy:" : "Parallax Tier Toggles:"}
                </Text>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TIERS.map((tier) => {
                    const enabled = !disabledTiers[tier];
                    return (
                      <Button
                        key={tier}
                        size="sm"
                        variant={enabled ? "primary" : "secondary"}
                        className="whitespace-nowrap shrink-0 px-2.5 font-mono"
                        onClick={() => toggleTier(tier)}
                      >
                        {TIER_LABELS[tier]}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Geometry Overlay Toggles */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800/80">
                <Text size="xs" variant="muted">
                  {isPl ? "Nakładki blueprintu poziomu:" : "Level Blueprint Overlays:"}
                </Text>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant={overlays.showSolids ? "primary" : "secondary"}
                    icon={<Eye size={12} />}
                    className="whitespace-nowrap shrink-0 px-2.5"
                    onClick={() =>
                      setOverlays((o) => ({ ...o, showSolids: !o.showSolids }))
                    }
                  >
                    {isPl ? "Platformy i bryły" : "Solids & Platforms"}
                  </Button>
                  <Button
                    size="sm"
                    variant={overlays.showHazardsAndLevers ? "primary" : "secondary"}
                    icon={<Flame size={12} />}
                    className="whitespace-nowrap shrink-0 px-2.5"
                    onClick={() =>
                      setOverlays((o) => ({
                        ...o,
                        showHazardsAndLevers: !o.showHazardsAndLevers,
                      }))
                    }
                  >
                    {isPl ? "Pułapki i dźwignie" : "Hazards & Levers"}
                  </Button>
                  <Button
                    size="sm"
                    variant={overlays.showPortalsAndSpawn ? "primary" : "secondary"}
                    icon={<Sparkles size={12} />}
                    className="whitespace-nowrap shrink-0 px-2.5"
                    onClick={() =>
                      setOverlays((o) => ({
                        ...o,
                        showPortalsAndSpawn: !o.showPortalsAndSpawn,
                      }))
                    }
                  >
                    {isPl ? "Portale i Spawn" : "Portals & Spawn"}
                  </Button>
                  <Button
                    size="sm"
                    variant={overlays.showEnemiesAndBossZones ? "primary" : "secondary"}
                    icon={<Crown size={12} />}
                    className="whitespace-nowrap shrink-0 px-2.5"
                    onClick={() =>
                      setOverlays((o) => ({
                        ...o,
                        showEnemiesAndBossZones: !o.showEnemiesAndBossZones,
                      }))
                    }
                  >
                    {isPl ? "Wrogowie i Strefy Bossa" : "Enemies & Boss Zones"}
                  </Button>
                </div>
              </div>

              {/* Active Location Layer Breakdown */}
              <div className="rounded-lg border border-stone-800 bg-black/30 p-2.5 flex flex-col gap-1.5">
                <Text size="xs" variant="muted">
                  {isPl
                    ? `Aktywne warstwy tej mapy (${activeLocation.parallaxBackground?.layers.length ?? 0}):`
                    : `Active layers on this map (${activeLocation.parallaxBackground?.layers.length ?? 0}):`}
                </Text>
                <div className="flex flex-wrap gap-1.5">
                  {(activeLocation.parallaxBackground?.layers ?? []).map((layer) => (
                    <Badge
                      key={layer.id}
                      variant={
                        layer.tier === "boss_world"
                          ? "red"
                          : layer.tier === "boss_stage"
                            ? "amber"
                            : layer.tier === "far"
                              ? "cyan"
                              : "stone"
                      }
                    >
                      {layer.tier}: {layer.layerKey ?? layer.id}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW 2: Automated Missing Assets & Readiness Audit */}
      {viewMode === "audit" && (
        <Card variant="subtle">
          <CardHeader>
            <CardTitle icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}>
              {isPl
                ? "Automatyczny Audyt Brakujących Assetów i Gotowości Poziomów"
                : "Automated Missing Assets & Level Readiness Audit"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-stone-800 bg-black/35 p-3 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <Text size="xs" variant="muted">
                    {isPl ? "Pokrycie 8 światów (tła far)" : "8 Worlds Far Backdrops"}
                  </Text>
                  <Text size="xs" className="font-mono tabular-nums text-emerald-400">
                    100%
                  </Text>
                </div>
                <ProgressBar value={100} max={100} variant="info" />
              </div>

              <div className="rounded-lg border border-stone-800 bg-black/35 p-3 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <Text size="xs" variant="muted">
                    {isPl ? "Kampania 64 plansz" : "64-Stage Campaign"}
                  </Text>
                  <Text size="xs" className="font-mono tabular-nums text-amber-400">
                    {auditReport.summary.playableStages}/64
                  </Text>
                </div>
                <ProgressBar
                  value={auditReport.summary.playableStages}
                  max={auditReport.summary.totalCampaignStages}
                  variant="stamina"
                />
              </div>

              <div className="rounded-lg border border-stone-800 bg-black/35 p-3 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <Text size="xs" variant="muted">
                    {isPl ? "Wrogowie z atlasem sprite" : "Enemies with Sprite Atlas"}
                  </Text>
                  <Text size="xs" className="font-mono tabular-nums text-rose-400">
                    {auditReport.summary.enemiesWithAtlas}/{auditReport.summary.totalEnemies}
                  </Text>
                </div>
                <ProgressBar
                  value={auditReport.summary.enemiesWithAtlas}
                  max={auditReport.summary.totalEnemies}
                  variant="health"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", isPl ? "Wszystkie" : "All"],
                  ["critical", isPl ? "Krytyczne braki" : "Critical Gaps"],
                  ["parallax", isPl ? "Paralaksa i Tła" : "Parallax & BGs"],
                  ["enemies", isPl ? "Wrogowie i Bossowie" : "Enemies & Bosses"],
                  ["tiles_decor", isPl ? "Kafelki i Dekor" : "Tiles & Decor"],
                  ["structures", isPl ? "Struktury" : "Structures"],
                  ["campaign", isPl ? "Kampania 8×8" : "8×8 Campaign"],
                ] as const
              ).map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={auditFilter === key ? "primary" : "secondary"}
                  className="whitespace-nowrap shrink-0 px-3"
                  onClick={() => setAuditFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Audit Rows */}
            <div className="flex flex-col gap-2">
              {filteredAuditItems.map((item) => {
                const statusBadge =
                  item.status === "ready"
                    ? "green"
                    : item.status === "partial"
                      ? "amber"
                      : "red";
                const statusText =
                  item.status === "ready"
                    ? isPl
                      ? "Gotowe"
                      : "Ready"
                    : item.status === "partial"
                      ? isPl
                        ? "Częściowe"
                        : "Partial"
                      : isPl
                        ? "Brakuje"
                        : "Missing";

                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-stone-800 bg-stone-950/60 px-3.5 py-3 flex flex-col gap-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.status === "ready" ? (
                          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                        ) : item.status === "missing" ? (
                          <XCircle size={15} className="text-rose-400 shrink-0" />
                        ) : (
                          <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                        )}
                        <Heading level={5} size="sm" className="text-stone-100">
                          {isPl ? item.titlePl : item.titleEn}
                        </Heading>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Text size="xs" className="font-mono tabular-nums text-stone-300">
                          {item.countLabel}
                        </Text>
                        <Badge variant={statusBadge}>{statusText}</Badge>
                      </div>
                    </div>
                    <Text size="xs" variant="muted">
                      {isPl ? item.detailPl : item.detailEn}
                    </Text>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* VIEW 3: Hybrid Parallax Layer Library */}
      {viewMode === "layers" && (
        <Card variant="subtle">
          <CardHeader>
            <CardTitle icon={<Layers className="w-4 h-4 text-cyan-400" />}>
              {t("levelsLayerLibraryTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", t("levelsLayerFilterAll", { count: PARALLAX_LAYER_CATALOG.length })],
                  [
                    "world",
                    t("levelsLayerFilterWorld", {
                      count: PARALLAX_LAYER_CATALOG.filter((l) => l.namespace === "world").length,
                    }),
                  ],
                  [
                    "shared",
                    t("levelsLayerFilterShared", {
                      count: PARALLAX_LAYER_CATALOG.filter((l) => l.namespace === "shared").length,
                    }),
                  ],
                  [
                    "boss",
                    t("levelsLayerFilterBoss", {
                      count: PARALLAX_LAYER_CATALOG.filter((l) => l.namespace === "boss").length,
                    }),
                  ],
                ] as const
              ).map(([ns, label]) => (
                <Button
                  key={ns}
                  size="sm"
                  variant={layerFilter === ns ? "primary" : "secondary"}
                  className="whitespace-nowrap shrink-0 px-3 font-mono"
                  onClick={() => setLayerFilter(ns)}
                >
                  {label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredLayers.map((entry) => (
                <div
                  key={entry.key}
                  className="rounded-lg border border-stone-800 bg-stone-950/70 overflow-hidden flex flex-col"
                >
                  <div className="relative h-28 bg-black overflow-hidden border-b border-stone-800/80">
                    <img
                      src={entry.url}
                      alt={isPl ? entry.labelPl : entry.labelEn}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2.5 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <Text size="xs" weight="semibold" className="truncate">
                        {isPl ? entry.labelPl : entry.labelEn}
                      </Text>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge
                          variant={
                            entry.namespace === "boss"
                              ? "red"
                              : entry.namespace === "world"
                                ? "cyan"
                                : "stone"
                          }
                        >
                          {entry.tier}
                        </Badge>
                        {entry.generatedByAi && <Badge variant="purple">AI</Badge>}
                      </div>
                    </div>
                    <Text size="xs" variant="muted" className="font-mono truncate">
                      {entry.key}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

LevelsSubtab.displayName = "LevelsSubtab";
export default LevelsSubtab;
