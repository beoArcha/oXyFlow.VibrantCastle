import { rendererLogger } from "@game/logger/gameLogger";
import { EngineError, ErrorCode } from "@lib/errors";

/**
 * Acquires a 2D rendering context from the provided canvas with hardware acceleration fallback.
 */
export function acquireCanvas2DContext(
  canvas: HTMLCanvasElement,
  isHardwareAccelerated: boolean
): CanvasRenderingContext2D {
  let context: CanvasRenderingContext2D | null = null;

  if (isHardwareAccelerated) {
    try {
      context = canvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
        willReadFrequently: false,
      });
    } catch (err) {
      rendererLogger.warn(
        "Failed to acquire accelerated 2D context, falling back:",
        { mode: "accelerated_2d" },
        err
      );
    }
  }

  if (!context) {
    context =
      canvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false,
      }) || canvas.getContext("2d");
  }

  if (!context) {
    throw new EngineError(
      "Could not acquire 2D context from canvas",
      ErrorCode.ENGINE_CANVAS_CONTEXT_LOST,
      {
        severity: "FATAL",
        details: {
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          isHardwareAccelerated,
        },
      }
    );
  }

  return context;
}
