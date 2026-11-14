import { describe, expect, it } from "bun:test";
import { decodePngBuffer } from "../lib/png";
import { DEFAULT_HERO_OUT_DIR } from "../sprites/cli";
import { compileHeroSprite } from "../sprites/compileHero";
import { snap565 } from "../sprites/colors";
import { defineHeroSprite } from "../sprites/defineHeroSprite";
import { measure } from "../sprites/frameStats";
import { extractPaintedFrames, footColumn, loadPaintedFiles, paletteOf, renderPaintedHero } from "../sprites/paintedHero";
import { TRANSPARENT } from "../sprites/pixelCanvas";
import { buildPalette, downscale2x, remapColor, thresholdAlpha, unpack } from "../sprites/quantize";
import sampleHero from "../sprites/__fixtures__/sample_hero";
import {
  aPaintedHero,
  BLUE_ROWS,
  HALF_ALPHA_AT,
  MOSTLY_OPAQUE_AT,
  PAINTED_GRID,
  PAINTED_RECTS,
} from "../sprites/__fixtures__/paintedHero";
import { aHero } from "../sprites/__fixtures__/minimalHero";

const render = (def = aPaintedHero()) => renderPaintedHero(def, PAINTED_GRID, loadPaintedFiles(def, DEFAULT_HERO_OUT_DIR));
const compile = (def = aPaintedHero()) => compileHeroSprite(def, DEFAULT_HERO_OUT_DIR);
const frameOf = (anim: string, frame: number) => {
  const files = loadPaintedFiles(aPaintedHero(), DEFAULT_HERO_OUT_DIR);
  const found = extractPaintedFrames(PAINTED_GRID, files).find((f) => f.anim === anim && f.frame === frame);
  if (!found) throw new Error(`no painted frame ${anim}_${frame}`);
  return found;
};
const luma = (rgb: number): number => 0.299 * ((rgb >> 16) & 255) + 0.587 * ((rgb >> 8) & 255) + 0.114 * (rgb & 255);
const WARM_REMAP = [{ hue: [180, 260] as [number, number], toHue: 40, minSaturation: 0.3, minValue: 0.45 }];

describe("painted hero determinism", () => {
  it("should produce identical sheets and meta when compiled twice", () => {
    // Arrange
    const first = compile();

    // Act
    const second = compile();

    // Assert
    expect(Buffer.compare(second.hi8bitPng, first.hi8bitPng)).toBe(0);
    expect(Buffer.compare(second.hi16bitPng, first.hi16bitPng)).toBe(0);
    expect(second.metaJson).toBe(first.metaJson);
  });

  it("should build the same palette whatever the histogram insertion order", () => {
    // Arrange
    const entries: [number, number][] = [[0x102030, 9], [0x304050, 4], [0xa0b0c0, 7], [0xf0e0d0, 2], [0x80ff10, 5], [0x405060, 3]];

    // Act
    const forward = buildPalette(new Map(entries), 3, "hi16bit");
    const backward = buildPalette(new Map([...entries].reverse()), 3, "hi16bit");

    // Assert
    expect(backward).toEqual(forward);
  });
});

describe("painted hero palettes", () => {
  it("should use exactly the requested palette size per tier when the source has more colours", () => {
    // Arrange & Act
    const { hi8bit, hi16bit } = render();

    // Assert (the outline colour is a palette entry, so it adds no colour)
    expect(paletteOf(hi16bit)).toHaveLength(12);
    expect(paletteOf(hi8bit)).toHaveLength(6);
  });

  it("should snap hi-16bit colours to RGB565 and hi-8bit colours to 12-bit", () => {
    // Arrange & Act
    const { hi8bit, hi16bit } = render();

    // Assert
    expect(paletteOf(hi16bit).every((rgb) => snap565(rgb) === rgb)).toBe(true);
    expect(paletteOf(hi8bit).every((rgb) => unpack(rgb).every((channel) => channel % 17 === 0))).toBe(true);
  });

  it("should write PNG sheets whose opaque colours sit at the tier depth", () => {
    // Arrange & Act
    const compiled = compile();

    // Assert
    const opaque = (png: Uint8Array) => {
      const { data } = decodePngBuffer(png);
      const colors: number[] = [];
      for (let i = 0; i < data.length; i += 4) if (data[i + 3] === 255) colors.push((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
      return colors;
    };
    const low = opaque(compiled.hi8bitPng);
    const mid = opaque(compiled.hi16bitPng);
    expect(low.length).toBeGreaterThan(0);
    expect(low.every((rgb) => [rgb >> 16, (rgb >> 8) & 255, rgb & 255].every((c) => c % 17 === 0))).toBe(true);
    expect(mid.every((rgb) => snap565(rgb) === rgb)).toBe(true);
  });
});

describe("painted hero alpha and outline", () => {
  it("should drop pixels below 50 % alpha (the hole is closed by the outline) and keep pixels above it", () => {
    // Arrange
    const frame = frameOf("idle", 0);
    const { grid, hi16bit } = render();
    const canvas = hi16bit.frames.idle[0];
    const left = (grid.anchorX ?? 0) - frame.footX;
    const top = (grid.cell?.height ?? 0) - frame.image.height;

    // Act
    const dropped = canvas.pixelAt(left + HALF_ALPHA_AT[0], top + HALF_ALPHA_AT[1]);
    const kept = canvas.pixelAt(left + MOSTLY_OPAQUE_AT[0], top + MOSTLY_OPAQUE_AT[1]);
    const darkest = paletteOf(hi16bit).reduce((a, b) => (luma(a) <= luma(b) ? a : b));

    // Assert: a dropped pixel is transparent in the base, so the outline pass paints the hole with the outline colour
    expect(dropped).toBe(darkest);
    expect(kept).not.toBe(TRANSPARENT);
    expect(kept).not.toBe(darkest);
    expect(thresholdAlpha({ width: 2, height: 1, data: new Uint8Array([9, 9, 9, 127, 9, 9, 9, 128]) })).toEqual(
      new Int32Array([TRANSPARENT, 0x090909]),
    );
  });

  it("should paint a one pixel outline in the darkest palette colour around the silhouette", () => {
    // Arrange
    const { hi8bit, hi16bit } = render();

    for (const tier of [hi16bit, hi8bit]) {
      const canvas = tier.frames.idle[0];
      const bounds = measure(canvas);
      const darkest = paletteOf(tier).reduce((a, b) => (luma(a) <= luma(b) ? a : b));

      // Act
      const y = (bounds?.maxY ?? 0) - 3;

      // Assert
      expect(canvas.pixelAt(bounds?.minX ?? 0, y)).toBe(darkest);
      expect(canvas.pixelAt(bounds?.maxX ?? 0, y)).toBe(darkest);
    }
  });
});

describe("painted hero placement", () => {
  it("should put the lowest opaque row of every frame on the bottom row in both tiers", () => {
    // Arrange & Act
    const { hi8bit, hi16bit } = render();

    // Assert
    for (const tier of [hi8bit, hi16bit]) {
      for (const canvases of Object.values(tier.frames)) {
        for (const canvas of canvases) expect(measure(canvas)?.maxY).toBe(canvas.height - 1);
      }
    }
  });

  it("should anchor the feet column of every frame, wide ones included, on the same column of the first cell", () => {
    // Arrange
    const { grid, hi16bit } = render();
    const feetMean = (anim: string, frame: number) => {
      const canvas = hi16bit.frames[anim][frame];
      const xs = [...Array(canvas.width).keys()].filter((x) => canvas.pixelAt(x, canvas.height - 1) !== TRANSPARENT);
      return xs.reduce((a, b) => a + b, 0) / xs.length;
    };

    // Act & Assert (odd body widths, so the symmetric outline keeps the mean exact)
    expect(feetMean("idle", 0)).toBe(grid.anchorX);
    expect(feetMean("idle", 1)).toBe(grid.anchorX);
    expect(feetMean("attack", 0)).toBe(grid.anchorX);
  });

  it("should let a wide frame reach into the cells to the right of the body", () => {
    // Arrange
    const { hi16bit } = render();

    // Act
    const bounds = measure(hi16bit.frames.attack[0]);

    // Assert
    expect(hi16bit.frames.attack[0].width).toBe(hi16bit.cell.width * 2);
    expect(bounds?.maxX).toBeGreaterThanOrEqual(hi16bit.cell.width);
  });

  it("should keep hi-16bit at 1:1 and hi-8bit at half size", () => {
    // Arrange
    const painted = frameOf("idle", 0);
    const meta = JSON.parse(compile().metaJson);

    // Act
    const { mid, low } = meta.variants;

    // Assert (the outline adds one pixel per side in hi-16bit... or more; the body itself is unscaled)
    expect(mid.frameRects.idle_0.width).toBe(painted.image.width + 2);
    expect(low.cellWidth * 2).toBe(mid.cellWidth);
    expect(low.cellHeight * 2).toBe(mid.cellHeight);
    expect(mid.scale).toBe(1);
    expect(low.scale).toBe(0.5);
  });

  it("should grow the cell, evenly, when a painted frame is taller than the painted cell", () => {
    // Arrange & Act
    const { grid, hi8bit, hi16bit } = render();
    const cell = grid.cell ?? { width: 0, height: 0 };

    // Assert
    expect(PAINTED_RECTS.idle_1.height).toBeGreaterThan(PAINTED_GRID.packedCell.height);
    expect(cell.height).toBeGreaterThanOrEqual(PAINTED_RECTS.idle_1.height + 4);
    expect(cell.width % 2).toBe(0);
    expect(cell.height % 2).toBe(0);
    expect(hi8bit.cell).toEqual({ width: cell.width / 2, height: cell.height / 2 });
    expect(hi16bit.cell).toEqual(cell);
  });

  it("should write the fixed feet column as the layout origin shared by both tiers", () => {
    // Arrange
    const { grid, hi16bit } = render();

    // Act
    const origin = JSON.parse(compile().metaJson).layout.origin.normalized;

    // Assert
    expect(origin.x).toBeCloseTo((grid.anchorX ?? 0) / hi16bit.cell.width, 4);
    expect(origin.y).toBe(1);
  });

  it("should compute the feet column like the runtime island detector", () => {
    // Arrange: 5x8 frame, the lowest quarter is the last four rows; opaque at x=1 and x=3 there, plus one pixel above
    const data = new Uint8Array(5 * 8 * 4);
    for (const y of [4, 5, 6, 7]) for (const x of [1, 3]) data[(y * 5 + x) * 4 + 3] = 255;
    data[4 * 4 + 3] = 255;

    // Act
    const foot = footColumn({ width: 5, height: 8, data });

    // Assert
    expect(foot).toBe(2);
  });
});

describe("painted hero remap", () => {
  it("should turn vivid blue into warm colours and leave dark navy and greys alone", () => {
    // Arrange & Act
    const blue = unpack(remapColor(0x145aff, WARM_REMAP));
    const navy = remapColor(0x0a0a28, WARM_REMAP);
    const grey = remapColor(0x808080, WARM_REMAP);

    // Assert
    expect(blue[0]).toBeGreaterThan(blue[2]);
    expect(navy).toBe(0x0a0a28);
    expect(grey).toBe(0x808080);
  });

  it("should recolour the blue rows of the sheet before the palette is built", () => {
    // Arrange
    const plain = render();
    const warm = render(aPaintedHero({ remap: WARM_REMAP }));
    const topPixel = (r: ReturnType<typeof render>) => {
      const canvas = r.hi16bit.frames.idle[1];
      const bounds = measure(canvas);
      return unpack(canvas.pixelAt((bounds?.minX ?? 0) + 5, (bounds?.minY ?? 0) + 3));
    };

    // Act
    const before = topPixel(plain);
    const after = topPixel(warm);

    // Assert
    expect(BLUE_ROWS).toBeGreaterThan(3);
    expect(before[2]).toBeGreaterThan(before[0]);
    expect(after[0]).toBeGreaterThan(after[2]);
  });
});

describe("painted hero hooks and contracts", () => {
  it("should run draw hooks after the base so they can paint on top", () => {
    // Arrange
    const calls: string[] = [];
    const def = aPaintedHero({}, {
      hi16bit: (c, anim, frame, span) => {
        calls.push(`${anim}_${frame}x${span}`);
        c.px(1, 1, "#ff00ff");
      },
    });

    // Act
    const { hi16bit } = render(def);

    // Assert
    expect(calls).toEqual(["idle_0x1", "idle_1x1", "attack_0x2"]);
    expect(hi16bit.frames.idle[0].pixelAt(1, 1)).toBe(0xff00ff);
  });

  it("should compile a painted hero without warnings", () => {
    // Arrange & Act
    const compiled = compile();

    // Assert
    expect(compiled.warnings).toEqual([]);
  });

  it("should still compile hand-drawn heroes unchanged", () => {
    // Arrange & Act
    const sample = compile(sampleHero);
    const minimal = compile(aHero());

    // Assert
    expect(sample.warnings).toEqual([]);
    expect(minimal.sheets.hi16bit.cell).toBe(40);
    expect(JSON.parse(minimal.metaJson).variants.low.scale).toBe(0.5);
  });

  it("should reject a hero with neither draw functions nor a painted source", () => {
    // Arrange & Act
    const define = () => defineHeroSprite({ id: "nothing", description: "none" });

    // Assert
    expect(define).toThrow(/needs both draw.hi8bit and draw.hi16bit/);
  });

  it("should reject invalid palette sizes and dithering", () => {
    // Arrange & Act
    const small = () => aPaintedHero({ colors: { hi16bit: 1, hi8bit: 6 } });
    const dithered = () => aPaintedHero({ dither: true as unknown as false });

    // Assert
    expect(small).toThrow(/palette sizes/);
    expect(dithered).toThrow(/dithering is not implemented/);
  });

  it("should halve a frame with exact area averaging", () => {
    // Arrange: two red pixels (100, 200) and two transparent ones
    const data = new Uint8Array([100, 0, 0, 255, 200, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0]);

    // Act
    const half = downscale2x({ width: 2, height: 2, data });

    // Assert
    expect([...half.data]).toEqual([150, 0, 0, 128]);
  });
});
