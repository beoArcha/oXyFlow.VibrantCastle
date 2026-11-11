import { describe, expect, it } from "bun:test";
import { measureHorizontalSeam, seamVerdict } from "../parallax/seamMetrics";
import { blankImage, fillRect } from "../atlas/syntheticSheet";

describe("parallax seam metrics", () => {
  it("reports zero difference and pass for an image whose edges match", () => {
    // Arrange
    const image = blankImage(8, 4);
    fillRect(image, { x: 0, y: 0, w: 8, h: 4 }, [40, 50, 60, 255]);

    // Act
    const measurement = measureHorizontalSeam(image);

    // Assert
    expect(measurement.seamDiff).toBe(0);
    expect(measurement.comparedRows).toBe(4);
    expect(seamVerdict(measurement)).toBe("pass");
  });

  it("averages the absolute RGBA difference between the edge columns and warns", () => {
    // Arrange
    const image = blankImage(8, 2);
    fillRect(image, { x: 0, y: 0, w: 1, h: 2 }, [0, 0, 0, 255]);
    fillRect(image, { x: 7, y: 0, w: 1, h: 2 }, [100, 100, 100, 255]);

    // Act
    const measurement = measureHorizontalSeam(image);

    // Assert
    expect(measurement.seamDiff).toBe(75);
    expect(seamVerdict(measurement)).toBe("warn");
  });

  it("ignores rows that are transparent on both edges", () => {
    // Arrange
    const image = blankImage(8, 4);
    fillRect(image, { x: 0, y: 0, w: 1, h: 1 }, [10, 10, 10, 255]);
    fillRect(image, { x: 7, y: 0, w: 1, h: 1 }, [10, 10, 10, 255]);

    // Act
    const measurement = measureHorizontalSeam(image);

    // Assert
    expect(measurement.comparedRows).toBe(1);
    expect(measurement.seamDiff).toBe(0);
  });

  it("counts an opaque pixel facing a transparent one as a full mismatch", () => {
    // Arrange
    const image = blankImage(4, 1);
    fillRect(image, { x: 0, y: 0, w: 1, h: 1 }, [255, 255, 255, 255]);

    // Act
    const measurement = measureHorizontalSeam(image);

    // Assert
    expect(measurement.seamDiff).toBe(255);
    expect(seamVerdict(measurement)).toBe("warn");
  });
});
