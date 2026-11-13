/**
 * Contract of `<id>_pixel_meta.json`, written by `scripts/sprites/heroMeta.ts`. Only the fields the
 * runtime needs are modelled; everything else in the file is ignored.
 */
export interface HeroPixelFrameRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface HeroPixelAnimation {
  readonly row: number;
  readonly frames: number;
  readonly fps: number;
  readonly loop: boolean;
  /** Column span of each frame; frame `f` starts at the sum of the spans before it. */
  readonly cells: readonly number[];
}

export interface HeroPixelVariant {
  readonly file: string;
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly sheetWidth: number;
  readonly sheetHeight: number;
  /** Cell width relative to the painted `mid` cell. */
  readonly scale: number;
  /** Tight opaque bounds in sheet pixels, keyed `<anim>_<frame>`. */
  readonly frameRects: Readonly<Record<string, HeroPixelFrameRect>>;
}

export interface HeroPixelMeta {
  readonly characterId: string;
  readonly grid: {
    readonly ordering: readonly string[];
    readonly columns: number;
    readonly packedCell: { readonly width: number; readonly height: number };
    readonly animations: Readonly<Record<string, HeroPixelAnimation>>;
  };
  /** hi-8bit is `low`, hi-16bit is `mid`; either may be absent. */
  readonly variants: { readonly low?: HeroPixelVariant; readonly mid?: HeroPixelVariant };
  /** Normalized x of the feet inside the first cell of a slot. */
  readonly originX: number;
}

type Rec = Record<string, unknown>;

const isRecord = (value: unknown): value is Rec => typeof value === "object" && value !== null && !Array.isArray(value);
const isPositive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function parseRect(raw: unknown): HeroPixelFrameRect | null {
  if (!isRecord(raw)) return null;
  const { x, y, width, height } = raw;
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isPositive(width) || !isPositive(height)) return null;
  return { x, y, width, height };
}

function parseAnimation(raw: unknown): HeroPixelAnimation | null {
  if (!isRecord(raw)) return null;
  const { row, frames, fps, loop, cells } = raw;
  if (!isFiniteNumber(row) || !isPositive(frames) || !isPositive(fps) || typeof loop !== "boolean") return null;
  if (!Array.isArray(cells) || cells.length !== frames || !cells.every(isPositive)) return null;
  return { row, frames, fps, loop, cells: [...(cells as number[])] };
}

function parseVariant(raw: unknown): HeroPixelVariant | null {
  if (!isRecord(raw)) return null;
  const { file, cellWidth, cellHeight, sheetWidth, sheetHeight, scale, frameRects } = raw;
  if (typeof file !== "string" || file.length === 0) return null;
  if (![cellWidth, cellHeight, sheetWidth, sheetHeight, scale].every(isPositive)) return null;
  if (!isRecord(frameRects)) return null;
  const rects: Record<string, HeroPixelFrameRect> = {};
  for (const [key, value] of Object.entries(frameRects)) {
    const rect = parseRect(value);
    if (rect) rects[key] = rect;
  }
  return {
    file,
    cellWidth: cellWidth as number,
    cellHeight: cellHeight as number,
    sheetWidth: sheetWidth as number,
    sheetHeight: sheetHeight as number,
    scale: scale as number,
    frameRects: rects,
  };
}

function parseGrid(raw: unknown): HeroPixelMeta["grid"] | null {
  if (!isRecord(raw)) return null;
  const { ordering, columns, packedCell, animations } = raw;
  if (!Array.isArray(ordering) || !isPositive(columns) || !isRecord(packedCell) || !isRecord(animations)) return null;
  if (!isPositive(packedCell.width) || !isPositive(packedCell.height)) return null;
  const parsed: Record<string, HeroPixelAnimation> = {};
  for (const name of ordering.map(String)) {
    const anim = parseAnimation(animations[name]);
    if (!anim) return null;
    parsed[name] = anim;
  }
  return {
    ordering: ordering.map(String),
    columns,
    packedCell: { width: packedCell.width, height: packedCell.height },
    animations: parsed,
  };
}

/** Validates a pixel meta document; null when it is not usable (the runtime then keeps the painted tiers). */
export function parseHeroPixelMeta(raw: unknown): HeroPixelMeta | null {
  if (!isRecord(raw) || typeof raw.characterId !== "string") return null;
  const grid = parseGrid(raw.grid);
  const variants = isRecord(raw.variants) ? raw.variants : null;
  const layout = isRecord(raw.layout) ? raw.layout : null;
  const origin = layout && isRecord(layout.origin) ? layout.origin : null;
  const normalized = origin && isRecord(origin.normalized) ? origin.normalized : null;
  if (!grid || !variants || !normalized || !isFiniteNumber(normalized.x)) return null;
  const low = variants.low === undefined ? undefined : parseVariant(variants.low);
  const mid = variants.mid === undefined ? undefined : parseVariant(variants.mid);
  if (low === null || mid === null) return null;
  if (!low && !mid) return null;
  return { characterId: raw.characterId, grid, variants: { low, mid }, originX: normalized.x };
}
