import React, { useEffect, useRef } from "react";
import { LocationDefinition } from "@game/locations/types";
import { BackgroundLayerTier, BossZoneScope } from "@game/locations/schema/locationSchema";
import type { IParallaxSystem } from "@game/parallax/render";
import { createDefaultParallaxSystem } from "@game/parallax/parallaxWiring";

export interface LevelOverlayOptions {
  readonly showSolids: boolean;
  readonly showHazardsAndLevers: boolean;
  readonly showPortalsAndSpawn: boolean;
  readonly showEnemiesAndBossZones: boolean;
}

export interface LevelPreviewCanvasProps {
  readonly location: LocationDefinition;
  readonly cameraX: number;
  readonly cameraY: number;
  readonly disabledTiers: Partial<Record<BackgroundLayerTier, boolean>>;
  readonly bossPreviewMode: "auto" | "stage" | "world" | "off";
  readonly overlays: LevelOverlayOptions;
}

const PREVIEW_WIDTH = 960;
const PREVIEW_HEIGHT = 480;

/**
 * Interactive live preview canvas for the Creation Studio "Poziomy" subtab.
 * Shares the exact same MultiLayerBackgroundSystem used by the runtime game engine,
 * plus overlays level geometry, portals, enemies, boss zones, and a live camera minimap.
 */
export const LevelPreviewCanvas: React.FC<LevelPreviewCanvasProps> = ({
  location,
  cameraX,
  cameraY,
  disabledTiers,
  bossPreviewMode,
  overlays,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgSystemRef = useRef<IParallaxSystem | null>(null);

  if (!bgSystemRef.current) {
    bgSystemRef.current = createDefaultParallaxSystem();
  }

  // Preload all textures for the selected location whenever location changes
  useEffect(() => {
    bgSystemRef.current?.preload(location.parallaxBackground?.layers);
  }, [location]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bgSystem = bgSystemRef.current;
    if (!canvas || !bgSystem) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let tick = 0;

    const drawFrame = () => {
      tick += 1;
      ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

      const effectiveDisabled: Partial<Record<BackgroundLayerTier, boolean>> = {
        ...disabledTiers,
      };
      let forceBossScope: BossZoneScope | null = null;
      if (bossPreviewMode === "stage") {
        forceBossScope = "stage";
      } else if (bossPreviewMode === "world") {
        forceBossScope = "world";
      } else if (bossPreviewMode === "off") {
        effectiveDisabled.boss_stage = true;
        effectiveDisabled.boss_world = true;
      }

      // 1. Render live parallax layers + boss zone crossfading
      bgSystem.render(
        ctx,
        location,
        location.width,
        location.height,
        PREVIEW_WIDTH,
        PREVIEW_HEIGHT,
        cameraX,
        cameraY,
        tick,
        {
          disabledTiers: effectiveDisabled,
          forceBossScope,
        }
      );

      // 2. World-space level geometry overlays
      const bp = location.jsonBlueprint;
      if (bp) {
        ctx.save();
        ctx.translate(-Math.round(cameraX), -Math.round(cameraY));

        if (overlays.showSolids) {
          for (const solid of bp.layout.solids) {
            const prefab = solid.prefabId ? bp.dictionaries.entities[solid.prefabId] : undefined;
            const isOneway = prefab?.type === "oneway";
            const isMoving = Boolean(solid.vx || solid.vy);

            ctx.fillStyle = isMoving
              ? "rgba(251, 191, 36, 0.35)"
              : isOneway
                ? "rgba(148, 163, 184, 0.45)"
                : "rgba(30, 41, 59, 0.78)";
            ctx.strokeStyle = isMoving
              ? "#fbbf24"
              : isOneway
                ? "#cbd5e1"
                : prefab?.borderColor || "#94a3b8";
            ctx.lineWidth = isMoving ? 2 : 1.5;

            ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
            ctx.strokeRect(solid.x, solid.y, solid.width, solid.height);

            if (isOneway) {
              ctx.fillStyle = "#f8fafc";
              ctx.fillRect(solid.x, solid.y, solid.width, 3);
            }

            if (solid.minX !== undefined && solid.maxX !== undefined) {
              ctx.save();
              ctx.setLineDash([4, 4]);
              ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
              ctx.beginPath();
              ctx.moveTo(solid.minX, solid.y + solid.height * 0.5);
              ctx.lineTo(solid.maxX + solid.width, solid.y + solid.height * 0.5);
              ctx.stroke();
              ctx.restore();
            }

            if (solid.minY !== undefined && solid.maxY !== undefined) {
              ctx.save();
              ctx.setLineDash([4, 4]);
              ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
              ctx.beginPath();
              ctx.moveTo(solid.x + solid.width * 0.5, solid.minY);
              ctx.lineTo(solid.x + solid.width * 0.5, solid.maxY + solid.height);
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        if (overlays.showHazardsAndLevers) {
          for (const haz of bp.layout.hazards ?? []) {
            ctx.fillStyle = "rgba(220, 38, 38, 0.55)";
            ctx.strokeStyle = "#f87171";
            ctx.lineWidth = 1.5;
            ctx.fillRect(haz.x, haz.y, haz.width, haz.height);
            ctx.strokeRect(haz.x, haz.y, haz.width, haz.height);
          }

          for (const lever of bp.layout.levers ?? []) {
            const lw = lever.width ?? 44;
            const lh = lever.height ?? 54;
            ctx.fillStyle = "rgba(245, 158, 11, 0.5)";
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 2;
            ctx.fillRect(lever.x, lever.y, lw, lh);
            ctx.strokeRect(lever.x, lever.y, lw, lh);

            if (lever.targetGateId) {
              const gate = bp.layout.solids.find((s) => s.id === lever.targetGateId);
              if (gate) {
                ctx.save();
                ctx.setLineDash([6, 4]);
                ctx.strokeStyle = "#fbbf24";
                ctx.beginPath();
                ctx.moveTo(lever.x + lw / 2, lever.y + lh / 2);
                ctx.lineTo(gate.x + gate.width / 2, gate.y + gate.height / 2);
                ctx.stroke();
                ctx.restore();
              }
            }
          }
        }

        if (overlays.showPortalsAndSpawn) {
          // Default spawn point
          const sp = bp.spawnPoints.default;
          ctx.fillStyle = "rgba(34, 197, 94, 0.85)";
          ctx.beginPath();
          ctx.arc(sp.x + 16, sp.y + 24, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = "bold 10px monospace";
          ctx.fillStyle = "#dcfce7";
          ctx.fillText("SPAWN", sp.x - 2, sp.y + 6);

          for (const p of bp.layout.portals ?? []) {
            const pDef = p.portalKey ? bp.dictionaries.portals[p.portalKey] : undefined;
            ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
            ctx.strokeStyle = pDef?.colors?.inner || "#38bdf8";
            ctx.lineWidth = 2;
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.strokeRect(p.x, p.y, p.width, p.height);

            ctx.font = "bold 10px monospace";
            ctx.fillStyle = "#e0f2fe";
            ctx.fillText(
              `→ ${pDef?.targetLocationId || p.targetLocationId || "?"}`,
              p.x,
              p.y - 6
            );
          }
        }

        if (overlays.showEnemiesAndBossZones) {
          for (const zone of location.bossZones ?? []) {
            const isWorld = zone.scope === "world";
            ctx.save();
            ctx.fillStyle = isWorld
              ? "rgba(225, 29, 72, 0.16)"
              : "rgba(245, 158, 11, 0.14)";
            ctx.strokeStyle = isWorld ? "#fb7185" : "#fbbf24";
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 5]);
            ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
            ctx.font = "bold 11px monospace";
            ctx.fillStyle = isWorld ? "#fecdd3" : "#fef3c7";
            ctx.fillText(
              `${isWorld ? "WORLD BOSS ZONE" : "STAGE BOSS ZONE"}: ${zone.defaultLabel || zone.id}`,
              zone.x + 8,
              zone.y + 18
            );
            ctx.restore();
          }

          for (const enemy of bp.layout.enemies ?? []) {
            ctx.fillStyle = "rgba(244, 63, 94, 0.8)";
            ctx.strokeStyle = "#fda4af";
            ctx.lineWidth = 1.5;
            ctx.fillRect(enemy.x, enemy.y, 38, 48);
            ctx.strokeRect(enemy.x, enemy.y, 38, 48);
            ctx.font = "10px monospace";
            ctx.fillStyle = "#ffe4e6";
            ctx.fillText(enemy.monsterKey, enemy.x - 4, enemy.y - 5);

            if (enemy.patrolMinX !== undefined && enemy.patrolMaxX !== undefined) {
              ctx.save();
              ctx.strokeStyle = "rgba(251, 113, 133, 0.55)";
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(enemy.patrolMinX, enemy.y + 44);
              ctx.lineTo(enemy.patrolMaxX, enemy.y + 44);
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        ctx.restore();
      }

      // 3. Compact Minimap Scrub Overlay at bottom edge
      const mapH = 18;
      const mapY = PREVIEW_HEIGHT - mapH - 8;
      const mapX = 12;
      const mapW = PREVIEW_WIDTH - 24;
      ctx.save();
      ctx.fillStyle = "rgba(9, 9, 11, 0.78)";
      ctx.strokeStyle = "rgba(120, 113, 108, 0.5)";
      ctx.lineWidth = 1;
      ctx.fillRect(mapX, mapY, mapW, mapH);
      ctx.strokeRect(mapX, mapY, mapW, mapH);

      // Draw boss zone markers on minimap
      for (const zone of location.bossZones ?? []) {
        const zx = mapX + (zone.x / Math.max(1, location.width)) * mapW;
        const zw = Math.max(6, (zone.width / Math.max(1, location.width)) * mapW);
        ctx.fillStyle =
          zone.scope === "world"
            ? "rgba(225, 29, 72, 0.65)"
            : "rgba(245, 158, 11, 0.55)";
        ctx.fillRect(zx, mapY + 2, zw, mapH - 4);
      }

      // Draw active camera viewport box on minimap
      const vpX = mapX + (cameraX / Math.max(1, location.width)) * mapW;
      const vpW = Math.min(mapW, (PREVIEW_WIDTH / Math.max(1, location.width)) * mapW);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(vpX, mapY + 1, vpW, mapH - 2);
      ctx.restore();

      rafId = requestAnimationFrame(drawFrame);
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  }, [location, cameraX, cameraY, disabledTiers, bossPreviewMode, overlays]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-stone-800 bg-black">
      <canvas
        ref={canvasRef}
        width={PREVIEW_WIDTH}
        height={PREVIEW_HEIGHT}
        className="w-full h-auto block"
      />
    </div>
  );
};

LevelPreviewCanvas.displayName = "LevelPreviewCanvas";
export default LevelPreviewCanvas;
