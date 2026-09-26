import { Player, Enemy, Entity, Particle, Projectile, AssetQuality } from "../types";
import { assetLoader } from "../engine/assetLoader";
import { CameraState } from "../engine/cameraManager";
import { LocationDefinition } from "../locations/types";
import { LanguageCode } from "../i18n";
import { ParallaxRenderer } from "./parallaxRenderer";
import {
  ILevelEntityRenderer,
  LevelEntityRenderer,
  defaultLevelEntityRenderer,
} from "./levelEntityRenderer";
import {
  IActorRenderer,
  ActorRenderer,
  defaultActorRenderer,
} from "./actorRenderer";
import {
  IFxRenderer,
  FxRenderer,
  defaultFxRenderer,
} from "./fxRenderer";
import {
  IMultiLayerBackgroundSystem,
  MultiLayerBackgroundSystem,
  defaultMultiLayerBackgroundSystem,
} from "./multiLayerBackgroundSystem";
import {
  IHitboxRenderer,
  HitboxRenderer,
  defaultHitboxRenderer,
} from "./hitboxRenderer";
import { debugManager } from "../debug/debugManager";
import {
  ProceduralBackdropCache,
  defaultProceduralBackdropCache,
} from "./proceduralBackdropCache";
import { rendererLogger } from "../logger/gameLogger";
import { EngineError, ErrorCode } from "../../lib/errors";

const SCENERY_TREE_OFFSETS = [350, 1100, 1600, 2450, 3050, 3500] as const;
const LEAF_COLORS = ["#b45309", "#d97706", "#f59e0b", "#fbbf24"] as const;

export type { IMultiLayerBackgroundSystem, IHitboxRenderer };
export { MultiLayerBackgroundSystem, defaultMultiLayerBackgroundSystem, HitboxRenderer, defaultHitboxRenderer };

export interface IRendererConfig {
  hardwareAcceleration?: boolean;
}

export interface IRendererDependencies {
  parallaxRenderer?: ParallaxRenderer;
  multiLayerBackgroundSystem?: IMultiLayerBackgroundSystem;
  levelEntityRenderer?: ILevelEntityRenderer;
  actorRenderer?: IActorRenderer;
  fxRenderer?: IFxRenderer;
  hitboxRenderer?: IHitboxRenderer;
  proceduralBackdropCache?: ProceduralBackdropCache;
}

/**
 * High-performance 2D Canvas Scene Orchestrator & Renderer.
 * Delivers a "HiPixel" visual aesthetic blending the rich autumnal warmth of Owlboy
 * with kinetic visual flair (dashes, hit-flashes, sweeps, spells) of Hades.
 *
 * Refactored to adhere to SOLID principles:
 * - SRP: Delegates domain rendering to ParallaxRenderer, LevelEntityRenderer, ActorRenderer, and FxRenderer.
 * - DIP: Injects sub-renderers via IRendererDependencies with robust defaults.
 * - OCP: Modular sub-renderers can be extended or replaced without modifying camera or viewport logic.
 */
export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Viewport & Relative Scaling
  public viewportWidth: number = 1000;
  public viewportHeight: number = 625;
  public scaleFactor: number = 1;
  public assetQuality: AssetQuality = "high";
  public isHardwareAccelerated: boolean = true;
  private tickCount: number = 0;

  // Camera settings (cached for parallax computations)
  public cameraX: number = 0;
  public cameraY: number = 0;
  public language: LanguageCode = "en";

  // Sub-renderers (DIP & SRP)
  private readonly parallaxRenderer: ParallaxRenderer;
  private readonly levelEntityRenderer: ILevelEntityRenderer;
  private readonly actorRenderer: IActorRenderer;
  private readonly fxRenderer: IFxRenderer;
  private readonly hitboxRenderer: IHitboxRenderer;
  private readonly backdropCache: ProceduralBackdropCache;

  constructor(
    canvas: HTMLCanvasElement,
    deps: IRendererDependencies = {},
    config: IRendererConfig = {}
  ) {
    this.canvas = canvas;
    this.isHardwareAccelerated = config.hardwareAcceleration !== false;

    let context: CanvasRenderingContext2D | null = null;
    if (this.isHardwareAccelerated) {
      try {
        context = canvas.getContext("2d", {
          alpha: false,
          desynchronized: true,
          willReadFrequently: false,
        });
      } catch (err) {
        rendererLogger.warn("Failed to acquire accelerated 2D context, falling back:", { mode: "accelerated_2d" }, err);
      }
    }
    if (!context) {
      context =
        canvas.getContext("2d", {
          alpha: true,
          willReadFrequently: false,
        }) || canvas.getContext("2d");
    }
    if (!context) {
      throw new EngineError(
        "Could not acquire 2D context from canvas",
        ErrorCode.ENGINE_CANVAS_CONTEXT_LOST,
        {
          severity: "FATAL",
          details: {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            isHardwareAccelerated: this.isHardwareAccelerated,
          },
        }
      );
    }
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;

    this.parallaxRenderer =
      deps.parallaxRenderer ||
      new ParallaxRenderer({ multiLayerSystem: deps.multiLayerBackgroundSystem });
    this.levelEntityRenderer = deps.levelEntityRenderer || defaultLevelEntityRenderer;
    this.actorRenderer = deps.actorRenderer || defaultActorRenderer;
    this.fxRenderer = deps.fxRenderer || defaultFxRenderer;
    this.hitboxRenderer = deps.hitboxRenderer || defaultHitboxRenderer;
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

  public setAssetQuality(quality: AssetQuality) {
    this.assetQuality = quality;
    assetLoader.setQuality(quality);
  }

  /**
   * Dynamically resizes canvas buffer and sets up relative scaling based on container dimensions,
   * aspect ratio mode, and device pixel ratio.
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

    // Baseline reference: 1000 logical units wide for standard 16:10 view
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
    dtMultiplier: number = 1.0,
    fpsInfo?: { targetFps: number; measuredFps: number; showFps: boolean }
  ) {
    this.language = language;
    this.tickCount += dtMultiplier;
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

    // Scale from logical world coordinates to physical pixels
    this.ctx.scale(this.scaleFactor, this.scaleFactor);

    // Screen Shake offset
    if (camera.shakeOffsetX !== 0 || camera.shakeOffsetY !== 0) {
      this.ctx.translate(camera.shakeOffsetX, camera.shakeOffsetY);
    }

    // 1. BACKDROP & DYNAMIC PARALLAX (Screen-space projection utilizing oversized background box)
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
      this.drawSkyBackground(this.viewportWidth, this.viewportHeight);
      this.drawParallaxCastles();
    }
    this.ctx.restore();

    // Camera translation for all world entities, enemies, players, projectiles
    this.ctx.translate(-camera.x, -camera.y);

    // 2. AMBIENT PARTICLES (SRP via FxRenderer)
    this.fxRenderer.renderParticles(this.ctx, particles, "dust");
    this.fxRenderer.renderParticles(this.ctx, particles, "leaf");

    // 3. SCENERY DECORATIONS (Fallback if location has no dynamic parallax scenery)
    if (!location?.parallaxBackground) {
      this.drawSceneryDecorations();
    }

    // 4. LEVEL ENTITIES (Platforms, Hazards, Levers, Portals - SRP via LevelEntityRenderer)
    this.levelEntityRenderer.render(this.ctx, entities, this.language, this.tickCount);

    // 5. ENEMIES & TARGET DUMMIES (SRP via ActorRenderer)
    this.actorRenderer.renderEnemies(this.ctx, enemies, this.tickCount);

    // 6. MAGIC PROJECTILES (SRP via FxRenderer)
    this.fxRenderer.renderProjectiles(this.ctx, projectiles);

    // 7. PLAYERS (With Crouch, Slide, Shield & Slash - SRP via ActorRenderer)
    this.actorRenderer.renderPlayers(this.ctx, players, this.assetQuality, this.tickCount);

    // 8. COMBAT SPARKS (SRP via FxRenderer)
    this.fxRenderer.renderParticles(this.ctx, particles, "spark");

    // 9. DEBUG HITBOX OVERLAY
    if (debugManager.state.showHitboxes) {
      this.hitboxRenderer.renderHitboxes(this.ctx, players, enemies, entities, projectiles);
    }

    this.ctx.restore();

    // 10. ON-SCREEN FPS COUNTER OVERLAY (when enabled)
    if (fpsInfo?.showFps && !debugManager.state.showProfiler) {
      this.drawFpsOverlay(fpsInfo.targetFps, fpsInfo.measuredFps);
    }

    // 11. DEBUG PROFILER OVERLAY
    if (debugManager.state.showProfiler) {
      this.hitboxRenderer.renderProfiler(
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

  private drawFpsOverlay(targetFps: number, measuredFps: number) {
    this.ctx.save();
    const pad = 12;
    const badgeW = this.isHardwareAccelerated ? 138 : 100;
    const badgeH = 24;
    const x = this.canvas.width - badgeW - pad;
    const y = pad;

    this.ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    this.ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, badgeW, badgeH, 6);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    this.ctx.fillStyle = "#fbbf24";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    const gpuTag = this.isHardwareAccelerated ? " • GPU" : "";
    this.ctx.fillText(`${measuredFps} / ${targetFps} FPS${gpuTag}`, x + badgeW / 2, y + badgeH / 2);
    this.ctx.restore();
  }

  private drawSkyBackground(width: number, height: number) {
    if (this.isHardwareAccelerated) {
      this.backdropCache.renderSky(this.ctx, width, height, this.cameraX);
      return;
    }

    const grad = this.ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#fef3c7");
    grad.addColorStop(0.5, "#fde68a");
    grad.addColorStop(1, "#f59e0b");
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, width, height);

    // Sun with slow parallax scroll
    const sunX = 800 - this.cameraX * 0.05;
    this.ctx.fillStyle = "rgba(251, 191, 36, 0.25)";
    this.ctx.beginPath();
    this.ctx.arc(sunX, 150, 160, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "rgba(251, 191, 36, 0.4)";
    this.ctx.beginPath();
    this.ctx.arc(sunX, 150, 100, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawParallaxCastles() {
    if (this.isHardwareAccelerated) {
      this.backdropCache.renderCastles(this.ctx, this.viewportWidth, this.cameraX);
      return;
    }

    this.ctx.fillStyle = "rgba(180, 83, 9, 0.12)";
    const p1 = -(this.cameraX * 0.15) % 700;
    for (let offset = -700; offset < this.viewportWidth + 700; offset += 700) {
      this.drawCastleProfile(p1 + offset, 200, 100, 320);
      this.drawCastleProfile(p1 + offset + 350, 140, 110, 380);
    }

    this.ctx.fillStyle = "rgba(180, 83, 9, 0.22)";
    const p2 = -(this.cameraX * 0.28) % 600;
    for (let offset = -600; offset < this.viewportWidth + 600; offset += 600) {
      this.drawCastleProfile(p2 + offset + 150, 260, 140, 270);
      this.drawCastleProfile(p2 + offset + 420, 220, 130, 310);
    }
  }

  private drawCastleProfile(x: number, y: number, w: number, h: number) {
    this.ctx.fillRect(x, y, w, h);
    const spikeW = w / 5;
    for (let i = 0; i < 5; i += 2) {
      this.ctx.fillRect(x + i * spikeW, y - 15, spikeW, 15);
    }
    this.ctx.beginPath();
    this.ctx.moveTo(x + w / 2, y - 50);
    this.ctx.lineTo(x, y - 15);
    this.ctx.lineTo(x + w, y - 15);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawSceneryDecorations() {
    if (this.isHardwareAccelerated) {
      for (let i = 0; i < SCENERY_TREE_OFFSETS.length; i++) {
        this.backdropCache.renderTree(this.ctx, SCENERY_TREE_OFFSETS[i], 260);
      }
      return;
    }

    this.ctx.fillStyle = "#8d4325";
    for (let i = 0; i < SCENERY_TREE_OFFSETS.length; i++) {
      this.drawPixelTree(SCENERY_TREE_OFFSETS[i], 260);
    }
  }

  private drawPixelTree(x: number, y: number) {
    this.ctx.fillStyle = "#5c2512";
    this.ctx.fillRect(x - 6, y, 12, 240);

    for (let idx = 0; idx < LEAF_COLORS.length; idx++) {
      this.ctx.fillStyle = LEAF_COLORS[idx];
      this.ctx.beginPath();
      this.ctx.arc(x, y - idx * 12, 35 - idx * 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

export default GameRenderer;
