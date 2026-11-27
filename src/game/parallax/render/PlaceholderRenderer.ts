import type { LocationDefinition } from "@game/locations/types";
import type { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import { getWorldPlaceholderColors } from "../loading/parallaxMetaPlaceholders";
import {
  BoundedLinearGradientCache,
  createLinearGradientSpec,
  prepareLinearGradientSpec,
  resetLinearGradientSpec,
} from "./gradientCache";
import type { IPlaceholderRenderer } from "./types";
import {
  type ICelestialRenderer,
  defaultCelestialRenderer,
} from "./placeholder/celestialRenderer";
import {
  type ICastleSilhouetteRenderer,
  defaultCastleSilhouetteRenderer,
} from "./placeholder/castleSilhouetteRenderer";
import {
  type IMountainRidgeRenderer,
  defaultMountainRidgeRenderer,
} from "./placeholder/mountainRidgeRenderer";
import {
  type IAtmosphericFogRenderer,
  defaultAtmosphericFogRenderer,
} from "./placeholder/atmosphericFogRenderer";
import {
  type ISceneryScaffoldRenderer,
  defaultSceneryScaffoldRenderer,
} from "./placeholder/sceneryScaffoldRenderer";

export interface PlaceholderRendererDeps {
  celestialRenderer?: ICelestialRenderer;
  castleSilhouetteRenderer?: ICastleSilhouetteRenderer;
  mountainRidgeRenderer?: IMountainRidgeRenderer;
  atmosphericFogRenderer?: IAtmosphericFogRenderer;
  sceneryScaffoldRenderer?: ISceneryScaffoldRenderer;
}

/**
 * Renders procedural non-image parallax layers (sky gradients, celestial bodies,
 * castle silhouettes, mountain ridges, scenery, fog, and custom shapes) as well as
 * zero-allocation world-meta placeholder backdrops for `off` and `simplified` modes.
 */
export class PlaceholderRenderer implements IPlaceholderRenderer {
  private readonly celestialRenderer: ICelestialRenderer;
  private readonly castleSilhouetteRenderer: ICastleSilhouetteRenderer;
  private readonly mountainRidgeRenderer: IMountainRidgeRenderer;
  private readonly atmosphericFogRenderer: IAtmosphericFogRenderer;
  private readonly sceneryScaffoldRenderer: ISceneryScaffoldRenderer;
  private readonly sortedLayersCache = new WeakMap<ParallaxLayerSchema[], ParallaxLayerSchema[]>();
  private readonly gradientCache = new BoundedLinearGradientCache();
  private readonly gradientSpec = createLinearGradientSpec();

  constructor(deps: PlaceholderRendererDeps = {}) {
    this.celestialRenderer = deps.celestialRenderer || defaultCelestialRenderer;
    this.castleSilhouetteRenderer = deps.castleSilhouetteRenderer || defaultCastleSilhouetteRenderer;
    this.mountainRidgeRenderer = deps.mountainRidgeRenderer || defaultMountainRidgeRenderer;
    this.atmosphericFogRenderer = deps.atmosphericFogRenderer || defaultAtmosphericFogRenderer;
    this.sceneryScaffoldRenderer = deps.sceneryScaffoldRenderer || defaultSceneryScaffoldRenderer;
  }

  public clearCaches(): void {
    this.celestialRenderer.clearCaches?.();
    this.gradientCache.clear();
    resetLinearGradientSpec(this.gradientSpec);
  }

  public renderGradientBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    viewportWidth: number,
    viewportHeight: number,
    showSilhouette = false
  ): void {
    const worldId = location.worldId || location.id;
    const metaColors = getWorldPlaceholderColors(worldId);
    const topColor = metaColors?.top || location.theme?.bgGradientTop || "#1c0b05";
    const bottomColor = metaColors?.bottom || location.theme?.bgGradientBottom || "#0a0301";
    prepareLinearGradientSpec(
      this.gradientSpec,
      "placeholder_",
      worldId,
      topColor,
      bottomColor,
      viewportHeight
    );

    ctx.save();
    ctx.fillStyle = this.gradientCache.getOrCreate(
      ctx,
      this.gradientSpec.key,
      0,
      0,
      0,
      viewportHeight,
      this.gradientSpec.stops
    );
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    if (showSilhouette) {
      const silhouetteColor = metaColors?.silhouette || bottomColor;
      const bandTop = Math.round(viewportHeight * 0.65);
      ctx.fillStyle = silhouetteColor;
      ctx.fillRect(0, bandTop, viewportWidth, viewportHeight - bandTop);
    }
    ctx.restore();
  }

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
      this.renderGradientBackdrop(ctx, location, viewportWidth, viewportHeight, true);
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

    let sortedLayers = this.sortedLayersCache.get(pb.layers);
    if (!sortedLayers) {
      sortedLayers = [...pb.layers].sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));
      this.sortedLayersCache.set(pb.layers, sortedLayers);
    }

    for (let i = 0; i < sortedLayers.length; i++) {
      const layer = sortedLayers[i];
      ctx.save();
      ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1.0;

      const driftX = layer.autoDriftX ? tickCount * layer.autoDriftX : 0;
      const driftY = layer.autoDriftY ? tickCount * layer.autoDriftY : 0;
      const scrollX = progressX * extraWidth * layer.scrollSpeedX;
      const scrollY = progressY * extraHeight * layer.scrollSpeedY;

      this.renderProceduralLayer(
        ctx,
        location,
        layer,
        boxWidth,
        boxHeight,
        extraWidth,
        extraHeight,
        progressX,
        progressY,
        scrollX,
        scrollY,
        driftX,
        driftY,
        viewportWidth,
        viewportHeight,
        tickCount
      );

      ctx.restore();
    }
  }

  private renderProceduralLayer(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    layer: ParallaxLayerSchema,
    boxWidth: number,
    boxHeight: number,
    extraWidth: number,
    extraHeight: number,
    progressX: number,
    progressY: number,
    scrollX: number,
    scrollY: number,
    driftX: number,
    driftY: number,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    switch (layer.type) {
      case "sky_gradient":
        this.atmosphericFogRenderer.renderSkyGradient(
          ctx,
          location,
          layer,
          viewportWidth,
          viewportHeight,
          progressY,
          tickCount
        );
        break;
      case "celestial":
        this.celestialRenderer.render(
          ctx,
          layer,
          boxWidth,
          boxHeight,
          extraWidth,
          extraHeight,
          progressX,
          progressY,
          scrollX,
          scrollY,
          driftX,
          driftY,
          viewportWidth,
          viewportHeight,
          tickCount
        );
        break;
      case "castle_silhouettes":
        this.castleSilhouetteRenderer.render(
          ctx,
          location,
          layer,
          boxWidth,
          boxHeight,
          extraWidth,
          extraHeight,
          progressX,
          progressY,
          viewportWidth,
          viewportHeight,
          tickCount
        );
        break;
      case "mountain_ridges":
        this.mountainRidgeRenderer.render(
          ctx,
          location,
          layer,
          boxWidth,
          boxHeight,
          extraWidth,
          extraHeight,
          progressX,
          progressY,
          viewportWidth,
          viewportHeight
        );
        break;
      case "scenery_trees":
        this.sceneryScaffoldRenderer.renderScenery(
          ctx,
          location,
          layer,
          boxWidth,
          boxHeight,
          extraWidth,
          extraHeight,
          progressX,
          progressY,
          viewportWidth,
          viewportHeight,
          tickCount
        );
        break;
      case "fog_overlay":
        this.atmosphericFogRenderer.renderFogOverlay(
          ctx,
          layer,
          viewportWidth,
          viewportHeight,
          progressY,
          driftX,
          tickCount
        );
        break;
      case "custom_shapes":
        this.sceneryScaffoldRenderer.renderCustomShapes(
          ctx,
          layer,
          boxWidth,
          boxHeight,
          extraWidth,
          extraHeight,
          progressX,
          progressY,
          driftX,
          driftY,
          viewportWidth,
          viewportHeight
        );
        break;
    }
  }
}

export const defaultPlaceholderRenderer = new PlaceholderRenderer();
