import {
  defaultAtlasSlicingEngine,
} from "@game/engine/meta/slicing/AtlasSlicingEngine";
import {
  BackgroundProcessor,
  type IPixelBuffer,
} from "@game/engine/meta/slicing/BackgroundProcessor";
import type {
  IAnimationTrackMeta,
  IAtlasBackgroundConfig,
  IAtlasSlicingConfig,
  ResolvedFrameRect,
  SlicingMethod,
} from "@game/engine/meta/types";
import type { AtlasAssetPreset, AtlasPresetMeta } from "./assetPresets";

export interface EditableMetaDoc {
  atlas: {
    columns: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
    spacing: number;
    safeMargin: number;
    background?: string;
    image?: string;
    [key: string]: unknown;
  };
  slicing: IAtlasSlicingConfig;
  backgroundConfig: IAtlasBackgroundConfig;
  animations: Record<string, IAnimationTrackMeta>;
  layout: {
    origin: {
      type: string;
      normalized: { x: number; y: number };
    };
    naturalFacing: "left" | "right";
    anchor: { x: number; y: number };
  };
  variants?: AtlasPresetMeta["variants"];
  [key: string]: unknown;
}

export const SLICER_CANVAS_COLORS = {
  gridStroke: "rgba(245, 158, 11, 0.38)",
  marginStroke: "rgba(56, 189, 248, 0.45)",
  frameStroke: "rgba(52, 211, 153, 0.78)",
  trackFill: "rgba(245, 158, 11, 0.14)",
  selectedStroke: "#fbbf24",
  selectedFill: "rgba(251, 191, 36, 0.22)",
  hoverStroke: "#38bdf8",
  groundLine: "rgba(245, 158, 11, 0.75)",
  pivotCrosshair: "#f43f5e",
  badgeBg: "rgba(12, 10, 9, 0.86)",
  badgeText: "#fde68a",
  checkerLight: "#292524",
  checkerDark: "#1c1917",
} as const;

export const CHROMA_COLOR_PRESETS: readonly { label: string; hex: string }[] = [
  { label: "Magenta", hex: "#ff00ff" },
  { label: "Green Screen", hex: "#00ff00" },
  { label: "Deep Black", hex: "#000000" },
  { label: "Pure White", hex: "#ffffff" },
  { label: "Obsidian", hex: "#111111" },
];

export const PIVOT_ANCHOR_PRESETS: readonly {
  id: string;
  label: string;
  x: number;
  y: number;
}[] = [
  { id: "feet", label: "Stopy (0.5, 1.0)", x: 0.5, y: 1.0 },
  { id: "center", label: "Środek (0.5, 0.5)", x: 0.5, y: 0.5 },
  { id: "top_left", label: "Góra-Lewo (0, 0)", x: 0, y: 0 },
];

/**
 * Extracts normalized animations record from either flat or nested meta documents.
 */
export function normalizeAnimationsMap(
  rawAnimations: unknown
): Record<string, IAnimationTrackMeta> {
  if (!rawAnimations || typeof rawAnimations !== "object") {
    return {
      idle: { row: 0, frames: 4, fps: 8, loop: true },
    };
  }
  const candidate =
    "animations" in (rawAnimations as Record<string, unknown>) &&
    typeof (rawAnimations as Record<string, unknown>).animations === "object"
      ? ((rawAnimations as Record<string, unknown>).animations as Record<string, unknown>)
      : (rawAnimations as Record<string, unknown>);

  const result: Record<string, IAnimationTrackMeta> = {};
  for (const [name, entry] of Object.entries(candidate)) {
    if (!entry || typeof entry !== "object") continue;
    const rec = entry as Record<string, unknown>;
    result[name] = {
      row: typeof rec.row === "number" ? rec.row : 0,
      frames: typeof rec.frames === "number" ? rec.frames : 1,
      fps: typeof rec.fps === "number" ? rec.fps : 8,
      loop: typeof rec.loop === "boolean" ? rec.loop : true,
      wide: typeof rec.wide === "boolean" ? rec.wide : undefined,
      slotSpan: Array.isArray(rec.slotSpan) ? (rec.slotSpan as number[]) : undefined,
      frameIndices: Array.isArray(rec.frameIndices)
        ? (rec.frameIndices as number[])
        : undefined,
      startCol: typeof rec.startCol === "number" ? rec.startCol : undefined,
      widthCells: typeof rec.widthCells === "number" ? rec.widthCells : undefined,
      pingPong: typeof rec.pingPong === "boolean" ? rec.pingPong : undefined,
    };
  }
  if (Object.keys(result).length === 0) {
    result.idle = { row: 0, frames: 4, fps: 8, loop: true };
  }
  return result;
}

export function buildEditableMetaFromPreset(preset: AtlasAssetPreset): EditableMetaDoc {
  const raw = JSON.parse(JSON.stringify(preset.defaultMeta)) as Record<string, unknown>;
  const atlasRaw = (raw.atlas ?? {}) as Record<string, unknown>;
  const highVariant = preset.defaultMeta.variants?.high;

  const columns = Number(atlasRaw.columns) || 4;
  const rows = Number(atlasRaw.rows) || 4;
  const cellWidth = Number(highVariant?.cellWidth ?? atlasRaw.cellWidth) || 128;
  const cellHeight = Number(highVariant?.cellHeight ?? atlasRaw.cellHeight) || 128;
  const spacing = Number(atlasRaw.spacing) || 0;
  const safeMargin = Number(atlasRaw.safeMargin) || 0;

  const rawSlicing = (raw.slicing ?? {}) as Partial<IAtlasSlicingConfig>;
  const method: SlicingMethod = rawSlicing.method ?? "by_count";

  const rawBg = (raw.backgroundConfig ?? {}) as Partial<IAtlasBackgroundConfig>;
  const rawLayout = (raw.layout ?? {}) as Record<string, unknown>;
  const rawAnchor = (rawLayout.anchor ?? { x: 0.5, y: 1.0 }) as { x?: number; y?: number };

  return {
    ...raw,
    atlas: {
      ...atlasRaw,
      columns,
      rows,
      cellWidth,
      cellHeight,
      spacing,
      safeMargin,
    },
    slicing: {
      method,
      grid: { columns, rows, cellWidth, cellHeight, spacing, safeMargin },
      cellSize: rawSlicing.cellSize ?? {
        cellWidth,
        cellHeight,
        spacing,
        margin: safeMargin,
      },
      autoIslands: rawSlicing.autoIslands ?? {
        minIslandPixels: 24,
        clusterYTolerance: 16,
      },
      frames: rawSlicing.frames,
    },
    backgroundConfig: {
      mode: rawBg.mode ?? "transparent",
      colorHex: rawBg.colorHex ?? "#ff00ff",
      tolerance: rawBg.tolerance ?? 18,
      removeAtRuntime: rawBg.removeAtRuntime ?? false,
    },
    animations: normalizeAnimationsMap(raw.animations),
    layout: {
      origin: {
        type:
          typeof (rawLayout.origin as Record<string, unknown> | undefined)?.type === "string"
            ? String((rawLayout.origin as Record<string, unknown>).type)
            : "feet",
        normalized: {
          x: typeof rawAnchor.x === "number" ? rawAnchor.x : 0.5,
          y: typeof rawAnchor.y === "number" ? rawAnchor.y : 1.0,
        },
      },
      naturalFacing: rawLayout.naturalFacing === "left" ? "left" : "right",
      anchor: {
        x: typeof rawAnchor.x === "number" ? rawAnchor.x : 0.5,
        y: typeof rawAnchor.y === "number" ? rawAnchor.y : 1.0,
      },
    },
  };
}

export function resolveFramesForMeta(
  meta: EditableMetaDoc,
  textureWidth: number,
  textureHeight: number,
  pixelBuffer?: IPixelBuffer | null
): ResolvedFrameRect[] {
  return defaultAtlasSlicingEngine.resolveFrames(
    meta,
    textureWidth,
    textureHeight,
    pixelBuffer ?? undefined
  );
}

/**
 * Applies BackgroundProcessor.applyChromaKey to an HTMLImageElement and returns an offscreen canvas.
 */
export function buildChromaKeyedCanvas(
  img: HTMLImageElement,
  colorHex: string,
  tolerance: number,
  feather = 6
): HTMLCanvasElement | null {
  const offscreen = document.createElement("canvas");
  offscreen.width = img.naturalWidth || img.width;
  offscreen.height = img.naturalHeight || img.height;
  const ctx = offscreen.getContext("2d");
  if (!ctx || offscreen.width === 0 || offscreen.height === 0) return null;

  ctx.drawImage(img, 0, 0);
  const extracted = BackgroundProcessor.extractFromCanvas(offscreen);
  if (!extracted) return offscreen;

  const processed = BackgroundProcessor.applyChromaKey(
    extracted,
    colorHex,
    tolerance,
    feather
  );
  const imgData = new ImageData(
    new Uint8ClampedArray(processed.data),
    processed.width,
    processed.height
  );
  ctx.putImageData(imgData, 0, 0);
  return offscreen;
}

export function triggerCanvasPngDownload(canvas: HTMLCanvasElement, filename: string): void {
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

export function triggerJsonTextDownload(jsonText: string, filename: string): void {
  const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
