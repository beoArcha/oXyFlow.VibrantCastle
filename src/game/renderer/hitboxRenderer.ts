import { Player, Enemy, Entity, Projectile, CollisionType } from "../types";
import { debugManager } from "../debug/debugManager";

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
    levelHeight: number
  ): void;
}

export class HitboxRenderer implements IHitboxRenderer {
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
    for (const entity of entities) {
      if (entity.y === -1000) continue; // deactivated / lifted

      let strokeColor = "#38bdf8"; // solid platform
      let fillColor = "rgba(56, 189, 248, 0.15)";
      let tag = "Solid";

      if (entity.type === CollisionType.Hazard) {
        strokeColor = "#ef4444";
        fillColor = "rgba(239, 68, 68, 0.25)";
        tag = "Hazard";
      } else if (entity.type === CollisionType.OneWay) {
        strokeColor = "#f59e0b";
        fillColor = "rgba(245, 158, 11, 0.2)";
        tag = "OneWay";
      } else if (entity.type === CollisionType.Lever) {
        strokeColor = "#eab308";
        fillColor = "rgba(234, 179, 8, 0.2)";
        tag = `Lever [${entity.id}]`;
      } else if (entity.type === CollisionType.Goal) {
        strokeColor = "#c084fc";
        fillColor = "rgba(192, 132, 252, 0.25)";
        tag = `Portal -> ${entity.targetLocationId || "next"}`;
      } else if (entity.type === CollisionType.Trigger) {
        strokeColor = "#10b981";
        fillColor = "rgba(16, 185, 129, 0.15)";
        tag = `Trigger [${entity.triggerId || entity.id}]`;
      }

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
    for (const enemy of enemies) {
      if (enemy.isDead) continue;

      // Body box
      ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
      ctx.strokeStyle = "#f43f5e";
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);

      // Label & HP
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "#fecdd3";
      ctx.fillText(
        `${enemy.defaultName || enemy.id} (${enemy.health}/${enemy.maxHealth})`,
        enemy.x,
        enemy.y - 4
      );

      // Patrol bounds if moving
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
    for (const proj of projectiles) {
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
    for (const player of players) {
      if (player.isDead) continue;

      // Player body box
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

      // Player Tag
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
    levelHeight: number
  ): void {
    ctx.save();
    const p1 = players[0];
    const aliveEnemies = enemies.filter((e) => !e.isDead).length;
    const frameTimeMs = measuredFps > 0 ? (1000 / measuredFps).toFixed(1) : "0.0";

    const boxW = 260;
    const boxH = 155;
    const x = 12;
    const y = 12;

    ctx.fillStyle = "rgba(10, 5, 3, 0.88)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText("🛠️ DEBUG PROFILER", x + 10, y + 20);

    ctx.font = "10px monospace";
    ctx.fillStyle = "#fed7aa";

    ctx.fillText(`FPS: ${measuredFps} / ${targetFps} (${frameTimeMs} ms)`, x + 10, y + 38);
    ctx.fillText(`Lokacja: ${locationId} (${levelWidth}x${levelHeight})`, x + 10, y + 54);

    if (p1) {
      ctx.fillText(
        `P1 Pos: X=${Math.round(p1.x)} Y=${Math.round(p1.y)} Ground=${p1.isGrounded ? "TAK" : "NIE"}`,
        x + 10,
        y + 70
      );
      ctx.fillText(
        `P1 Spd: VX=${p1.vx.toFixed(1)} VY=${p1.vy.toFixed(1)}`,
        x + 10,
        y + 86
      );
      ctx.fillText(
        `P1 Vit: HP=${Math.round(p1.health)}/${p1.maxHealth} MP=${Math.round(p1.mana)} SP=${Math.round(p1.stamina)}`,
        x + 10,
        y + 102
      );
    }

    ctx.fillText(
      `Obiekty: Wrogowie=${aliveEnemies}/${enemies.length} Encje=${entities.length}`,
      x + 10,
      y + 118
    );
    ctx.fillText(
      `Pociski=${projectiles.length} Cząstki=${particleCount}`,
      x + 10,
      y + 134
    );

    // Active Cheats Status bar
    const st = debugManager.state;
    const flags: string[] = [];
    if (st.godMode) flags.push("GOD");
    if (st.infiniteMana) flags.push("INF_MP");
    if (st.infiniteStamina) flags.push("INF_SP");
    if (st.noClip) flags.push("NOCLIP");
    if (st.freezeAI) flags.push("FROZEN_AI");
    if (st.timeScale !== 1.0) flags.push(`${st.timeScale}x`);

    if (flags.length > 0) {
      ctx.fillStyle = "#ef4444";
      ctx.fillText(`Aktywne: ${flags.join(" | ")}`, x + 10, y + 148);
    }

    ctx.restore();
  }
}

export const defaultHitboxRenderer = new HitboxRenderer();
