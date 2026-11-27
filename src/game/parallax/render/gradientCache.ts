export type LinearGradientStop = readonly [number, string];

export interface PrecomputedLinearGradientSpec {
  worldId: string;
  topColor: string;
  bottomColor: string;
  height: number;
  key: string;
  readonly stops: [[number, string], [number, string]];
}

const MAX_GRADIENT_CACHE_SIZE = 32;

export function createLinearGradientSpec(): PrecomputedLinearGradientSpec {
  return {
    worldId: "",
    topColor: "",
    bottomColor: "",
    height: -1,
    key: "",
    stops: [
      [0, ""],
      [1, ""],
    ],
  };
}

export function resetLinearGradientSpec(spec: PrecomputedLinearGradientSpec): void {
  spec.worldId = "";
  spec.topColor = "";
  spec.bottomColor = "";
  spec.height = -1;
  spec.key = "";
  spec.stops[0][1] = "";
  spec.stops[1][1] = "";
}

export function prepareLinearGradientSpec(
  spec: PrecomputedLinearGradientSpec,
  prefix: string,
  worldId: string,
  topColor: string,
  bottomColor: string,
  viewportHeight: number
): void {
  if (
    spec.worldId === worldId &&
    spec.topColor === topColor &&
    spec.bottomColor === bottomColor &&
    spec.height === viewportHeight
  ) {
    return;
  }

  spec.worldId = worldId;
  spec.topColor = topColor;
  spec.bottomColor = bottomColor;
  spec.height = viewportHeight;
  spec.key = `${prefix}${worldId}_${topColor}_${bottomColor}_${viewportHeight}`;
  spec.stops[0][1] = topColor;
  spec.stops[1][1] = bottomColor;
}

/**
 * Bounded LRU-like FIFO cache for vertical CanvasGradient instances so per-frame
 * backdrop renders perform zero heap or gradient allocations after warm-up.
 */
export class BoundedLinearGradientCache {
  private readonly cache = new Map<string, CanvasGradient>();

  public clear(): void {
    this.cache.clear();
  }

  public getOrCreate(
    ctx: CanvasRenderingContext2D,
    key: string,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: readonly LinearGradientStop[]
  ): CanvasGradient {
    let grad = this.cache.get(key);
    if (!grad) {
      grad = ctx.createLinearGradient(x0, y0, x1, y1);
      for (let i = 0; i < stops.length; i++) {
        grad.addColorStop(stops[i][0], stops[i][1]);
      }
      if (this.cache.size >= MAX_GRADIENT_CACHE_SIZE && !this.cache.has(key)) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) {
          this.cache.delete(oldestKey);
        }
      }
      this.cache.set(key, grad);
    }
    return grad;
  }
}
