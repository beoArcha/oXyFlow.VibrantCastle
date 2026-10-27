import { Player, Enemy, Entity, Particle, Projectile, AssetQuality } from "../types";
import { assetLoader } from "../engine/assetLoader";
import { CameraState } from "../engine/cameraManager";
import { LocationDefinition } from "../locations/types";
import { LanguageCode } from "@i18n";
import { ParallaxRenderer } from "./parallaxRenderer";
import { IStructureRenderer, defaultStructureRenderer } from "./structureRenderer";
import { ILevelEntityRenderer } from "./levelEntityRenderer";
import { IActorRenderer, ActorRenderer, defaultActorRenderer } from "./actorRenderer";
import { IFxRenderer, FxRenderer, defaultFxRenderer } from "./fxRenderer";
import {
  IMultiLayerBackgroundSystem,
  MultiLayerBackgroundSystem,
  defaultMultiLayerBackgroundSystem,
} from "./multiLayerBackgroundSystem";
import { IHitboxRenderer, HitboxRenderer, defaultHitboxRenderer } from "./hitboxRenderer";
import { debugManager } from "@game/debug/debugManager";
import { ProceduralBackdropCache, defaultProceduralBackdropCache } from "./proceduralBackdropCache";
import { IDebugProfilerOverlay, defaultDebugProfilerOverlay } from "./debugProfilerOverlay";
import { acquireCanvas2DContext } from "./canvasContextAcquisition";
import { renderFpsBadge } from "./fpsOverlayRenderer";

const SCENERY_TREE_OFFSETS = [350, 1100, 1600, 2450, 3050, 3500] as const;

export type { IMultiLayerBackgroundSystem, IHitboxRenderer };
export { MultiLayerBackgroundSystem, defaultMultiLayerBackgroundSystem, HitboxRenderer, defaultHitboxRenderer };

export interface IRendererConfig {
  hardwareAcceleration?: boolean;
}

export interface IRendererDependencies {
  parallaxRenderer?: ParallaxRenderer;
  multiLayerBackgroundSystem?: IMultiLayerBackgroundSystem;
  structureRenderer?: IStructureRenderer;
  levelEntityRenderer?: ILevelEntityRenderer;
  actorRenderer?: IActorRenderer;
  fxRenderer?: IFxRenderer;
  hitboxRenderer?: IHitboxRenderer;
  debugProfilerOverlay?: IDebugProfilerOverlay;
  proceduralBackdropCache?: ProceduralBackdropCache;
}

/**
 * High-performance 2D Canvas Scene Orchestrator & Renderer.
 * Coordinates layered rendering across parallax backgrounds, structures, actors, visual effects, and overlays.
 */
export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  public viewportWidth: number = 1000;
  public viewportHeight: number = 625;
  public scaleFactor: number = 1;
  public assetQuality: AssetQuality = "high";
  public isHardwareAccelerated: boolean = true;
  private tickCount: number = 0;

  public cameraX: number = 0;
  public cameraY: number = 0;
  public language: LanguageCode = "en";

  private readonly parallaxRenderer: ParallaxRenderer;
  private readonly structureRenderer: IStructureRenderer;
  private readonly actorRenderer: IActorRenderer;
  private readonly fxRenderer: IFxRenderer;
  private readonly hitboxRenderer: IHitboxRenderer;
  private readonly debugProfilerOverlay: IDebugProfilerOverlay;
  private readonly backdropCache: ProceduralBackdropCache;

  constructor(
    canvas: HTMLCanvasElement,
    deps: IRendererDependencies = {},
    config: IRendererConfig = {}
  ) {
    this.canvas = canvas;
    this.isHardwareAccelerated = config.hardwareAcceleration !== false;
    this.ctx = acquireCanvas2DContext(canvas, this.isHardwareAccelerated);
    this.ctx.imageSmoothingEnabled = false;

    this.parallaxRenderer =
      deps.parallaxRenderer ||
      new ParallaxRenderer({ multiLayerSystem: deps.multiLayerBackgroundSystem });
    this.structureRenderer = deps.structureRenderer || deps.levelEntityRenderer || defaultStructureRenderer;
    this.actorRenderer = deps.actorRenderer || defaultActorRenderer;
    this.fxRenderer = deps.fxRenderer || defaultFxRenderer;
    this.hitboxRenderer = deps.hitboxRenderer || defaultHitboxRenderer;
    this.debugProfilerOverlay = deps.debugProfilerOverlay || defaultDebugProfilerOverlay;
    this.backdropCache = deps.proceduralBackdropCache || defaultProceduralBackdropCache;
  }

  public setHardwareAcceleration(enabled: boolean) {
    this.isHardwareAccelerated = enabled;
    if (enabled) {
      this.backdropCache.resize(this.viewportWidth, this.viewportHeight);
    }
  }

  public get scale(): number {
    return this.scaleFactor;
  }

  public get currentTickCount(): number {
    return this.tickCount;
  }

  public setAssetQuality(quality: AssetQuality) {
    this.assetQuality = quality;
    assetLoader.setQuality(quality);
  }

  /**
   * Resizes canvas buffer and updates viewport scaling factors based on display dimensions and pixel ratio.
   */
  public setDimensions(
    displayWidth: number,
    displayHeight: number,
    pixelRatio: number = 1,
    filterMode: "smooth" | "pixel" = "pixel"
  ) {
    const width = Math.max(320, Math.floor(displayWidth * pixelRatio));
    const height = Math.max(200, Math.floor(displayHeight * pixelRatio));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const baseWidth = 1000;
    this.scaleFactor = Math.max(0.2, this.canvas.width / baseWidth);
    this.viewportWidth = this.canvas.width / this.scaleFactor;
    this.viewportHeight = this.canvas.height / this.scaleFactor;

    this.ctx.imageSmoothingEnabled = filterMode === "smooth";

    if (this.isHardwareAccelerated) {
      this.backdropCache.resize(this.viewportWidth, this.viewportHeight);
    }
  }

  /**
   * Renders the entire frame purely from provided state.
   */
  public render(
    players: Player[],
    enemies: Enemy[],
    entities: Entity[],
    projectiles: Projectile[],
    particles: readonly Particle[],
    camera: CameraState,
    levelWidth: number,
    levelHeight: number,
    assetQuality?: AssetQuality,
    location?: LocationDefinition,
    language: LanguageCode = "en",
    tickCount: number = 0,
    fpsInfo?: { targetFps: number; measuredFps: number; showFps: boolean }
  ) {
    this.language = language;
    this.tickCount = tickCount;
    if (assetQuality) {
      this.assetQuality = assetQuality;
    }

    this.cameraX = camera.x;
    this.cameraY = camera.y;

    if (this.isHardwareAccelerated) {
      this.ctx.fillStyle = "#0a0301";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.ctx.save();

    this.ctx.scale(this.scaleFactor, this.scaleFactor);

    if (camera.shakeOffsetX !== 0 || camera.shakeOffsetY !== 0) {
      this.ctx.translate(camera.shakeOffsetX, camera.shakeOffsetY);
    }

    // 1. BACKDROP & DYNAMIC PARALLAX
    this.ctx.save();
    if (location?.parallaxBackground) {
      this.parallaxRenderer.render(
        this.ctx,
        location,
        levelWidth,
        levelHeight,
        this.viewportWidth,
        this.viewportHeight,
        this.cameraX,
        this.cameraY,
        this.tickCount
      );
    } else {
      this.backdropCache.renderSky(this.ctx, this.viewportWidth, this.viewportHeight, this.cameraX);
      this.backdropCache.renderCastles(this.ctx, this.viewportWidth, this.cameraX);
    }
    this.ctx.restore();

    this.ctx.translate(-camera.x, -camera.y);

    // 2. AMBIENT PARTICLES
    this.fxRenderer.renderParticles(this.ctx, particles, "dust");
    this.fxRenderer.renderParticles(this.ctx, particles, "leaf");

    // 3. SCENERY DECORATIONS
    if (!location?.parallaxBackground) {
      for (let i = 0; i < SCENERY_TREE_OFFSETS.length; i++) {
        this.backdropCache.renderTree(this.ctx, SCENERY_TREE_OFFSETS[i], 260);
      }
    }

    // 4. LEVEL ENTITIES & STRUCTURES
    this.structureRenderer.render(this.ctx, entities, this.language, this.tickCount);

    // 5. ENEMIES & TARGET DUMMIES
    this.actorRenderer.renderEnemies(this.ctx, enemies, this.tickCount);

    // 6. MAGIC PROJECTILES
    this.fxRenderer.renderProjectiles(this.ctx, projectiles);

    // 7. PLAYERS
    this.actorRenderer.renderPlayers(this.ctx, players, this.assetQuality, this.tickCount);

    // 8. COMBAT SPARKS
    this.fxRenderer.renderParticles(this.ctx, particles, "spark");

    // 9. DEBUG HITBOX OVERLAY
    if (debugManager.state.showHitboxes) {
      this.hitboxRenderer.renderHitboxes(this.ctx, players, enemies, entities, projectiles);
    }

    this.ctx.restore();

    // 10. ON-SCREEN FPS COUNTER OVERLAY
    if (fpsInfo?.showFps && !debugManager.state.showProfiler) {
      renderFpsBadge(
        this.ctx,
        this.canvas.width,
        fpsInfo.targetFps,
        fpsInfo.measuredFps,
        this.isHardwareAccelerated
      );
    }

    // 11. DEBUG PROFILER OVERLAY
    if (debugManager.state.showProfiler) {
      this.debugProfilerOverlay.render(
        this.ctx,
        this.canvas.width,
        this.canvas.height,
        players,
        enemies,
        entities,
        projectiles,
        particles.length,
        fpsInfo?.targetFps || 60,
        fpsInfo?.measuredFps || 60,
        location?.id || "unknown",
        levelWidth,
        levelHeight,
        this.isHardwareAccelerated
      );
    }
  }
}

export default GameRenderer;
