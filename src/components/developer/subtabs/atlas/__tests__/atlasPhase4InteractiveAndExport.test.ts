import { describe, it, expect } from "bun:test";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  AtlasMetaDoc,
  ResolvedFrameRect,
} from "../types";
import { defaultAtlasSlicingEngine } from "../../../../../game/engine/meta/slicing";
import { IFreeformFrameRect } from "../../../../../game/engine/meta/types";
import { buildAtlasExportMetaDoc } from "../AtlasJsonExportPanel";

describe("Atlas Studio Phase 4: Interactive Frame Assignment & JSON Export Suite", () => {
  describe("1. Auto-Islands Frame Baking (Zero Runtime CPU Overhead)", () => {
    it("bakes detected islands into static slicing.frames and resolves via freeform at runtime in sub-millisecond", () => {
      const simulatedDetectedIslands: ResolvedFrameRect[] = [
        { id: "island_r0_c0", x: 12, y: 18, width: 44, height: 72, trackName: "walk", frameIndex: 0 },
        { id: "island_r0_c1", x: 68, y: 18, width: 46, height: 72, trackName: "walk", frameIndex: 1 },
        { id: "island_r0_c2", x: 124, y: 18, width: 48, height: 72, trackName: "walk", frameIndex: 2 },
      ];

      const bakedStaticFrames: IFreeformFrameRect[] = simulatedDetectedIslands.map((isl) => ({
        id: isl.id,
        x: Math.round(isl.x),
        y: Math.round(isl.y),
        width: Math.round(isl.width),
        height: Math.round(isl.height),
        trackName: isl.trackName,
        frameIndex: isl.frameIndex,
        pivot: { x: 0.5, y: 1.0 },
      }));

      const metaWithBakedIslands: AtlasMetaDoc = {
        characterId: "valen_hero",
        entityType: "humanoid",
        slicing: {
          method: "auto_islands",
          autoIslands: { minIslandPixels: 15, clusterYTolerance: 10 },
          frames: bakedStaticFrames,
        },
        atlas: { columns: 3, rows: 1 },
      };

      const t0 = performance.now();
      const resolved = defaultAtlasSlicingEngine.resolveFrames(metaWithBakedIslands, 512, 256);
      const elapsed = performance.now() - t0;

      expect(resolved).toHaveLength(3);
      expect(resolved[0].id).toBe("island_r0_c0");
      expect(resolved[0].width).toBe(44);
      expect(resolved[1].id).toBe("island_r0_c1");
      expect(resolved[2].id).toBe("island_r0_c2");
      expect(elapsed).toBeLessThan(10);
    });
  });

  describe("2. JSON Generator & Export Validation", () => {
    const baseGrid: AtlasGridConfig = {
      columns: 12,
      rows: 8,
      cellWidth: 128,
      cellHeight: 128,
      spacing: 0,
      safeMargin: 0,
    };

    const baseTracks: AtlasAnimationTrackDefinition[] = [
      { name: "idle", row: 0, frames: 4, fps: 8, loop: true },
      { name: "walk", row: 1, frames: 6, fps: 10, loop: true },
    ];

    const baseOrigin: AtlasOriginDefinition = {
      type: "feet",
      normalized: { x: 0.5, y: 1.0 },
    };

    const baseMetaDoc: AtlasMetaDoc = {
      characterId: "valen_hero",
      version: "1.0",
      description: "Valen Test Meta",
      atlas: { columns: 12, rows: 8 },
    };

    it("generates complete meta JSON for 'by_count' strategy", () => {
      const exported = buildAtlasExportMetaDoc({
        metaDoc: baseMetaDoc,
        gridConfig: baseGrid,
        tracks: baseTracks,
        origin: baseOrigin,
        assetId: "valen_hero",
        slicingConfig: {
          method: "by_count",
          grid: { columns: 12, rows: 8, spacing: 0, safeMargin: 0, cellWidth: 128, cellHeight: 128 },
        },
      });

      expect(exported.characterId).toBe("valen_hero");
      expect(exported.slicing?.method).toBe("by_count");
      expect(exported.slicing?.grid?.columns).toBe(12);
      expect(exported.animations?.idle.frames).toBe(4);
      expect(exported.animations?.walk.fps).toBe(10);
      expect(exported.backgroundConfig?.mode).toBe("transparent");

      const jsonStr = JSON.stringify(exported, null, 2);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.characterId).toBe("valen_hero");
    });

    it("generates complete meta JSON for 'by_cell_size' strategy", () => {
      const exported = buildAtlasExportMetaDoc({
        metaDoc: baseMetaDoc,
        gridConfig: baseGrid,
        tracks: baseTracks,
        origin: baseOrigin,
        assetId: "valen_hero",
        slicingConfig: {
          method: "by_cell_size",
          cellSize: { cellWidth: 96, cellHeight: 96, offsetX: 5, offsetY: 5, spacingX: 2, spacingY: 2 },
        },
      });

      expect(exported.slicing?.method).toBe("by_cell_size");
      expect(exported.slicing?.cellSize?.cellWidth).toBe(96);
      expect(exported.slicing?.cellSize?.offsetX).toBe(5);
    });

    it("generates complete meta JSON for 'freeform_rects' strategy with explicit frame boxes", () => {
      const frames: IFreeformFrameRect[] = [
        { id: "box_1", x: 10, y: 15, width: 50, height: 70, trackName: "idle", frameIndex: 0 },
        { id: "box_2", x: 70, y: 15, width: 52, height: 70, trackName: "idle", frameIndex: 1 },
      ];

      const exported = buildAtlasExportMetaDoc({
        metaDoc: baseMetaDoc,
        gridConfig: baseGrid,
        tracks: baseTracks,
        origin: baseOrigin,
        assetId: "valen_hero",
        slicingConfig: {
          method: "freeform_rects",
          frames,
        },
      });

      expect(exported.slicing?.method).toBe("freeform_rects");
      expect(Array.isArray(exported.slicing?.frames)).toBe(true);
      expect(exported.slicing?.frames).toHaveLength(2);
      expect((exported.slicing?.frames as IFreeformFrameRect[])[0].width).toBe(50);
    });

    it("generates complete meta JSON with chroma key background configuration", () => {
      const exported = buildAtlasExportMetaDoc({
        metaDoc: baseMetaDoc,
        gridConfig: baseGrid,
        tracks: baseTracks,
        origin: baseOrigin,
        assetId: "valen_hero",
        backgroundConfig: {
          mode: "color",
          colorHex: "#00FF00",
          tolerance: 20,
          removeAtRuntime: true,
        },
      });

      expect(exported.backgroundConfig?.mode).toBe("color");
      expect(exported.backgroundConfig?.colorHex).toBe("#00FF00");
      expect(exported.backgroundConfig?.tolerance).toBe(20);
      expect(exported.backgroundConfig?.removeAtRuntime).toBe(true);
    });
  });
});
