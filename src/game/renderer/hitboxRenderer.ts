import { Player, Enemy, Entity, Projectile, CollisionType } from "@game/types";
import {
  IDebugProfilerOverlay,
  defaultDebugProfilerOverlay,
} from "./debugProfilerOverlay";

export interface IHitboxRenderer {
  renderHitboxes(
    ctx: CanvasRenderingContext2D,
    players: Player[],
    enemies: Enemy[],
    entities: Entity[],
    projectiles: Projectile[]
  ): void;

  renderProfiler(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    players: Player[],
    enemies: Enemy[],
    entities: Entity[],
    projectiles: Projectile[],
    particleCount: number,
    targetFps: number,
    measuredFps: number,
    locationId: string,
    levelWidth: number,
    levelHeight: number,
    isHardwareAccelerated?: boolean
  ): void;
}

/**
 * Dedicated visual debugging renderer for physical collision boxes,
 * sensors, attack reaches, and navigation patrol lines.
 */
export class HitboxRenderer implements IHitboxRenderer {
  private readonly entityTagCache: Map<string, string> = new Map();
  private readonly profilerOverlay: IDebugProfilerOverlay;

  constructor(deps: { profilerOverlay?: IDebugProfilerOverlay } = {}) {
    this.profilerOverlay = deps.profilerOverlay || defaultDebugProfilerOverlay;
  }

  public clearCaches(): void {
    this.entityTagCache.clear();
  }

  private getEntityTag(entity: Entity): string {
    const key = `${entity.type}_${entity.id || ""}_${entity.targetLocationId || ""}_${entity.triggerId || ""}`;
    let tag = this.entityTagCache.get(key);
    if (!tag) {
      if (entity.type === CollisionType.Hazard) {
        tag = "Hazard";
      } else if (entity.type === CollisionType.OneWay) {
        tag = "OneWay";
      } else if (entity.type === CollisionType.Lever) {
        tag = `Lever [${entity.id}]`;
      } else if (entity.type === CollisionType.Goal) {
        tag = `Portal -> ${entity.targetLocationId || "next"}`;
      } else if (entity.type === CollisionType.Trigger) {
        tag = `Trigger [${entity.triggerId || entity.id}]`;
      } else {
        tag = "Solid";
      }
      this.entityTagCache.set(key, tag);
    }
    return tag;
  }

  public renderHitboxes(
    ctx: CanvasRenderingContext2D,
    players: Player[],
    enemies: Enemy[],
    entities: Entity[],
    projectiles: Projectile[]
  ): void {
    ctx.save();
    ctx.lineWidth = 1.5;

    // 1. Entities
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (entity.y === -1000) continue;

      let strokeColor = "#38bdf8";
      let fillColor = "rgba(56, 189, 248, 0.15)";

      if (entity.type === CollisionType.Hazard) {
        strokeColor = "#ef4444";
        fillColor = "rgba(239, 68, 68, 0.25)";
      } else if (entity.type === CollisionType.OneWay) {
        strokeColor = "#f59e0b";
        fillColor = "rgba(245, 158, 11, 0.2)";
      } else if (entity.type === CollisionType.Lever) {
        strokeColor = "#eab308";
        fillColor = "rgba(234, 179, 8, 0.2)";
      } else if (entity.type === CollisionType.Goal) {
        strokeColor = "#c084fc";
        fillColor = "rgba(192, 132, 252, 0.25)";
      } else if (entity.type === CollisionType.Trigger) {
        strokeColor = "#10b981";
        fillColor = "rgba(16, 185, 129, 0.15)";
      }

      const tag = this.getEntityTag(entity);

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
      ctx.strokeRect(entity.x, entity.y, entity.width, entity.height);

      // Label
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = strokeColor;
      ctx.fillText(tag, entity.x + 2, entity.y - 3);
    }

    // 2. Enemies
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.isDead) continue;

      ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
      ctx.strokeStyle = "#f43f5e";
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);

      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "#fecdd3";
      ctx.fillText(
        `${enemy.defaultName || enemy.id} (${enemy.health}/${enemy.maxHealth})`,
        enemy.x,
        enemy.y - 4
      );

      // Patrol bounds
      if (enemy.patrolMinX !== undefined && enemy.patrolMaxX !== undefined && enemy.patrolMaxX > enemy.patrolMinX) {
        ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(enemy.patrolMinX, enemy.y + enemy.height);
        ctx.lineTo(enemy.patrolMaxX, enemy.y + enemy.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 3. Projectiles
    for (let i = 0; i < projectiles.length; i++) {
      const proj = projectiles[i];
      const radius = proj.radius || 10;
      ctx.fillStyle = "rgba(56, 189, 248, 0.3)";
      ctx.strokeStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Velocity line
      ctx.strokeStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      ctx.lineTo(proj.x + proj.vx * 3, proj.y + proj.vy * 3);
      ctx.stroke();
    }

    // 4. Players
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (player.isDead) continue;

      ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
      ctx.strokeStyle = "#22c55e";
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.strokeRect(player.x, player.y, player.width, player.height);

      // Ground sensor dot
      ctx.fillStyle = player.isGrounded ? "#4ade80" : "#ef4444";
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + player.height, 3, 0, Math.PI * 2);
      ctx.fill();

      // Melee attack box if currently attacking
      if (player.isAttacking) {
        const attackReach = 55;
        const attackHeight = 40;
        const attackX = player.facingLeft ? player.x - attackReach : player.x + player.width;
        const attackY = player.y + (player.isCrouching ? 16 : 4);

        ctx.fillStyle = "rgba(245, 158, 11, 0.3)";
        ctx.strokeStyle = "#f59e0b";
        ctx.fillRect(attackX, attackY, attackReach, attackHeight);
        ctx.strokeRect(attackX, attackY, attackReach, attackHeight);
      }

      ctx.font = "bold 10px monospace";
      ctx.fillStyle = "#86efac";
      ctx.fillText(
        `${player.id} [${Math.round(player.x)}, ${Math.round(player.y)}]`,
        player.x - 4,
        player.y - 6
      );
    }

    ctx.restore();
  }

  public renderProfiler(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    players: Player[],
    enemies: Enemy[],
    entities: Entity[],
    projectiles: Projectile[],
    particleCount: number,
    targetFps: number,
    measuredFps: number,
    locationId: string,
    levelWidth: number,
    levelHeight: number,
    isHardwareAccelerated: boolean = true
  ): void {
    this.profilerOverlay.render(
      ctx,
      canvasWidth,
      canvasHeight,
      players,
      enemies,
      entities,
      projectiles,
      particleCount,
      targetFps,
      measuredFps,
      locationId,
      levelWidth,
      levelHeight,
      isHardwareAccelerated
    );
  }
}

export const defaultHitboxRenderer = new HitboxRenderer();
