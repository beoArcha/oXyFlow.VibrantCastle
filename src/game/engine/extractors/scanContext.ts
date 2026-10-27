export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  hasContent: boolean;
  footY?: number;
  originX?: number;
  originY?: number;
}

let scanCanvas: HTMLCanvasElement | null = null;
let scanCtx: CanvasRenderingContext2D | null = null;

/**
 * Provides a reusable, single-allocation 2D canvas context configured with willReadFrequently
 * for pixel data analysis and sprite bounds extraction.
 */
export function getScanCanvasContext(w: number, h: number): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!scanCanvas) {
    scanCanvas = document.createElement("canvas");
    scanCtx = scanCanvas.getContext("2d", { willReadFrequently: true });
  }
  if (scanCanvas.width !== w || scanCanvas.height !== h) {
    scanCanvas.width = w;
    scanCanvas.height = h;
  }
  return scanCtx;
}
