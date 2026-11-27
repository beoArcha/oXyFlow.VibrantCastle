import { LocationDefinition } from "@game/locations/types";

export interface ISectorAtmosphericRenderer {
  renderSectorAtmosphere(
    ctx: CanvasRenderingContext2D,
    worldId: string,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void;

  renderProceduralFarBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void;

  clearCaches(): void;
}

type GradientStop = readonly [number, string];
type GradientStops = readonly GradientStop[];

interface ProceduralFarTheme {
  readonly mountain: string;
  readonly stops: readonly [GradientStop, GradientStop];
}

interface SectorAtmosphereSpec {
  readonly keyPrefix: string;
  readonly kind: "linear" | "radial";
  readonly sizeDependsOnWidth: boolean;
  readonly baseAlpha: number;
  readonly alphaFreq: number;
  readonly alphaAmp: number;
  readonly waveFreq: number;
  readonly waveAmp: number;
  readonly gradY0Ratio: number;
  readonly gradY1Ratio: number;
  readonly gradX1FullWidth: boolean;
  readonly radialCenterXRatio: number;
  readonly radialCenterYRatio: number;
  readonly radialInnerRadius: number;
  readonly radialOuterRadiusRatio: number;
  readonly rectYRatio: number;
  readonly rectHRatio: number;
  readonly stops: GradientStops;
}

const MAX_GRADIENT_CACHE_SIZE = 32;

const DEFAULT_PROCEDURAL_FAR_THEME: ProceduralFarTheme = {
  mountain: "#2a150b",
  stops: [[0, "rgba(251, 191, 36, 0.22)"], [1, "rgba(0,0,0,0)"]],
};

const PROCEDURAL_FAR_THEMES: Readonly<Record<string, ProceduralFarTheme>> = {
  thorn_chasm: { mountain: "#15041c", stops: [[0, "rgba(147, 51, 234, 0.18)"], [1, "rgba(0,0,0,0)"]] },
  ashen_catacombs: { mountain: "#1a0c08", stops: [[0, "rgba(234, 88, 12, 0.22)"], [1, "rgba(0,0,0,0)"]] },
  aether_sanctuary: { mountain: "#0f172a", stops: [[0, "rgba(56, 189, 248, 0.20)"], [1, "rgba(0,0,0,0)"]] },
  alchemist_library: { mountain: "#071f1a", stops: [[0, "rgba(16, 185, 129, 0.20)"], [1, "rgba(0,0,0,0)"]] },
  clocktower: { mountain: "#1c0b05", stops: [[0, "rgba(245, 158, 11, 0.16)"], [1, "rgba(0,0,0,0)"]] },
  eclipse_crown: { mountain: "#160711", stops: [[0, "rgba(225, 29, 72, 0.24)"], [1, "rgba(0,0,0,0)"]] },
};

function makeLinearSpec(
  keyPrefix: string,
  baseAlpha: number,
  alphaFreq: number,
  alphaAmp: number,
  gradY0Ratio: number,
  stops: GradientStops,
  options: { waveFreq?: number; waveAmp?: number; fullWidth?: boolean } = {}
): SectorAtmosphereSpec {
  return {
    keyPrefix,
    kind: "linear",
    sizeDependsOnWidth: Boolean(options.fullWidth),
    baseAlpha,
    alphaFreq,
    alphaAmp,
    waveFreq: options.waveFreq ?? 0,
    waveAmp: options.waveAmp ?? 0,
    gradY0Ratio,
    gradY1Ratio: 1,
    gradX1FullWidth: Boolean(options.fullWidth),
    radialCenterXRatio: 0,
    radialCenterYRatio: 0,
    radialInnerRadius: 0,
    radialOuterRadiusRatio: 0,
    rectYRatio: gradY0Ratio,
    rectHRatio: 1 - gradY0Ratio,
    stops,
  };
}

function makeRadialSpec(
  keyPrefix: string,
  baseAlpha: number,
  alphaFreq: number,
  alphaAmp: number,
  centerYRatio: number,
  innerRadius: number,
  outerRadiusRatio: number,
  stops: GradientStops
): SectorAtmosphereSpec {
  return {
    keyPrefix,
    kind: "radial",
    sizeDependsOnWidth: true,
    baseAlpha,
    alphaFreq,
    alphaAmp,
    waveFreq: 0,
    waveAmp: 0,
    gradY0Ratio: 0,
    gradY1Ratio: 1,
    gradX1FullWidth: false,
    radialCenterXRatio: 0.5,
    radialCenterYRatio: centerYRatio,
    radialInnerRadius: innerRadius,
    radialOuterRadiusRatio: outerRadiusRatio,
    rectYRatio: 0,
    rectHRatio: 1,
    stops,
  };
}

const SECTOR_ATMOSPHERE_SPECS: Readonly<Record<string, SectorAtmosphereSpec>> = {
  thorn_chasm: makeLinearSpec(
    "chasm_mist_", 0.12, 0, 0, 0.6,
    [[0, "rgba(147, 51, 234, 0)"], [0.5, "rgba(147, 51, 234, 0.25)"], [1, "rgba(88, 28, 135, 0)"]],
    { waveFreq: 0.02, waveAmp: 15 }
  ),
  ashen_catacombs: makeLinearSpec(
    "catacombs_ember_", 0.12, 0.022, 0.03, 0.45,
    [[0, "rgba(234, 88, 12, 0)"], [0.65, "rgba(234, 88, 12, 0.22)"], [1, "rgba(124, 45, 18, 0.35)"]]
  ),
  grand_bastion: makeLinearSpec(
    "bastion_solar_", 0.08, 0.015, 0.02, 0,
    [[0, "rgba(251, 191, 36, 0.2)"], [0.5, "rgba(245, 158, 11, 0.05)"], [1, "rgba(180, 83, 9, 0)"]],
    { fullWidth: true }
  ),
  clocktower: makeLinearSpec(
    "clocktower_steam_", 0.09, 0.02, 0.02, 0.5,
    [[0, "rgba(217, 119, 6, 0)"], [0.5, "rgba(245, 158, 11, 0.16)"], [1, "rgba(180, 83, 9, 0.04)"]],
    { waveFreq: 0.018, waveAmp: 12 }
  ),
  alchemist_library: makeRadialSpec(
    "library_emerald_", 0.1, 0.018, 0.025, 0.2, 40, 0.65,
    [[0, "rgba(16, 185, 129, 0.22)"], [0.55, "rgba(20, 184, 166, 0.08)"], [1, "rgba(6, 78, 59, 0)"]]
  ),
  aether_sanctuary: makeRadialSpec(
    "aether_aura_", 0.1, 0.025, 0.03, 0.35, 60, 0.65,
    [[0, "rgba(56, 189, 248, 0.18)"], [0.5, "rgba(99, 102, 241, 0.08)"], [1, "rgba(15, 23, 42, 0)"]]
  ),
  eclipse_crown: makeRadialSpec(
    "eclipse_corona_", 0.14, 0.03, 0.035, 0.28, 30, 0.7,
    [[0, "rgba(225, 29, 72, 0.28)"], [0.45, "rgba(245, 158, 11, 0.12)"], [1, "rgba(15, 23, 42, 0)"]]
  ),
  courtyard: makeLinearSpec(
    "courtyard_haze_", 0.07, 0.012, 0.015, 0.55,
    [[0, "rgba(234, 88, 12, 0)"], [0.5, "rgba(224, 108, 53, 0.12)"], [1, "rgba(120, 53, 15, 0.03)"]]
  ),
};

/**
 * Dedicated renderer for sector-specific atmospheric blending phenomena
 * across all 8 castle worlds and procedural far backdrops with bounded gradient caching.
 */
export class AtmosphericSectorRenderer implements ISectorAtmosphericRenderer {
  private readonly gradientCache: Map<string, CanvasGradient> = new Map();

  private lastSectorWorldId = "";
  private lastSectorWidth = -1;
  private lastSectorHeight = -1;
  private lastSectorKey = "";
  private lastSectorSpec: SectorAtmosphereSpec | null = null;

  private lastProcWorldId = "";
  private lastProcWidth = -1;
  private lastProcHeight = -1;
  private lastProcKey = "";
  private lastProcTheme: ProceduralFarTheme = DEFAULT_PROCEDURAL_FAR_THEME;

  public clearCaches(): void {
    this.gradientCache.clear();
    this.lastSectorWorldId = "";
    this.lastSectorWidth = -1;
    this.lastSectorHeight = -1;
    this.lastSectorKey = "";
    this.lastSectorSpec = null;
    this.lastProcWorldId = "";
    this.lastProcWidth = -1;
    this.lastProcHeight = -1;
    this.lastProcKey = "";
    this.lastProcTheme = DEFAULT_PROCEDURAL_FAR_THEME;
  }

  public getOrCreateLinearGradient(
    ctx: CanvasRenderingContext2D,
    key: string,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: GradientStops
  ): CanvasGradient {
    let grad = this.gradientCache.get(key);
    if (!grad) {
      grad = ctx.createLinearGradient(x0, y0, x1, y1);
      for (let i = 0; i < stops.length; i++) {
        grad.addColorStop(stops[i][0], stops[i][1]);
      }
      this.storeGradient(key, grad);
    }
    return grad;
  }

  public getOrCreateRadialGradient(
    ctx: CanvasRenderingContext2D,
    key: string,
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number,
    stops: GradientStops
  ): CanvasGradient {
    let grad = this.gradientCache.get(key);
    if (!grad) {
      grad = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
      for (let i = 0; i < stops.length; i++) {
        grad.addColorStop(stops[i][0], stops[i][1]);
      }
      this.storeGradient(key, grad);
    }
    return grad;
  }

  public renderSectorAtmosphere(
    ctx: CanvasRenderingContext2D,
    worldId: string,
    viewportWidth: number,
    viewportHeight: number,
    tickCount: number
  ): void {
    if (
      this.lastSectorWorldId !== worldId ||
      this.lastSectorWidth !== viewportWidth ||
      this.lastSectorHeight !== viewportHeight
    ) {
      this.prepareSectorState(worldId, viewportWidth, viewportHeight);
    }

    const spec = this.lastSectorSpec;
    if (!spec) return;

    const grad =
      spec.kind === "linear"
        ? this.getOrCreateLinearGradient(
            ctx,
            this.lastSectorKey,
            0,
            viewportHeight * spec.gradY0Ratio,
            spec.gradX1FullWidth ? viewportWidth : 0,
            viewportHeight * spec.gradY1Ratio,
            spec.stops
          )
        : this.getOrCreateRadialGradient(
            ctx,
            this.lastSectorKey,
            viewportWidth * spec.radialCenterXRatio,
            viewportHeight * spec.radialCenterYRatio,
            spec.radialInnerRadius,
            viewportWidth * spec.radialCenterXRatio,
            viewportHeight * spec.radialCenterYRatio,
            viewportWidth * spec.radialOuterRadiusRatio,
            spec.stops
          );

    ctx.save();
    ctx.globalAlpha =
      spec.alphaAmp !== 0
        ? spec.baseAlpha + Math.sin(tickCount * spec.alphaFreq) * spec.alphaAmp
        : spec.baseAlpha;
    if (spec.waveAmp !== 0) {
      ctx.translate(0, Math.sin(tickCount * spec.waveFreq) * spec.waveAmp);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, viewportHeight * spec.rectYRatio, viewportWidth, viewportHeight * spec.rectHRatio);
    ctx.restore();
  }

  public renderProceduralFarBackdrop(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    viewportWidth: number,
    viewportHeight: number,
    _tickCount: number
  ): void {
    const worldId = location.worldId || location.id;
    if (
      this.lastProcWorldId !== worldId ||
      this.lastProcWidth !== viewportWidth ||
      this.lastProcHeight !== viewportHeight
    ) {
      this.prepareProceduralFarState(worldId, viewportWidth, viewportHeight);
    }

    const theme = this.lastProcTheme;
    const grad = this.getOrCreateRadialGradient(
      ctx,
      this.lastProcKey,
      viewportWidth * 0.5,
      viewportHeight * 0.4,
      50,
      viewportWidth * 0.5,
      viewportHeight * 0.4,
      viewportWidth * 0.7,
      theme.stops
    );
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    ctx.fillStyle = theme.mountain;
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

  private prepareSectorState(worldId: string, viewportWidth: number, viewportHeight: number): void {
    this.lastSectorWorldId = worldId;
    this.lastSectorWidth = viewportWidth;
    this.lastSectorHeight = viewportHeight;

    const spec = SECTOR_ATMOSPHERE_SPECS[worldId] ?? null;
    this.lastSectorSpec = spec;
    if (!spec) {
      this.lastSectorKey = "";
      return;
    }

    this.lastSectorKey = spec.sizeDependsOnWidth
      ? `${spec.keyPrefix}${viewportWidth}_${viewportHeight}`
      : `${spec.keyPrefix}${viewportHeight}`;
  }

  private prepareProceduralFarState(worldId: string, viewportWidth: number, viewportHeight: number): void {
    this.lastProcWorldId = worldId;
    this.lastProcWidth = viewportWidth;
    this.lastProcHeight = viewportHeight;
    this.lastProcTheme = PROCEDURAL_FAR_THEMES[worldId] ?? DEFAULT_PROCEDURAL_FAR_THEME;
    this.lastProcKey = `proc_far_${worldId}_${viewportWidth}_${viewportHeight}`;
  }

  private storeGradient(key: string, grad: CanvasGradient): void {
    // Bound cache growth across repeated window resizes.
    if (this.gradientCache.size >= MAX_GRADIENT_CACHE_SIZE && !this.gradientCache.has(key)) {
      const oldestKey = this.gradientCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.gradientCache.delete(oldestKey);
      }
    }
    this.gradientCache.set(key, grad);
  }
}

export const defaultAtmosphericSectorRenderer = new AtmosphericSectorRenderer();
