import type { DecorPlacementSchema } from "../../locations/schema/locationSchema";
import { assetsLogger } from "../../logger/gameLogger";
import type { IPropProvider } from "./propManager";
import type { PropAnchor, PropMeta } from "./propMeta";

/** Everything the renderer needs per decor piece, computed once when a location loads. */
export interface DecorDraw {
  readonly propId: string;
  readonly index: number;
  /** Top-left of the sprite in world units. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly flipX: boolean;
  readonly phase: number;
  readonly frames: number;
  readonly fps: number;
  readonly flicker: boolean;
  /** World-space centre and radius of the glow; radius 0 means no glow. */
  readonly glowX: number;
  readonly glowY: number;
  readonly glowRadius: number;
  readonly glowColor: string;
  /** Culling rectangle: the sprite box unioned with the glow disc. */
  readonly cullX: number;
  readonly cullY: number;
  readonly cullW: number;
  readonly cullH: number;
}

export interface DecorPlan {
  readonly back: readonly DecorDraw[];
  readonly front: readonly DecorDraw[];
}

export const EMPTY_DECOR_PLAN: DecorPlan = { back: [], front: [] };

/** Top-left x of a sprite whose anchor x is `x` (all anchors are horizontally centred). */
export function anchoredLeft(x: number, width: number): number {
  return x - width / 2;
}

/** Top-left y of a sprite whose anchor y is `y`. */
export function anchoredTop(anchor: PropAnchor, y: number, height: number): number {
  if (anchor === "bottom") return y - height;
  if (anchor === "center") return y - height / 2;
  return y;
}

/** Deterministic frame from the simulation tick: floor(tick / 60 * fps + phase) mod frames. */
export function decorFrame(tickCount: number, fps: number, phase: number, frames: number): number {
  if (frames <= 1) return 0;
  const raw = Math.floor((tickCount / 60) * fps + phase);
  return ((raw % frames) + frames) % frames;
}

/** Deterministic glow alpha in 0.75..1.0 from the tick and the decor index (changes every 3 ticks). */
export function decorFlicker(tickCount: number, index: number): number {
  let h = (Math.floor(tickCount / 3) + Math.imul(index + 1, 7919)) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  h ^= h >>> 15;
  return 0.75 + 0.25 * ((h >>> 0) / 4294967295);
}

function buildDraw(meta: PropMeta, placement: DecorPlacementSchema, index: number): DecorDraw {
  const width = meta.worldWidth;
  const height = meta.worldHeight;
  const x = anchoredLeft(placement.x, width);
  const y = anchoredTop(meta.anchor, placement.y, height);
  const flipX = placement.flipX === true;
  const glow = meta.glow;
  const glowRadius = glow ? glow.radius : 0;
  const glowX = glow ? x + (flipX ? width - glow.x : glow.x) : 0;
  const glowY = glow ? y + glow.y : 0;
  const cullX = glow ? Math.min(x, glowX - glowRadius) : x;
  const cullY = glow ? Math.min(y, glowY - glowRadius) : y;
  const cullR = glow ? Math.max(x + width, glowX + glowRadius) : x + width;
  const cullB = glow ? Math.max(y + height, glowY + glowRadius) : y + height;
  return {
    propId: meta.propId,
    index,
    x,
    y,
    width,
    height,
    flipX,
    phase: placement.phase ?? 0,
    frames: meta.frames,
    fps: meta.fps,
    flicker: glow?.flicker === true,
    glowX,
    glowY,
    glowRadius,
    glowColor: glow ? glow.color : "",
    cullX,
    cullY,
    cullW: cullR - cullX,
    cullH: cullB - cullY,
  };
}

/**
 * Resolves placements into draw data split by layer. A placement whose `propId` is unknown to the
 * provider is skipped (warned once per prop id per plan).
 */
export function buildDecorPlan(placements: readonly DecorPlacementSchema[] | undefined, props: IPropProvider): DecorPlan {
  if (!placements || placements.length === 0) return EMPTY_DECOR_PLAN;
  const back: DecorDraw[] = [];
  const front: DecorDraw[] = [];
  const warned = new Set<string>();
  placements.forEach((placement, index) => {
    const meta = props.getMeta(placement.propId);
    if (!meta) {
      if (!warned.has(placement.propId)) {
        warned.add(placement.propId);
        assetsLogger.warn(`Decor '${placement.id}' uses unknown propId '${placement.propId}', skipping`, {
          propId: placement.propId,
        });
      }
      return;
    }
    (placement.layer === "front" ? front : back).push(buildDraw(meta, placement, index));
  });
  return { back, front };
}
