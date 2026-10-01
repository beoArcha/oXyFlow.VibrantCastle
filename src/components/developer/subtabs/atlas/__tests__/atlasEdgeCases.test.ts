import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { defaultAtlasSlicingEngine } from "@game/engine/meta/slicing/AtlasSlicingEngine";
import { AutoIslandSlicingStrategy } from "@game/engine/meta/slicing/AutoIslandSlicingStrategy";
import { useAtlasAnimationTracks } from "../hooks/useAtlasAnimationTracks";
import { useAtlasPresets } from "../hooks/useAtlasPresets";
import {
  renderCustomHook,
  cleanupDom,
  setupDomEnvironment,
} from "@test-utils";

describe("Atlas Studio - Edge Cases & Mathematical Guards", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("Grid dimensions zero & negative boundary guards", () => {
    it("safely handles 0 or negative columns and rows without dividing by zero", () => {
      const zeroColumnsMeta = {
        atlas: {
          columns: 0,
          rows: 0,
          cellWidth: 64,
          cellHeight: 64,
        },
        slicing: {
          method: "by_count" as const,
          grid: { columns: 0, rows: 0 },
        },
      };

      const frames = defaultAtlasSlicingEngine.resolveFrames(zeroColumnsMeta, 256, 256);
      expect(frames.length).toBeGreaterThan(0);
      frames.forEach((f) => {
        expect(Number.isFinite(f.x)).toBe(true);
        expect(Number.isFinite(f.y)).toBe(true);
        expect(Number.isFinite(f.width)).toBe(true);
        expect(f.width).toBeGreaterThan(0);
      });
    });

    it("safely handles negative cell dimensions without creating inverted rects", () => {
      const negativeCellMeta = {
        atlas: {
          columns: 4,
          rows: 4,
          cellWidth: -32,
          cellHeight: -32,
        },
        slicing: {
          method: "by_cell_size" as const,
          cellSize: { width: -32, height: -32 },
        },
      };

      const frames = defaultAtlasSlicingEngine.resolveFrames(negativeCellMeta, 128, 128);
      expect(Array.isArray(frames)).toBe(true);
      frames.forEach((f) => {
        expect(f.width).toBeGreaterThanOrEqual(0);
        expect(f.height).toBeGreaterThanOrEqual(0);
      });
    });

    it("handles texture smaller than a single cell size gracefully", () => {
      const bigCellMeta = {
        atlas: {
          columns: 2,
          rows: 2,
          cellWidth: 128,
          cellHeight: 128,
        },
        slicing: {
          method: "by_count" as const,
          grid: { columns: 2, rows: 2 },
        },
      };

      // Texture is only 16x16 px while cells expect 128x128
      const frames = defaultAtlasSlicingEngine.resolveFrames(bigCellMeta, 16, 16);
      expect(frames.length).toBe(4);
      expect(frames[0].width).toBe(8); // 16 / 2
      expect(frames[0].height).toBe(8); // 16 / 2
    });
  });

  describe("Track frame index bounds & out-of-range reordering", () => {
    it("safely ignores reorder requests when indices are negative or out of bounds", async () => {
      const { result } = await renderCustomHook(() => useAtlasAnimationTracks());

      await React.act(async () => {
        result.current.setTracks([
          {
            name: "walk",
            type: "grid",
            row: 0,
            frames: 3,
            fps: 8,
            loop: true,
          },
        ]);
        result.current.setSelectedTrackName("walk");
      });

      // Negative source index
      await React.act(async () => {
        result.current.handleReorderTrackFrames(-1, 0);
      });
      expect(result.current.tracks[0].frames).toBe(3);

      // Out of bounds target index
      await React.act(async () => {
        result.current.handleReorderTrackFrames(0, 999);
      });
      expect(result.current.tracks[0].frames).toBe(3);

      // Out of bounds remove
      await React.act(async () => {
        result.current.handleRemoveTrackFrame(999);
        result.current.handleRemoveTrackFrame(-5);
      });
      expect(result.current.tracks[0].frames).toBe(3);

      // Out of bounds duplicate
      await React.act(async () => {
        result.current.handleDuplicateTrackFrame(-1);
        result.current.handleDuplicateTrackFrame(999);
      });
      expect(result.current.tracks[0].frames).toBe(3);
    });

    it("clamps frame delay changes safely", async () => {
      const { result } = await renderCustomHook(() => useAtlasAnimationTracks());

      await React.act(async () => {
        result.current.setTracks([
          {
            name: "idle",
            type: "grid",
            row: 0,
            frames: 2,
            fps: 8,
            loop: true,
          },
        ]);
        result.current.setSelectedTrackName("idle");
      });

      await React.act(async () => {
        result.current.handleFrameDelayChange(0, 150);
      });

      expect(result.current.tracks[0].frameDelays).toBeDefined();
      expect(result.current.tracks[0].frameDelays?.[0]).toBe(150);
    });
  });

  describe("AutoIsland clustering boundary conditions", () => {
    it("handles single island input without crashing", () => {
      const singleIsland = [{ id: "isl_0", x: 10, y: 10, width: 32, height: 32 }];
      const clusters = AutoIslandSlicingStrategy.clusterIslandsIntoRows(singleIsland);

      expect(clusters.length).toBe(1);
      expect(clusters[0].frames.length).toBe(1);
      expect(clusters[0].frames[0].id).toBe("isl_0");
    });

    it("handles islands aligned on the exact same row height perfectly", () => {
      const rowIslands = [
        { id: "isl_2", x: 100, y: 50, width: 30, height: 30 },
        { id: "isl_1", x: 50, y: 50, width: 30, height: 30 },
        { id: "isl_0", x: 0, y: 50, width: 30, height: 30 },
      ];

      const clusters = AutoIslandSlicingStrategy.clusterIslandsIntoRows(rowIslands);
      expect(clusters.length).toBe(1);
      expect(clusters[0].frames.map((f) => f.id)).toEqual(["isl_0", "isl_1", "isl_2"]);
    });
  });
});
