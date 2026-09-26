import { describe, it, expect } from "bun:test";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  AtlasMetaDoc,
  IAtlasSlicingConfig,
  IAtlasBackgroundConfig,
  ResolvedFrameRect,
} from "../types";
import { defaultAtlasSlicingEngine } from "../../../../../game/engine/meta/slicing";
import { IFreeformFrameRect } from "../../../../../game/engine/meta/types";

describe("Atlas Studio Phase 4: Interactive Frame Assignment & JSON Export Suite", () => {
  // Test helper replicating the JSON export generator in AtlasJsonExportPanel
  function generateExportJson(params: {
    metaDoc: AtlasMetaDoc;
    gridConfig: AtlasGridConfig;
    tracks: AtlasAnimationTrackDefinition[];
    origin: AtlasOriginDefinition;
    assetId: string;
    slicingConfig?: IAtlasSlicingConfig;
    backgroundConfig?: IAtlasBackgroundConfig;
  }): AtlasMetaDoc {
    const { metaDoc, gridConfig, tracks, origin, assetId, slicingConfig, backgroundConfig } = params;

    const animMap: Record<string, any> = {};
    tracks.forEach((track) => {
      animMap[track.name] = {
        row: track.row,
        frames: track.frames,
        fps: track.fps,
        loop: track.loop,
        ...(track.wide ? { wide: true } : {}),
        ...(track.slotSpan ? { slotSpan: track.slotSpan } : {}),
        ...(track.cells ? { cells: track.cells } : {}),
        ...(track.frameIndices ? { frameIndices: track.frameIndices } : {}),
      };
    });

    const effectiveSlicing = slicingConfig || metaDoc.slicing;
    const currentMethod = effectiveSlicing?.method || "by_count";

    let resolvedSlicingSection: IAtlasSlicingConfig;
    if (currentMethod === "auto_islands") {
      resolvedSlicingSection = {
        method: "auto_islands",
        autoIslands: {
          minIslandPixels: effectiveSlicing?.autoIslands?.minIslandPixels ?? 15,
          clusterYTolerance: effectiveSlicing?.autoIslands?.clusterYTolerance ?? 10,
        },
        ...(effectiveSlicing?.frames ? { frames: effectiveSlicing.frames } : {}),
      };
    } else if (currentMethod === "freeform_rects") {
      resolvedSlicingSection = {
        method: "freeform_rects",
        frames: effectiveSlicing?.frames || [],
      };
    } else if (currentMethod === "by_cell_size") {
      resolvedSlicingSection = {
        method: "by_cell_size",
        cellSize: {
          cellWidth: effectiveSlicing?.cellSize?.cellWidth ?? gridConfig.cellWidth,
          cellHeight: effectiveSlicing?.cellSize?.cellHeight ?? gridConfig.cellHeight,
          offsetX: effectiveSlicing?.cellSize?.offsetX ?? 0,
          offsetY: effectiveSlicing?.cellSize?.offsetY ?? 0,
          spacingX: effectiveSlicing?.cellSize?.spacingX ?? gridConfig.spacing,
          spacingY: effectiveSlicing?.cellSize?.spacingY ?? gridConfig.spacing,
        },
      };
    } else {
      resolvedSlicingSection = {
        method: "by_count",
        grid: {
          columns: gridConfig.columns,
          rows: gridConfig.rows,
          spacing: gridConfig.spacing,
          safeMargin: gridConfig.safeMargin,
          cellWidth: gridConfig.cellWidth,
          cellHeight: gridConfig.cellHeight,
        },
      };
    }

    const effectiveBg = backgroundConfig || metaDoc.backgroundConfig;
    const resolvedBgSection: IAtlasBackgroundConfig =
      effectiveBg?.mode === "color"
        ? {
            mode: "color",
            colorHex: effectiveBg.colorHex,
            tolerance: effectiveBg.tolerance ?? 15,
            removeAtRuntime: effectiveBg.removeAtRuntime ?? true,
          }
        : {
            mode: "transparent",
          };

    return {
      ...metaDoc,
      characterId: metaDoc.characterId || assetId,
      slicing: resolvedSlicingSection,
      backgroundConfig: resolvedBgSection,
      atlas: {
        ...metaDoc.atlas,
        columns: gridConfig.columns,
        rows: gridConfig.rows,
        spacing: gridConfig.spacing,
        safeMargin: gridConfig.safeMargin,
        cellWidth: gridConfig.cellWidth,
        cellHeight: gridConfig.cellHeight,
      },
      variants: {
        ...metaDoc.variants,
        high: {
          cellWidth: gridConfig.cellWidth,
          cellHeight: gridConfig.cellHeight,
          scale: metaDoc.variants?.high?.scale ?? 1.5,
        },
      },
      animations: animMap,
      layout: {
        ...metaDoc.layout,
        origin: {
          type: origin.type || "feet",
          normalized: origin.normalized,
        },
      },
    };
  }

  // --------------------------------------------------------------------------
  // 1. Freeform Frame Management & Persistence
  // --------------------------------------------------------------------------
  describe("1. Freeform Frame Operations", () => {
    it("creates, updates, and deletes freeform frames with normalized coordinate boxes", () => {
      const frames: IFreeformFrameRect[] = [];

      // 1. Add frame 1
      const frame1: IFreeformFrameRect = {
        id: "frame_1",
        x: 10,
        y: 20,
        width: 64,
        height: 80,
        trackName: "idle",
        frameIndex: 0,
        pivot: { x: 0.5, y: 1.0 },
      };
      frames.push(frame1);

      // 2. Add frame 2
      const frame2: IFreeformFrameRect = {
        id: "frame_2",
        x: 84,
        y: 20,
        width: 68,
        height: 80,
        trackName: "idle",
        frameIndex: 1,
        pivot: { x: 0.5, y: 1.0 },
      };
      frames.push(frame2);

      expect(frames).toHaveLength(2);
      expect(frames[0].width).toBe(64);
      expect(frames[1].width).toBe(68);

      // 3. Update frame 1 width (e.g. slash attack wide reach)
      const updatedFrames = frames.map((f) => (f.id === "frame_1" ? { ...f, width: 128 } : f));
      expect(updatedFrames[0].width).toBe(128);

      // 4. Delete frame 2
      const remainingFrames = updatedFrames.filter((f) => f.id !== "frame_2");
      expect(remainingFrames).toHaveLength(1);
      expect(remainingFrames[0].id).toBe("frame_1");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Auto-Islands Baking & Zero Runtime CPU Flood-Fill Guarantee
  // --------------------------------------------------------------------------
  describe("2. Auto-Islands Frame Baking (Zero Runtime CPU Overhead)", () => {
    it("bakes detected islands into static slicing.frames and resolves via freeform at runtime in sub-millisecond", () => {
      // Simulating detected islands from authoring studio
      const simulatedDetectedIslands: ResolvedFrameRect[] = [
        { id: "island_r0_c0", x: 12, y: 18, width: 44, height: 72, trackName: "walk", frameIndex: 0 },
        { id: "island_r0_c1", x: 68, y: 18, width: 46, height: 72, trackName: "walk", frameIndex: 1 },
        { id: "island_r0_c2", x: 124, y: 18, width: 48, height: 72, trackName: "walk", frameIndex: 2 },
      ];

      // Bake into static frames in meta config
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

      // At runtime, resolving frames does NOT provide pixelBuffer
      const t0 = performance.now();
      const resolved = defaultAtlasSlicingEngine.resolveFrames(metaWithBakedIslands, 512, 256);
      const elapsed = performance.now() - t0;

      expect(resolved).toHaveLength(3);
      expect(resolved[0].id).toBe("island_r0_c0");
      expect(resolved[0].width).toBe(44);
      expect(resolved[1].id).toBe("island_r0_c1");
      expect(resolved[2].id).toBe("island_r0_c2");
      // Execution must be fast with zero pixel scanning
      expect(elapsed).toBeLessThan(10);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Frame to Track Assignment
  // --------------------------------------------------------------------------
  describe("3. Interactive Track Assignment", () => {
    it("assigns selected frame IDs to an animation track and updates sequential frameIndex", () => {
      const initialFrames: IFreeformFrameRect[] = [
        { id: "f1", x: 0, y: 0, width: 50, height: 50 },
        { id: "f2", x: 50, y: 0, width: 50, height: 50 },
        { id: "f3", x: 100, y: 0, width: 50, height: 50 },
      ];

      const selectedIds = ["f1", "f3"];
      const targetTrack = "jump_attack";

      let assignedIndex = 0;
      const updatedFrames = initialFrames.map((f) => {
        if (selectedIds.includes(f.id!)) {
          return {
            ...f,
            trackName: targetTrack,
            frameIndex: assignedIndex++,
          };
        }
        return f;
      });

      expect(updatedFrames[0].trackName).toBe("jump_attack");
      expect(updatedFrames[0].frameIndex).toBe(0);
      expect(updatedFrames[1].trackName).toBeUndefined();
      expect(updatedFrames[2].trackName).toBe("jump_attack");
      expect(updatedFrames[2].frameIndex).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Complete JSON Generator & Export
  // --------------------------------------------------------------------------
  describe("4. JSON Generator & Export Validation", () => {
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
      const exported = generateExportJson({
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

      // Verify serialization and re-parsing
      const jsonStr = JSON.stringify(exported, null, 2);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.characterId).toBe("valen_hero");
    });

    it("generates complete meta JSON for 'by_cell_size' strategy", () => {
      const exported = generateExportJson({
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

      const exported = generateExportJson({
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
      const exported = generateExportJson({
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
