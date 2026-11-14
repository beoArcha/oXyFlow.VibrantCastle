import { describe, expect, it } from "bun:test";
import { defineProp, type PixelCanvas, type PropSpriteDefinition } from "../sprites/defineProp";
import sampleProp from "../sprites/__fixtures__/sample_prop";

const noop = (_c: PixelCanvas) => undefined;

function thrownMessage(action: () => unknown): string {
  try {
    action();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return "";
}

const validBase = (): PropSpriteDefinition => ({
  id: "test_prop",
  description: "A test prop.",
  size: { width: 16, height: 32 },
  anchor: "bottom",
  frames: 2,
  fps: 6,
  draw: { hi8bit: noop, hi16bit: noop },
});

describe("defineProp shape validation", () => {
  it("should accept the worked example when it is defined", () => {
    // Arrange & Act
    const def = defineProp(sampleProp);

    // Assert
    expect(def.id).toBe("sample_prop");
  });

  it("should reject an odd width because the hi-8bit frame would be half a pixel", () => {
    // Arrange
    const def = { ...validBase(), size: { width: 15, height: 32 } };

    // Act
    const message = thrownMessage(() => defineProp(def));

    // Assert
    expect(message).toContain("size.width 15 must be a positive even whole number");
  });

  it("should reject a zero height", () => {
    // Arrange
    const def = { ...validBase(), size: { width: 16, height: 0 } };

    // Act
    const message = thrownMessage(() => defineProp(def));

    // Assert
    expect(message).toContain("size.height 0 must be a positive even whole number");
  });

  it("should reject an anchor outside bottom, top and center", () => {
    // Arrange
    const def = { ...validBase(), anchor: "side" as PropSpriteDefinition["anchor"] };

    // Act
    const message = thrownMessage(() => defineProp(def));

    // Assert
    expect(message).toContain('anchor "side" must be "bottom", "top" or "center"');
  });

  it("should reject a frame count of zero or more than twelve", () => {
    // Arrange
    const tooMany = { ...validBase(), frames: 13 };
    const none = { ...validBase(), frames: 0 };

    // Act
    const messages = [thrownMessage(() => defineProp(tooMany)), thrownMessage(() => defineProp(none))];

    // Assert
    expect(messages[0]).toContain("frames 13 must be a whole number from 1 to 12");
    expect(messages[1]).toContain("frames 0 must be a whole number from 1 to 12");
  });

  it("should reject a non-positive fps", () => {
    // Arrange
    const def = { ...validBase(), fps: 0 };

    // Act
    const message = thrownMessage(() => defineProp(def));

    // Assert
    expect(message).toContain("fps 0 must be greater than 0");
  });

  it("should reject an id that is not snake_case", () => {
    // Arrange
    const def = { ...validBase(), id: "Hanging-Lantern" };

    // Act
    const message = thrownMessage(() => defineProp(def));

    // Assert
    expect(message).toContain('id "Hanging-Lantern" must be snake_case');
  });

  it("should reject a glow with a bad colour, a zero radius or a centre outside the sprite", () => {
    // Arrange
    const def = { ...validBase(), glow: { color: "orange", radius: 0, x: 16, y: 4 } };

    // Act
    const message = thrownMessage(() => defineProp(def));

    // Assert
    expect(message).toContain('glow.color "orange" must be "#rgb" or "#rrggbb"');
    expect(message).toContain("glow.radius 0 must be greater than 0");
    expect(message).toContain("glow.x 16 must lie inside the sprite (0..15)");
  });

  it("should reject a prop without both draw functions", () => {
    // Arrange
    const def = { ...validBase(), draw: { hi8bit: noop } } as unknown as PropSpriteDefinition;

    // Act
    const message = thrownMessage(() => defineProp(def));

    // Assert
    expect(message).toContain("needs draw.hi16bit(c, frame)");
  });
});
