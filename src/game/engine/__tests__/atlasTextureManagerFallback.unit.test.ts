import { describe, it, expect } from "bun:test";
import { AtlasTextureManager } from "../atlas";
import type { AtlasMeta, AtlasTextureDeps, AtlasVariants, ReleasableTexture } from "../atlas";
import type { AssetQuality } from "../../types";

const META = { atlas: { columns: 4, rows: 3 } } as unknown as AtlasMeta;

const VARIANTS: AtlasVariants = {
  low: { src: "low.svg", format: "svg", meta: META },
  mid: { src: "mid.svg", format: "svg", meta: META },
  high: { src: "high.png", format: "png", meta: META },
};

const flush = async (): Promise<void> => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

function setup(failing: Set<string>) {
  const quality = { value: "high" as AssetQuality };
  const requested: string[] = [];
  const images = new Map<string, HTMLImageElement>();
  const deps: AtlasTextureDeps = {
    getImage: (url) => images.get(url) ?? null,
    loadImage: async (url) => {
      requested.push(url);
      if (failing.has(url)) return Promise.reject(new Error(`load failed: ${url}`));
      images.set(url, { complete: true, naturalWidth: 400, naturalHeight: 300 } as unknown as HTMLImageElement);
      return undefined;
    },
    loadSvg: async (src): Promise<ReleasableTexture> => {
      requested.push(src);
      if (failing.has(src)) return Promise.reject(new Error(`load failed: ${src}`));
      return { source: {} as CanvasImageSource, width: 400, height: 300, crisp: true, release: () => undefined };
    },
    canLoad: () => true,
    getQuality: () => quality.value,
    onChange: () => undefined,
  };
  const manager = new AtlasTextureManager(deps);
  manager.register({ id: "imp", category: "enemy", variants: VARIANTS });
  return { manager, requested };
}

describe("AtlasTextureManager failed tier fallback", () => {
  it("keeps drawing the active tier, falls back along the chain and never retries the failed tier", async () => {
    // Arrange
    const { manager, requested } = setup(new Set(["low.svg"]));
    await flush();
    expect(manager.getSource("imp")?.tier).toBe("high");

    // Act
    manager.setQuality("low");
    expect(manager.getSource("imp")?.tier).toBe("high");
    await flush();

    // Assert
    expect(requested).toEqual(["high.png", "low.svg", "mid.svg"]);
    expect(manager.getSource("imp")?.tier).toBe("mid");

    manager.setQuality("high");
    await flush();
    manager.setQuality("low");
    await flush();
    for (let frame = 0; frame < 10; frame++) manager.getSource("imp");

    expect(requested.filter((src) => src === "low.svg")).toHaveLength(1);
    expect(manager.getSource("imp")?.tier).toBe("mid");
  });

  it("keeps the old texture when every other tier of the chain fails too", async () => {
    // Arrange
    const { manager, requested } = setup(new Set(["low.svg", "mid.svg"]));
    await flush();

    // Act
    manager.setQuality("low");
    await flush();
    manager.setQuality("low");
    for (let frame = 0; frame < 10; frame++) manager.getSource("imp");
    await flush();

    // Assert
    expect(manager.getSource("imp")?.tier).toBe("high");
    expect(requested.filter((src) => src !== "high.png").sort()).toEqual(["low.svg", "mid.svg"]);
  });
});
