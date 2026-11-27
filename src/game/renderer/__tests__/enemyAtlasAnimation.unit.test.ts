import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { EnemyRenderer } from "../enemyRenderer";
import { AtlasSpriteRenderer } from "../atlasSpriteRenderer";
import { assetLoader } from "@game/engine/assetLoader";
import type { AtlasMeta } from "@game/engine/atlas/atlasTypes";
import { hasAnimationTrack, resolveEffectiveFrameCount, IAtlasMetaLike } from "../atlasMetadataResolver";
import { Enemy } from "@game/types";
import { createMockContext2D as createMockContext } from "@test-utils";
import { createMockEnemy } from "@test-utils/mockEntities";

interface Captured {
  atlasId: string;
  animationName: string;
  ticks?: number;
}

function createRenderer(atlases: Record<string, string[]>) {
  const calls: Captured[] = [];
  const atlasRenderer = {
    hasAtlas: (id: string) => id in atlases,
    hasAnimation: (id: string, name: string) => !!atlases[id] && atlases[id].includes(name),
    render: (_ctx: unknown, o: Captured) => {
      calls.push({ atlasId: o.atlasId, animationName: o.animationName, ticks: o.ticks });
      return true;
    },
    renderRegion: () => false,
    getBodyAspect: () => 0,
  };
  return { renderer: new EnemyRenderer(atlasRenderer), calls };
}

function drawOne(renderer: EnemyRenderer, enemy: Enemy, tick = 999): void {
  renderer.render(createMockContext(), [enemy], tick);
}

describe("EnemyRenderer atlas priority", () => {
  it("prefers enemy.atlasId over templateId and legacy fallbacks", () => {
    const { renderer, calls } = createRenderer({
      a: ["idle"],
      b: ["idle"],
      clockwork_owl_gargoyle: ["idle"],
    });

    drawOne(renderer, createMockEnemy({ atlasId: "a", templateId: "b", isAerial: true }));

    expect(calls[0].atlasId).toBe("a");
  });

  it("uses templateId when atlasId is unregistered", () => {
    const { renderer, calls } = createRenderer({ b: ["idle"] });

    drawOne(renderer, createMockEnemy({ atlasId: "missing", templateId: "b" }));

    expect(calls[0].atlasId).toBe("b");
  });

  it("keeps legacy dummy and aerial fallbacks", () => {
    const { renderer, calls } = createRenderer({
      training_dummy: ["idle"],
      clockwork_owl_gargoyle: ["fly"],
    });

    drawOne(renderer, createMockEnemy({ isDummy: true, templateId: "x" }));
    drawOne(renderer, createMockEnemy({ isAerial: true, templateId: "y", animationState: "fly" }));

    expect(calls.map((c) => c.atlasId)).toEqual(["training_dummy", "clockwork_owl_gargoyle"]);
  });
});

describe("EnemyRenderer animation resolution", () => {
  it("passes simulation state and clock through unchanged when the track exists", () => {
    const { renderer, calls } = createRenderer({ a: ["idle", "move", "hit"] });

    drawOne(renderer, createMockEnemy({ atlasId: "a", animationState: "move", animationTicks: 42 }));

    expect(calls[0]).toEqual({ atlasId: "a", animationName: "move", ticks: 42 });
  });

  it("falls back move -> idle", () => {
    const { renderer, calls } = createRenderer({ a: ["idle"] });

    drawOne(renderer, createMockEnemy({ atlasId: "a", animationState: "move" }));

    expect(calls[0].animationName).toBe("idle");
  });

  it("falls back fly -> idle", () => {
    const { renderer, calls } = createRenderer({ a: ["idle"] });

    drawOne(renderer, createMockEnemy({ atlasId: "a", isAerial: true, animationState: "fly" }));

    expect(calls[0].animationName).toBe("idle");
  });

  it("falls back hit -> current base animation", () => {
    const { renderer, calls } = createRenderer({ a: ["idle", "move"], g: ["idle", "fly"] });

    drawOne(renderer, createMockEnemy({ atlasId: "a", vx: 2, animationState: "hit", damageTimer: 5 }));
    drawOne(renderer, createMockEnemy({ atlasId: "g", isAerial: true, animationState: "hit", damageTimer: 5 }));

    expect(calls.map((c) => c.animationName)).toEqual(["move", "fly"]);
  });

  it("falls back hit -> idle when the base animation is missing too", () => {
    const { renderer, calls } = createRenderer({ a: ["idle"] });

    drawOne(renderer, createMockEnemy({ atlasId: "a", vx: 2, animationState: "hit", damageTimer: 5 }));

    expect(calls[0].animationName).toBe("idle");
  });

  it("requests hit for aerial enemies", () => {
    const { renderer, calls } = createRenderer({ a: ["fly", "hit"] });

    drawOne(renderer, createMockEnemy({ atlasId: "a", isAerial: true, animationState: "hit", damageTimer: 5 }));

    expect(calls[0].animationName).toBe("hit");
  });
});

describe("zero-span frame handling", () => {
  it("counts only leading non-zero slotSpan entries, capped by frames", () => {
    expect(resolveEffectiveFrameCount({ frames: 6, slotSpan: [1, 2, 0, 0, 0, 0] })).toBe(2);
    expect(resolveEffectiveFrameCount({ frames: 2, slotSpan: [1, 1, 1, 1] })).toBe(2);
    expect(resolveEffectiveFrameCount({ frames: 4, cells: [1, 1, 0, 1] })).toBe(2);
    expect(resolveEffectiveFrameCount({ frames: 4 })).toBe(4);
    expect(resolveEffectiveFrameCount({ frames: 3, frameIndices: [0, 1, 2], slotSpan: [0, 0, 0] })).toBe(3);
  });

  it("treats a track whose first span is zero as missing", () => {
    const meta: IAtlasMetaLike = {
      animations: { idle: { frames: 2, slotSpan: [1, 1] }, hit: { frames: 2, slotSpan: [0, 0] } },
    };

    expect(hasAnimationTrack(meta, "idle")).toBe(true);
    expect(hasAnimationTrack(meta, "hit")).toBe(false);
    expect(hasAnimationTrack(meta, "nope")).toBe(false);
  });

  it("resolves states aliases and layout tracks in hasAnimationTrack", () => {
    const meta: IAtlasMetaLike = {
      states: { inactive: { animation: "idle" } },
      animations: { idle: { frames: 1 } },
      layout: { walk: { frames: 4 } },
    };

    expect(hasAnimationTrack(meta, "inactive")).toBe(true);
    expect(hasAnimationTrack(meta, "walk")).toBe(true);
  });
});

describe("legacy animation names", () => {
  it("leaves no legacy gargoyle hit animation name in src", () => {
    const legacyName = ["gargoyle", "hit"].join("_");
    const hits: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx|json)$/.test(name) && readFileSync(p, "utf8").includes(legacyName)) hits.push(p);
      }
    };

    walk(join(process.cwd(), "src"));

    expect(hits).toEqual([]);
  });
});

describe("EnemyRenderer consecutive frame playback and flicker prevention", () => {
  const textureCacheOf = (loader: typeof assetLoader) =>
    (loader as unknown as { textureCache: Map<string, HTMLImageElement> }).textureCache;

  it("advances PNG-animated frames over ticks and draws every consecutive frame for clockwork_owl_gargoyle", () => {
    const packedMeta = JSON.parse(
      readFileSync("src/assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_packed_meta.json", "utf-8")
    ) as AtlasMeta;
    const atlasId = "test_owl_packed_anim";
    assetLoader.registerAtlas({
      id: atlasId,
      category: "enemy",
      imageSrc: "mock://owl_packed.png",
      meta: packedMeta,
    });
    textureCacheOf(assetLoader).set("mock://owl_packed.png", {
      complete: true,
      naturalWidth: 2114,
      naturalHeight: 1270,
      width: 2114,
      height: 1270,
    } as unknown as HTMLImageElement);

    const spriteRenderer = new AtlasSpriteRenderer();
    const renderer = new EnemyRenderer(spriteRenderer);
    const draws: Array<{ sx: number; sy: number; sw: number; sh: number }> = [];
    const fillRects: Array<{ x: number; y: number; w: number; h: number }> = [];
    const ctx = {
      ...createMockContext(),
      drawImage: (_img: unknown, sx: number, sy: number, sw: number, sh: number) => {
        draws.push({ sx, sy, sw, sh });
      },
      fillRect: (x: number, y: number, w: number, h: number) => {
        fillRects.push({ x, y, w, h });
      },
    } as unknown as CanvasRenderingContext2D;

    const owl = createMockEnemy({
      atlasId,
      isAerial: true,
      animationState: "fly",
      health: 50,
      maxHealth: 75,
    });

    for (const tick of [0, 8, 16, 24]) {
      owl.animationTicks = tick;
      renderer.render(ctx, [owl], tick);
    }

    expect(draws.length).toBe(4);
    expect(draws.map((d) => d.sx)).toEqual([0, 302, 604, 906]);
    // Damaged health bar (2 fillRect calls per frame: backdrop + fill) must be drawn on every consecutive frame.
    expect(fillRects.length).toBe(8);
  });

  it("draws the full cell on every consecutive frame for 1-column hi8bit enemies without box flicker", () => {
    const atlasId = "test_owl_hi8bit_1col";
    const normalized1ColMeta = {
      atlas: { columns: 1, rows: 5, cellWidth: 196, cellHeight: 229 },
      animations: {
        fly: { row: 0, frames: 1, fps: 9, loop: true, startCol: 0, slotSpan: [1], cells: [1] },
      },
      states: { fly: { animation: "fly" } },
    } as unknown as AtlasMeta;

    assetLoader.registerAtlas({
      id: atlasId,
      category: "enemy",
      imageSrc: "mock://owl_hi8bit.png",
      meta: normalized1ColMeta,
    });
    textureCacheOf(assetLoader).set("mock://owl_hi8bit.png", {
      complete: true,
      naturalWidth: 192,
      naturalHeight: 960,
      width: 192,
      height: 960,
    } as unknown as HTMLImageElement);

    const spriteRenderer = new AtlasSpriteRenderer();
    const renderer = new EnemyRenderer(spriteRenderer);
    const draws: Array<{ sx: number; sy: number; sw: number; sh: number }> = [];
    const ctx = {
      ...createMockContext(),
      drawImage: (_img: unknown, sx: number, sy: number, sw: number, sh: number) => {
        draws.push({ sx, sy, sw, sh });
      },
    } as unknown as CanvasRenderingContext2D;

    const owl = createMockEnemy({ atlasId, isAerial: true, animationState: "fly" });
    for (let tick = 0; tick < 6; tick++) {
      owl.animationTicks = tick * 8;
      renderer.render(ctx, [owl], tick * 8);
    }

    expect(draws.length).toBe(6);
    for (const d of draws) {
      expect(d.sx).toBe(0);
      expect(d.sy).toBe(0);
      expect(d.sw).toBe(192);
      expect(d.sh).toBe(192);
    }
  });
});
