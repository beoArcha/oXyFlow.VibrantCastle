import { LocationDefinition } from "../locations/types";
import {
  BackgroundLayerTier,
  ParallaxLayerSchema,
} from "../locations/schema/locationSchema";
import { debugManager } from "../debug/debugManager";

// High quality assets preloaded directly
import bgBastionFarPng from "../../assets/bg/grand_bastion/grand_bastion_far_high.png";
import bgBastionMidFarPng from "../../assets/bg/grand_bastion/grand_bastion_mid_far_high.png";
import bgBastionMidPng from "../../assets/bg/grand_bastion/grand_bastion_mid_high.png";
import bgBastionMidClosePng from "../../assets/bg/grand_bastion/grand_bastion_mid_close_high.png";
import bgBastionClosePng from "../../assets/bg/grand_bastion/grand_bastion_close_high.png";

import bgChasmFarPng from "../../assets/bg/thorn_chasm/thorn_chasm_far_high.png";
import bgChasmMidFarPng from "../../assets/bg/thorn_chasm/thorn_chasm_mid_far_high.png";
import bgChasmMidPng from "../../assets/bg/thorn_chasm/thorn_chasm_mid_high.png";
import bgChasmCloseMidPng from "../../assets/bg/thorn_chasm/thorn_chasm_close_mid_high.png";
import bgChasmClosePng from "../../assets/bg/thorn_chasm/thorn_chasm_close_high.png";

import bgCourtFarPng from "../../assets/bg/courtyard/courtyard_far_high.png";
import bgCourtMidFarPng from "../../assets/bg/courtyard/courtyard_mid-far_high.png";
import bgCourtMidPng from "../../assets/bg/courtyard/courtyard_mid_high.png";
import bgCourtMidClosePng from "../../assets/bg/courtyard/courtyard_mid-close_high.png";
import bgCourtClosePng from "../../assets/bg/courtyard/courtyard_close_high.png";

import bgTowerFarPng from "../../assets/bg/clocktower/clocktower_far_high.png";
import bgTowerMidFarPng from "../../assets/bg/clocktower/clocktower_mid_far_high.png";
import bgTowerMidPng from "../../assets/bg/clocktower/clocktower_mid_high.png";
import bgTowerMidClosePng from "../../assets/bg/clocktower/clocktower_mid_close_high.png";
import bgTowerClosePng from "../../assets/bg/clocktower/clocktower_close_high.png";

import bgAetherFarPng from "../../assets/bg/aether_sanctuary/aether_sanctuary_far_high.png";
import bgAetherMidFarPng from "../../assets/bg/aether_sanctuary/aether_sanctuary_mid_far_high.png";
import bgAetherMidPng from "../../assets/bg/aether_sanctuary/aether_sanctuary_mid_high.png";
import bgAetherMidClosePng from "../../assets/bg/aether_sanctuary/aether_sanctuary_mid_close_high.png";
import bgAetherClosePng from "../../assets/bg/aether_sanctuary/aether_sanctuary_close_high.png";

export interface IMultiLayerBackgroundSystem {
  isSupported(locationId: string): boolean;
  preload(): void;
  render(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    levelWidth: number,
    levelHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    cameraX: number,
    cameraY: number,
    tickCount: number
  ): void;
}

const TIER_ORDER: BackgroundLayerTier[] = [
  "far",
  "mid_far",
  "mid",
  "mid_close",
  "close",
];

const DYNAMIC_TIERS: readonly BackgroundLayerTier[] = [
  "mid_far",
  "mid",
  "mid_close",
  "close",
] as const;

const DEFAULT_TIER_SPEEDS: Readonly<Record<BackgroundLayerTier, { readonly x: number; readonly y: number }>> = {
  far: { x: 0.0, y: 0.0 }, // static
  mid_far: { x: 0.22, y: 0.09 },
  mid: { x: 0.42, y: 0.18 },
  mid_close: { x: 0.65, y: 0.30 },
  close: { x: 0.85, y: 0.45 },
};

/**
 * MultiLayerBackgroundSystem:
 * Implements a multi-layered parallax background system for all 5 sectors
 * ("courtyard", "thorn_chasm", "clocktower", "aether_sanctuary", "grand_bastion"):
 * - 'far' tier: Rendered as a static backdrop, anchored to the viewport without camera parallax movement.
 * - 'mid_far', 'mid', 'mid_close', 'close' tiers: Dynamically rendered on top with calculated parallax scrolling,
 *   sub-pixel offset alignment, seamless horizontal wrapping, and vertical camera perspective shifts.
 */
export class MultiLayerBackgroundSystem implements IMultiLayerBackgroundSystem {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private isPreloaded: boolean = false;
  private readonly tierBuckets: Record<BackgroundLayerTier, ParallaxLayerSchema[]> = {
    far: [],
    mid_far: [],
    mid: [],
    mid_close: [],
    close: [],
  };

  constructor() {
    this.preload();
  }

  /**
   * Check if a location is configured for or targeted by the multi-layered background system.
   */
  public isSupported(locationId: string): boolean {
    return (
      locationId === "grand_bastion" ||
      locationId === "thorn_chasm" ||
      locationId === "courtyard" ||
      locationId === "clocktower" ||
      locationId === "aether_sanctuary"
    );
  }

  /**
   * Preload all high-res background images into the HTMLImageElement texture cache.
   */
  public preload(): void {
    if (this.isPreloaded || typeof window === "undefined") return;
    this.isPreloaded = true;

    const urls = [
      bgBastionFarPng,
      bgBastionMidFarPng,
      bgBastionMidPng,
      bgBastionMidClosePng,
      bgBastionClosePng,
      bgChasmFarPng,
      bgChasmMidFarPng,
      bgChasmMidPng,
      bgChasmCloseMidPng,
      bgChasmClosePng,
      bgCourtFarPng,
      bgCourtMidFarPng,
      bgCourtMidPng,
      bgCourtMidClosePng,
      bgCourtClosePng,
      bgTowerFarPng,
      bgTowerMidFarPng,
      bgTowerMidPng,
      bgTowerMidClosePng,
      bgTowerClosePng,
      bgAetherFarPng,
      bgAetherMidFarPng,
      bgAetherMidPng,
      bgAetherMidClosePng,
      bgAetherClosePng,
    ];

    urls.forEach((url) => {
      if (!this.imageCache.has(url)) {
        const img = new Image();
        img.src = url;
        this.imageCache.set(url, img);
      }
    });
  }

  private getImage(url: string | undefined): HTMLImageElement | null {
    if (!url || typeof Image === "undefined") return null;
    let img = this.imageCache.get(url);
    if (!img) {
      img = new Image();
      img.src = url;
      this.imageCache.set(url, img);
    }
    return img;
  }

  /**
   * Resolves the layer tier from the layer schema, id, or name.
   */
  private resolveTier(layer: ParallaxLayerSchema): BackgroundLayerTier {
    if (layer.tier) return layer.tier;

    const id = layer.id.toLowerCase();
    if (id.includes("mid_far") || id.includes("mid-far")) return "mid_far";
    if (id.includes("mid_close") || id.includes("mid-close") || id.includes("close_mid")) return "mid_close";
    if (id.includes("far") && !id.includes("mid")) return "far";
    if (id.includes("close") && !id.includes("mid")) return "close";
    if (id.includes("mid")) return "mid";

    // Depth-based fallback
    if (layer.depth <= 0.15) return "far";
    if (layer.depth <= 0.35) return "mid_far";
    if (layer.depth <= 0.55) return "mid";
    if (layer.depth <= 0.75) return "mid_close";
    return "close";
  }

  /**
   * Main rendering method for the multi-layered background system.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    levelWidth: number,
    levelHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    cameraX: number,
    cameraY: number,
    tickCount: number
  ): void {
    const pb = location.parallaxBackground;
    if (!pb || !pb.layers || pb.layers.length === 0) {
      this.renderFallbackBackdrop(ctx, location, viewportWidth, viewportHeight);
      return;
    }

    const boxWidth = Math.max(pb.boxWidth || 0, levelWidth + 400);
    const boxHeight = Math.max(pb.boxHeight || 0, levelHeight + 200);

    const extraWidth = Math.max(0, boxWidth - viewportWidth);
    const extraHeight = Math.max(0, boxHeight - viewportHeight);

    const maxCamX = Math.max(1, levelWidth - viewportWidth);
    const maxCamY = Math.max(1, levelHeight - viewportHeight);

    const progressX = Math.max(0, Math.min(1, cameraX / maxCamX));
    const progressY = Math.max(0, Math.min(1, cameraY / maxCamY));

    // Group layers into preallocated reusable tiers (zero per-frame allocations)
    this.tierBuckets.far.length = 0;
    this.tierBuckets.mid_far.length = 0;
    this.tierBuckets.mid.length = 0;
    this.tierBuckets.mid_close.length = 0;
    this.tierBuckets.close.length = 0;

    for (let i = 0; i < pb.layers.length; i++) {
      const layer = pb.layers[i];
      const tier = this.resolveTier(layer);
      this.tierBuckets[tier].push(layer);
    }

    // 1. Render 'far' as a static backdrop (anchored to viewport, zero parallax movement)
    if (debugManager.state.parallaxTiers.far !== false) {
      this.renderFarStaticBackdrop(
        ctx,
        location,
        this.tierBuckets.far,
        viewportWidth,
        viewportHeight,
        tickCount
      );
    }

    // 2. Render dynamic layers ('mid_far', 'mid', 'mid_close', 'close') on top in sequence
    for (let i = 0; i < DYNAMIC_TIERS.length; i++) {
      const tier = DYNAMIC_TIERS[i];
      if (debugManager.state.parallaxTiers[tier] === false) continue;
      const layersInTier = this.tierBuckets[tier];
      for (let j = 0; j < layersInTier.length; j++) {
        const layer = layersInTier[j];
        this.renderDynamicLayer(
          ctx,
          layer,
          tier,
          location,
          boxHeight,
          extraWidth,
          extraHeight,
          progressX,
          progressY,
          viewportWidth,
          viewportHeight,
          tickCount
        );
      }

      // Subtle atmospheric environmental depth blending between mid and close tiers
      if (tier === "mid") {
        if (location.id === "thorn_chasm") {
          this.renderChasmAtmosphericMist(ctx, viewportWidth, viewportHeight, tickCount);
        } else if (location.id === "grand_bastion") {
          this.renderBastionSolarGlow(ctx, viewportWidth, viewportHeight, tickCount);
        } else if (location.id === "clocktower") {
          this.renderClocktowerAtmosphericSteam(ctx, viewportWidth, viewportHeight, tickCount);
        } else if (location.id === "aether_sanctuary") {
          this.renderAetherAtmosphericAura(ctx, viewportWidth, viewportHeight, tickCount);
        } else if (location.id === "courtyard") {
          this.renderCourtyardAutumnHaze(ctx, viewportWidth, viewportHeight, tickCount);
        }
      }
    }
  }

  /**
   * Renders the 'far' layer as a static backdrop.
   * Completely fixed to the game view with zero camera parallax shift,
   * filling the viewport cleanly.
   */
  private renderFarStaticBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    farLayers: ParallaxLayerSchema[],
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();

    // 1. Solid base gradient underneath image
    const bgGrad = ctx.createLinearGradient(0, 0, 0, viewportHeight);
    const topColor = location.theme?.bgGradientTop || (location.id === "thorn_chasm" ? "#14041a" : "#2a150b");
    const bottomColor = location.theme?.bgGradientBottom || (location.id === "thorn_chasm" ? "#08010d" : "#0d0502");
    bgGrad.addColorStop(0, topColor);
    bgGrad.addColorStop(1, bottomColor);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    let imageRendered = false;

    for (const layer of farLayers) {
      if (layer.imageUrl) {
        const img = layer.imageElement || this.getImage(layer.imageUrl);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          if (layer.opacity !== undefined) {
            ctx.globalAlpha = layer.opacity;
          }

          // Static backdrop calculation: scale to cover viewport cleanly while maintaining ratio
          const scale = Math.max(
            viewportWidth / img.naturalWidth,
            viewportHeight / img.naturalHeight
          );
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const drawX = (viewportWidth - drawW) / 2;
          const drawY = 0; // Anchored to top for horizon/sky consistency

          ctx.drawImage(img, Math.round(drawX), Math.round(drawY), Math.round(drawW), Math.round(drawH));
          ctx.restore();
          imageRendered = true;
        }
      }
    }

    // If far image is loading, provide a rich stylized backdrop
    if (!imageRendered) {
      this.renderProceduralFarBackdrop(ctx, location, viewportWidth, viewportHeight, tickCount);
    }

    ctx.restore();
  }

  /**
   * Renders a dynamic layer ('mid_far', 'mid', 'mid_close', 'close') on top of the static backdrop.
   * Employs sub-pixel parallax scrolling, seamless horizontal looping, and vertical tracking.
   */
  private renderDynamicLayer(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    tier: BackgroundLayerTier,
    _location: LocationDefinition,
    boxHeight: number,
    extraWidth: number,
    _extraHeight: number,
    progressX: number,
    progressY: number,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    if (!layer.imageUrl) return;

    const img = layer.imageElement || this.getImage(layer.imageUrl);
    if (!img || !img.complete || img.naturalWidth === 0) return;

    ctx.save();
    if (layer.opacity !== undefined && layer.opacity < 1) {
      ctx.globalAlpha = layer.opacity;
    }

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    // Scale layer vertically to cover the viewport with margin for vertical parallax
    const effectiveHeight = Math.max(viewportHeight, boxHeight * 0.85);
    const scale = effectiveHeight / imgH;
    const drawW = imgW * scale;
    const drawH = effectiveHeight;

    // Tier-appropriate scroll speeds if not explicitly assigned
    const speedX = layer.scrollSpeedX !== undefined ? layer.scrollSpeedX : DEFAULT_TIER_SPEEDS[tier].x;
    const speedY = layer.scrollSpeedY !== undefined ? layer.scrollSpeedY : DEFAULT_TIER_SPEEDS[tier].y;

    // Horizontal parallax scroll position
    const scrollX = progressX * extraWidth * speedX;
    const driftX = layer.autoDriftX ? tickCount * layer.autoDriftX : 0;
    const screenX = -scrollX - driftX;

    // Vertical parallax scroll position
    const maxShiftY = Math.max(0, drawH - viewportHeight);
    const driftY = layer.autoDriftY ? tickCount * layer.autoDriftY : 0;
    const screenY = -progressY * maxShiftY * speedY - driftY;

    // Seamless horizontal tile looping across full viewport width
    let startX = screenX % drawW;
    if (startX > 0) startX -= drawW;

    for (let x = startX; x < viewportWidth + drawW; x += drawW) {
      ctx.drawImage(
        img,
        Math.round(x),
        Math.round(screenY),
        Math.round(drawW),
        Math.round(drawH)
      );
    }

    ctx.restore();
  }

  /**
   * Procedural fallback backdrop while far texture is streaming/loading.
   */
  private renderProceduralFarBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    // Horizon glow tuned to location archetype
    let glowColor = "rgba(245, 158, 11, 0.15)";
    let mountainColor = "#1a0b05";

    if (location.id === "thorn_chasm") {
      glowColor = "rgba(168, 85, 247, 0.12)";
      mountainColor = "#12031a";
    } else if (location.id === "aether_sanctuary") {
      glowColor = "rgba(56, 189, 248, 0.18)";
      mountainColor = "#081426";
    } else if (location.id === "clocktower") {
      glowColor = "rgba(245, 158, 11, 0.16)";
      mountainColor = "#1a0e05";
    } else if (location.id === "grand_bastion") {
      glowColor = "rgba(251, 191, 36, 0.15)";
      mountainColor = "#1a0b05";
    } else if (location.id === "courtyard") {
      glowColor = "rgba(224, 108, 53, 0.14)";
      mountainColor = "#1c0b05";
    }

    const grad = ctx.createRadialGradient(
      viewportWidth * 0.5,
      viewportHeight * 0.4,
      50,
      viewportWidth * 0.5,
      viewportHeight * 0.4,
      viewportWidth * 0.7
    );
    grad.addColorStop(0, glowColor);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // Distant mountain silhouette
    ctx.fillStyle = mountainColor;
    ctx.beginPath();
    ctx.moveTo(0, viewportHeight);
    for (let x = 0; x <= viewportWidth; x += 40) {
      const peak =
        viewportHeight * 0.65 -
        Math.sin(x * 0.005) * 35 -
        Math.cos(x * 0.012) * 20;
      ctx.lineTo(x, peak);
    }
    ctx.lineTo(viewportWidth, viewportHeight);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Atmospheric floating mist for Thorn Chasm between mid & close layers.
   */
  private renderChasmAtmosphericMist(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.12;
    const waveOffset = Math.sin(tickCount * 0.02) * 15;
    const mistGrad = ctx.createLinearGradient(0, viewportHeight * 0.6 + waveOffset, 0, viewportHeight);
    mistGrad.addColorStop(0, "rgba(147, 51, 234, 0)");
    mistGrad.addColorStop(0.5, "rgba(147, 51, 234, 0.25)");
    mistGrad.addColorStop(1, "rgba(88, 28, 135, 0)");
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, viewportHeight * 0.6 + waveOffset, viewportWidth, viewportHeight * 0.4);
    ctx.restore();
  }

  /**
   * Atmospheric solar dusk warmth for Grand Bastion between mid & close layers.
   */
  private renderBastionSolarGlow(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.08 + Math.sin(tickCount * 0.015) * 0.02;
    const glowGrad = ctx.createLinearGradient(0, 0, viewportWidth, viewportHeight);
    glowGrad.addColorStop(0, "rgba(251, 191, 36, 0.2)");
    glowGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.05)");
    glowGrad.addColorStop(1, "rgba(180, 83, 9, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.restore();
  }

  /**
   * Atmospheric warm bronze steam and cog haze for Clocktower between mid & close layers.
   */
  private renderClocktowerAtmosphericSteam(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.09 + Math.sin(tickCount * 0.02) * 0.02;
    const waveOffset = Math.sin(tickCount * 0.018) * 12;
    const steamGrad = ctx.createLinearGradient(0, viewportHeight * 0.5 + waveOffset, 0, viewportHeight);
    steamGrad.addColorStop(0, "rgba(217, 119, 6, 0)");
    steamGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.16)");
    steamGrad.addColorStop(1, "rgba(180, 83, 9, 0.04)");
    ctx.fillStyle = steamGrad;
    ctx.fillRect(0, viewportHeight * 0.5 + waveOffset, viewportWidth, viewportHeight * 0.5);
    ctx.restore();
  }

  /**
   * Atmospheric glowing celestial aura for Aether Sanctuary between mid & close layers.
   */
  private renderAetherAtmosphericAura(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.10 + Math.sin(tickCount * 0.025) * 0.03;
    const auraGrad = ctx.createRadialGradient(
      viewportWidth * 0.5,
      viewportHeight * 0.35,
      60,
      viewportWidth * 0.5,
      viewportHeight * 0.35,
      viewportWidth * 0.65
    );
    auraGrad.addColorStop(0, "rgba(56, 189, 248, 0.18)");
    auraGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.08)");
    auraGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = auraGrad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.restore();
  }

  /**
   * Atmospheric autumn twilight haze for Courtyard between mid & close layers.
   */
  private renderCourtyardAutumnHaze(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.07 + Math.sin(tickCount * 0.012) * 0.015;
    const hazeGrad = ctx.createLinearGradient(0, viewportHeight * 0.55, 0, viewportHeight);
    hazeGrad.addColorStop(0, "rgba(234, 88, 12, 0)");
    hazeGrad.addColorStop(0.5, "rgba(224, 108, 53, 0.12)");
    hazeGrad.addColorStop(1, "rgba(120, 53, 15, 0.03)");
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, viewportHeight * 0.55, viewportWidth, viewportHeight * 0.45);
    ctx.restore();
  }

  private renderFallbackBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, 0, viewportHeight);
    grad.addColorStop(0, location.theme?.bgGradientTop || "#1c0b05");
    grad.addColorStop(1, location.theme?.bgGradientBottom || "#0a0301");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.restore();
  }
}

export const defaultMultiLayerBackgroundSystem = new MultiLayerBackgroundSystem();
