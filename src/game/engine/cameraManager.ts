import { Player } from "../types";

export interface CameraState {
  x: number;
  y: number;
  shakeOffsetX: number;
  shakeOffsetY: number;
}

/**
 * Manages viewport tracking, bounds clamping, lerping, and screen shake effects.
 * Completely decouples camera logic from drawing.
 */
export class CameraManager {
  public x: number = 0;
  public y: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private lerpFactor: number = 0.08;

  // Screen shake state
  private shakeTime: number = 0;
  private shakeIntensity: number = 0;
  public shakeOffsetX: number = 0;
  public shakeOffsetY: number = 0;

  public triggerShake(duration: number, intensity: number) {
    this.shakeTime = duration;
    this.shakeIntensity = intensity;
  }

  public update(
    players: Player[],
    viewportWidth: number,
    viewportHeight: number,
    levelWidth: number,
    levelHeight: number
  ): CameraState {
    const activePlayers = players.filter((p) => !p.isDead);

    if (activePlayers.length > 0) {
      const avgX = activePlayers.reduce((acc, p) => acc + (p.x + p.width / 2), 0) / activePlayers.length;
      const avgY = activePlayers.reduce((acc, p) => acc + (p.y + p.height / 2), 0) / activePlayers.length;

      this.targetX = avgX - viewportWidth / 2;
      this.targetY = avgY - viewportHeight / 2 - 40;
    }

    // Smooth lerp
    this.x += (this.targetX - this.x) * this.lerpFactor;
    this.y += (this.targetY - this.y) * this.lerpFactor;

    // Clamp within world boundaries
    this.x = Math.max(0, Math.min(this.x, Math.max(0, levelWidth - viewportWidth)));
    this.y = Math.max(0, Math.min(this.y, Math.max(0, levelHeight - viewportHeight)));

    // Screen shake update
    if (this.shakeTime > 0) {
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeTime--;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    return {
      x: this.x,
      y: this.y,
      shakeOffsetX: this.shakeOffsetX,
      shakeOffsetY: this.shakeOffsetY,
    };
  }

  public reset(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.shakeTime = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  public snapToPlayers(
    players: Player[],
    viewportWidth: number,
    viewportHeight: number,
    levelWidth: number,
    levelHeight: number
  ) {
    const activePlayers = players.filter((p) => !p.isDead);
    if (activePlayers.length > 0) {
      const avgX = activePlayers.reduce((acc, p) => acc + (p.x + p.width / 2), 0) / activePlayers.length;
      const avgY = activePlayers.reduce((acc, p) => acc + (p.y + p.height / 2), 0) / activePlayers.length;

      this.targetX = Math.max(0, Math.min(avgX - viewportWidth / 2, Math.max(0, levelWidth - viewportWidth)));
      this.targetY = Math.max(0, Math.min(avgY - viewportHeight / 2 - 40, Math.max(0, levelHeight - viewportHeight)));
      this.x = this.targetX;
      this.y = this.targetY;
    }
    this.shakeTime = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }
}
