import { describe, expect, it } from "bun:test";
import { decodePngBuffer } from "../lib/png";
import { compileProp } from "../sprites/compileProp";
import { defineProp, type PixelCanvas, type PropAnchor, type PropSpriteDefinition } from "../sprites/defineProp";
import sampleProp from "../sprites/__fixtures__/sample_prop";

const STONE = "#8c8170";
const RIM = "#d9b766";

/** a 2-pixel-wide column of stone standing on the bottom row (or hanging from the top row when `top`). */
function column(c: PixelCanvas, s: number, detailed: boolean, anchor: PropAnchor): void {
  const y = anchor === "top" ? 0 : 4 * s;
  c.rect(2 * s, y, 4 * s, 12 * s, STONE);
  if (detailed) c.px(5 * s, y + 4 * s, RIM);
}

const columnDraw = {
  hi8bit: (c: PixelCanvas) => column(c, 1, false, "bottom"),
  hi16bit: (c: PixelCanvas) => column(c, 2, true, "bottom"),
};

function propWith(overrides: Partial<PropSpriteDefinition> = {}): PropSpriteDefinition {
  return defineProp({
    id: "test_column",
    description: "A test column.",
    size: { width: 16, height: 32 },
    anchor: "bottom",
    frames: 1,
    fps: 4,
    draw: columnDraw,
    ...overrides,
  });
}

function thrownMessage(action: () => unknown): string {
  try {
    action();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return "";
}

describe("sample prop compilation", () => {
  it("should compile the worked example without warnings", () => {
    // Arrange & Act
    const { warnings } = compileProp(sampleProp);

    // Assert
    expect(warnings).toEqual([]);
  });

  it("should write the meta with the world size, timing, tier variants and glow when compiled", () => {
    // Arrange & Act
    const meta = JSON.parse(compileProp(sampleProp).metaJson);

    // Assert
    expect(meta).toEqual({
      propId: "sample_prop",
      worldWidth: 24,
      worldHeight: 48,
      anchor: "bottom",
      frames: 3,
      fps: 8,
      variants: {
        low: { file: "sample_prop_hi8bit.png", frameWidth: 12, frameHeight: 24 },
        mid: { file: "sample_prop_hi16bit.png", frameWidth: 24, frameHeight: 48 },
      },
      glow: { color: "#ffb347", radius: 72, x: 12, y: 8, flicker: true },
    });
  });

  it("should omit the glow key and default flicker to false when the prop emits no light", () => {
    // Arrange
    const def = propWith();

    // Act
    const meta = JSON.parse(compileProp(def).metaJson);

    // Assert
    expect(meta).not.toHaveProperty("glow");
    expect(meta.variants.low.frameWidth).toBe(8);
  });

  it("should write glow flicker as false when the glow does not flicker", () => {
    // Arrange
    const def = propWith({ glow: { color: "#4fd6c9", radius: 20, x: 8, y: 16 } });

    // Act
    const meta = JSON.parse(compileProp(def).metaJson);

    // Assert
    expect(meta.glow).toEqual({ color: "#4fd6c9", radius: 20, x: 8, y: 16, flicker: false });
  });

  it("should lay the frames in one row per tier when compiled", () => {
    // Arrange & Act
    const compiled = compileProp(sampleProp);

    // Assert
    const low = decodePngBuffer(compiled.hi8bitPng);
    const mid = decodePngBuffer(compiled.hi16bitPng);
    expect([low.width, low.height]).toEqual([3 * 12, 24]);
    expect([mid.width, mid.height]).toEqual([3 * 24, 48]);
  });

  it("should produce identical bytes when the same prop is compiled twice", () => {
    // Arrange
    const first = compileProp(sampleProp);

    // Act
    const second = compileProp(sampleProp);

    // Assert
    expect(Buffer.from(first.hi8bitPng).equals(Buffer.from(second.hi8bitPng))).toBe(true);
    expect(Buffer.from(first.hi16bitPng).equals(Buffer.from(second.hi16bitPng))).toBe(true);
    expect(first.metaJson).toBe(second.metaJson);
  });
});

describe("prop validation failures", () => {
  it("should name both tiers and the frame when a frame is empty", () => {
    // Arrange
    const def = propWith({
      frames: 2,
      draw: {
        hi8bit: (c, frame) => {
          if (frame === 0) column(c, 1, false, "bottom");
        },
        hi16bit: (c, frame) => {
          if (frame === 0) column(c, 2, true, "bottom");
        },
      },
    });

    // Act
    const message = thrownMessage(() => compileProp(def));

    // Assert
    expect(message).toContain("hi-8bit frame 1 is empty");
    expect(message).toContain("hi-16bit frame 1 is empty");
  });

  it("should reject a bottom prop that does not touch the bottom row", () => {
    // Arrange
    const def = propWith({
      draw: {
        hi8bit: (c) => c.rect(2, 2, 4, 10, STONE),
        hi16bit: (c) => c.rect(4, 4, 8, 20, STONE),
      },
    });

    // Act
    const message = thrownMessage(() => compileProp(def));

    // Assert
    expect(message).toContain("hi-8bit frame 0: bottom props must touch the bottom row (y=15)");
    expect(message).toContain("hi-16bit frame 0: bottom props must touch the bottom row (y=31)");
  });

  it("should reject a top prop that does not touch the top row", () => {
    // Arrange
    const def = propWith({
      anchor: "top",
      draw: {
        hi8bit: (c) => column(c, 1, false, "bottom"),
        hi16bit: (c) => column(c, 2, true, "bottom"),
      },
    });

    // Act
    const message = thrownMessage(() => compileProp(def));

    // Assert
    expect(message).toContain("hi-8bit frame 0: top props must touch the top row (y=0)");
    expect(message).toContain("hi-16bit frame 0: top props must touch the top row (y=0)");
  });

  it("should reject opaque pixels on the margin sides that the anchor does not own", () => {
    // Arrange
    const def = propWith({
      draw: {
        hi8bit: (c) => c.rect(0, 4, 8, 12, STONE),
        hi16bit: (c) => {
          c.rect(0, 8, 8, 24, STONE);
          c.px(9, 9, RIM);
        },
      },
    });

    // Act
    const message = thrownMessage(() => compileProp(def));

    // Assert
    expect(message).toContain("hi-8bit frame 0: opaque pixels touch the left edge; keep a 1 px transparent margin.");
    expect(message).toContain("hi-16bit frame 0: opaque pixels touch the left edge");
  });

  it("should reject a hi-16bit frame identical to the hi-8bit frame scaled 2x", () => {
    // Arrange
    const def = propWith({
      draw: {
        hi8bit: (c) => column(c, 1, false, "bottom"),
        hi16bit: (c) => column(c, 2, false, "bottom"),
      },
    });

    // Act
    const message = thrownMessage(() => compileProp(def));

    // Assert
    expect(message).toContain("hi-16bit frame 0 is identical to hi-8bit scaled 2x");
  });

  it("should list every failing tier and frame in one error", () => {
    // Arrange
    const def = propWith({
      frames: 2,
      draw: {
        hi8bit: (c, frame) => (frame === 0 ? c.rect(2, 2, 4, 10, STONE) : c.rect(0, 0, 2, 2, STONE)),
        hi16bit: (c) => c.rect(4, 4, 8, 20, STONE),
      },
    });

    // Act
    const message = thrownMessage(() => compileProp(def));

    // Assert
    expect(message).toContain("hi-8bit frame 0: bottom props must touch the bottom row");
    expect(message).toContain("hi-8bit frame 1: bottom props must touch the bottom row");
    expect(message).toContain("hi-16bit frame 0: bottom props must touch the bottom row");
  });

  it("should name the prop and the frame when a draw function throws", () => {
    // Arrange
    const def = propWith({
      frames: 2,
      draw: {
        hi8bit: (c, frame) => {
          if (frame === 1) c.px(99, 0, STONE);
          else column(c, 1, false, "bottom");
        },
        hi16bit: (c) => column(c, 2, true, "bottom"),
      },
    });

    // Act
    const message = thrownMessage(() => compileProp(def));

    // Assert
    expect(message).toContain('Prop "test_column" hi-8bit frame 1');
  });
});

describe("prop frame warnings", () => {
  it("should warn when two consecutive frames are identical in both tiers", () => {
    // Arrange
    const def = propWith({
      frames: 2,
      draw: {
        hi8bit: (c) => column(c, 1, false, "bottom"),
        hi16bit: (c) => column(c, 2, true, "bottom"),
      },
    });

    // Act
    const { warnings } = compileProp(def);

    // Assert
    expect(warnings).toEqual([
      "hi-8bit frames 0 and 1 are identical; animate the frame or drop one of them.",
      "hi-16bit frames 0 and 1 are identical; animate the frame or drop one of them.",
    ]);
  });
});
