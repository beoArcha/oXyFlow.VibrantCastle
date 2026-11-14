import { describe, it, expect } from "bun:test";
import { acquireCanvas2DContext } from "../canvasContextAcquisition";

interface RecordingCanvas {
  canvas: HTMLCanvasElement;
  requests: unknown[];
}

function recordingCanvas(): RecordingCanvas {
  const requests: unknown[] = [];
  const context = {} as CanvasRenderingContext2D;
  const canvas = {
    width: 1000,
    height: 625,
    getContext: (_kind: string, options?: unknown) => {
      requests.push(options);
      return context;
    },
  } as unknown as HTMLCanvasElement;
  return { canvas, requests };
}

describe("acquireCanvas2DContext", () => {
  it("should never request a desynchronized context when hardware acceleration is on", () => {
    // Arrange
    const { canvas, requests } = recordingCanvas();

    // Act
    acquireCanvas2DContext(canvas, true);

    // Assert
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.filter((o) => typeof o === "object" && o !== null && "desynchronized" in o)).toEqual([]);
  });

  it("should request an opaque context when hardware acceleration is on", () => {
    // Arrange
    const { canvas, requests } = recordingCanvas();

    // Act
    acquireCanvas2DContext(canvas, true);

    // Assert
    expect(requests[0]).toMatchObject({ alpha: false });
  });
});
