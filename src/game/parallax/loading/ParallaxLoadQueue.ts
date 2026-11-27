import {
  computeParallaxPreScaleDimensions,
  type ParallaxLoadResizeSpec,
  type ParallaxSurfaceMetrics,
} from "@game/renderer/background/parallaxGeometry";
import type { ParallaxQualityTier } from "../meta";
import {
  browserParallaxBitmapDecoder,
  createBrowserIdleScheduler,
  resolveBrowserSurfaceMetrics,
} from "./browserBitmapDecoder";
import {
  PARALLAX_LOAD_PRIORITY,
  type IParallaxTextureDecoder,
  type ParallaxDecodeResult,
  type ParallaxDrawableTexture,
  type ParallaxIdleDeadline,
  type ParallaxIdleScheduler,
  type ParallaxLoadQueueDeps,
  type ParallaxLoadQueueStats,
  type ParallaxLoadTaskDescriptor,
  type ParallaxQueuePriority,
  type ParallaxResizeResolver,
} from "./types";

export const DEFAULT_PARALLAX_FADE_DURATION_MS = 200;
export const DEFAULT_PARALLAX_IDLE_FRAME_BUDGET_MS = 2.5;

const TIER_RANK: Readonly<Record<ParallaxQualityTier, number>> = {
  low: 1,
  mid: 2,
  high: 3,
};

interface CachedParallaxEntry {
  readonly cacheKey: string;
  readonly url: string;
  readonly tier: ParallaxQualityTier;
  readonly texture: ParallaxDrawableTexture;
  readonly decodedBytes: number;
  /** Timestamp when this slot first became drawable; null disables fade-in. */
  readonly fadeStartMs: number | null;
}

interface QueuedLoadTask {
  readonly cacheKey: string;
  readonly url: string;
  readonly tier: ParallaxQualityTier;
  priority: ParallaxQueuePriority;
  subOrder: number;
  readonly seq: number;
  readonly generation: number;
  fadeInOnReady: boolean;
  surfaceSpec?: ParallaxLoadResizeSpec;
  readonly promise: Promise<ParallaxDrawableTexture | null>;
  resolve: (texture: ParallaxDrawableTexture | null) => void;
}

/**
 * Selects queue concurrency (1-2) based on host CPU core count so decode work never starves rendering.
 */
export function resolveDefaultParallaxConcurrency(): number {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const cores = typeof nav?.hardwareConcurrency === "number" ? nav.hardwareConcurrency : 4;
  return cores >= 8 ? 2 : 1;
}

function defaultNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function compareQueuedTasks(a: QueuedLoadTask, b: QueuedLoadTask): number {
  if (a.priority !== b.priority) return a.priority - b.priority;
  if (a.subOrder !== b.subOrder) return a.subOrder - b.subOrder;
  return a.seq - b.seq;
}

/**
 * Progressive parallax image loader and decoder.
 * Orders downloads by §3.7 priority, bounds concurrency to 1-2, decodes off-thread via
 * `createImageBitmap`, supports `low -> high` refinement, generation cancellation, and 200 ms fade-in.
 */
export class ParallaxLoadQueue {
  private readonly decoder: IParallaxTextureDecoder;
  private readonly concurrency: number;
  private readonly now: () => number;
  private readonly fadeDurationMs: number;
  private readonly resolveDefaultSurfaceMetrics?: () => ParallaxSurfaceMetrics;
  private readonly scheduleIdle?: ParallaxIdleScheduler;
  private readonly idleFrameBudgetMs: number;
  private readonly maxStartsPerIdleSlice: number;

  private surfaceMetrics: ParallaxSurfaceMetrics | null;
  private idleScheduled = false;
  private generation = 0;
  private nextSeq = 0;
  private readonly cacheByKey = new Map<string, CachedParallaxEntry>();
  private readonly cacheByUrl = new Map<string, CachedParallaxEntry>();
  private readonly pending: QueuedLoadTask[] = [];
  private readonly inFlight = new Set<QueuedLoadTask>();
  private readonly cancelledInFlight = new WeakSet<QueuedLoadTask>();
  private readonly releaseListeners = new Set<(texture: ParallaxDrawableTexture) => void>();

  constructor(deps: ParallaxLoadQueueDeps = {}) {
    this.decoder = deps.decoder ?? browserParallaxBitmapDecoder;
    const requestedConcurrency = deps.concurrency ?? resolveDefaultParallaxConcurrency();
    this.concurrency = Math.max(1, Math.min(2, Math.floor(requestedConcurrency)));
    this.now = deps.now ?? defaultNow;
    this.fadeDurationMs = deps.fadeDurationMs ?? DEFAULT_PARALLAX_FADE_DURATION_MS;
    this.surfaceMetrics = deps.surfaceMetrics ?? null;
    this.resolveDefaultSurfaceMetrics = deps.resolveDefaultSurfaceMetrics;
    this.scheduleIdle =
      deps.scheduleIdle ??
      (deps.idleFrameBudgetMs !== undefined
        ? createBrowserIdleScheduler(deps.idleFrameBudgetMs)
        : undefined);
    this.idleFrameBudgetMs = Math.max(0.25, deps.idleFrameBudgetMs ?? DEFAULT_PARALLAX_IDLE_FRAME_BUDGET_MS);
    this.maxStartsPerIdleSlice = Math.max(1, Math.floor(deps.maxStartsPerIdleSlice ?? 1));
  }

  public setSurfaceMetrics(metrics: ParallaxSurfaceMetrics): void {
    this.surfaceMetrics = metrics;
  }

  public getSurfaceMetrics(): ParallaxSurfaceMetrics | null {
    return this.surfaceMetrics ?? this.resolveDefaultSurfaceMetrics?.() ?? null;
  }

  public subscribeRelease(listener: (texture: ParallaxDrawableTexture) => void): () => void {
    this.releaseListeners.add(listener);
    return () => {
      this.releaseListeners.delete(listener);
    };
  }

  public get currentGeneration(): number {
    return this.generation;
  }

  /**
   * Advances the generation counter and cancels every pending task from older generations.
   */
  public beginGeneration(): number {
    this.generation++;
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const task = this.pending[i];
      if (task.generation !== this.generation) {
        this.pending.splice(i, 1);
        task.resolve(null);
      }
    }
    return this.generation;
  }

  public enqueue(descriptor: ParallaxLoadTaskDescriptor): Promise<ParallaxDrawableTexture | null> {
    const promise = this.enqueueInternal(descriptor);
    this.pump();
    return promise;
  }

  /**
   * Enqueues multiple tasks atomically before draining so higher-priority items always jump ahead.
   */
  public enqueueBatch(descriptors: readonly ParallaxLoadTaskDescriptor[]): Promise<void> {
    if (descriptors.length === 0) return Promise.resolve();
    const promises: Promise<ParallaxDrawableTexture | null>[] = [];
    for (let i = 0; i < descriptors.length; i++) {
      promises.push(this.enqueueInternal(descriptors[i]));
    }
    this.pump();
    return Promise.all(promises).then(() => undefined);
  }

  public getTexture(keyOrUrl: string): ParallaxDrawableTexture | null {
    const entry = this.cacheByKey.get(keyOrUrl) ?? this.cacheByUrl.get(keyOrUrl);
    return entry ? entry.texture : null;
  }

  public hasTier(cacheKey: string, minTier: ParallaxQualityTier): boolean {
    const entry = this.cacheByKey.get(cacheKey);
    if (!entry) return false;
    return TIER_RANK[entry.tier] >= TIER_RANK[minTier];
  }

  /**
   * Returns true while a key or URL is cached, queued, or actively decoding for the current generation.
   */
  public isManaged(keyOrUrl: string): boolean {
    if (this.cacheByKey.has(keyOrUrl) || this.cacheByUrl.has(keyOrUrl)) return true;
    for (let i = 0; i < this.pending.length; i++) {
      const t = this.pending[i];
      if (t.generation === this.generation && (t.cacheKey === keyOrUrl || t.url === keyOrUrl)) return true;
    }
    for (const t of this.inFlight) {
      if (t.generation === this.generation && (t.cacheKey === keyOrUrl || t.url === keyOrUrl)) return true;
    }
    return false;
  }

  /**
   * Computes the current fade-in alpha in [0, 1] for a layer loaded by the queue.
   * Returns 1 when not managed by a fade curve or once the 200 ms transition completes.
   */
  public getFadeAlpha(keyOrUrl: string, nowMs: number = this.now()): number {
    const entry = this.cacheByKey.get(keyOrUrl) ?? this.cacheByUrl.get(keyOrUrl);
    if (!entry || entry.fadeStartMs === null || this.fadeDurationMs <= 0) return 1;
    const elapsed = nowMs - entry.fadeStartMs;
    if (elapsed <= 0) return 0;
    if (elapsed >= this.fadeDurationMs) return 1;
    return elapsed / this.fadeDurationMs;
  }

  public evict(keyOrUrl: string): boolean {
    let removed = false;
    const entry = this.cacheByKey.get(keyOrUrl) ?? this.cacheByUrl.get(keyOrUrl);
    if (entry) {
      this.cacheByKey.delete(entry.cacheKey);
      this.cacheByUrl.delete(entry.url);
      this.releaseTexture(entry.texture);
      removed = true;
    }

    for (let i = this.pending.length - 1; i >= 0; i--) {
      const task = this.pending[i];
      if (task.cacheKey === keyOrUrl || task.url === keyOrUrl) {
        this.pending.splice(i, 1);
        task.resolve(null);
        removed = true;
      }
    }

    for (const task of this.inFlight) {
      if (task.cacheKey === keyOrUrl || task.url === keyOrUrl) {
        this.cancelledInFlight.add(task);
        removed = true;
      }
    }
    return removed;
  }

  public clear(): void {
    this.beginGeneration();
    for (const entry of this.cacheByKey.values()) {
      this.releaseTexture(entry.texture);
    }
    this.cacheByKey.clear();
    this.cacheByUrl.clear();
  }

  public getStats(): ParallaxLoadQueueStats {
    let decodedBytes = 0;
    for (const entry of this.cacheByKey.values()) {
      decodedBytes += entry.decodedBytes;
    }
    return {
      textureCount: this.cacheByKey.size,
      decodedBytes,
      pendingCount: this.pending.length,
      inFlightCount: this.inFlight.size,
      generation: this.generation,
    };
  }

  private enqueueInternal(descriptor: ParallaxLoadTaskDescriptor): Promise<ParallaxDrawableTexture | null> {
    const tier: ParallaxQualityTier = descriptor.tier ?? "high";
    const subOrder = descriptor.subOrder ?? 0;
    const fadeInOnReady = descriptor.fadeInOnReady ?? descriptor.priority !== 1;

    const cached = this.cacheByKey.get(descriptor.cacheKey) ?? this.cacheByUrl.get(descriptor.url);
    if (cached && TIER_RANK[cached.tier] >= TIER_RANK[tier]) {
      return Promise.resolve(cached.texture);
    }

    const existing = this.findActiveTask(descriptor.cacheKey, tier, descriptor.url);
    if (existing) {
      this.promoteTask(existing, descriptor.priority, subOrder, fadeInOnReady, descriptor.surfaceSpec);
      return existing.promise;
    }

    let resolveFn: (texture: ParallaxDrawableTexture | null) => void = () => {};
    const promise = new Promise<ParallaxDrawableTexture | null>((resolve) => {
      resolveFn = resolve;
    });

    this.pending.push({
      cacheKey: descriptor.cacheKey,
      url: descriptor.url,
      tier,
      priority: descriptor.priority,
      subOrder,
      seq: this.nextSeq++,
      generation: this.generation,
      fadeInOnReady,
      surfaceSpec: descriptor.surfaceSpec,
      promise,
      resolve: resolveFn,
    });
    this.pending.sort(compareQueuedTasks);
    return promise;
  }

  private findActiveTask(cacheKey: string, tier: ParallaxQualityTier, url: string): QueuedLoadTask | undefined {
    for (let i = 0; i < this.pending.length; i++) {
      const t = this.pending[i];
      if (t.generation === this.generation && t.cacheKey === cacheKey && t.tier === tier && t.url === url) {
        return t;
      }
    }
    for (const t of this.inFlight) {
      if (t.generation === this.generation && t.cacheKey === cacheKey && t.tier === tier && t.url === url) {
        return t;
      }
    }
    return undefined;
  }

  private promoteTask(
    task: QueuedLoadTask,
    priority: ParallaxQueuePriority,
    subOrder: number,
    fadeInOnReady: boolean,
    surfaceSpec?: ParallaxLoadResizeSpec
  ): void {
    const higherPriority = priority < task.priority || (priority === task.priority && subOrder < task.subOrder);
    if (higherPriority) {
      task.priority = priority;
      task.subOrder = subOrder;
      this.pending.sort(compareQueuedTasks);
    }
    if (fadeInOnReady) {
      task.fadeInOnReady = true;
    }
    if (surfaceSpec && !task.surfaceSpec) {
      task.surfaceSpec = surfaceSpec;
    }
  }

  private pump(): void {
    while (this.inFlight.size < this.concurrency && this.pending.length > 0) {
      const next = this.pending[0];
      if (next.generation !== this.generation) {
        this.pending.shift();
        next.resolve(null);
        continue;
      }
      if (this.scheduleIdle && next.priority > PARALLAX_LOAD_PRIORITY.FAR) {
        this.ensureIdleScheduled();
        break;
      }
      this.pending.shift();
      this.startTask(next);
    }
  }

  private ensureIdleScheduled(): void {
    if (!this.scheduleIdle || this.idleScheduled) return;
    if (this.pending.length === 0 || this.inFlight.size >= this.concurrency) return;
    this.idleScheduled = true;
    this.scheduleIdle((deadline) => this.runIdleSlice(deadline));
  }

  private runIdleSlice(deadline: ParallaxIdleDeadline): void {
    this.idleScheduled = false;
    if (this.pending.length === 0 || this.inFlight.size >= this.concurrency) return;

    const remaining = Math.max(0, deadline.timeRemaining());
    if (!deadline.didTimeout && remaining <= 0.25) {
      this.ensureIdleScheduled();
      return;
    }

    const sliceStart = this.now();
    const budgetMs = Math.min(this.idleFrameBudgetMs, remaining > 0 ? remaining : this.idleFrameBudgetMs);
    let started = 0;

    while (this.inFlight.size < this.concurrency && this.pending.length > 0) {
      if (started > 0) {
        if (started >= this.maxStartsPerIdleSlice) break;
        if (this.now() - sliceStart >= budgetMs) break;
      }
      const next = this.pending.shift()!;
      if (next.generation !== this.generation) {
        next.resolve(null);
        continue;
      }
      this.startTask(next);
      started++;
    }

    if (this.inFlight.size < this.concurrency && this.pending.length > 0) {
      this.ensureIdleScheduled();
    }
  }

  private startTask(task: QueuedLoadTask): void {
    this.inFlight.add(task);
    const isCancelled = () => task.generation !== this.generation || this.cancelledInFlight.has(task);
    const surfaceSpec = task.surfaceSpec;
    const resolveResize: ParallaxResizeResolver | undefined = surfaceSpec
      ? (srcWidth, srcHeight) => {
          const metrics = this.getSurfaceMetrics();
          if (!metrics) return null;
          return computeParallaxPreScaleDimensions(srcWidth, srcHeight, surfaceSpec, metrics);
        }
      : undefined;

    this.decoder
      .loadAndDecode(task.url, isCancelled, resolveResize)
      .then((result) => this.handleTaskResult(task, result))
      .catch(() => {
        this.inFlight.delete(task);
        task.resolve(null);
        this.pump();
      });
  }

  private handleTaskResult(task: QueuedLoadTask, result: ParallaxDecodeResult | null): void {
    this.inFlight.delete(task);

    if (!result || task.generation !== this.generation || this.cancelledInFlight.has(task)) {
      if (result) {
        this.releaseTexture(result.texture);
      }
      task.resolve(null);
      this.pump();
      return;
    }

    const texture = this.commitDecodedEntry(task, result);
    task.resolve(texture);
    this.pump();
  }

  private releaseTexture(texture: ParallaxDrawableTexture): void {
    this.decoder.release?.(texture);
    for (const listener of this.releaseListeners) {
      listener(texture);
    }
  }

  private commitDecodedEntry(task: QueuedLoadTask, result: ParallaxDecodeResult): ParallaxDrawableTexture {
    const previous = this.cacheByKey.get(task.cacheKey);
    if (previous && TIER_RANK[previous.tier] > TIER_RANK[task.tier]) {
      if (result.texture !== previous.texture) {
        this.releaseTexture(result.texture);
      }
      return previous.texture;
    }

    // Preserve existing fade state when refining a lower-tier texture so the layer never blinks.
    const fadeStartMs = previous
      ? previous.fadeStartMs
      : task.fadeInOnReady
        ? this.now()
        : null;

    if (previous) {
      this.cacheByUrl.delete(previous.url);
      if (previous.texture !== result.texture) {
        this.releaseTexture(previous.texture);
      }
    }

    const entry: CachedParallaxEntry = {
      cacheKey: task.cacheKey,
      url: task.url,
      tier: task.tier,
      texture: result.texture,
      decodedBytes: result.decodedBytes,
      fadeStartMs,
    };
    this.cacheByKey.set(entry.cacheKey, entry);
    this.cacheByUrl.set(entry.url, entry);
    return entry.texture;
  }
}

const IS_TEST_RUNTIME = typeof process !== "undefined" && process.env?.NODE_ENV === "test";

export const defaultParallaxLoadQueue = new ParallaxLoadQueue({
  resolveDefaultSurfaceMetrics: resolveBrowserSurfaceMetrics,
  scheduleIdle: !IS_TEST_RUNTIME && typeof Image !== "undefined" ? createBrowserIdleScheduler() : undefined,
  idleFrameBudgetMs: DEFAULT_PARALLAX_IDLE_FRAME_BUDGET_MS,
  maxStartsPerIdleSlice: 1,
});
