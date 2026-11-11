import { describe, it, expect } from "bun:test";
import {
  MAX_LAYER_UPSCALE,
  createLayerRect,
  resolveFarBackdropRect,
  resolveLayerDrawHeight,
  resolveLayerScreenY,
} from "../background/parallaxGeometry";
import { drawHorizontalTiles } from "../background/parallaxTiling";

const VIEWPORT_H = 625;

interface DrawCall {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  mirrored: boolean;
}

function createRecordingContext() {
  const calls: DrawCall[] = [];
  const translations: number[] = [];
  let mirrored = false;
  const ctx = {
    save: () => {},
    restore: () => {
      mirrored = false;
    },
    translate: (x: number) => {
      translations.push(x);
    },
    scale: (sx: number) => {
      mirrored = sx < 0;
    },
    drawImage: (_img: unknown, dx: number, dy: number, dw: number, dh: number) => {
      calls.push({ dx, dy, dw, dh, mirrored });
    },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, calls, translations };
}

const IMAGE = {} as CanvasImageSource;

describe("parallax layer geometry", () => {
  describe("current courtyard numbers (2048x768 art, box 4400x1150, viewport 1000x625)", () => {
    it("keeps the 0.85 box height fill for the draw size", () => {
      // Arrange
      const imageHeight = 768;

      // Act
      const drawH = resolveLayerDrawHeight(imageHeight, 1150, VIEWPORT_H);

      // Assert
      expect(drawH).toBeCloseTo(977.5, 6);
      expect((2048 * drawH) / imageHeight).toBeCloseTo(2606.6667, 3);
    });

    it("keeps the close layer vertical range of 0.45 of the overflow", () => {
      // Arrange
      const drawH = resolveLayerDrawHeight(768, 1150, VIEWPORT_H);

      // Act
      const atBottom = resolveLayerScreenY(drawH, VIEWPORT_H, 1, 0.45, 0);
      const atTop = resolveLayerScreenY(drawH, VIEWPORT_H, 0, 0.45, 0);

      // Assert
      expect(atBottom).toBeCloseTo(-158.625, 6);
      expect(Math.abs(atTop)).toBe(0);
    });

    it("keeps the clocktower 724 px art unaffected by the upscale cap", () => {
      // Act
      const drawH = resolveLayerDrawHeight(724, 1400, VIEWPORT_H);

      // Assert
      expect(drawH).toBeCloseTo(1190, 6);
      expect(drawH / 724).toBeLessThan(MAX_LAYER_UPSCALE);
    });
  });

  describe("tall maps", () => {
    it.each([1600, 3250, 6000])("caps the on-screen scale of 768 px art for box height %i", (boxHeight) => {
      // Act
      const drawH = resolveLayerDrawHeight(768, boxHeight, VIEWPORT_H);

      // Assert
      expect(drawH / 768).toBeLessThanOrEqual(MAX_LAYER_UPSCALE + 1e-9);
      expect(drawH).toBeGreaterThanOrEqual(VIEWPORT_H);
    });

    it("never lets the viewport leave the layer, whatever the speed, progress and drift", () => {
      // Arrange
      const drawH = resolveLayerDrawHeight(768, 3250, VIEWPORT_H);

      for (const speed of [0, 0.45, 1, 1.5]) {
        for (const progress of [0, 0.25, 1]) {
          for (const drift of [0, 40, 5000]) {
            // Act
            const y = resolveLayerScreenY(drawH, VIEWPORT_H, progress, speed, drift);

            // Assert
            expect(y).toBeLessThanOrEqual(0);
            expect(y + drawH).toBeGreaterThanOrEqual(VIEWPORT_H);
          }
        }
      }
    });

    it("falls back to the viewport height when the box is shorter than the viewport", () => {
      // Act
      const drawH = resolveLayerDrawHeight(768, 400, VIEWPORT_H);

      // Assert
      expect(drawH).toBe(VIEWPORT_H);
    });
  });

  describe("FAR backdrop rectangle", () => {
    it.each([
      [2048, 768, 1000, 625],
      [2172, 724, 1000, 625],
      [2048, 768, 1920, 600],
      [2048, 768, 600, 1080],
      [2050, 767, 1001, 626],
    ])("covers the viewport for %ix%i art in a %ix%i viewport", (iw, ih, vw, vh) => {
      // Arrange
      const rect = createLayerRect();

      // Act
      resolveFarBackdropRect(rect, iw, ih, vw, vh);

      // Assert
      expect(rect.x).toBeLessThanOrEqual(0);
      expect(rect.y).toBe(0);
      expect(rect.x + rect.width).toBeGreaterThanOrEqual(vw);
      expect(rect.height).toBeGreaterThanOrEqual(vh);
    });
  });

  describe("horizontal tiling", () => {
    it("abuts neighbouring tiles exactly with fractional tile widths", () => {
      // Arrange
      const { ctx, calls } = createRecordingContext();

      // Act
      drawHorizontalTiles(ctx, IMAGE, -1234.4, -20, 2606.6667, 977.5, 5000, false);

      // Assert
      expect(calls.length).toBeGreaterThan(1);
      for (let i = 1; i < calls.length; i++) {
        expect(calls[i].dx).toBe(calls[i - 1].dx + calls[i - 1].dw);
      }
      expect(calls[0].dx).toBeLessThanOrEqual(0);
      const last = calls[calls.length - 1];
      expect(last.dx + last.dw).toBeGreaterThanOrEqual(5000);
    });

    it("flips every odd world tile when mirroring and leaves clean layers untouched", () => {
      // Arrange
      const mirrored = createRecordingContext();
      const clean = createRecordingContext();

      // Act
      drawHorizontalTiles(mirrored.ctx, IMAGE, -100, 0, 1000, 600, 2500, true);
      drawHorizontalTiles(clean.ctx, IMAGE, -100, 0, 1000, 600, 2500, false);

      // Assert
      expect(mirrored.calls.map((c) => c.mirrored)).toEqual([false, true, false]);
      expect(mirrored.translations).toEqual([1900]);
      expect(clean.calls.map((c) => c.mirrored)).toEqual([false, false, false]);
      expect(clean.translations).toEqual([]);
    });

    it("keeps the mirror parity tied to the world tile after scrolling past two tiles", () => {
      // Arrange
      const { ctx, calls } = createRecordingContext();

      // Act
      drawHorizontalTiles(ctx, IMAGE, -2100, 0, 1000, 600, 1500, true);

      // Assert
      expect(calls.map((c) => c.mirrored)).toEqual([false, true]);
      expect(calls[0].dx).toBe(-100);
    });
  });
});
