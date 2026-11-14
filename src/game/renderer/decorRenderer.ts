import type { LocationDefinition } from "../locations/types";
import type { DecorPlacementSchema } from "../locations/schema/locationSchema";
import { createDiscoveredPropManager } from "../engine/props";
import {
  buildDecorPlan,
  decorFlicker,
  decorFrame,
  EMPTY_DECOR_PLAN,
  type DecorDraw,
  type DecorPlan,
} from "../engine/props/decorPlan";
import type { IPropProvider } from "../engine/props/propManager";
import { assetLoader } from "../engine/assetLoader";
import type { ViewCuller } from "./viewCulling";

export type DecorLayer = "back" | "front";

export interface IDecorRenderer {
  /** Draws one decor layer of the location. Allocation-free once the location plan is built. */
  render(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition | undefined,
    layer: DecorLayer,
    tickCount: number,
    culler: ViewCuller
  ): void;
}

/** Creates the offscreen surface a glow sprite is pre-rendered into; null when no canvas is available. */
export type GlowSurfaceFactory = (size: number) => { image: CanvasImageSource; ctx: CanvasRenderingContext2D } | null;

const defaultGlowSurface: GlowSurfaceFactory = (size) => {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  return ctx ? { image: canvas, ctx } : null;
};

const HEX = /^#([0-9a-f]{6})$/i;

function withAlpha(color: string, alpha: number): string {
  const match = HEX.exec(color);
  if (!match) return alpha > 0 ? color : "rgba(0,0,0,0)";
  const n = parseInt(match[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/**
 * Draws non-colliding decor props from the location plan. The plan (anchor rectangles, culling boxes,
 * glow sprites) is built once when the location changes; per frame only the animation frame and the
 * flicker alpha are computed, both from the simulation tick so they freeze while the game is paused.
 */
export class DecorRenderer implements IDecorRenderer {
  private propProvider: IPropProvider | null;
  private readonly glowSurface: GlowSurfaceFactory;
  private readonly glowSprites = new Map<string, CanvasImageSource | null>();
  private planSource: readonly DecorPlacementSchema[] | undefined = undefined;
  private plan: DecorPlan = EMPTY_DECOR_PLAN;
  private backGlow: (CanvasImageSource | null)[] = [];
  private frontGlow: (CanvasImageSource | null)[] = [];

  /** `props` defaults to the props discovered under `src/assets/props`, created on first use. */
  constructor(props?: IPropProvider, glowSurface: GlowSurfaceFactory = defaultGlowSurface) {
    this.propProvider = props ?? null;
    this.glowSurface = glowSurface;
  }

  private get props(): IPropProvider {
    return (this.propProvider ??= createDiscoveredPropManager(assetLoader.spriteSources));
  }

  /** Builds (once per decor list) the draw plan and the glow sprites it needs. */
  private ensurePlan(placements: readonly DecorPlacementSchema[] | undefined): void {
    if (placements === this.planSource) return;
    this.planSource = placements;
    this.plan = buildDecorPlan(placements, this.props);
    this.backGlow = this.plan.back.map((d) => this.glowFor(d));
    this.frontGlow = this.plan.front.map((d) => this.glowFor(d));
  }

  private glowFor(draw: DecorDraw): CanvasImageSource | null {
    if (draw.glowRadius <= 0) return null;
    const key = `${draw.glowColor}|${draw.glowRadius}`;
    if (this.glowSprites.has(key)) return this.glowSprites.get(key) ?? null;
    const sprite = this.renderGlow(draw.glowColor, draw.glowRadius);
    this.glowSprites.set(key, sprite);
    return sprite;
  }

  private renderGlow(color: string, radius: number): CanvasImageSource | null {
    const size = Math.max(2, Math.ceil(radius * 2));
    const surface = this.glowSurface(size);
    if (!surface) return null;
    const c = size / 2;
    const gradient = surface.ctx.createRadialGradient(c, c, 0, c, c, c);
    gradient.addColorStop(0, withAlpha(color, 0.65));
    gradient.addColorStop(0.45, withAlpha(color, 0.25));
    gradient.addColorStop(1, withAlpha(color, 0));
    surface.ctx.fillStyle = gradient;
    surface.ctx.fillRect(0, 0, size, size);
    return surface.image;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition | undefined,
    layer: DecorLayer,
    tickCount: number,
    culler: ViewCuller
  ): void {
    const placements = location?.decor;
    if (!placements || placements.length === 0) return;
    this.ensurePlan(placements);
    const draws = layer === "back" ? this.plan.back : this.plan.front;
    if (draws.length === 0) return;
    const glows = layer === "back" ? this.backGlow : this.frontGlow;
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < draws.length; i++) {
      const d = draws[i];
      if (!culler.intersects(d.cullX, d.cullY, d.cullW, d.cullH)) continue;
      const prop = this.props.resolve(d.propId);
      if (!prop) continue;
      const sx = decorFrame(tickCount, d.fps, d.phase, d.frames) * prop.frameWidth;
      if (d.flipX) {
        ctx.save();
        ctx.translate(d.x + d.width, d.y);
        ctx.scale(-1, 1);
        ctx.drawImage(prop.image, sx, 0, prop.frameWidth, prop.frameHeight, 0, 0, d.width, d.height);
        ctx.restore();
      } else {
        ctx.drawImage(prop.image, sx, 0, prop.frameWidth, prop.frameHeight, d.x, d.y, d.width, d.height);
      }
      const glow = glows[i];
      if (glow) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = d.flicker ? decorFlicker(tickCount, d.index) : 1;
        ctx.drawImage(glow, d.glowX - d.glowRadius, d.glowY - d.glowRadius, d.glowRadius * 2, d.glowRadius * 2);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
    }
    ctx.imageSmoothingEnabled = smoothing;
  }
}
