import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { assetLoader } from "../assetLoader";

class MockImage {
  public static created: MockImage[] = [];
  public static autoLoad = true;
  public crossOrigin = "";
  public naturalWidth = 2048;
  public naturalHeight = 768;
  public complete = false;
  public onload: (() => void) | null = null;
  public onerror: (() => void) | null = null;
  private _src = "";
  constructor() {
    MockImage.created.push(this);
  }
  public get src(): string {
    return this._src;
  }
  public set src(v: string) {
    this._src = v;
    if (v && MockImage.autoLoad) this.finish();
  }
  public finish(): void {
    this.complete = true;
    queueMicrotask(() => this.onload?.());
  }
}

describe("assetLoader texture eviction", () => {
  const original = (globalThis as { Image?: unknown }).Image;

  beforeEach(() => {
    MockImage.created = [];
    MockImage.autoLoad = true;
    (globalThis as { Image?: unknown }).Image = MockImage;
  });

  afterEach(() => {
    (globalThis as { Image?: unknown }).Image = original;
  });

  it("evicts a loaded texture, releases the image and reloads on demand", async () => {
    const url = "evict_test_a.png";
    const first = await assetLoader.loadTexture(url);
    expect(assetLoader.isTextureLoaded(url)).toBe(true);

    expect(assetLoader.evictTexture(url)).toBe(true);
    expect(assetLoader.isTextureLoaded(url)).toBe(false);
    expect(first.src).toBe("");

    const second = await assetLoader.loadTexture(url);
    expect(second).not.toBe(first);
    expect(assetLoader.isTextureLoaded(url)).toBe(true);
    assetLoader.evictTexture(url);
  });

  it("reports texture count and estimated decoded bytes", async () => {
    const before = assetLoader.getTextureStats();
    await assetLoader.loadTexture("evict_stats_1.png");
    await assetLoader.loadTexture("evict_stats_2.png");
    const after = assetLoader.getTextureStats();
    expect(after.textureCount - before.textureCount).toBe(2);
    expect(after.decodedBytes - before.decodedBytes).toBe(2 * 2048 * 768 * 4);
    assetLoader.evictTexture("evict_stats_1.png");
    assetLoader.evictTexture("evict_stats_2.png");
  });

  it("does not cache a texture evicted while its load was in flight", async () => {
    MockImage.autoLoad = false;
    const url = "evict_inflight.png";
    const pending = assetLoader.loadTexture(url);
    expect(assetLoader.evictTexture(url)).toBe(true);
    MockImage.created[0].finish();
    await pending;
    expect(assetLoader.isTextureLoaded(url)).toBe(false);
  });

  it("keeps an in-flight texture requested again after the eviction mark", async () => {
    MockImage.autoLoad = false;
    const url = "evict_rerequest.png";
    const pending = assetLoader.loadTexture(url);
    assetLoader.evictTexture(url);
    void assetLoader.loadTexture(url);
    MockImage.created[0].finish();
    await pending;
    expect(assetLoader.isTextureLoaded(url)).toBe(true);
    assetLoader.evictTexture(url);
  });

  it("clears the discard marker when an evicted in-flight load fails", async () => {
    MockImage.autoLoad = false;
    const url = "evict_inflight_fail.png";
    const failing = assetLoader.loadTexture(url);
    expect(assetLoader.evictTexture(url)).toBe(true);
    MockImage.created[0].onerror?.();
    await expect(failing).rejects.toBeDefined();

    MockImage.autoLoad = true;
    await assetLoader.loadTexture(url);
    expect(assetLoader.isTextureLoaded(url)).toBe(true);
    assetLoader.evictTexture(url);
  });

  it("never evicts atlas textures", () => {
    const atlas = assetLoader.getAllAtlases()[0];
    expect(assetLoader.evictTexture(atlas.imageSrc)).toBe(false);
  });
});
