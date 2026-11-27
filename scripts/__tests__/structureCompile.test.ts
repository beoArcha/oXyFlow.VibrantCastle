import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultMetaParser } from "../../src/game/engine/meta/MetaParser";
import { decodePngBuffer } from "../lib/png";
import {
  DEFAULT_OUT_DIR,
  DEFAULT_STRUCTURE_OUT_DIR,
  isStructureDefinition,
  listStructureIds,
  loadSprite,
  outputFiles,
  run,
} from "../sprites/cli";
import { compileStructureSprite } from "../sprites/compileStructure";
import {
  STRUCTURE_ANIMATION_ORDER,
  defineStructureSprite,
  type StructureSpriteDefinition,
} from "../sprites/defineStructureSprite";
import type { PixelCanvas } from "../sprites/pixelCanvas";
import type { RgbaFrameBuffer, StructureAnimationName } from "../sprites/structureTypes";

function makeValidStructure(overrides: Partial<StructureSpriteDefinition> = {}): StructureSpriteDefinition {
  const drawPixel = (scale: number) => (c: PixelCanvas, anim: StructureAnimationName, frame: number): void => {
    const w = c.width;
    const h = c.height;
    const inset = 2 * scale;
    c.rect(inset, inset, w - inset * 2, h - inset, "#556677");
    if (scale === 2) {
      c.rect(inset + 2, inset + 2, w - inset * 2 - 4, 2, "#8899aa");
    }
    const pulse = anim === "off" ? "#223344" : frame % 2 === 0 ? "#2299dd" : "#77eeff";
    c.rect(Math.floor(w / 2) - scale, Math.floor(h / 2) - scale, 2 * scale, 2 * scale, pulse);
  };

  const drawHigh = (buf: RgbaFrameBuffer, anim: StructureAnimationName, frame: number): void => {
    const inset = 8;
    for (let y = inset; y < buf.height; y++) {
      for (let x = inset; x < buf.width - inset; x++) {
        const isCore = Math.abs(x - buf.width / 2) < 6 && Math.abs(y - buf.height / 2) < 6;
        if (isCore) {
          const b = anim === "off" ? 80 : frame % 2 === 0 ? 220 : 255;
          buf.setRgba(x, y, 100, 200, b, 255);
        } else {
          buf.setRgba(x, y, 80, 90, 110, 255);
        }
      }
    }
  };

  return defineStructureSprite({
    id: "test_gate",
    description: "Synthetic test gate structure.",
    hitbox: { width: 48, height: 64 },
    cellSize: {
      hi8bit: { width: 16, height: 20 },
      hi16bit: { width: 32, height: 40 },
      high: { width: 64, height: 80 },
    },
    animations: {
      idle: { frames: 2, fps: 4, loop: true },
      opening: { frames: 3, fps: 8, loop: false },
      on: { frames: 2, fps: 6, loop: true },
      off: { frames: 1, fps: 2, loop: true },
      closing: { frames: 3, fps: 8, loop: false },
    },
    states: {
      idle: { animation: "idle" },
      opening: { animation: "opening" },
      on: { animation: "on" },
      off: { animation: "off" },
      closing: { animation: "closing" },
    },
    infoFrames: { default: 0, idle: 0, opening: 1, on: 2, off: 3, closing: 4 },
    draw: {
      hi8bit: drawPixel(1),
      hi16bit: drawPixel(2),
      high: drawHigh,
    },
    ...overrides,
  });
}

describe("defineStructureSprite validation", () => {
  it("rejects non snake_case ids, missing descriptions and invalid cell sizes", () => {
    const base = makeValidStructure();

    expect(() => defineStructureSprite({ ...base, id: "BadGate" })).toThrow();
    expect(() => defineStructureSprite({ ...base, description: "   " })).toThrow();
    expect(() => defineStructureSprite({ ...base, hitbox: { width: 0, height: 10 } })).toThrow();
    expect(() =>
      defineStructureSprite({
        ...base,
        cellSize: { ...base.cellSize, hi8bit: { width: 12, height: 20 } },
      }),
    ).toThrow();
  });

  it("rejects missing required animations or invalid animation specs", () => {
    const base = makeValidStructure();
    const missingAnims = { ...base.animations } as Partial<StructureSpriteDefinition["animations"]>;
    delete missingAnims.closing;

    expect(() =>
      defineStructureSprite({
        ...base,
        animations: missingAnims as StructureSpriteDefinition["animations"],
      }),
    ).toThrow();

    expect(() =>
      defineStructureSprite({
        ...base,
        animations: { ...base.animations, idle: { frames: 0, fps: 4, loop: true } },
      }),
    ).toThrow();
  });
});

describe("compileStructureSprite", () => {
  it("compiles all three tiers with matching grid roots, PNG dimensions and parsed structure meta", () => {
    // Arrange
    const def = makeValidStructure();
    const expectedCols = 3;
    const expectedRows = STRUCTURE_ANIMATION_ORDER.length;

    // Act
    const compiled = compileStructureSprite(def);
    const meta = JSON.parse(compiled.metaJson) as {
      variants: Record<"low" | "mid" | "high", { file: string; cellWidth: number; cellHeight: number; scale: number }>;
    };
    const parsed = defaultMetaParser.parseStructure(meta);
    const png = decodePngBuffer(compiled.highPng!);

    // Assert
    expect(compiled.warnings).toEqual([]);
    expect(compiled.hi8bitSvg).toContain(
      `viewBox="0 0 ${expectedCols * 16} ${expectedRows * 20}" width="${expectedCols * 16}" height="${expectedRows * 20}"`,
    );
    expect(compiled.hi16bitSvg).toContain(
      `viewBox="0 0 ${expectedCols * 32} ${expectedRows * 40}" width="${expectedCols * 32}" height="${expectedRows * 40}"`,
    );
    expect(png.width).toBe(expectedCols * 64);
    expect(png.height).toBe(expectedRows * 80);

    expect(parsed.info.id).toBe("test_gate");
    expect(parsed.info.entityType).toBe("structure");
    expect(parsed.atlas.columns).toBe(expectedCols);
    expect(parsed.atlas.rows).toBe(expectedRows);
    expect(meta.variants.low.file).toBe("test_gate_hi8bit.svg");
    expect(meta.variants.mid.file).toBe("test_gate_hi16bit.svg");
    expect(meta.variants.high.file).toBe("test_gate_high.png");
    expect(parsed.variants?.variants.low.cellWidth).toBe(16);
    expect(parsed.variants?.variants.mid.cellWidth).toBe(32);
    expect(parsed.variants?.variants.high.cellWidth).toBe(64);
    for (const anim of STRUCTURE_ANIMATION_ORDER) {
      expect(parsed.animations.animations[anim].frames).toBe(def.animations[anim].frames);
    }
  });

  it("is deterministic across repeated compilations", () => {
    const def = makeValidStructure();
    const a = compileStructureSprite(def);
    const b = compileStructureSprite(def);

    expect(a.hi8bitSvg).toBe(b.hi8bitSvg);
    expect(a.hi16bitSvg).toBe(b.hi16bitSvg);
    expect(a.metaJson).toBe(b.metaJson);
    expect(Buffer.compare(a.highPng!, b.highPng!)).toBe(0);
  });

  it("rejects frames that float above the floor, touch outer edges, or duplicate hi8bit at 2x", () => {
    const base = makeValidStructure();

    const floating = makeValidStructure({
      draw: {
        ...base.draw,
        hi8bit: (c) => {
          c.rect(2, 2, c.width - 4, c.height - 4, "#556677");
        },
      },
    });
    expect(() => compileStructureSprite(floating)).toThrow(/floor contact/);

    const edgeTouching = makeValidStructure({
      draw: {
        ...base.draw,
        hi8bit: (c) => {
          c.rect(0, 2, c.width - 2, c.height - 2, "#556677");
        },
      },
    });
    expect(() => compileStructureSprite(edgeTouching)).toThrow(/left edge/);

    const identicalScaled = makeValidStructure({
      draw: {
        ...base.draw,
        hi8bit: (c) => {
          c.rect(2, 2, c.width - 4, c.height - 2, "#556677");
        },
        hi16bit: (c) => {
          c.rect(4, 4, c.width - 8, c.height - 4, "#556677");
        },
      },
    });
    expect(() => compileStructureSprite(identicalScaled)).toThrow(/identical to hi8bit scaled up/);
  });
});

describe("committed structure sprites & CLI", () => {
  it("lists aether_gate and compiles it matching all committed tier files and meta", async () => {
    // Arrange
    const ids = listStructureIds();
    expect(ids).toContain("aether_gate");
    const def = await loadSprite("aether_gate");
    expect(isStructureDefinition(def)).toBe(true);
    if (!isStructureDefinition(def)) return;

    // Act
    const compiled = compileStructureSprite(def);
    const files = outputFiles(def, compiled, DEFAULT_STRUCTURE_OUT_DIR);
    const dir = join(DEFAULT_STRUCTURE_OUT_DIR, "aether_gate");
    const meta = JSON.parse(compiled.metaJson) as {
      atlas: { columns: number; rows: number; cellWidth: number; cellHeight: number };
      animations: Record<string, { row: number; frames: number }>;
      layout: { ordering: string[] };
    };

    // Assert
    expect(files.map((f) => f.path)).toEqual([
      join(dir, "aether_gate_hi8bit.svg"),
      join(dir, "aether_gate_hi16bit.svg"),
      join(dir, "aether_gate_high.png"),
      join(dir, "aether_gate_meta.json"),
    ]);
    expect(meta.layout.ordering).toEqual([...STRUCTURE_ANIMATION_ORDER]);
    expect(meta.atlas.columns).toBe(8);
    expect(meta.atlas.rows).toBe(5);
    expect(readFileSync(join(dir, "aether_gate_meta.json"), "utf8").replace(/\r\n/g, "\n")).toBe(compiled.metaJson);

    const logs: string[] = [];
    const code = await run(["aether_gate", "--check"], (line) => logs.push(line));
    expect(code).toBe(0);
    expect(logs).toEqual([]);
  });

  it("compiles PNG-backed structure and dummy scripts matching all committed SVGs and metas", async () => {
    const targets: Array<[string, string]> = [
      ["chrono_lever", DEFAULT_STRUCTURE_OUT_DIR],
      ["grand_portcullis", DEFAULT_STRUCTURE_OUT_DIR],
      ["hazard_thorns", DEFAULT_STRUCTURE_OUT_DIR],
      ["training_dummy", DEFAULT_OUT_DIR],
    ];
    for (const [id, rootDir] of targets) {
      const def = await loadSprite(id);
      expect(isStructureDefinition(def)).toBe(true);
      if (!isStructureDefinition(def)) continue;
      const compiled = compileStructureSprite(def);
      expect(compiled.highPng).toBeUndefined();
      const files = outputFiles(def, compiled, rootDir);
      const dir = join(rootDir, id);
      expect(files.map((f) => f.path)).toEqual([
        join(dir, `${id}_hi8bit.svg`),
        join(dir, `${id}_hi16bit.svg`),
        join(dir, `${id}_meta.json`),
      ]);
      const logs: string[] = [];
      const code = await run([id, "--check"], (line) => logs.push(line));
      expect(code).toBe(0);
      expect(logs).toEqual([]);
    }
  });
});
