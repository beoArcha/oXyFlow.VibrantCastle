import { LocationDefinition } from "../locations/types";
import {
  ParallaxBackgroundSchema,
  ParallaxLayerSchema,
  ParallaxElementSchema,
} from "../locations/schema/locationSchema";
import {
  IMultiLayerBackgroundSystem,
  defaultMultiLayerBackgroundSystem,
} from "./multiLayerBackgroundSystem";

/**
 * High-performance Parallax Background Renderer for Castlevania-style platformer.
 *
 * Utilizes the oversized background bounding box defined in location JSON blueprints
 * (e.g. boxWidth: 3800-5000, boxHeight: 950-1400) to project smooth, deep, multi-layered
 * parallax scrolling across the viewport.
 *
 * Supports:
 * - Deterministic celestial bodies (Suns, Moons, Eclipses) with radiant atmospheric halos
 * - Depth-tiered Castlevania silhouettes (distant needle spires, mid-ground ramparts with flickering windows)
 * - Procedural mountain & chasm gorge ridges with rim-lit crags
 * - Thematic scenery (ancient cypress trees, withered brambles, clockwork shafts, celestial aqueducts)
 * - Undulating multi-wave atmospheric mist/fog with continuous autoDrift
 * - View-frustum culling for consistent 60fps rendering
 */
export class ParallaxRenderer {
  // Deterministic star field cache for dusk/space sky gradients
  private cachedStars: Array<{ xRatio: number; yRatio: number; size: number; phase: number; brightness: number }> = [];
  private imageCache: Map<string, HTMLImageElement> = new Map(); 1
  private readonly multiLayerSystem: IMultiLayerBackgroundSystem;

  constructor(deps: { multiLayerSystem?: IMultiLayerBackgroundSystem } = {}) {
    this.multiLayerSystem = deps.multiLayerSystem || defaultMultiLayerBackgroundSystem;
    this.initStarField();
  }

  private initStarField() {
    // 70 deterministic twinkling background stars
    let seed = 42;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < 70; i++) {
      this.cachedStars.push({
        xRatio: random(),
        yRatio: random() * 0.65, // upper 65% of the sky
        size: random() > 0.85 ? 2 : 1,
        phase: random() * Math.PI * 2,
        brightness: 0.3 + random() * 0.7,
      });
    }
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
  ) {
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

    // Sort layers by depth (shallowest 0.02 first, deepest 0.9 last)
    const sortedLayers = [...pb.layers].sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));

    for (const layer of sortedLayers) {
      ctx.save();

      const layerOpacity = layer.opacity !== undefined ? layer.opacity : 1.0;
      ctx.globalAlpha = layerOpacity;

      // Auto-drifting continuous offset (e.g. moving clouds, fog ribbons)
      const driftX = layer.autoDriftX ? (tickCount * layer.autoDriftX) : 0;
      const driftY = layer.autoDriftY ? (tickCount * layer.autoDriftY) : 0;

      // Parallax scroll factor through the extra background box space
      const scrollX = progressX * extraWidth * layer.scrollSpeedX;
      const scrollY = progressY * extraHeight * layer.scrollSpeedY;

      switch (layer.type) {
        case "image":
          this.renderImageLayer(
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
            viewportHeight
          );
          break;

        case "sky_gradient":
          this.renderSkyGradient(
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
          this.renderCelestial(
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
          this.renderCastleSilhouettes(
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
          this.renderMountainRidges(
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
          this.renderScenery(
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
          this.renderFogOverlay(
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
          this.renderCustomShapes(
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

  /**
   * 1. Sky Gradient & Atmospheric Horizon
   */
  private renderSkyGradient(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    layer: ParallaxLayerSchema,
    viewportWidth: number,
    viewportHeight: number,
    progressY: number,
    tickCount: number
  ) {
    // Subtle vertical shift with camera perspective
    const yShift = (progressY - 0.5) * 60;
    const grad = ctx.createLinearGradient(0, -yShift, 0, viewportHeight + 40 - yShift);

    const topColor = location.theme.bgGradientTop || "#2d140a";
    const bottomColor = location.theme.bgGradientBottom || "#120602";

    grad.addColorStop(0, topColor);
    grad.addColorStop(0.65, bottomColor);
    grad.addColorStop(1, location.theme.fogColor || "rgba(20, 6, 2, 0.8)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // If sky is dark or twilight (e.g. Aether Sanctuary, Clocktower, Thorn Chasm), render subtle twinkling stars
    const isNightOrAether =
      location.id === "aether_sanctuary" ||
      location.id === "clocktower" ||
      location.id === "thorn_chasm" ||
      layer.depth < 0.05;

    if (isNightOrAether) {
      ctx.save();
      const starTint = location.id === "aether_sanctuary" ? "#38bdf8" : "#fef08a";
      for (const star of this.cachedStars) {
        const starX = star.xRatio * viewportWidth;
        const starY = star.yRatio * viewportHeight - yShift * 0.3;
        const twinkle = Math.sin(tickCount * 0.04 + star.phase);
        const alpha = Math.max(0.1, star.brightness + twinkle * 0.35);

        ctx.globalAlpha = alpha * 0.75;
        ctx.fillStyle = starTint;
        ctx.fillRect(starX, starY, star.size, star.size);
      }
      ctx.restore();
    }

    // Atmospheric horizon haze band
    const hazeGrad = ctx.createLinearGradient(0, viewportHeight * 0.45, 0, viewportHeight);
    hazeGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    hazeGrad.addColorStop(0.7, layer.color || location.theme.fogColor || "rgba(245, 158, 11, 0.06)");
    hazeGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, viewportHeight * 0.45, viewportWidth, viewportHeight * 0.55);
  }

  /**
   * 2. Celestial Bodies (Suns, Moons, Eclipses)
   */
  private renderCelestial(
    ctx: CanvasRenderingContext2D,
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
  ) {
    if (!layer.elements || layer.elements.length === 0) return;

    for (const el of layer.elements) {
      if (el.type !== "circle" || !el.radius) continue;

      // Project celestial object from background box space into viewport
      // Using normalized ratio anchor + parallax offset through oversized background box
      const baseRatioX = el.x / boxWidth;
      const baseScreenX = el.x - baseRatioX * extraWidth;
      const parallaxShiftX = (progressX - baseRatioX) * extraWidth * layer.scrollSpeedX;
      const screenX = baseScreenX - parallaxShiftX - (driftX % viewportWidth);

      const baseRatioY = el.y / boxHeight;
      const baseScreenY = el.y - baseRatioY * extraHeight;
      const parallaxShiftY = (progressY - baseRatioY) * extraHeight * layer.scrollSpeedY;
      const screenY = baseScreenY - parallaxShiftY - driftY;

      // View-frustum culling
      const maxR = el.radius * 2.2;
      if (
        screenX + maxR < -50 ||
        screenX - maxR > viewportWidth + 50 ||
        screenY + maxR < -50 ||
        screenY - maxR > viewportHeight + 50
      ) {
        continue;
      }

      // Outer ethereal corona / halo (atmospheric scattering)
      const glowGrad = ctx.createRadialGradient(
        screenX,
        screenY,
        el.radius * 0.2,
        screenX,
        screenY,
        el.radius * 1.8
      );
      glowGrad.addColorStop(0, el.color);
      glowGrad.addColorStop(0.45, el.color);
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.save();
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(screenX, screenY, el.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Inner solid celestial disk
      ctx.fillStyle = el.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, el.radius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle radiant corona pulse
      const pulse = Math.sin(tickCount * 0.03 + el.x) * 3;
      ctx.strokeStyle = el.color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(screenX, screenY, el.radius + 6 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  /**
   * 3. Castlevania Castle Silhouettes (Distant Spires & Mid-ground Fortress Ramparts)
   */
  private renderCastleSilhouettes(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    layer: ParallaxLayerSchema,
    boxWidth: number,
    boxHeight: number,
    extraWidth: number,
    extraHeight: number,
    progressX: number,
    progressY: number,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ) {
    const isDistant = layer.depth < 0.2;
    const baseColor = layer.color || (isDistant ? "rgba(180, 83, 9, 0.16)" : "rgba(180, 83, 9, 0.26)");
    ctx.fillStyle = baseColor;

    // Repeating architecture intervals across the oversized background box
    const step = isDistant ? 560 : 440;
    const structureWidth = isDistant ? 120 : 160;
    const baseHeight = isDistant ? 340 : 280;

    // Baseline positioning: deeper layers sit slightly higher, foreground layers sit lower
    const horizonY = isDistant ? viewportHeight * 0.38 : viewportHeight * 0.46;
    const verticalShift = (progressY - 0.5) * extraHeight * layer.scrollSpeedY;

    // Window light color: amber warm candle glow or aether blue glow
    const windowColor = location.id === "aether_sanctuary" ? "rgba(56, 189, 248, 0.45)" : "rgba(251, 191, 36, 0.45)";

    for (let boxX = 0; boxX < boxWidth + step; boxX += step) {
      const baseRatioX = boxX / boxWidth;
      const baseScreenX = boxX - baseRatioX * extraWidth;
      const parallaxShiftX = (progressX - baseRatioX) * extraWidth * layer.scrollSpeedX;
      const screenX = baseScreenX - parallaxShiftX;

      // Culling
      if (screenX + structureWidth + 100 < 0 || screenX > viewportWidth + 100) {
        continue;
      }

      const drawY = horizonY - verticalShift;

      if (isDistant) {
        // Distant slender needle spires and gothic cathedral silhouettes
        this.drawNeedleSpire(ctx, screenX, drawY, 80, baseHeight);
        this.drawNeedleSpire(ctx, screenX + 160, drawY - 30, 95, baseHeight + 30);
        this.drawNeedleSpire(ctx, screenX + 310, drawY + 20, 70, baseHeight - 20);

        // High arched connecting rampart bridges
        ctx.fillRect(screenX + 60, drawY + 80, 120, 14);
        ctx.fillRect(screenX + 230, drawY + 95, 100, 12);
      } else {
        // Midground fortified ramparts, machicolated towers, battlements
        this.drawFortressBastion(
          ctx,
          screenX,
          drawY,
          structureWidth,
          baseHeight,
          windowColor,
          tickCount,
          boxX
        );
        this.drawFortressBastion(
          ctx,
          screenX + 220,
          drawY - 25,
          structureWidth - 20,
          baseHeight + 25,
          windowColor,
          tickCount,
          boxX + 220
        );

        // Heavy connecting battlement wall
        ctx.fillStyle = baseColor;
        ctx.fillRect(screenX + structureWidth - 10, drawY + 70, 90, baseHeight - 70);
        // Wall crenellations
        for (let c = 0; c < 90; c += 18) {
          ctx.fillRect(screenX + structureWidth - 10 + c, drawY + 58, 10, 12);
        }
      }
    }
  }

  /**
   * Helper: Distant needle-sharp spire
   */
  private drawNeedleSpire(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    // Spire tower body
    ctx.fillRect(x, y, w, h + 300);

    // Decorative corbels / overhang
    ctx.fillRect(x - 6, y - 6, w + 12, 10);

    // Needle pinnacle roof
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 65);
    ctx.lineTo(x - 4, y - 6);
    ctx.lineTo(x + w + 4, y - 6);
    ctx.closePath();
    ctx.fill();

    // Spire apex needle
    ctx.fillRect(x + w / 2 - 1.5, y - 85, 3, 22);
  }

  /**
   * Helper: Mid-ground Fortress Bastion with crenellations and candlelit windows
   */
  private drawFortressBastion(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    windowColor: string,
    tickCount: number,
    seed: number
  ) {
    // Tower body
    ctx.fillRect(x, y, w, h + 300);

    // Cornice overhang
    ctx.fillRect(x - 8, y - 10, w + 16, 14);

    // Battlements / Crenels
    const toothW = Math.max(12, Math.floor(w / 6));
    for (let pos = x - 8; pos < x + w + 8; pos += toothW * 2) {
      ctx.fillRect(pos, y - 24, toothW, 14);
    }

    // High pointed roof on central turret
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 55);
    ctx.lineTo(x + 10, y - 10);
    ctx.lineTo(x + w - 10, y - 10);
    ctx.closePath();
    ctx.fill();

    // Animated waving banner / pennant atop tower
    const flagWave = Math.sin(tickCount * 0.08 + seed) * 4;
    ctx.fillRect(x + w / 2 - 1.5, y - 80, 3, 25);
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 80);
    ctx.lineTo(x + w / 2 + 18, y - 74 + flagWave);
    ctx.lineTo(x + w / 2, y - 68);
    ctx.closePath();
    ctx.fill();

    // Arched arrow slits with flickering warm candlelight
    const flicker = Math.sin(tickCount * 0.05 + seed) * 0.15;
    ctx.save();
    ctx.fillStyle = windowColor;
    ctx.globalAlpha = Math.max(0.2, 0.4 + flicker);

    const winX1 = x + w * 0.3 - 4;
    const winX2 = x + w * 0.7 - 4;
    const winY = y + 45;

    // Two arched window slots
    ctx.fillRect(winX1, winY, 8, 16);
    ctx.beginPath();
    ctx.arc(winX1 + 4, winY, 4, Math.PI, 0);
    ctx.fill();

    ctx.fillRect(winX2, winY, 8, 16);
    ctx.beginPath();
    ctx.arc(winX2 + 4, winY, 4, Math.PI, 0);
    ctx.fill();

    ctx.restore();
  }

  /**
   * 4. Mountain Ridges & Chasm Gorge Cliffs
   */
  private renderMountainRidges(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    layer: ParallaxLayerSchema,
    boxWidth: number,
    boxHeight: number,
    extraWidth: number,
    extraHeight: number,
    progressX: number,
    progressY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    const ridgeColor = layer.color || "rgba(100, 35, 15, 0.22)";
    ctx.fillStyle = ridgeColor;

    const baseHorizonY = viewportHeight * 0.52;
    const verticalShift = (progressY - 0.5) * extraHeight * layer.scrollSpeedY;
    const step = 380;

    for (let boxX = -step; boxX < boxWidth + step * 2; boxX += step) {
      const baseRatioX = boxX / boxWidth;
      const baseScreenX = boxX - baseRatioX * extraWidth;
      const parallaxShiftX = (progressX - baseRatioX) * extraWidth * layer.scrollSpeedX;
      const screenX = baseScreenX - parallaxShiftX;

      if (screenX + step * 2 < -50 || screenX > viewportWidth + 50) continue;

      const peakY = baseHorizonY - 140 - verticalShift;
      const baseY = viewportHeight + 100;

      // Jagged mountain polygon
      ctx.beginPath();
      ctx.moveTo(screenX - 80, baseY);
      ctx.lineTo(screenX + 60, peakY + 40);
      ctx.lineTo(screenX + step * 0.45, peakY);
      ctx.lineTo(screenX + step * 0.75, peakY + 55);
      ctx.lineTo(screenX + step + 60, baseY);
      ctx.closePath();
      ctx.fill();

      // Rim lighting highlight on crest edge
      ctx.save();
      ctx.strokeStyle = location.theme.fogColor || "rgba(251, 191, 36, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(screenX - 40, baseY - 60);
      ctx.lineTo(screenX + 60, peakY + 40);
      ctx.lineTo(screenX + step * 0.45, peakY);
      ctx.lineTo(screenX + step * 0.75, peakY + 55);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * 5. Thematic Scenery (Ancient Trees, Clockwork Shafts, Celestial Aqueducts, Withered Brambles)
   */
  private renderScenery(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    layer: ParallaxLayerSchema,
    boxWidth: number,
    boxHeight: number,
    extraWidth: number,
    extraHeight: number,
    progressX: number,
    progressY: number,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ) {
    const sceneryColor = layer.color || "#8d4325";
    ctx.fillStyle = sceneryColor;

    const baseHorizonY = viewportHeight * 0.54;
    const verticalShift = (progressY - 0.5) * extraHeight * layer.scrollSpeedY;
    const step = 420;

    for (let boxX = 0; boxX < boxWidth + step; boxX += step) {
      const baseRatioX = boxX / boxWidth;
      const baseScreenX = boxX - baseRatioX * extraWidth;
      const parallaxShiftX = (progressX - baseRatioX) * extraWidth * layer.scrollSpeedX;
      const screenX = baseScreenX - parallaxShiftX;

      if (screenX + 200 < 0 || screenX > viewportWidth + 100) continue;

      const drawY = baseHorizonY - verticalShift;

      if (location.id === "clocktower") {
        // Clocktower: Vertical mechanical iron shafts, riveted beams, rotating brass gear silhouettes
        this.drawClockworkShaft(ctx, screenX, drawY - 60, sceneryColor, tickCount, boxX);
      } else if (location.id === "aether_sanctuary") {
        // Aether Sanctuary: Floating aqueduct masonry, fluted marble pillars, crystalline arches
        this.drawAetherAqueduct(ctx, screenX, drawY - 40, sceneryColor);
      } else if (location.id === "thorn_chasm") {
        // Thorn Chasm: Gnarled thorny bramble ridges & skeletal twisted branches
        this.drawThornBramble(ctx, screenX, drawY + 10, sceneryColor, boxX);
      } else {
        // Courtyard & Grand Bastion: Ancient majestic Cypress and Pine trees
        this.drawParallaxTree(ctx, screenX, drawY, sceneryColor, boxX);
      }
    }
  }

  /**
   * Helper: Clockwork mechanical shaft with rotating gear silhouette
   */
  private drawClockworkShaft(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    tickCount: number,
    seed: number
  ) {
    ctx.fillStyle = color;
    // Vertical structural beam
    ctx.fillRect(x, y - 120, 24, 450);
    // Diagonal cross-brace
    ctx.fillRect(x - 40, y + 40, 100, 10);

    // Rotating gear silhouette
    const gearX = x + 12;
    const gearY = y - 30;
    const gearR = 48;
    const rotation = tickCount * 0.006 * (seed % 2 === 0 ? 1 : -1);

    ctx.save();
    ctx.translate(gearX, gearY);
    ctx.rotate(rotation);

    // Gear hub
    ctx.beginPath();
    ctx.arc(0, 0, gearR, 0, Math.PI * 2);
    ctx.fill();

    // Gear teeth
    const numTeeth = 8;
    for (let i = 0; i < numTeeth; i++) {
      ctx.rotate((Math.PI * 2) / numTeeth);
      ctx.fillRect(-6, -gearR - 8, 12, 10);
    }

    // Inner axle cutout
    ctx.fillStyle = "#0b0402";
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Helper: Aether Sanctuary floating aqueduct arches
   */
  private drawAetherAqueduct(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ) {
    ctx.fillStyle = color;
    // Aqueduct pillars
    ctx.fillRect(x, y, 22, 350);
    ctx.fillRect(x + 140, y, 22, 350);
    // Horizontal lintel beam
    ctx.fillRect(x - 20, y - 20, 200, 24);

    // Archway
    ctx.beginPath();
    ctx.arc(x + 81, y + 25, 45, Math.PI, 0);
    ctx.lineWidth = 14;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  /**
   * Helper: Thorn Chasm gnarled brambles
   */
  private drawThornBramble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    seed: number
  ) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;

    // Twisted main stalk
    ctx.beginPath();
    ctx.moveTo(x, y + 250);
    ctx.quadraticCurveTo(x + 20, y + 100, x - 15, y);
    ctx.quadraticCurveTo(x - 30, y - 40, x + 10, y - 90);
    ctx.stroke();

    // Sharp thorn spikes
    const spikeCoords = [
      { sx: x + 10, sy: y + 80, dx: 22, dy: -12 },
      { sx: x - 5, sy: y + 20, dx: -24, dy: -10 },
      { sx: x - 18, sy: y - 30, dx: -20, dy: 14 },
      { sx: x + 2, sy: y - 70, dx: 18, dy: -15 },
    ];

    for (const s of spikeCoords) {
      ctx.beginPath();
      ctx.moveTo(s.sx, s.sy);
      ctx.lineTo(s.sx + s.dx, s.sy + s.dy);
      ctx.lineTo(s.sx + s.dx * 0.2, s.sy + s.dy + 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * Helper: Ancient Cypress & Pine Trees
   */
  private drawParallaxTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    seed: number
  ) {
    // Tree trunk
    ctx.fillStyle = color;
    ctx.fillRect(x - 7, y - 20, 14, 300);

    // Tiered leaf clusters (Castlevania/Owlboy autumnal pixel aesthetic)
    const tiers = [
      { r: 42, offsetY: 30 },
      { r: 36, offsetY: 0 },
      { r: 30, offsetY: -30 },
      { r: 22, offsetY: -58 },
      { r: 14, offsetY: -82 },
    ];

    for (const tier of tiers) {
      ctx.beginPath();
      ctx.arc(x, y - tier.offsetY, tier.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 6. Atmospheric Fog & Mist Overlay
   */
  private renderFogOverlay(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    viewportWidth: number,
    viewportHeight: number,
    progressY: number,
    driftX: number,
    tickCount: number
  ) {
    const fogColor = layer.color || "rgba(245, 158, 11, 0.08)";
    const fogHeight = viewportHeight * 0.65;
    const fogTop = viewportHeight * 0.42 - progressY * 40;

    // Multi-frequency sinusoidal undulating mist bands
    ctx.save();
    ctx.fillStyle = fogColor;

    // Main smooth vertical fog gradient
    const grad = ctx.createLinearGradient(0, fogTop, 0, viewportHeight);
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(0.35, fogColor);
    grad.addColorStop(0.75, fogColor);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;

    // Undulating upper edge
    ctx.beginPath();
    ctx.moveTo(0, viewportHeight);
    ctx.lineTo(0, fogTop);

    const step = 40;
    for (let x = 0; x <= viewportWidth + step; x += step) {
      const wave1 = Math.sin((x + driftX * 0.8) * 0.008) * 22;
      const wave2 = Math.cos((x + tickCount * 1.2) * 0.015) * 12;
      ctx.lineTo(x, fogTop + wave1 + wave2);
    }

    ctx.lineTo(viewportWidth, viewportHeight);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * 7. Custom Shapes (Rect, Circle, Castle Tower, Pillar, Tree)
   */
  private renderCustomShapes(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    boxWidth: number,
    boxHeight: number,
    extraWidth: number,
    extraHeight: number,
    progressX: number,
    progressY: number,
    driftX: number,
    driftY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    if (!layer.elements) return;

    for (const el of layer.elements) {
      ctx.fillStyle = el.color;

      const baseRatioX = el.x / boxWidth;
      const baseScreenX = el.x - baseRatioX * extraWidth;
      const parallaxShiftX = (progressX - baseRatioX) * extraWidth * layer.scrollSpeedX;
      const screenX = baseScreenX - parallaxShiftX - driftX;

      const baseRatioY = el.y / boxHeight;
      const baseScreenY = el.y - baseRatioY * extraHeight;
      const parallaxShiftY = (progressY - baseRatioY) * extraHeight * layer.scrollSpeedY;
      const screenY = baseScreenY - parallaxShiftY - driftY;

      if (el.type === "rect" && el.width && el.height) {
        if (screenX + el.width < 0 || screenX > viewportWidth) continue;
        ctx.fillRect(screenX, screenY, el.width, el.height);
      } else if (el.type === "circle" && el.radius) {
        if (screenX + el.radius < 0 || screenX - el.radius > viewportWidth) continue;
        ctx.beginPath();
        ctx.arc(screenX, screenY, el.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.type === "castle_tower") {
        const tw = el.width || 80;
        const th = el.height || 260;
        if (screenX + tw < 0 || screenX > viewportWidth) continue;
        this.drawNeedleSpire(ctx, screenX, screenY, tw, th);
      } else if (el.type === "pillar") {
        const pw = el.width || 24;
        const ph = el.height || 200;
        if (screenX + pw < 0 || screenX > viewportWidth) continue;
        ctx.fillRect(screenX, screenY, pw, ph);
        ctx.fillRect(screenX - 6, screenY - 6, pw + 12, 8);
        ctx.fillRect(screenX - 6, screenY + ph - 2, pw + 12, 8);
      } else if (el.type === "tree") {
        this.drawParallaxTree(ctx, screenX, screenY, el.color, el.x);
      }
    }
  }

  /**
   * High-performance image layer rendering with automatic caching, vertical fitting,
   * horizontal seamless repeating, and sub-pixel parallax scrolling.
   */
  private renderImageLayer(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayerSchema,
    _boxWidth: number,
    boxHeight: number,
    _extraWidth: number,
    extraHeight: number,
    _progressX: number,
    progressY: number,
    scrollX: number,
    _scrollY: number,
    driftX: number,
    driftY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    if (!layer.imageUrl) return;

    let img = layer.imageElement || this.imageCache.get(layer.imageUrl);
    if (!img) {
      img = new Image();
      img.src = layer.imageUrl;
      this.imageCache.set(layer.imageUrl, img);
      layer.imageElement = img;
    }

    if (!img.complete || img.naturalWidth === 0) return;

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    const isFarStatic = layer.tier === "far" || (layer.id.includes("_far") && !layer.id.includes("mid"));

    if (isFarStatic) {
      // Far static backdrop: cleanly scales and stays fixed to the viewport
      const scale = Math.max(viewportWidth / imgW, viewportHeight / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = (viewportWidth - drawW) / 2;
      ctx.save();
      if (layer.opacity !== undefined && layer.opacity < 1) {
        ctx.globalAlpha = layer.opacity;
      }
      ctx.drawImage(img, Math.round(drawX), 0, Math.round(drawW), Math.round(drawH));
      ctx.restore();
      return;
    }

    // Scale to fill the vertical field of the viewport + extra parallax allowance
    const effectiveHeight = Math.max(viewportHeight, boxHeight * 0.85);
    const scale = effectiveHeight / imgH;
    const drawW = imgW * scale;
    const drawH = effectiveHeight;

    const screenX = -scrollX - driftX;
    // Calculate Y offset so the layer tracks camera Y smoothly
    const maxShiftY = Math.max(0, drawH - viewportHeight);
    const screenY = -progressY * maxShiftY * layer.scrollSpeedY - driftY;

    ctx.save();
    if (layer.opacity !== undefined && layer.opacity < 1) {
      ctx.globalAlpha = layer.opacity;
    }

    // Seamless horizontal repeating across viewport
    let startX = screenX % drawW;
    if (startX > 0) startX -= drawW;

    for (let x = startX; x < viewportWidth + drawW; x += drawW) {
      ctx.drawImage(img, Math.round(x), Math.round(screenY), Math.round(drawW), Math.round(drawH));
    }
    ctx.restore();
  }
}
