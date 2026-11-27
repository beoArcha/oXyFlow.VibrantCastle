import { describe, expect, it } from "bun:test";
import { decodePngBuffer, encodePngBuffer } from "../lib/png";
import { blankImage, fillRect } from "../atlas/syntheticSheet";

describe("PNG codec (scripts/lib/png)", () => {
  it("round-trips an RGBA image byte for byte", () => {
    // Arrange
    const image = blankImage(17, 9);
    fillRect(image, { x: 2, y: 1, w: 5, h: 4 }, [10, 20, 30, 255]);
    fillRect(image, { x: 9, y: 3, w: 3, h: 3 }, [200, 100, 50, 77]);

    // Act
    const decoded = decodePngBuffer(encodePngBuffer(image));

    // Assert
    expect(decoded.width).toBe(17);
    expect(decoded.height).toBe(9);
    expect(Array.from(decoded.data)).toEqual(Array.from(image.data));
  });

  it("encodes deterministically", () => {
    // Arrange
    const image = blankImage(8, 8);
    fillRect(image, { x: 1, y: 1, w: 4, h: 4 });

    // Act
    const first = encodePngBuffer(image);
    const second = encodePngBuffer(image);

    // Assert
    expect(first.equals(second)).toBe(true);
  });

  it("rejects data that is not a PNG", () => {
    // Arrange
    const garbage = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Act & Assert
    expect(() => decodePngBuffer(garbage)).toThrow();
  });

  it("round-trips RGB colorType 2 with adaptive filtering and no alpha", () => {
    // Arrange
    const image = blankImage(12, 6);
    fillRect(image, { x: 0, y: 0, w: 12, h: 6 }, [40, 80, 120, 255]);
    fillRect(image, { x: 2, y: 1, w: 4, h: 3 }, [200, 110, 30, 255]);

    // Act
    const encoded = encodePngBuffer(image, { colorType: 2, adaptiveFilter: true });
    const decoded = decodePngBuffer(encoded);

    // Assert
    expect(encoded[25]).toBe(2);
    expect(Array.from(decoded.data)).toEqual(Array.from(image.data));
  });

  it("round-trips indexed colorType 3 with PLTE and tRNS deterministically", () => {
    // Arrange
    const image = blankImage(10, 6);
    fillRect(image, { x: 1, y: 1, w: 4, h: 3 }, [12, 34, 56, 255]);
    fillRect(image, { x: 5, y: 2, w: 3, h: 3 }, [210, 140, 60, 128]);

    // Act
    const first = encodePngBuffer(image, { colorType: 3 });
    const second = encodePngBuffer(image, { colorType: 3 });
    const decoded = decodePngBuffer(first);

    // Assert
    expect(first[25]).toBe(3);
    expect(first.equals(second)).toBe(true);
    expect(Array.from(decoded.data)).toEqual(Array.from(image.data));
  });
});
