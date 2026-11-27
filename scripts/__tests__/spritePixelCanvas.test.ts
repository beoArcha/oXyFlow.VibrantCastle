import { describe, expect, it } from "bun:test";
import { PixelCanvas, TRANSPARENT } from "../sprites/pixelCanvas";

function opaqueCount(c: PixelCanvas): number {
  return c.data.filter((v) => v !== TRANSPARENT).length;
}

describe("PixelCanvas", () => {
  it("should paint a single pixel when px is called inside the cell", () => {
    // Arrange
    const c = new PixelCanvas(4, 4);

    // Act
    c.px(1, 2, "#f00");

    // Assert
    expect(c.pixelAt(1, 2)).toBe(0xff0000);
    expect(opaqueCount(c)).toBe(1);
  });

  it("should fill exactly w*h pixels when rect is called", () => {
    // Arrange
    const c = new PixelCanvas(8, 8);

    // Act
    c.rect(2, 3, 3, 2, "#0f0");

    // Assert
    expect(opaqueCount(c)).toBe(6);
    expect(c.pixelAt(4, 4)).toBe(0x00ff00);
  });

  it("should include both endpoints when a diagonal line is drawn", () => {
    // Arrange
    const c = new PixelCanvas(8, 8);

    // Act
    c.line(0, 0, 5, 5, "#fff");

    // Assert
    expect(opaqueCount(c)).toBe(6);
    expect(c.pixelAt(5, 5)).toBe(0xffffff);
  });

  it("should draw a symmetric filled disc when ellipse has equal radii", () => {
    // Arrange
    const c = new PixelCanvas(9, 9);

    // Act
    c.ellipse(4, 4, 3, 3, "#fff");

    // Assert
    expect(c.pixelAt(4, 4)).not.toBe(TRANSPARENT);
    expect(c.pixelAt(1, 4)).not.toBe(TRANSPARENT);
    expect(c.pixelAt(4, 7)).not.toBe(TRANSPARENT);
    expect(c.pixelAt(0, 0)).toBe(TRANSPARENT);
  });

  it("should fill the interior when polygon is a square", () => {
    // Arrange
    const c = new PixelCanvas(8, 8);

    // Act
    c.polygon([[1, 1], [5, 1], [5, 5], [1, 5]], "#fff");

    // Assert
    expect(c.pixelAt(3, 3)).not.toBe(TRANSPARENT);
    expect(c.pixelAt(6, 6)).toBe(TRANSPARENT);
  });

  it("should make pixels transparent when clear is called on a painted area", () => {
    // Arrange
    const c = new PixelCanvas(4, 4);
    c.rect(0, 0, 4, 4, "#fff");

    // Act
    c.clear(1, 1, 2, 2);

    // Assert
    expect(opaqueCount(c)).toBe(12);
  });

  it("should paint only edge-adjacent transparent pixels when outline is called", () => {
    // Arrange
    const c = new PixelCanvas(5, 5);
    c.px(2, 2, "#fff");

    // Act
    c.outline("#000");

    // Assert
    expect(opaqueCount(c)).toBe(5);
    expect(c.pixelAt(1, 1)).toBe(TRANSPARENT);
    expect(c.pixelAt(2, 1)).toBe(0x000000);
  });

  it("should not paint outside the cell when outline is called on an edge pixel", () => {
    // Arrange
    const c = new PixelCanvas(3, 3);
    c.px(0, 0, "#fff");

    // Act
    c.outline("#000");

    // Assert
    expect(opaqueCount(c)).toBe(3);
  });

  it("should flip rows horizontally when mirrorX is called", () => {
    // Arrange
    const c = new PixelCanvas(4, 1);
    c.px(0, 0, "#f00");

    // Act
    c.mirrorX();

    // Assert
    expect(c.pixelAt(3, 0)).toBe(0xff0000);
    expect(c.pixelAt(0, 0)).toBe(TRANSPARENT);
  });

  it("should copy only opaque part pixels when stamp is called", () => {
    // Arrange
    const c = new PixelCanvas(6, 6);
    const part = c.part(2, 2);
    part.px(0, 0, "#0f0");

    // Act
    c.stamp(part, 3, 3);

    // Assert
    expect(c.pixelAt(3, 3)).toBe(0x00ff00);
    expect(opaqueCount(c)).toBe(1);
  });

  it("should name the call and coordinates when rect leaves the cell", () => {
    // Arrange
    const c = new PixelCanvas(10, 10);

    // Act
    const draw = () => c.rect(8, 2, 5, 3, "#fff");

    // Assert
    expect(draw).toThrow(/rect\(8, 2, 5, 3\).*x 8\.\.12, y 2\.\.4/);
  });

  it("should throw when stamp pushes an opaque pixel outside the cell", () => {
    // Arrange
    const c = new PixelCanvas(4, 4);
    const part = c.part(2, 2);
    part.rect(0, 0, 2, 2, "#fff");

    // Act
    const draw = () => c.stamp(part, 3, 0);

    // Assert
    expect(draw).toThrow(/stamp\(part, 3, 0\)/);
  });

  it("should throw when a coordinate is not an integer", () => {
    // Arrange
    const c = new PixelCanvas(4, 4);

    // Act
    const draw = () => c.px(1.5, 1, "#fff");

    // Assert
    expect(draw).toThrow(/integers/);
  });

  it("should throw when a colour string is malformed", () => {
    // Arrange
    const c = new PixelCanvas(4, 4);

    // Act
    const draw = () => c.px(1, 1, "red");

    // Assert
    expect(draw).toThrow(/Invalid colour/);
  });
});
