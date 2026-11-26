import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  Users,
  Crosshair,
  ShieldAlert,
  Copy,
  Check,
  Trash2,
  Zap,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SearchInput,
  Switch,
  Text,
  Badge,
  ProgressBar,
  MetricTile,
  EmptyState,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import { useGameEngine } from "@context/GameEngineContext";
import { debugManager, DebugState } from "@game/debug/debugManager";
import { PlayerId } from "@game/types";

export const DebugSubtab: React.FC = () => {
  const { t } = useI18n();
  const { engine, currentLocationId } = useGameEngine();

  const [, setRefreshTick] = useState(0);
  const [enemyQuery, setEnemyQuery] = useState("");
  const [copiedSnapshot, setCopiedSnapshot] = useState(false);
  const [debugState, setDebugState] = useState<DebugState>(() => ({
    ...debugManager.state,
    parallaxTiers: { ...debugManager.state.parallaxTiers },
  }));

  useEffect(() => {
    const id = window.setInterval(() => {
      setRefreshTick((prev) => prev + 1);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return debugManager.subscribe(() => {
      setDebugState({
        ...debugManager.state,
        parallaxTiers: { ...debugManager.state.parallaxTiers },
      });
    });
  }, []);

  const players = engine.players;
  const enemies = engine.enemies;
  const entities = engine.entities;
  const projectiles = engine.projectiles;
  const particlesCount = engine.particleSystem.getParticles().length;
  const camX = Math.round(engine.cameraManager.x);
  const camY = Math.round(engine.cameraManager.y);
  const targetFps = engine.settings.display.targetFps || 60;
  const avgFrameMs = Number((1000 / Math.max(1, targetFps)).toFixed(1));

  const filteredEnemies = useMemo(() => {
    const q = enemyQuery.trim().toLowerCase();
    if (!q) return enemies;
    return enemies.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        (e.defaultName ?? "").toLowerCase().includes(q)
    );
  }, [enemies, enemyQuery]);

  const handleCopySnapshot = useCallback(async () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      locationId: currentLocationId,
      simulationTicks: engine.simulationTicks,
      isPaused: engine.isPaused,
      camera: { x: camX, y: camY },
      world: { width: engine.levelWidth, height: engine.levelHeight },
      players: players.map((p) => ({
        id: p.id,
        characterId: p.characterId,
        x: Math.round(p.x),
        y: Math.round(p.y),
        vx: Number(p.vx.toFixed(2)),
        vy: Number(p.vy.toFixed(2)),
        health: p.health,
        maxHealth: p.maxHealth,
        mana: p.mana,
        stamina: p.stamina,
        isGrounded: p.isGrounded,
      })),
      enemiesCount: enemies.length,
      entitiesCount: entities.length,
      projectilesCount: projectiles.length,
      particlesCount,
      debugState,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setCopiedSnapshot(true);
      window.setTimeout(() => setCopiedSnapshot(false), 1800);
    } catch {
      setCopiedSnapshot(false);
    }
  }, [
    currentLocationId,
    engine,
    camX,
    camY,
    players,
    enemies.length,
    entities.length,
    projectiles.length,
    particlesCount,
    debugState,
  ]);

  return (
    <div id="subtab-content-debug" className="flex flex-col gap-4">
      {/* Telemetry Grid */}
      <Card variant="subtle">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle icon={<Activity className="w-4 h-4 text-amber-400" />}>
              {t("debugTelemetryTitle")}
            </CardTitle>
            <Button
              size="sm"
              variant="secondary"
              icon={copiedSnapshot ? <Check size={13} /> : <Copy size={13} />}
              className="whitespace-nowrap shrink-0 px-3"
              onClick={handleCopySnapshot}
            >
              {copiedSnapshot ? t("debugSnapshotCopied") : t("debugCopySnapshot")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
            <MetricTile
              label={t("debugMetricFps")}
              value={`${targetFps} ${t("debugUnitFps")}`}
            />
            <MetricTile
              label={t("debugMetricFrameTime")}
              value={`${avgFrameMs} ${t("debugUnitMs")}`}
            />
            <MetricTile
              label={t("debugMetricParticles")}
              value={String(particlesCount)}
            />
            <MetricTile
              label={t("debugMetricProjectiles")}
              value={String(projectiles.length)}
            />
            <MetricTile
              label={t("debugMetricEnemies")}
              value={String(enemies.filter((e) => !e.isDead).length)}
            />
            <MetricTile
              label={t("debugMetricEntities")}
              value={String(entities.length)}
            />
            <MetricTile
              label={t("debugMetricCamera")}
              value={`${camX}, ${camY}`}
            />
            <MetricTile
              label={t("debugMetricWorld")}
              value={`${engine.levelWidth}×${engine.levelHeight}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Player Inspector & Sensors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card variant="subtle" className="lg:col-span-8">
          <CardHeader>
            <CardTitle icon={<Users className="w-4 h-4 text-cyan-400" />}>
              {t("debugPlayerInspectorTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {players.map((player, idx) => {
              const actionState = player.isAttacking
                ? t("debugPlayerAttack")
                : player.isDashing
                  ? t("debugPlayerDash")
                  : t("debugPlayerIdleState");

              return (
                <div
                  key={player.id}
                  className="p-3 rounded-lg border border-stone-800 bg-black/30 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Text size="sm" weight="bold" className="text-amber-200">
                      P{idx + 1} · {player.characterId ?? "valen"}
                    </Text>
                    <Text size="2xs" family="mono" variant="muted">
                      {player.facingLeft
                        ? t("debugPlayerFacingLeft")
                        : t("debugPlayerFacingRight")}
                    </Text>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
                    <Text size="2xs" variant="muted">
                      {t("debugPlayerPos")}: {Math.round(player.x)}, {Math.round(player.y)}
                    </Text>
                    <Text size="2xs" variant="muted">
                      {t("debugPlayerVel")}: {player.vx.toFixed(1)}, {player.vy.toFixed(1)}
                    </Text>
                    <Text size="2xs" variant="muted">
                      {t("debugPlayerGrounded")}:{" "}
                      {player.isGrounded ? t("debugYes") : t("debugNo")}
                    </Text>
                    <Text size="2xs" variant="muted">
                      {t("debugPlayerState")}: {actionState}
                    </Text>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                      <Text size="2xs">{t("debugVitalsHp")}</Text>
                      <Text size="2xs">
                        {Math.round(player.health)}/{Math.round(player.maxHealth)}
                      </Text>
                    </div>
                    <ProgressBar
                      value={player.health}
                      max={Math.max(1, player.maxHealth)}
                      variant="health"
                    />
                    <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                      <Text size="2xs">{t("debugVitalsMp")}</Text>
                      <Text size="2xs">
                        {Math.round(player.mana)}/{Math.round(player.maxMana)}
                      </Text>
                    </div>
                    <ProgressBar
                      value={player.mana}
                      max={Math.max(1, player.maxMana)}
                      variant="mana"
                    />
                    <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                      <Text size="2xs">{t("debugVitalsSp")}</Text>
                      <Text size="2xs">
                        {Math.round(player.stamina)}/{Math.round(player.maxStamina)}
                      </Text>
                    </div>
                    <ProgressBar
                      value={player.stamina}
                      max={Math.max(1, player.maxStamina)}
                      variant="stamina"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card variant="subtle" className="lg:col-span-4">
          <CardHeader>
            <CardTitle icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}>
              {t("debugToggleSensorsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-stone-800 bg-black/30">
              <Text size="xs">{t("debugToggleHitboxes")}</Text>
              <Switch
                checked={debugState.showHitboxes}
                onCheckedChange={() => debugManager.toggleHitboxes()}
              />
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-stone-800 bg-black/30">
              <Text size="xs">{t("debugToggleProfiler")}</Text>
              <Switch
                checked={debugState.showProfiler}
                onCheckedChange={() => debugManager.toggleProfiler()}
              />
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-stone-800 bg-black/30">
              <Text size="xs">{t("testerClickTeleportLabel")}</Text>
              <Switch
                checked={debugState.clickToTeleport}
                onCheckedChange={() => debugManager.toggleClickToTeleport()}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Enemies Table */}
      <Card variant="subtle">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle icon={<Crosshair className="w-4 h-4 text-red-400" />}>
              {t("debugEntityTableTitle")}
            </CardTitle>
            <div className="w-full sm:w-64">
              <SearchInput
                value={enemyQuery}
                onChange={(val) => setEnemyQuery(val)}
                placeholder={t("debugSearchEnemiesPlaceholder")}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEnemies.length === 0 ? (
            <EmptyState title={t("debugNoEnemies")} />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[560px] flex flex-col divide-y divide-stone-800/80">
                <div className="grid grid-cols-12 gap-2 py-2 px-2 text-xs text-stone-400 font-semibold">
                  <Text size="2xs" variant="muted" className="col-span-4">
                    {t("debugTableId")}
                  </Text>
                  <Text size="2xs" variant="muted" className="col-span-2">
                    {t("debugTableCoords")}
                  </Text>
                  <Text size="2xs" variant="muted" className="col-span-2">
                    {t("debugTableHp")}
                  </Text>
                  <Text size="2xs" variant="muted" className="col-span-4 text-right">
                    {t("debugTableActions")}
                  </Text>
                </div>

                {filteredEnemies.map((enemy) => (
                  <div
                    key={enemy.id}
                    className="grid grid-cols-12 gap-2 py-2 px-2 items-center hover:bg-white/[0.02]"
                  >
                    <div className="col-span-4 flex flex-col min-w-0">
                      <Text size="xs" weight="semibold" className="truncate text-stone-100">
                        {enemy.defaultName || enemy.id}
                      </Text>
                      <Text size="2xs" family="mono" variant="muted" className="truncate">
                        {enemy.id}
                      </Text>
                    </div>
                    <Text size="xs" family="mono" className="col-span-2 tabular-nums text-stone-300">
                      {Math.round(enemy.x)}, {Math.round(enemy.y)}
                    </Text>
                    <div className="col-span-2 flex items-center gap-1.5 font-mono tabular-nums">
                      <Badge variant={enemy.isDead ? "stone" : "red"}>
                        {Math.round(enemy.health)}/{Math.round(enemy.maxHealth)}
                      </Badge>
                    </div>
                    <div className="col-span-4 flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="whitespace-nowrap shrink-0 px-2.5"
                        onClick={() =>
                          engine.teleportPlayer(
                            PlayerId.Player1,
                            Math.max(0, enemy.x - 60),
                            enemy.y
                          )
                        }
                      >
                        {t("debugActionTeleportShort")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Zap size={12} />}
                        className="whitespace-nowrap shrink-0 px-2.5"
                        disabled={enemy.isDead}
                        onClick={() => engine.damageEnemy(enemy.id, 50)}
                      >
                        {t("debugActionDamageShort")}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash2 size={12} />}
                        className="whitespace-nowrap shrink-0 px-2.5"
                        onClick={() => engine.removeEnemy(enemy.id)}
                      >
                        {t("debugActionRemove")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

DebugSubtab.displayName = "DebugSubtab";
export default DebugSubtab;
