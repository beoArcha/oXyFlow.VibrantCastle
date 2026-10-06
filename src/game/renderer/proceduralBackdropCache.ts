/**
 * GPU Texture Caching for Procedural Backdrops & Silhouette Geometry.
 * Pre-renders procedural skies, solar auras, castle profiles, and scenery trees
 * onto offscreen GPU canvas textures, replacing per-frame path rasterization
 * with blazing-fast hardware-accelerated drawImage (quad) blits.
 */

export class ProceduralBackdropCache {
  // Texture buffers (GPU surfaces)
  private skyCanvas: HTMLCanvasElement | null = null;
  private skyCtx: CanvasRenderingContext2D | null = null;

  private sunCanvas: HTMLCanvasElement | null = null;
  private sunCtx: CanvasRenderingContext2D | null = null;

  private castle1Canvas: HTMLCanvasElement | null = null;
  private castle1Ctx: CanvasRenderingContext2D | null = null;

  private castle2Canvas: HTMLCanvasElement | null = null;
  private castle2Ctx: CanvasRenderingContext2D | null = null;

  private treeCanvas: HTMLCanvasElement | null = null;
  private treeCtx: CanvasRenderingContext2D | null = null;

  private currentWidth: number = 0;
  private currentHeight: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.initStaticBuffers();
  }

  /**
   * Initializes static buffers that have fixed dimensions independent of viewport size.
   */
  private initStaticBuffers(): void {
    if (typeof document === "undefined" || this.isInitialized) return;
    this.isInitialized = true;

    // 1. Solar aura texture (360x360 fixed offscreen buffer)
    this.sunCanvas = document.createElement("canvas");
    this.sunCanvas.width = 360;
    this.sunCanvas.height = 360;
    this.sunCtx = this.sunCanvas.getContext("2d", { willReadFrequently: false });
    this.bakeSunTexture();

    // 2. Castle Strip 1 (700x500 fixed repeating slice)
    this.castle1Canvas = document.createElement("canvas");
    this.castle1Canvas.width = 700;
    this.castle1Canvas.height = 500;
    this.castle1Ctx = this.castle1Canvas.getContext("2d", { willReadFrequently: false });
    this.bakeCastleStrip1();

    // 3. Castle Strip 2 (600x500 fixed repeating slice)
    this.castle2Canvas = document.createElement("canvas");
    this.castle2Canvas.width = 600;
    this.castle2Canvas.height = 500;
    this.castle2Ctx = this.castle2Canvas.getContext("2d", { willReadFrequently: false });
    this.bakeCastleStrip2();

    // 4. Scenery Tree Texture (100x260 fixed sprite)
    this.treeCanvas = document.createElement("canvas");
    this.treeCanvas.width = 100;
    this.treeCanvas.height = 260;
    this.treeCtx = this.treeCanvas.getContext("2d", { willReadFrequently: false });
    this.bakeTreeTexture();
  }

  /**
   * Bakes the sun glow and aura into its dedicated GPU texture buffer.
   */
  private bakeSunTexture(): void {
    if (!this.sunCtx) return;
    const ctx = this.sunCtx;
    ctx.clearRect(0, 0, 360, 360);

    // Outer glow
    ctx.fillStyle = "rgba(251, 191, 36, 0.25)";
    ctx.beginPath();
    ctx.arc(180, 180, 160, 0, Math.PI * 2);
    ctx.fill();

    // Inner core
    ctx.fillStyle = "rgba(251, 191, 36, 0.4)";
    ctx.beginPath();
    ctx.arc(180, 180, 100, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Bakes repeating Castle Profile 1 (700px span).
   */
  private bakeCastleStrip1(): void {
    if (!this.castle1Ctx) return;
    const ctx = this.castle1Ctx;
    ctx.clearRect(0, 0, 700, 500);
    ctx.fillStyle = "rgba(180, 83, 9, 0.12)";

    this.drawCastleProfileOnCtx(ctx, 0, 200, 100, 320);
    this.drawCastleProfileOnCtx(ctx, 350, 140, 110, 380);
  }

  /**
   * Bakes repeating Castle Profile 2 (600px span).
   */
  private bakeCastleStrip2(): void {
    if (!this.castle2Ctx) return;
    const ctx = this.castle2Ctx;
    ctx.clearRect(0, 0, 600, 500);
    ctx.fillStyle = "rgba(180, 83, 9, 0.22)";

    this.drawCastleProfileOnCtx(ctx, 150, 260, 140, 270);
    this.drawCastleProfileOnCtx(ctx, 420, 220, 130, 310);
  }

  private drawCastleProfileOnCtx(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    ctx.fillRect(x, y, w, h);
    const spikeW = w / 5;
    for (let i = 0; i < 5; i += 2) {
      ctx.fillRect(x + i * spikeW, y - 15, spikeW, 15);
    }
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 50);
    ctx.lineTo(x, y - 15);
    ctx.lineTo(x + w, y - 15);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Bakes a decorative pixel tree sprite into offscreen texture.
   */
  private bakeTreeTexture(): void {
    if (!this.treeCtx) return;
    const ctx = this.treeCtx;
    ctx.clearRect(0, 0, 100, 260);

    const trunkX = 50;

    // Trunk
    ctx.fillStyle = "#5c2512";
    ctx.fillRect(trunkX - 6, 20, 12, 240);

    // Leaves
    const leafColors = ["#b45309", "#d97706", "#f59e0b", "#fbbf24"];
    leafColors.forEach((color, idx) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(trunkX, 20 - idx * 12 + 10, 35 - idx * 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * Resizes viewport-dependent buffers only when dimensions actually change.
   */
  public resize(width: number, height: number): void {
    const targetW = Math.max(320, Math.round(width));
    const targetH = Math.max(200, Math.round(height));

    if (this.currentWidth === targetW && this.currentHeight === targetH && this.skyCanvas) {
      return;
    }

    this.currentWidth = targetW;
    this.currentHeight = targetH;

    if (!this.skyCanvas && typeof document !== "undefined") {
      this.skyCanvas = document.createElement("canvas");
      this.skyCtx = this.skyCanvas.getContext("2d", { willReadFrequently: false });
    }

    if (this.skyCanvas && this.skyCtx) {
      this.skyCanvas.width = targetW;
      this.skyCanvas.height = targetH;

      // Pre-bake the vertical linear gradient once
      const grad = this.skyCtx.createLinearGradient(0, 0, 0, targetH);
      grad.addColorStop(0, "#fef3c7");
      grad.addColorStop(0.5, "#fde68a");
      grad.addColorStop(1, "#f59e0b");
      this.skyCtx.fillStyle = grad;
      this.skyCtx.fillRect(0, 0, targetW, targetH);
    }
  }

  /**
   * Fast GPU blit of sky and sun aura.
   */
  public renderSky(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number
  ): void {
    if (!this.skyCanvas) {
      this.resize(width, height);
    }

    if (this.skyCanvas) {
      ctx.drawImage(this.skyCanvas, 0, 0, width, height);
    }

    if (this.sunCanvas) {
      const sunX = Math.round(800 - cameraX * 0.05);
      ctx.drawImage(this.sunCanvas, sunX - 180, 150 - 180);
    }
  }

  /**
   * Fast GPU blit of repeating castle silhouettes.
   */
  public renderCastles(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    cameraX: number
  ): void {
    // Castle Tier 1 (700px repeat)
    if (this.castle1Canvas) {
      const p1 = Math.round(-(cameraX * 0.15) % 700);
      for (let offset = -700; offset < viewportWidth + 700; offset += 700) {
        ctx.drawImage(this.castle1Canvas, p1 + offset, 0);
      }
    }

    // Castle Tier 2 (600px repeat)
    if (this.castle2Canvas) {
      const p2 = Math.round(-(cameraX * 0.28) % 600);
      for (let offset = -600; offset < viewportWidth + 600; offset += 600) {
        ctx.drawImage(this.castle2Canvas, p2 + offset, 0);
      }
    }
  }

  /**
   * Fast GPU blit of scenery pixel tree.
   */
  public renderTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (this.treeCanvas) {
      ctx.drawImage(this.treeCanvas, Math.round(x - 50), Math.round(y - 20));
    }
  }
}

export const defaultProceduralBackdropCache = new ProceduralBackdropCache();
