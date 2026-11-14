import { AssetError, ErrorCode } from "@lib/errors";

/**
 * Contract of `<id>_prop_meta.json`, written by the prop compiler (`scripts/sprites/props`).
 * See `docs/manifesto/PARALLAX_AND_RENDERING.md` (decor props).
 */
export type PropAnchor = "bottom" | "top" | "center";

export interface PropVariantMeta {
  readonly file: string;
  /** Frame size in sheet pixels. */
  readonly frameWidth: number;
  readonly frameHeight: number;
}

export interface PropGlowMeta {
  readonly color: string;
  /** Glow radius in world units. */
  readonly radius: number;
  /** Glow centre in world units relative to the sprite top-left corner. */
  readonly x: number;
  readonly y: number;
  readonly flicker: boolean;
}

export interface PropMeta {
  readonly propId: string;
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly anchor: PropAnchor;
  readonly frames: number;
  readonly fps: number;
  /** hi-8bit is `low`, hi-16bit is `mid`; either may be absent. */
  readonly variants: { readonly low?: PropVariantMeta; readonly mid?: PropVariantMeta };
  readonly glow?: PropGlowMeta;
}

type Rec = Record<string, unknown>;

const isRecord = (value: unknown): value is Rec => typeof value === "object" && value !== null && !Array.isArray(value);
const isPositiveInt = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value > 0;
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function corrupted(propId: string, reason: string): AssetError {
  return new AssetError(`Prop meta '${propId}' is invalid: ${reason}`, ErrorCode.ASSET_CORRUPTED, {
    details: { propId, reason },
  });
}

function parseVariant(propId: string, name: string, raw: unknown): PropVariantMeta {
  if (
    !isRecord(raw) ||
    typeof raw.file !== "string" ||
    raw.file.length === 0 ||
    !isPositiveInt(raw.frameWidth) ||
    !isPositiveInt(raw.frameHeight)
  ) {
    throw corrupted(propId, `variant '${name}' needs a file and integer frameWidth and frameHeight`);
  }
  return { file: raw.file, frameWidth: raw.frameWidth, frameHeight: raw.frameHeight };
}

function parseGlow(propId: string, raw: unknown): PropGlowMeta {
  if (
    !isRecord(raw) ||
    typeof raw.color !== "string" ||
    raw.color.length === 0 ||
    !isFiniteNumber(raw.radius) ||
    raw.radius <= 0 ||
    !isFiniteNumber(raw.x) ||
    !isFiniteNumber(raw.y)
  ) {
    throw corrupted(propId, "glow needs a color, a positive radius and x, y");
  }
  return { color: raw.color, radius: raw.radius, x: raw.x, y: raw.y, flicker: raw.flicker === true };
}

/** Validates a prop meta document. Throws an `AssetError` (ASSET_CORRUPTED) when it is not usable. */
export function parsePropMeta(raw: unknown): PropMeta {
  if (!isRecord(raw) || typeof raw.propId !== "string" || raw.propId.length === 0) {
    throw corrupted("<unknown>", "missing propId");
  }
  const id = raw.propId;
  if (!isPositiveInt(raw.worldWidth) || !isPositiveInt(raw.worldHeight)) {
    throw corrupted(id, "worldWidth and worldHeight must be positive integers");
  }
  if (raw.anchor !== "bottom" && raw.anchor !== "top" && raw.anchor !== "center") {
    throw corrupted(id, "anchor must be 'bottom', 'top' or 'center'");
  }
  if (!isPositiveInt(raw.frames) || raw.frames > 12) throw corrupted(id, "frames must be an integer in 1..12");
  if (!isFiniteNumber(raw.fps) || raw.fps < 0) throw corrupted(id, "fps must be a non-negative number");
  if (!isRecord(raw.variants)) throw corrupted(id, "variants is missing");
  const low = raw.variants.low === undefined ? undefined : parseVariant(id, "low", raw.variants.low);
  const mid = raw.variants.mid === undefined ? undefined : parseVariant(id, "mid", raw.variants.mid);
  if (!low && !mid) throw corrupted(id, "no low or mid variant");
  return {
    propId: id,
    worldWidth: raw.worldWidth,
    worldHeight: raw.worldHeight,
    anchor: raw.anchor,
    frames: raw.frames,
    fps: raw.fps,
    variants: { low, mid },
    glow: raw.glow === undefined ? undefined : parseGlow(id, raw.glow),
  };
}
