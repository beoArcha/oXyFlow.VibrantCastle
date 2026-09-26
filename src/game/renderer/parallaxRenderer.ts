import { LocationDefinition } from "../locations/types";
import {
  ParallaxBackgroundSchema,
  ParallaxLayerSchema,
} from "../locations/schema/locationSchema";
import {
  IMultiLayerBackgroundSystem,
  defaultMultiLayerBackgroundSystem,
} from "./multiLayerBackgroundSystem";
import {
  ICelestialRenderer,
  defaultCelestialRenderer,
} from "./parallax/celestialRenderer";
import {
  ICastleSilhouetteRenderer,
  defaultCastleSilhouetteRenderer,
} from "./parallax/castleSilhouetteRenderer";
import {
  IMountainRidgeRenderer,
  defaultMountainRidgeRenderer,
} from "./parallax/mountainRidgeRenderer";
import {
  IAtmosphericFogRenderer,
  defaultAtmosphericFogRenderer,
} from "./parallax/atmosphericFogRenderer";
import {
  ISceneryScaffoldRenderer,
  defaultSceneryScaffoldRenderer,
} from "./parallax/sceneryScaffoldRenderer";
import {
  IParallaxImageRenderer,
  defaultParallaxImageRenderer,
} from "./parallax/parallaxImageRenderer";

export interface IParallaxRendererDependencies {
  multiLayerSystem?: IMultiLayerBackgroundSystem;
  celestialRenderer?: ICelestialRenderer;
  castleSilhouetteRenderer?: ICastleSilhouetteRenderer;
  mountainRidgeRenderer?: IMountainRidgeRenderer;
  atmosphericFogRenderer?: IAtmosphericFogRenderer;
  sceneryScaffoldRenderer?: ISceneryScaffoldRenderer;
  parallaxImageRenderer?: IParallaxImageRenderer;
}

/**
 * Modular Parallax Background Orchestrator (Single Responsibility & Open-Closed Principle).
 *
 * Coordinates deep multi-layered parallax scrolling across the viewport using
 * the oversized background bounding box defined in location JSON blueprints.
 * Delegates specialized sub-layer rendering to focused modules in `src/game/renderer/parallax/`.
 * Size: < 190 lines (strict AGENT.md modularity compliance).
 */
export class ParallaxRenderer {
  private readonly multiLayerSystem: IMultiLayerBackgroundSystem;
  private readonly celestialRenderer: ICelestialRenderer;
  private readonly castleSilhouetteRenderer: ICastleSilhouetteRenderer;
  private readonly mountainRidgeRenderer: IMountainRidgeRenderer;
  private readonly atmosphericFogRenderer: IAtmosphericFogRenderer;
  private readonly sceneryScaffoldRenderer: ISceneryScaffoldRenderer;
  private readonly parallaxImageRenderer: IParallaxImageRenderer;

  private readonly sortedLayersCache = new WeakMap<ParallaxLayerSchema[], ParallaxLayerSchema[]>();

  constructor(deps: IParallaxRendererDependencies = {}) {
    this.multiLayerSystem = deps.multiLayerSystem || defaultMultiLayerBackgroundSystem;
    this.celestialRenderer = deps.celestialRenderer || defaultCelestialRenderer;
    this.castleSilhouetteRenderer = deps.castleSilhouetteRenderer || defaultCastleSilhouetteRenderer;
    this.mountainRidgeRenderer = deps.mountainRidgeRenderer || defaultMountainRidgeRenderer;
    this.atmosphericFogRenderer = deps.atmosphericFogRenderer || defaultAtmosphericFogRenderer;
    this.sceneryScaffoldRenderer = deps.sceneryScaffoldRenderer || defaultSceneryScaffoldRenderer;
    this.parallaxImageRenderer = deps.parallaxImageRenderer || defaultParallaxImageRenderer;
  }

  /**
   * Preload image layers into memory cache ahead of rendering (Zero I/O in render loop).
   */
  public preload(layers?: readonly ParallaxLayerSchema[]): void {
    this.parallaxImageRenderer.preload(layers);
  }

  /**
   * Main entry point: renders all parallax layers defined in the location schema.
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
    if (this.multiLayerSystem.isSupported(location.id)) {
      this.multiLayerSystem.render(
        ctx,
        location,
        levelWidth,
        levelHeight,
        viewportWidth,
        viewportHeight,
        cameraX,
        cameraY,
        tickCount
      );
      return;
    }

    const pb: ParallaxBackgroundSchema | undefined = location.parallaxBackground;
    if (!pb || !pb.layers || pb.layers.length === 0) return;

    // The oversized background bounding box dimensions
    const boxWidth = Math.max(pb.boxWidth || 0, levelWidth + 400);
    const boxHeight = Math.max(pb.boxHeight || 0, levelHeight + 200);

    // Available extra space in the background box beyond the viewport
    const extraWidth = Math.max(0, boxWidth - viewportWidth);
    const extraHeight = Math.max(0, boxHeight - viewportHeight);

    // Maximum world camera excursion across the level
    const maxCamX = Math.max(1, levelWidth - viewportWidth);
    const maxCamY = Math.max(1, levelHeight - viewportHeight);

    // Normalized camera progress across the level [0.0 - 1.0]
    const progressX = Math.max(0, Math.min(1, cameraX / maxCamX));
    const progressY = Math.max(0, Math.min(1, cameraY / maxCamY));

    // Sort layers by depth (cached to avoid per-frame array clone & sort allocations)
    let sortedLayers = this.sortedLayersCache.get(pb.layers);
    if (!sortedLayers) {
      sortedLayers = [...pb.layers].sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));
      this.sortedLayersCache.set(pb.layers, sortedLayers);
    }

    for (let i = 0; i < sortedLayers.length; i++) {
      const layer = sortedLayers[i];
      ctx.save();

      const layerOpacity = layer.opacity !== undefined ? layer.opacity : 1.0;
      ctx.globalAlpha = layerOpacity;

      // Auto-drifting continuous offset (e.g. moving clouds, fog ribbons)
      const driftX = layer.autoDriftX ? tickCount * layer.autoDriftX : 0;
      const driftY = layer.autoDriftY ? tickCount * layer.autoDriftY : 0;

      // Parallax scroll factor through the extra background box space
      const scrollX = progressX * extraWidth * layer.scrollSpeedX;
      const scrollY = progressY * extraHeight * layer.scrollSpeedY;

      switch (layer.type) {
        case "image":
          this.parallaxImageRenderer.render(
            ctx,
            layer,
            boxHeight,
            progressY,
            scrollX,
            driftX,
            driftY,
            viewportWidth,
            viewportHeight
          );
          break;

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

      ctx.restore();
    }
  }
}
