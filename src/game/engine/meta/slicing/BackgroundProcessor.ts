import { IAtlasBackgroundConfig } from "../types";

export interface IPixelBuffer {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray | Uint8Array;
}

export interface ColorRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface BackgroundDetectionResult {
  colorHex: string;
  isTransparent: boolean;
  sampleCount: number;
}

/**
 * BackgroundProcessor: Pure algorithms for color sampling, chroma-keying,
 * threshold filtering, and background color detection on pixel buffers.
 * Zero DOM dependencies for full headless testability in Bun/Node while fully compatible with browser ImageData.
 */
export class BackgroundProcessor {
  /**
   * Converts a hex color string (#RGB, #RRGGBB) to numeric RGB components.
   */
  public static hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      clean = clean
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) {
      return { r: 0, g: 0, b: 0 };
    }
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  /**
   * Converts RGB components to a standard #RRGGBB hex string.
   */
  public static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => {
      const clamped = Math.max(0, Math.min(255, Math.round(c)));
      return clamped.toString(16).padStart(2, "0");
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Euclidean color distance in RGB space normalized to a 0–100 scale.
   */
  public static colorDistance(
    c1: { r: number; g: number; b: number },
    c2: { r: number; g: number; b: number }
  ): number {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    // Max theoretical distance in RGB space is sqrt(255^2 * 3) ~= 441.67
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    return (dist / 441.67) * 100;
  }

  /**
   * Samples a pixel from a pixel buffer at integer coordinate (x, y).
   */
  public static sampleColor(buffer: IPixelBuffer, x: number, y: number): { hex: string; rgba: ColorRGBA } {
    const px = Math.max(0, Math.min(buffer.width - 1, Math.floor(x)));
    const py = Math.max(0, Math.min(buffer.height - 1, Math.floor(y)));
    const offset = (py * buffer.width + px) * 4;

    const r = buffer.data[offset];
    const g = buffer.data[offset + 1];
    const b = buffer.data[offset + 2];
    const a = buffer.data[offset + 3];

    return {
      hex: BackgroundProcessor.rgbToHex(r, g, b),
      rgba: { r, g, b, a },
    };
  }

  /**
   * Detects the dominant background color by sampling perimeter pixels
   * (four corners and edge midpoints).
   */
  public static detectDominantBackground(buffer: IPixelBuffer): BackgroundDetectionResult {
    const w = buffer.width;
    const h = buffer.height;
    if (w <= 0 || h <= 0) {
      return { colorHex: "#000000", isTransparent: true, sampleCount: 0 };
    }

    const sampleCoords = [
      [0, 0],
      [w - 1, 0],
      [0, h - 1],
      [w - 1, h - 1],
      [Math.floor(w / 2), 0],
      [Math.floor(w / 2), h - 1],
      [0, Math.floor(h / 2)],
      [w - 1, Math.floor(h / 2)],
    ];

    let transparentCount = 0;
    const colorVotes = new Map<string, number>();

    sampleCoords.forEach(([x, y]) => {
      const { hex, rgba } = BackgroundProcessor.sampleColor(buffer, x, y);
      if (rgba.a < 15) {
        transparentCount++;
      } else {
        colorVotes.set(hex, (colorVotes.get(hex) || 0) + 1);
      }
    });

    if (transparentCount >= sampleCoords.length / 2) {
      return { colorHex: "#000000", isTransparent: true, sampleCount: sampleCoords.length };
    }

    let dominantHex = "#000000";
    let maxVotes = -1;
    colorVotes.forEach((votes, hex) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        dominantHex = hex;
      }
    });

    return {
      colorHex: dominantHex,
      isTransparent: false,
      sampleCount: sampleCoords.length,
    };
  }

  /**
   * Applies Chroma Keying to a pixel buffer:
   * Replaces pixels close to targetColorHex with transparent pixels (alpha = 0).
   * Softens edges within a small falloff range to prevent jagged halos.
   * Returns a new mutated or copy of pixel buffer.
   */
  public static applyChromaKey(
    buffer: IPixelBuffer,
    targetColorHex: string,
    tolerance = 15,
    feather = 5
  ): IPixelBuffer {
    const target = BackgroundProcessor.hexToRgb(targetColorHex);
    const outputData = new Uint8ClampedArray(buffer.data);
    const totalPixels = buffer.width * buffer.height;

    const tol = Math.max(0, tolerance);
    const feath = Math.max(0, feather);
    const innerThreshold = tol;
    const outerThreshold = tol + feath;

    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 4;
      const currentAlpha = outputData[offset + 3];
      if (currentAlpha === 0) continue;

      const r = outputData[offset];
      const g = outputData[offset + 1];
      const b = outputData[offset + 2];

      const dist = BackgroundProcessor.colorDistance({ r, g, b }, target);

      if (dist <= innerThreshold) {
        // Full transparency
        outputData[offset + 3] = 0;
      } else if (dist < outerThreshold && feath > 0) {
        // Smooth falloff factor between 0.0 and 1.0
        const factor = (dist - innerThreshold) / feath;
        outputData[offset + 3] = Math.round(currentAlpha * factor);
      }
    }

    return {
      width: buffer.width,
      height: buffer.height,
      data: outputData,
    };
  }

  /**
   * Helper factory to create a pure in-memory IPixelBuffer.
   */
  public static createPixelBuffer(width: number, height: number, fillHex?: string): IPixelBuffer {
    const data = new Uint8ClampedArray(width * height * 4);
    if (fillHex) {
      const rgb = BackgroundProcessor.hexToRgb(fillHex);
      const total = width * height;
      for (let i = 0; i < total; i++) {
        const offset = i * 4;
        data[offset] = rgb.r;
        data[offset + 1] = rgb.g;
        data[offset + 2] = rgb.b;
        data[offset + 3] = 255;
      }
    }
    return { width, height, data };
  }

  /**
   * Safe extraction of pixel buffer from an HTMLCanvasElement in DOM environment.
   */
  public static extractFromCanvas(
    canvas: HTMLCanvasElement | { width: number; height: number; getContext: (type: string) => unknown } | unknown
  ): IPixelBuffer | null {
    if (
      !canvas ||
      typeof canvas !== "object" ||
      !("getContext" in canvas) ||
      typeof (canvas as { getContext: unknown }).getContext !== "function"
    ) {
      return null;
    }
    const canvasObj = canvas as {
      width: number;
      height: number;
      getContext: (type: string) => {
        getImageData?: (
          sx: number,
          sy: number,
          sw: number,
          sh: number
        ) => { width: number; height: number; data: Uint8ClampedArray };
      } | null;
    };
    const ctx = canvasObj.getContext("2d");
    if (!ctx || typeof ctx.getImageData !== "function") return null;
    try {
      const imgData = ctx.getImageData(0, 0, canvasObj.width, canvasObj.height);
      return {
        width: imgData.width,
        height: imgData.height,
        data: imgData.data,
      };
    } catch {
      return null;
    }
  }
}
