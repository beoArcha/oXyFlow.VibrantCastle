import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { AtlasSpriteRenderer } from "../atlasSpriteRenderer";
import { getAtlasRenderInfo } from "../atlasMetadataResolver";
import type { IAtlasMetaLike } from "../atlasMetadataResolver";
import { assetLoader } from "@game/engine/assetLoader";
import { parseAtlasMeta } from "@game/engine/atlas";
import type { AtlasCategory } from "@game/engine/atlas";

interface DrawCall {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

function createRecordingContext() {
  const draws: DrawCall[] = [];
  const translates: number[] = [];
  const scales: Array<[number, number]> = [];
  const ctx = {
    save: () => undefined,
    restore: () => undefined,
    translate: (x: number) => translates.push(x),
    scale: (x: number, y: number) => scales.push([x, y]),
    drawImage: (_i: unknown, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) =>
      draws.push({ sx, sy, sw, sh, dx, dy, dw, dh }),
    fillRect: () => undefined,
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    globalCompositeOperation: "source-over",
    fillStyle: "#000",
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, draws, translates, scales };
}

let counter = 0;

/** Registers an atlas whose sheet is `width` x `height` px and returns its id. */
function registerSheet(raw: Record<string, unknown>, width: number, height: number, category: AtlasCategory = "enemy"): string {
  const id = `bodybox_${counter++}`;
  const src = `mock://${id}.png`;
  assetLoader.registerAtlas({ id, category, imageSrc: src, meta: parseAtlasMeta(raw, category) });
  const texture = { complete: true, naturalWidth: width, naturalHeight: height } as unknown as HTMLImageElement;
  (assetLoader as unknown as { textureCache: Map<string, HTMLImageElement> }).textureCache.set(src, texture);
  return id;
}

function sheetMeta(origin: "feet" | "center", bodyBox?: { x: number; y: number; w: number; h: number }, spans?: number[]) {
  return {
    entityType: "creature",
    atlas: { columns: 4, rows: 3 },
    naturalFacing: "right",
    animations: {
      idle: { row: 0, frames: 2, fps: 4, loop: true, slotSpan: spans ?? [1, 1], cells: spans ?? [1, 1] },
    },
    layout: {
      origin: { type: origin, normalized: { x: 0.5, y: origin === "feet" ? 1 : 0.55 } },
      ...(bodyBox ? { bodyBox } : {}),
    },
  };
}

const HITBOX = { x: 100, y: 200, width: 40, height: 80 };

describe("AtlasSpriteRenderer body box", () => {
  it("scales the body to the hitbox height and puts its bottom-centre on the hitbox bottom-centre (feet sheet)", () => {
    const id = registerSheet(sheetMeta("feet", { x: 0.1, y: 0.1, w: 0.4, h: 0.8 }), 400, 300);
    const { ctx, draws } = createRecordingContext();

    const rendered = new AtlasSpriteRenderer().render(ctx, { atlasId: id, animationName: "idle", frameIndex: 0, ...HITBOX });

    expect(rendered).toBe(true);
    // cell 100x100, scale = 80 / (0.8 * 100) = 1, anchor (120, 280), body centre x 0.3, feet y 0.9
    expect(draws[0]).toEqual({ sx: 0, sy: 0, sw: 100, sh: 100, dx: 90, dy: 190, dw: 100, dh: 100 });
  });

  it("centres the body on the hitbox centre for centre-origin sheets and honours scaleMultiplier", () => {
    const id = registerSheet(sheetMeta("center", { x: 0.1, y: 0.3, w: 0.4, h: 0.4 }), 400, 300);
    const { ctx, draws } = createRecordingContext();

    new AtlasSpriteRenderer().render(ctx, { atlasId: id, animationName: "idle", frameIndex: 0, ...HITBOX });
    new AtlasSpriteRenderer().render(ctx, { atlasId: id, animationName: "idle", frameIndex: 0, ...HITBOX, scaleMultiplier: 0.5 });

    // scale = 80 / (0.4 * 100) = 2, anchor (120, 240), body centre (0.3, 0.5)
    expect(draws[0]).toEqual({ sx: 0, sy: 0, sw: 100, sh: 100, dx: 60, dy: 140, dw: 200, dh: 200 });
    // half scale: body still centred on the hitbox centre
    expect(draws[1]).toEqual({ sx: 0, sy: 0, sw: 100, sh: 100, dx: 90, dy: 190, dw: 100, dh: 100 });
  });

  it("anchors a two-cell frame by its first cell and extends the extra cell to the right", () => {
    const id = registerSheet(sheetMeta("feet", { x: 0.1, y: 0.1, w: 0.4, h: 0.8 }, [1, 2]), 400, 300);
    const { ctx, draws, translates, scales } = createRecordingContext();

    new AtlasSpriteRenderer().render(ctx, { atlasId: id, animationName: "idle", frameIndex: 1, ...HITBOX, facingLeft: false });

    expect(draws[0]).toEqual({ sx: 100, sy: 0, sw: 200, sh: 100, dx: 90, dy: 190, dw: 200, dh: 100 });
    expect(scales).toHaveLength(0);
    expect(translates).toHaveLength(0);
  });

  it("mirrors a two-cell frame around the hitbox centre when flipped", () => {
    const id = registerSheet(sheetMeta("feet", { x: 0.1, y: 0.1, w: 0.4, h: 0.8 }, [1, 2]), 400, 300);
    const { ctx, draws, translates, scales } = createRecordingContext();

    new AtlasSpriteRenderer().render(ctx, { atlasId: id, animationName: "idle", frameIndex: 1, ...HITBOX, facingLeft: true });

    expect(draws[0].dx).toBe(90);
    expect(draws[0].dw).toBe(200);
    expect(translates).toEqual([120, -120]);
    expect(scales).toEqual([[-1, 1]]);
  });

  it("keeps the legacy heuristic when the meta has no body box", () => {
    const feet = registerSheet(sheetMeta("feet"), 400, 300);
    const centre = registerSheet(sheetMeta("center"), 400, 300);
    const { ctx, draws } = createRecordingContext();
    const renderer = new AtlasSpriteRenderer();

    renderer.render(ctx, { atlasId: feet, animationName: "idle", frameIndex: 0, ...HITBOX, height: 94 });
    renderer.render(ctx, { atlasId: centre, animationName: "idle", frameIndex: 0, ...HITBOX, height: 88 });

    // feet: scale 94 / (100 * 0.94) = 1, anchor (120, 294), anchor.x 0.5 * dw, anchor.y 1 * dh
    expect(draws[0]).toEqual({ sx: 0, sy: 0, sw: 100, sh: 100, dx: 70, dy: 194, dw: 100, dh: 100 });
    // centre: scale 88 / (100 * 0.88) = 1, anchor.y 0.55 -> hitbox centre 244 - 55
    expect(draws[1]).toEqual({ sx: 0, sy: 0, sw: 100, sh: 100, dx: 70, dy: 189, dw: 100, dh: 100 });
  });

  it("reuses the same resolved source and render info across frames", () => {
    const id = registerSheet(sheetMeta("feet", { x: 0.1, y: 0.1, w: 0.4, h: 0.8 }), 400, 300);

    const first = assetLoader.getAtlasSource(id);
    const second = assetLoader.getAtlasSource(id);

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    const meta = first!.meta as unknown as IAtlasMetaLike;
    expect(getAtlasRenderInfo(meta)).toBe(getAtlasRenderInfo(meta));
    expect(getAtlasRenderInfo(meta).body).not.toBeNull();
  });

  it("keys the chroma cache by resolved texture so a replaced texture is not stale", () => {
    const raw = { ...sheetMeta("feet"), backgroundConfig: { removeAtRuntime: true, colorHex: "#00ff00", tolerance: 10 } };
    const renderer = new AtlasSpriteRenderer();
    const keyedSources: unknown[] = [];
    const canvases: Array<{ width: number; height: number }> = [];
    const original = (globalThis as { document?: unknown }).document;
    (globalThis as { document?: unknown }).document = {
      createElement: () => {
        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({
            drawImage: () => undefined,
            getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
            putImageData: () => undefined,
          }),
        };
        canvases.push(canvas);
        return canvas;
      },
    };
    try {
      const idA = registerSheet(raw, 400, 300);
      const idB = registerSheet(raw, 800, 600);
      const { ctx } = createRecordingContext();
      renderer.render(ctx, { atlasId: idA, animationName: "idle", frameIndex: 0, ...HITBOX });
      renderer.render(ctx, { atlasId: idA, animationName: "idle", frameIndex: 0, ...HITBOX });
      renderer.render(ctx, { atlasId: idB, animationName: "idle", frameIndex: 0, ...HITBOX });
      keyedSources.push(...canvases);
    } finally {
      (globalThis as { document?: unknown }).document = original;
    }

    expect(keyedSources).toHaveLength(2);
    expect(canvases.map((c) => c.width)).toEqual([400, 800]);
  });
});

describe("AtlasSpriteRenderer with real metas", () => {
  function pngSize(path: string): { width: number; height: number } {
    const bytes = readFileSync(path);
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }

  function drawEveryFrame(id: string, animations: string[], width: number, height: number): void {
    const renderer = new AtlasSpriteRenderer();
    for (const animation of animations) {
      expect(renderer.hasAnimation(id, animation)).toBe(true);
      for (let frame = 0; frame < 12; frame++) {
        const { ctx, draws } = createRecordingContext();
        expect(renderer.render(ctx, { atlasId: id, animationName: animation, frameIndex: frame, ...HITBOX })).toBe(true);
        const d = draws[0];
        expect(d.sx).toBeGreaterThanOrEqual(0);
        expect(d.sy).toBeGreaterThanOrEqual(0);
        expect(d.sx + d.sw).toBeLessThanOrEqual(width + 1e-6);
        expect(d.sy + d.sh).toBeLessThanOrEqual(height + 1e-6);
        expect(d.dw).toBeGreaterThan(0);
        expect(d.dh).toBeGreaterThan(0);
      }
    }
  }

  const packed: Array<{ id: string; category: AtlasCategory; dir: string; animations: string[] }> = [
    { id: "training_dummy", category: "enemy", dir: "enemies", animations: ["idle", "hit"] },
    { id: "clockwork_owl_gargoyle", category: "enemy", dir: "enemies", animations: ["idle", "fly", "hit"] },
    { id: "aether_gate", category: "structure", dir: "structures", animations: ["inactive", "charging", "activating", "active"] },
  ];

  for (const item of packed) {
    it(`draws every animation the game requests for packed ${item.id} inside the sheet`, () => {
      const base = `src/assets/${item.dir}/${item.id}/${item.id}_packed`;
      const { width, height } = pngSize(`${base}_high.png`);
      const raw = JSON.parse(readFileSync(`${base}_meta.json`, "utf-8")) as Record<string, unknown>;
      const id = registerSheet(raw, width, height, item.category);

      drawEveryFrame(id, item.animations, width, height);
      expect(getAtlasRenderInfo(assetLoader.getAtlasSource(id)!.meta as unknown as IAtlasMetaLike).body).not.toBeNull();
    });
  }

  for (const [tier, cell] of [["nes", 48], ["snes", 96]] as const) {
    it(`draws the compiled sample golem ${tier} sheet inside its texture`, () => {
      const raw = JSON.parse(
        readFileSync("src/game/engine/__tests__/__fixtures__/sample_golem/sample_golem_meta.json", "utf-8")
      ) as Record<string, unknown>;
      const id = registerSheet(raw, 4 * cell, 3 * cell);

      drawEveryFrame(id, ["idle", "move", "walk", "hit"], 4 * cell, 3 * cell);
    });
  }
});
