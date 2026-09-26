import { Player, Enemy, Entity, Projectile } from "../types";
import { debugManager } from "../debug/debugManager";

export interface IDebugProfilerOverlay {
  render(
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
 * Dedicated visual overlay for engine performance metrics, GPU acceleration status,
 * live entity telemetry, and cheat toggles.
 * Adheres to SRP & AGENT.md size limits (< 140 lines).
 */
export class DebugProfilerOverlay implements IDebugProfilerOverlay {
  private readonly profilerFlags: string[] = [];

  public render(
    ctx: CanvasRenderingContext2D,
    _canvasWidth: number,
    _canvasHeight: number,
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
    ctx.save();
    const p1 = players[0];
    let aliveEnemies = 0;
    for (let i = 0; i < enemies.length; i++) {
      if (!enemies[i].isDead) aliveEnemies++;
    }
    const frameTimeMs = measuredFps > 0 ? (1000 / measuredFps).toFixed(1) : "0.0";

    const boxW = 260;
    const boxH = 170;
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

    ctx.fillText(`FPS: ${measuredFps} / ${targetFps} (${frameTimeMs} ms)`, x + 10, y + 36);
    ctx.fillText(`GPU: ${isHardwareAccelerated ? "DIRECT (VRAM CACHE)" : "STANDARD 2D (COMP)"}`, x + 10, y + 50);
    ctx.fillText(`Lokacja: ${locationId} (${levelWidth}x${levelHeight})`, x + 10, y + 64);

    if (p1) {
      ctx.fillText(
        `P1 Pos: X=${Math.round(p1.x)} Y=${Math.round(p1.y)} Ground=${p1.isGrounded ? "TAK" : "NIE"}`,
        x + 10,
        y + 78
      );
      ctx.fillText(
        `P1 Spd: VX=${p1.vx.toFixed(1)} VY=${p1.vy.toFixed(1)}`,
        x + 10,
        y + 92
      );
      ctx.fillText(
        `P1 Vit: HP=${Math.round(p1.health)}/${p1.maxHealth} MP=${Math.round(p1.mana)} SP=${Math.round(p1.stamina)}`,
        x + 10,
        y + 106
      );
    }

    ctx.fillText(
      `Obiekty: Wrogowie=${aliveEnemies}/${enemies.length} Encje=${entities.length}`,
      x + 10,
      y + 120
    );
    ctx.fillText(
      `Pociski=${projectiles.length} Cząstki=${particleCount}`,
      x + 10,
      y + 134
    );

    // Active Cheats Status bar
    const st = debugManager.state;
    this.profilerFlags.length = 0;
    if (st.godMode) this.profilerFlags.push("GOD");
    if (st.infiniteMana) this.profilerFlags.push("INF_MP");
    if (st.infiniteStamina) this.profilerFlags.push("INF_SP");
    if (st.noClip) this.profilerFlags.push("NOCLIP");
    if (st.freezeAI) this.profilerFlags.push("FROZEN_AI");
    if (st.timeScale !== 1.0) this.profilerFlags.push(`${st.timeScale}x`);

    if (this.profilerFlags.length > 0) {
      ctx.fillStyle = "#ef4444";
      ctx.fillText(`Aktywne: ${this.profilerFlags.join(" | ")}`, x + 10, y + 148);
    }

    ctx.restore();
  }
}

export const defaultDebugProfilerOverlay = new DebugProfilerOverlay();
