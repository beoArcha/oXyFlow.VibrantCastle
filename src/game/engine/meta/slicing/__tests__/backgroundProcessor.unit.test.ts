import { describe, it, expect } from "bun:test";
import {
  BackgroundProcessor,
  AutoIslandSlicingStrategy,
  AtlasSlicingEngine,
} from "../index";

describe("BackgroundProcessor & AutoIslandSlicingStrategy", () => {
  describe("BackgroundProcessor Color Math & Sampling", () => {
    it("converts hex to RGB accurately", () => {
      expect(BackgroundProcessor.hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(BackgroundProcessor.hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
      expect(BackgroundProcessor.hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 });
      expect(BackgroundProcessor.hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 });
    });

    it("converts RGB to hex accurately", () => {
      expect(BackgroundProcessor.rgbToHex(255, 255, 255)).toBe("#ffffff");
      expect(BackgroundProcessor.rgbToHex(0, 0, 0)).toBe("#000000");
      expect(BackgroundProcessor.rgbToHex(255, 0, 128)).toBe("#ff0080");
    });

    it("computes color distance correctly in RGB space", () => {
      const black = { r: 0, g: 0, b: 0 };
      const white = { r: 255, g: 255, b: 255 };
      const red = { r: 255, g: 0, b: 0 };

      expect(BackgroundProcessor.colorDistance(black, black)).toBe(0);
      expect(Math.round(BackgroundProcessor.colorDistance(black, white))).toBe(100);
      expect(Math.round(BackgroundProcessor.colorDistance(black, red))).toBe(58);
    });

    it("samples color at specific coordinates", () => {
      const buffer = BackgroundProcessor.createPixelBuffer(10, 10, "#123456");
      const sample = BackgroundProcessor.sampleColor(buffer, 5, 5);
      expect(sample.hex).toBe("#123456");
      expect(sample.rgba.a).toBe(255);
    });

    it("detects transparent background when corners are empty", () => {
      const buffer = BackgroundProcessor.createPixelBuffer(20, 20); // default transparent 0,0,0,0
      const result = BackgroundProcessor.detectDominantBackground(buffer);
      expect(result.isTransparent).toBe(true);
    });

    it("detects solid color background from perimeter pixels", () => {
      const buffer = BackgroundProcessor.createPixelBuffer(20, 20, "#00ff00");
      const result = BackgroundProcessor.detectDominantBackground(buffer);
      expect(result.isTransparent).toBe(false);
      expect(result.colorHex).toBe("#00ff00");
    });
  });

  describe("Chroma Keying (Background Removal)", () => {
    it("makes green background transparent while preserving non-green center", () => {
      // 10x10 green buffer
      const buffer = BackgroundProcessor.createPixelBuffer(10, 10, "#00ff00");

      // Draw a 2x2 red square in the center (x: 4..5, y: 4..5)
      for (let y = 4; y <= 5; y++) {
        for (let x = 4; x <= 5; x++) {
          const offset = (y * 10 + x) * 4;
          buffer.data[offset] = 255;   // R
          buffer.data[offset + 1] = 0; // G
          buffer.data[offset + 2] = 0; // B
          buffer.data[offset + 3] = 255; // A
        }
      }

      // Apply Chroma Key targeting #00ff00
      const keyed = BackgroundProcessor.applyChromaKey(buffer, "#00ff00", 15, 0);

      // Verify corner pixel is transparent
      const corner = BackgroundProcessor.sampleColor(keyed, 0, 0);
      expect(corner.rgba.a).toBe(0);

      // Verify center red pixel is still solid red
      const center = BackgroundProcessor.sampleColor(keyed, 4, 4);
      expect(center.rgba.r).toBe(255);
      expect(center.rgba.g).toBe(0);
      expect(center.rgba.b).toBe(0);
      expect(center.rgba.a).toBe(255);
    });
  });

  describe("AutoIslandSlicingStrategy (Smart Slicing)", () => {
    const strategy = new AutoIslandSlicingStrategy();

    it("detects distinct sprite islands on transparent background", () => {
      const buffer = BackgroundProcessor.createPixelBuffer(100, 50); // transparent

      // Draw Island 1 at (10, 10) with width 15, height 20
      for (let y = 10; y < 30; y++) {
        for (let x = 10; x < 25; x++) {
          const offset = (y * 100 + x) * 4;
          buffer.data[offset] = 255;
          buffer.data[offset + 1] = 255;
          buffer.data[offset + 2] = 255;
          buffer.data[offset + 3] = 255;
        }
      }

      // Draw Island 2 at (50, 10) with width 20, height 20
      for (let y = 10; y < 30; y++) {
        for (let x = 50; x < 70; x++) {
          const offset = (y * 100 + x) * 4;
          buffer.data[offset] = 200;
          buffer.data[offset + 1] = 100;
          buffer.data[offset + 2] = 50;
          buffer.data[offset + 3] = 255;
        }
      }

      const frames = strategy.slice(
        {
          textureWidth: 100,
          textureHeight: 50,
          pixelBuffer: buffer,
        },
        { minWidth: 5, minHeight: 5 }
      );

      expect(frames.length).toBe(2);

      // Island 1
      expect(frames[0].x).toBe(10);
      expect(frames[0].y).toBe(10);
      expect(frames[0].width).toBe(15);
      expect(frames[0].height).toBe(20);

      // Island 2
      expect(frames[1].x).toBe(50);
      expect(frames[1].y).toBe(10);
      expect(frames[1].width).toBe(20);
      expect(frames[1].height).toBe(20);
    });

    it("detects sprite islands on solid black background using chroma config", () => {
      // 80x40 solid black buffer
      const buffer = BackgroundProcessor.createPixelBuffer(80, 40, "#000000");

      // Draw a bright red rectangle at (15, 10), width 12, height 16
      for (let y = 10; y < 26; y++) {
        for (let x = 15; x < 27; x++) {
          const offset = (y * 80 + x) * 4;
          buffer.data[offset] = 255;
          buffer.data[offset + 1] = 50;
          buffer.data[offset + 2] = 50;
          buffer.data[offset + 3] = 255;
        }
      }

      const frames = strategy.slice(
        {
          textureWidth: 80,
          textureHeight: 40,
          pixelBuffer: buffer,
          backgroundConfig: {
            mode: "color",
            colorHex: "#000000",
            tolerance: 15,
          },
        },
        { minWidth: 5, minHeight: 5 }
      );

      expect(frames.length).toBe(1);
      expect(frames[0].x).toBe(15);
      expect(frames[0].y).toBe(10);
      expect(frames[0].width).toBe(12);
      expect(frames[0].height).toBe(16);
    });
  });

  describe("AtlasSlicingEngine Integration with AutoIsland", () => {
    const engine = new AtlasSlicingEngine();

    it("dispatches to auto_islands strategy through AtlasSlicingEngine", () => {
      const buffer = BackgroundProcessor.createPixelBuffer(60, 40);
      // Draw a 10x10 square at (10, 10)
      for (let y = 10; y < 20; y++) {
        for (let x = 10; x < 20; x++) {
          const offset = (y * 60 + x) * 4;
          buffer.data[offset] = 255;
          buffer.data[offset + 1] = 255;
          buffer.data[offset + 2] = 255;
          buffer.data[offset + 3] = 255;
        }
      }

      const doc = {
        slicing: {
          method: "auto_islands",
        },
      };

      const frames = engine.resolveFrames(doc, 60, 40, buffer);
      expect(frames.length).toBe(1);
      expect(frames[0].x).toBe(10);
      expect(frames[0].y).toBe(10);
      expect(frames[0].width).toBe(10);
      expect(frames[0].height).toBe(10);
    });
  });
});
