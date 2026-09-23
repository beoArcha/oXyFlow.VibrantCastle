import { Entity, CollisionType } from "../types";
import { LanguageCode, t } from "../i18n";
import { IAtlasSpriteRenderer, defaultAtlasSpriteRenderer } from "./atlasSpriteRenderer";

export interface IStructureRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    entities: Entity[],
    language: LanguageCode,
    tickCount: number
  ): void;
}

/**
 * Dedicated StructureRenderer (Single Responsibility Principle & Open-Closed Principle).
 * Renders interactive level mechanisms, portals, platforms, hazards, and levers.
 * Supports high-resolution sprite sheet atlases (e.g. Aether Gate) with procedural fallback.
 */
export class StructureRenderer implements IStructureRenderer {
  private readonly atlasRenderer: IAtlasSpriteRenderer;

  constructor(atlasRenderer: IAtlasSpriteRenderer = defaultAtlasSpriteRenderer) {
    this.atlasRenderer = atlasRenderer;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    entities: Entity[],
    language: LanguageCode,
    tickCount: number
  ): void {
    entities.forEach((entity) => {
      if (entity.y === -1000) return;

      ctx.save();

      switch (entity.type) {
        case CollisionType.Goal:
          this.renderGoalPortal(ctx, entity, language, tickCount);
          break;

        case CollisionType.Lever:
          this.renderLever(ctx, entity);
          break;

        case CollisionType.Solid:
          this.renderSolidPlatform(ctx, entity);
          break;

        case CollisionType.OneWay:
          this.renderOneWayPlatform(ctx, entity);
          break;

        case CollisionType.Hazard:
          this.renderHazardSpikes(ctx, entity);
          break;
      }

      ctx.restore();
    });
  }

  private renderGoalPortal(
    ctx: CanvasRenderingContext2D,
    entity: Entity,
    language: LanguageCode,
    tickCount: number
  ): void {
    const cx = Math.round(entity.x + entity.width / 2);

    // 1. Attempt Aether Gate Atlas Rendering
    const atlasId = entity.structureId || "aether_gate";
    let renderedWithAtlas = false;

    if (this.atlasRenderer.hasAtlas(atlasId)) {
      const animState = entity.animationState || (entity.isActivated ? "active" : "inactive");
      renderedWithAtlas = this.atlasRenderer.render(ctx, {
        atlasId,
        animationName: animState,
        ticks: entity.animationTicks !== undefined ? entity.animationTicks : tickCount,
        x: entity.x,
        y: entity.y,
        width: entity.width,
        height: entity.height,
        scaleMultiplier: 1.1,
      });
    }

    // 2. Procedural Fallback if atlas not available
    if (!renderedWithAtlas) {
      const cy = entity.y + entity.height / 2;
      const innerColor = entity.portalColors?.inner || "#ffffff";
      const outerColor = entity.portalColors?.outer || "#06b6d4";
      const borderColor = entity.portalColors?.border || "#d97706";

      const pulse = Math.sin((tickCount + entity.x) * 0.05) * 3;
      const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, entity.width / 2 + pulse);
      gradient.addColorStop(0, innerColor);
      gradient.addColorStop(0.35, outerColor);
      gradient.addColorStop(0.75, "#7c3aed");
      gradient.addColorStop(1, "rgba(245, 158, 11, 0.05)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy,
        Math.max(10, entity.width / 2 + pulse),
        Math.max(10, entity.height / 2),
        Math.sin((tickCount + entity.x) * 0.03),
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Portal gothic arch border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, entity.width / 2 + 2, entity.height / 2 + 2, 0, Math.PI, 0);
      ctx.stroke();
    }

    // 3. Floating Destination Label Badge
    const displayLabel = entity.labelKey ? t(language, entity.labelKey) : entity.label;
    if (displayLabel) {
      this.renderPortalBadge(ctx, entity, displayLabel, cx);
    }
  }

  private renderPortalBadge(
    ctx: CanvasRenderingContext2D,
    entity: Entity,
    displayLabel: string,
    cx: number
  ): void {
    ctx.save();
    ctx.font = "bold 11px system-ui, sans-serif";
    const textWidth = ctx.measureText(displayLabel).width;
    const badgeW = textWidth + 16;
    const badgeH = 20;
    const badgeX = cx - badgeW / 2;
    const badgeY = entity.y - 28;

    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fef08a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(displayLabel, cx, badgeY + badgeH / 2);
    ctx.restore();
  }

  private renderLever(ctx: CanvasRenderingContext2D, entity: Entity): void {
    ctx.fillStyle = "#5c3d2e";
    ctx.fillRect(entity.x - 5, entity.y + entity.height - 10, entity.width + 10, 10);

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#c29547";
    ctx.beginPath();
    ctx.moveTo(entity.x + entity.width / 2, entity.y + entity.height - 5);

    if (entity.isActivated) {
      ctx.lineTo(entity.x + entity.width + 10, entity.y + 5);
    } else {
      ctx.lineTo(entity.x - 10, entity.y + 5);
    }
    ctx.stroke();

    ctx.fillStyle = entity.isActivated ? "#22c55e" : "#ef4444";
    ctx.beginPath();
    if (entity.isActivated) {
      ctx.arc(entity.x + entity.width + 10, entity.y + 5, 6, 0, Math.PI * 2);
    } else {
      ctx.arc(entity.x - 10, entity.y + 5, 6, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  private renderSolidPlatform(ctx: CanvasRenderingContext2D, entity: Entity): void {
    ctx.fillStyle = entity.color || "#b35a38";
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height);

    ctx.fillStyle = "#e2b653";
    ctx.fillRect(entity.x, entity.y, entity.width, 4);

    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    for (let bx = entity.x; bx < entity.x + entity.width; bx += 40) {
      ctx.fillRect(bx, entity.y, 2, entity.height);
    }
    for (let by = entity.y; by < entity.y + entity.height; by += 20) {
      ctx.fillRect(entity.x, by, entity.width, 2);
    }
  }

  private renderOneWayPlatform(ctx: CanvasRenderingContext2D, entity: Entity): void {
    ctx.fillStyle = entity.color || "#d98a55";
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height);

    ctx.fillStyle = entity.borderColor || "#fde047";
    ctx.fillRect(entity.x, entity.y, entity.width, 4);

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    for (let bx = entity.x + 8; bx < entity.x + entity.width - 8; bx += 22) {
      ctx.fillRect(bx, entity.y + 4, 3, Math.max(6, entity.height - 4));
    }
  }

  private renderHazardSpikes(ctx: CanvasRenderingContext2D, entity: Entity): void {
    const width = entity.width;
    const height = entity.height;
    const spikeWidth = 20;
    const numSpikes = Math.ceil(width / spikeWidth);

    ctx.fillStyle = "#e06c35";
    for (let i = 0; i < numSpikes; i++) {
      const sx = entity.x + i * spikeWidth;
      const sy = entity.y + height;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + spikeWidth / 2, entity.y);
      ctx.lineTo(sx + spikeWidth, sy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(sx + spikeWidth / 3, sy);
      ctx.lineTo(sx + spikeWidth / 2, entity.y + height * 0.3);
      ctx.lineTo(sx + (2 * spikeWidth) / 3, sy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e06c35";
    }
  }
}

export const defaultStructureRenderer = new StructureRenderer();
