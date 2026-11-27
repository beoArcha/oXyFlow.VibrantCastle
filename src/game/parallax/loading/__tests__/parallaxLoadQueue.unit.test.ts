import { describe, it, expect } from "bun:test";
import {
  ParallaxLoadQueue,
  PARALLAX_LOAD_PRIORITY,
  browserParallaxBitmapDecoder,
  getWorldPlaceholderColors,
  type IParallaxTextureDecoder,
  type ParallaxDecodeResult,
  type ParallaxDrawableTexture,
} from "../index";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeFakeTexture(id: string, width = 1024, height = 512): ParallaxDrawableTexture {
  return {
    id,
    complete: true,
    naturalWidth: width,
    naturalHeight: height,
    width,
    height,
  } as unknown as ParallaxDrawableTexture;
}

function makeDecodeResult(id: string, width = 1024, height = 512): ParallaxDecodeResult {
  return {
    texture: makeFakeTexture(id, width, height),
    width,
    height,
    decodedBytes: width * height * 4,
  };
}

describe("ParallaxLoadQueue", () => {
  it("should load tasks in §3.7 priority order (far -> back-to-front layers -> zone -> effect -> neighbour)", async () => {
    // Arrange
    const startedUrls: string[] = [];
    const decoder: IParallaxTextureDecoder = {
      async loadAndDecode(url) {
        startedUrls.push(url);
        return makeDecodeResult(url);
      },
    };
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 1 });

    // Act
    await queue.enqueueBatch([
      { cacheKey: "n:far", url: "n_far_low.png", priority: PARALLAX_LOAD_PRIORITY.NEIGHBOUR, tier: "low", subOrder: 0 },
      { cacheKey: "fx:sigil", url: "fx_sigil.png", priority: PARALLAX_LOAD_PRIORITY.EFFECT, subOrder: 0.72 },
      { cacheKey: "c:close", url: "close.png", priority: PARALLAX_LOAD_PRIORITY.LAYER, subOrder: 0.86 },
      { cacheKey: "z:far_zone", url: "zone_far.png", priority: PARALLAX_LOAD_PRIORITY.ZONE_VARIANT, subOrder: 900 },
      { cacheKey: "c:mid_far", url: "mid_far.png", priority: PARALLAX_LOAD_PRIORITY.LAYER, subOrder: 0.24 },
      { cacheKey: "z:near_zone", url: "zone_near.png", priority: PARALLAX_LOAD_PRIORITY.ZONE_VARIANT, subOrder: 120 },
      { cacheKey: "c:mid", url: "mid.png", priority: PARALLAX_LOAD_PRIORITY.LAYER, subOrder: 0.45 },
      { cacheKey: "c:far", url: "far.png", priority: PARALLAX_LOAD_PRIORITY.FAR, subOrder: 0, fadeInOnReady: false },
    ]);

    // Assert
    expect(startedUrls).toEqual([
      "far.png",
      "mid_far.png",
      "mid.png",
      "close.png",
      "zone_near.png",
      "zone_far.png",
      "fx_sigil.png",
      "n_far_low.png",
    ]);
  });

  it("should enforce concurrency bounded to [1, 2]", async () => {
    // Arrange
    let activeCount = 0;
    let maxObservedActive = 0;
    const gates = new Map<string, Deferred<ParallaxDecodeResult | null>>();
    const decoder: IParallaxTextureDecoder = {
      loadAndDecode(url) {
        activeCount++;
        if (activeCount > maxObservedActive) maxObservedActive = activeCount;
        const d = createDeferred<ParallaxDecodeResult | null>();
        gates.set(url, d);
        return d.promise.finally(() => {
          activeCount--;
        });
      },
    };
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 8 });

    // Act
    const batchPromise = queue.enqueueBatch([
      { cacheKey: "k1", url: "u1.png", priority: PARALLAX_LOAD_PRIORITY.FAR },
      { cacheKey: "k2", url: "u2.png", priority: PARALLAX_LOAD_PRIORITY.LAYER, subOrder: 0.2 },
      { cacheKey: "k3", url: "u3.png", priority: PARALLAX_LOAD_PRIORITY.LAYER, subOrder: 0.5 },
    ]);
    await Promise.resolve();
    const activeBeforeResolve = maxObservedActive;
    gates.get("u1.png")!.resolve(makeDecodeResult("u1"));
    gates.get("u2.png")!.resolve(makeDecodeResult("u2"));
    await Promise.resolve();
    await Promise.resolve();
    gates.get("u3.png")!.resolve(makeDecodeResult("u3"));
    await batchPromise;

    // Assert
    expect(activeBeforeResolve).toBe(2);
    expect(maxObservedActive).toBe(2);
  });

  it("should cancel pending tasks and discard stale in-flight results on generation change", async () => {
    // Arrange
    const released: ParallaxDrawableTexture[] = [];
    const inFlightGate = createDeferred<ParallaxDecodeResult | null>();
    const startedUrls: string[] = [];
    const decoder: IParallaxTextureDecoder = {
      loadAndDecode(url) {
        startedUrls.push(url);
        if (url === "map1_far.png") return inFlightGate.promise;
        return Promise.resolve(makeDecodeResult(url));
      },
      release(tex) {
        released.push(tex);
      },
    };
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 1 });
    const staleFarResult = makeDecodeResult("stale_far");

    // Act
    const p1 = queue.enqueue({ cacheKey: "m1:far", url: "map1_far.png", priority: PARALLAX_LOAD_PRIORITY.FAR });
    const p2 = queue.enqueue({ cacheKey: "m1:mid", url: "map1_mid.png", priority: PARALLAX_LOAD_PRIORITY.LAYER });
    queue.beginGeneration();
    inFlightGate.resolve(staleFarResult);
    const [res1, res2] = await Promise.all([p1, p2]);
    const res3 = await queue.enqueue({ cacheKey: "m2:far", url: "map2_far.png", priority: PARALLAX_LOAD_PRIORITY.FAR });

    // Assert
    expect(res1).toBeNull();
    expect(res2).toBeNull();
    expect(res3).not.toBeNull();
    expect(startedUrls).toEqual(["map1_far.png", "map2_far.png"]);
    expect(released).toEqual([staleFarResult.texture]);
    expect(queue.getTexture("m1:far")).toBeNull();
    expect(queue.getTexture("m2:far")).toBe(res3);
  });

  it("should keep low-tier texture drawable while refining low to high and release replaced low texture", async () => {
    // Arrange
    let fakeNow = 100;
    const released: ParallaxDrawableTexture[] = [];
    const highGate = createDeferred<ParallaxDecodeResult | null>();
    const decoder: IParallaxTextureDecoder = {
      loadAndDecode(url) {
        if (url === "far_low.png") return Promise.resolve(makeDecodeResult("far_low", 512, 256));
        return highGate.promise;
      },
      release(tex) {
        released.push(tex);
      },
    };
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 1, now: () => fakeNow });

    // Act
    const lowTex = await queue.enqueue({
      cacheKey: "courtyard:far",
      url: "far_low.png",
      tier: "low",
      priority: PARALLAX_LOAD_PRIORITY.NEIGHBOUR,
      fadeInOnReady: false,
    });
    const highPromise = queue.enqueue({
      cacheKey: "courtyard:far",
      url: "far_high.png",
      tier: "high",
      priority: PARALLAX_LOAD_PRIORITY.FAR,
      fadeInOnReady: false,
    });
    const duringHighLoad = queue.getTexture("courtyard:far");
    fakeNow = 500;
    highGate.resolve(makeDecodeResult("far_high", 2048, 768));
    const highTex = await highPromise;

    // Assert
    expect(lowTex).not.toBeNull();
    expect(duringHighLoad).toBe(lowTex);
    expect(highTex).not.toBeNull();
    expect(queue.getTexture("courtyard:far")).toBe(highTex);
    expect(queue.getFadeAlpha("courtyard:far", fakeNow)).toBe(1);
    expect(released).toEqual([lowTex!]);
  });

  it("should skip redundant low-tier request when high-tier copy is already cached", async () => {
    // Arrange
    const loadCalls: string[] = [];
    const decoder: IParallaxTextureDecoder = {
      async loadAndDecode(url) {
        loadCalls.push(url);
        return makeDecodeResult(url);
      },
    };
    const queue = new ParallaxLoadQueue({ decoder, concurrency: 1 });
    await queue.enqueue({
      cacheKey: "shared:mid",
      url: "mid_high.png",
      tier: "high",
      priority: PARALLAX_LOAD_PRIORITY.LAYER,
    });

    // Act
    const result = await queue.enqueue({
      cacheKey: "shared:mid",
      url: "mid_low.png",
      tier: "low",
      priority: PARALLAX_LOAD_PRIORITY.NEIGHBOUR,
    });

    // Assert
    expect(loadCalls).toEqual(["mid_high.png"]);
    expect(result).toBe(queue.getTexture("shared:mid"));
  });

  it("should compute 200 ms fade-in alpha deterministically against an injected fake clock", async () => {
    // Arrange
    let fakeNow = 1000;
    const decoder: IParallaxTextureDecoder = {
      async loadAndDecode(url) {
        return makeDecodeResult(url);
      },
    };
    const queue = new ParallaxLoadQueue({
      decoder,
      concurrency: 1,
      now: () => fakeNow,
      fadeDurationMs: 200,
    });

    // Act
    await queue.enqueue({
      cacheKey: "courtyard:var_a",
      url: "var_a.png",
      priority: PARALLAX_LOAD_PRIORITY.LAYER,
      fadeInOnReady: true,
    });
    const alphaAtStart = queue.getFadeAlpha("courtyard:var_a", 1000);
    const alphaAtQuarter = queue.getFadeAlpha("courtyard:var_a", 1050);
    const alphaAtHalf = queue.getFadeAlpha("courtyard:var_a", 1100);
    const alphaAtEnd = queue.getFadeAlpha("courtyard:var_a", 1200);
    const alphaPastEnd = queue.getFadeAlpha("courtyard:var_a", 1450);

    // Assert
    expect(alphaAtStart).toBe(0);
    expect(alphaAtQuarter).toBeCloseTo(0.25, 4);
    expect(alphaAtHalf).toBeCloseTo(0.5, 4);
    expect(alphaAtEnd).toBe(1);
    expect(alphaPastEnd).toBe(1);
  });

  it("should expose world placeholder colours from parallax metas immediately", () => {
    // Arrange & Act
    const courtyard = getWorldPlaceholderColors("courtyard");
    const unknown = getWorldPlaceholderColors("not_a_world");

    // Assert
    expect(courtyard).toEqual({
      top: "#2c1e33",
      bottom: "#d97706",
      silhouette: "#93595a",
    });
    expect(unknown).toBeUndefined();
  });

  it("should decode with createImageBitmap when available and fall back to img.decode when unavailable", async () => {
    // Arrange
    const origImage = (globalThis as { Image?: unknown }).Image;
    const origCreateImageBitmap = (globalThis as { createImageBitmap?: unknown }).createImageBitmap;
    let closedCount = 0;
    let decodeCalled = 0;

    class MockImage {
      public crossOrigin = "";
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      public naturalWidth = 512;
      public naturalHeight = 256;
      public width = 512;
      public height = 256;
      public complete = true;
      private _src = "";
      public get src() {
        return this._src;
      }
      public set src(value: string) {
        this._src = value;
        if (value) queueMicrotask(() => this.onload?.());
      }
      public async decode() {
        decodeCalled++;
      }
    }

    (globalThis as { Image?: unknown }).Image = MockImage;
    (globalThis as { createImageBitmap?: unknown }).createImageBitmap = async () => ({
      width: 512,
      height: 256,
      close() {
        closedCount++;
      },
    });

    try {
      // Act
      const bitmapDecoded = await browserParallaxBitmapDecoder.loadAndDecode("a.png", () => false);
      if (bitmapDecoded) browserParallaxBitmapDecoder.release?.(bitmapDecoded.texture);

      (globalThis as { createImageBitmap?: unknown }).createImageBitmap = undefined;
      const fallbackDecoded = await browserParallaxBitmapDecoder.loadAndDecode("b.png", () => false);

      // Assert
      expect(bitmapDecoded).not.toBeNull();
      expect((bitmapDecoded!.texture as { naturalWidth?: number }).naturalWidth).toBe(512);
      expect(closedCount).toBe(1);
      expect(fallbackDecoded).not.toBeNull();
      expect(decodeCalled).toBe(1);
    } finally {
      (globalThis as { Image?: unknown }).Image = origImage;
      (globalThis as { createImageBitmap?: unknown }).createImageBitmap = origCreateImageBitmap;
    }
  });
});
