import { describe, it, expect } from "bun:test";
import {
  GridCountSlicingStrategy,
  CellSizeSlicingStrategy,
  FreeformRectSlicingStrategy,
  AtlasSlicingEngine,
} from "../index";
import { defaultMetaParser } from "../../MetaParser";

describe("Atlas Slicing Strategies & Engine (Phase 1)", () => {
  describe("1. GridCountSlicingStrategy (by_count)", () => {
    const strategy = new GridCountSlicingStrategy();

    it("generates regular grid frames when no animations are present", () => {
      const frames = strategy.slice(
        { textureWidth: 512, textureHeight: 256 },
        { columns: 4, rows: 2 }
      );

      expect(frames.length).toBe(8);
      expect(frames[0]).toEqual({
        id: "cell_0_0",
        row: 0,
        col: 0,
        x: 0,
        y: 0,
        width: 128,
        height: 128,
      });
      expect(frames[7]).toEqual({
        id: "cell_1_3",
        row: 1,
        col: 3,
        x: 384,
        y: 128,
        width: 128,
        height: 128,
      });
    });

    it("respects animations dictionary with discrete slotSpan and cells", () => {
      const context = {
        textureWidth: 1024,
        textureHeight: 512,
        animations: {
          attack: {
            row: 2,
            frames: 3,
            slotSpan: [1, 2, 1],
          },
        },
      };

      const frames = strategy.slice(context, {
        columns: 8,
        rows: 4,
        cellWidth: 128,
        cellHeight: 128,
      });

      expect(frames.length).toBe(3);

      // Frame 0: col 0, span 1 -> width 128
      expect(frames[0].x).toBe(0);
      expect(frames[0].width).toBe(128);

      // Frame 1: col 1, span 2 -> width 256
      expect(frames[1].col).toBe(1);
      expect(frames[1].x).toBe(128);
      expect(frames[1].width).toBe(256);

      // Frame 2: col 3 (1+2), span 1 -> width 128
      expect(frames[2].col).toBe(3);
      expect(frames[2].x).toBe(384);
      expect(frames[2].width).toBe(128);
    });

    it("supports startCol and widthCells for structure assets", () => {
      const context = {
        textureWidth: 800,
        textureHeight: 400,
        animations: {
          activate: {
            row: 1,
            startCol: 2,
            frames: 2,
            widthCells: 2,
          },
        },
      };

      const frames = strategy.slice(context, {
        columns: 8,
        rows: 4,
        cellWidth: 100,
        cellHeight: 100,
      });

      expect(frames.length).toBe(2);
      expect(frames[0].col).toBe(2);
      expect(frames[0].x).toBe(200);
      expect(frames[0].width).toBe(200);
    });

    it("supports frameIndices for shared-row animations", () => {
      const context = {
        textureWidth: 1024,
        textureHeight: 512,
        animations: {
          crouch: {
            row: 2,
            frames: 2,
            frameIndices: [5, 6],
          },
        },
      };

      const frames = strategy.slice(context, {
        columns: 8,
        rows: 4,
        cellWidth: 128,
        cellHeight: 128,
      });

      expect(frames.length).toBe(2);
      expect(frames[0].col).toBe(5);
      expect(frames[0].x).toBe(640);
      expect(frames[1].col).toBe(6);
      expect(frames[1].x).toBe(768);
    });

    it("hit tests coordinates accurately", () => {
      const frames = strategy.slice(
        { textureWidth: 200, textureHeight: 200 },
        { columns: 2, rows: 2, cellWidth: 100, cellHeight: 100 }
      );

      const hit = strategy.findFrame(150, 150, frames);
      expect(hit).not.toBeNull();
      expect(hit?.id).toBe("cell_1_1");

      const miss = strategy.findFrame(300, 300, frames);
      expect(miss).toBeNull();
    });
  });

  describe("2. CellSizeSlicingStrategy (by_cell_size)", () => {
    const strategy = new CellSizeSlicingStrategy();

    it("calculates grid automatically from cell dimensions", () => {
      const frames = strategy.slice(
        { textureWidth: 640, textureHeight: 384 },
        {
          cellWidth: 128,
          cellHeight: 128,
        }
      );

      // 640 / 128 = 5 cols; 384 / 128 = 3 rows -> 15 frames
      expect(frames.length).toBe(15);
      expect(frames[0].width).toBe(128);
      expect(frames[0].height).toBe(128);
      expect(frames[14].x).toBe(512);
      expect(frames[14].y).toBe(256);
    });

    it("handles offsets and spacing gutters cleanly", () => {
      const frames = strategy.slice(
        { textureWidth: 300, textureHeight: 300 },
        {
          cellWidth: 80,
          cellHeight: 80,
          offsetX: 10,
          offsetY: 20,
          spacingX: 10,
          spacingY: 10,
        }
      );

      // effectiveW = 90. (300 - 10) / 90 = 3 cols
      // effectiveH = 90. (300 - 20) / 90 = 3 rows
      expect(frames.length).toBe(9);
      expect(frames[0].x).toBe(10);
      expect(frames[0].y).toBe(20);
      expect(frames[1].x).toBe(100); // 10 + 1 * 90
    });

    it("respects animations dictionary with multi-span cells", () => {
      const context = {
        textureWidth: 800,
        textureHeight: 400,
        animations: {
          dash: {
            row: 0,
            frames: 2,
            slotSpan: [1, 2],
          },
        },
      };

      const frames = strategy.slice(context, {
        cellWidth: 100,
        cellHeight: 100,
        offsetX: 0,
        offsetY: 0,
        spacingX: 10,
        spacingY: 10,
      });

      expect(frames.length).toBe(2);
      expect(frames[0].width).toBe(100);
      // Span of 2 with 10px spacing = 100*2 + 10 = 210px
      expect(frames[1].width).toBe(210);
    });
  });

  describe("3. FreeformRectSlicingStrategy (freeform_rects)", () => {
    const strategy = new FreeformRectSlicingStrategy();

    it("resolves arbitrary pixel bounding boxes and pivots", () => {
      const frames = strategy.slice(
        { textureWidth: 1024, textureHeight: 1024 },
        {
          frames: {
            idle_0: { x: 10, y: 15, width: 64, height: 96, pivot: { x: 0.5, y: 1.0 } },
            idle_1: { x: 80, y: 12, width: 70, height: 100, pivot: { x: 0.5, y: 1.0 } },
          },
        }
      );

      expect(frames.length).toBe(2);
      expect(frames[0].id).toBe("idle_0");
      expect(frames[0].trackName).toBe("idle");
      expect(frames[0].frameIndex).toBe(0);
      expect(frames[0].pivot).toEqual({ x: 0.5, y: 1.0 });

      expect(frames[1].id).toBe("idle_1");
      expect(frames[1].frameIndex).toBe(1);
    });

    it("hit tests freeform rects", () => {
      const frames = strategy.slice(
        { textureWidth: 500, textureHeight: 500 },
        {
          frames: [
            { x: 100, y: 100, width: 50, height: 50 },
            { x: 200, y: 200, width: 80, height: 80 },
          ],
        }
      );

      expect(strategy.findFrame(120, 120, frames)?.id).toBe("frame_0");
      expect(strategy.findFrame(250, 250, frames)?.id).toBe("frame_1");
      expect(strategy.findFrame(10, 10, frames)).toBeNull();
    });
  });

  describe("4. AtlasSlicingEngine (Composition & Auto-Selection)", () => {
    const engine = new AtlasSlicingEngine();

    it("falls back to grid count strategy when slicing config is omitted", () => {
      const legacyDoc = {
        atlas: {
          columns: 4,
          rows: 2,
          cellWidth: 100,
          cellHeight: 100,
        },
      };

      const frames = engine.resolveFrames(legacyDoc, 400, 200);
      expect(frames.length).toBe(8);
      expect(frames[0].id).toBe("cell_0_0");
    });

    it("automatically dispatches to cell size strategy", () => {
      const sizeDoc = {
        slicing: {
          method: "by_cell_size",
          cellSize: {
            cellWidth: 100,
            cellHeight: 100,
          },
        },
      };

      const frames = engine.resolveFrames(sizeDoc, 300, 200);
      expect(frames.length).toBe(6);
    });

    it("automatically dispatches to freeform strategy", () => {
      const freeformDoc = {
        slicing: {
          method: "freeform_rects",
          frames: {
            shot_0: { x: 50, y: 50, width: 40, height: 40 },
          },
        },
      };

      const frames = engine.resolveFrames(freeformDoc, 500, 500);
      expect(frames.length).toBe(1);
      expect(frames[0].id).toBe("shot_0");
    });

    it("finds frame at given coordinate using findFrameAt", () => {
      const doc = {
        atlas: { columns: 2, rows: 2, cellWidth: 50, cellHeight: 50 },
      };
      const frames = engine.resolveFrames(doc, 100, 100);
      const hit = engine.findFrameAt(25, 25, frames);
      expect(hit?.id).toBe("cell_0_0");
    });
  });

  describe("5. MetaParser Integration & Backwards Compatibility", () => {
    it("parses character document with new slicing and backgroundConfig sections", () => {
      const raw = {
        id: "hero",
        entityType: "humanoid",
        version: "4.0",
        description: "Test hero",
        atlas: { columns: 8, rows: 4, background: "#000000" },
        variants: {
          low: { cellWidth: 32, cellHeight: 32, scale: 0.5 },
          mid: { cellWidth: 64, cellHeight: 64, scale: 1.0 },
          high: { cellWidth: 128, cellHeight: 128, scale: 2.0 },
        },
        animations: {
          run: { row: 0, frames: 6, fps: 10, loop: true },
        },
        layout: {
          ordering: ["run"],
          origin: { type: "feet", normalized: { x: 0.5, y: 1.0 } },
          naturalFacing: "right",
        },
        slicing: {
          method: "by_cell_size",
          cellSize: { cellWidth: 128, cellHeight: 128 },
        },
      };

      const doc = defaultMetaParser.parseCharacter(raw);
      expect(doc.slicing?.method).toBe("by_cell_size");
      expect(doc.slicing?.cellSize?.cellWidth).toBe(128);
      expect(doc.backgroundConfig?.mode).toBe("color");
      expect(doc.backgroundConfig?.colorHex).toBe("#000000");
    });

    it("retains 100% backward compatibility when slicing section is missing", () => {
      const rawLegacy = {
        id: "valen",
        entityType: "humanoid",
        atlas: { columns: 12, rows: 8 },
        variants: {
          high: { cellWidth: 128, cellHeight: 128, scale: 1.5 },
        },
        animations: {
          idle: { row: 0, frames: 6 },
        },
        layout: {
          origin: { type: "feet", normalized: { x: 0.5, y: 1.0 } },
        },
      };

      const doc = defaultMetaParser.parseCharacter(rawLegacy);
      expect(doc.slicing).toBeUndefined();
      expect(doc.backgroundConfig?.mode).toBe("transparent");
      expect(doc.atlas.columns).toBe(12);
    });
  });
});
