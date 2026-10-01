import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import {
  parseTracksFromMeta,
  useAtlasAnimationTracks,
} from "../hooks/useAtlasAnimationTracks";
import { useAtlasStudioState } from "../hooks";
import { AtlasAnimationPreview } from "../AtlasAnimationPreview";
import {
  renderCustomHook,
  renderIntoDom,
  cleanupDom,
  setupDomEnvironment,
} from "@test-utils";
import { AtlasMetaDoc, ResolvedFrameRect } from "../types";

describe("Atlas Studio Decomposed Slices & Animation Preview Bridge", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("useAtlasAnimationTracks & parseTracksFromMeta", () => {
    it("parses animation tracks safely with type tags and handles grid/indexed variants", () => {
      const mockMeta: AtlasMetaDoc = {
        characterId: "hero",
        entityType: "humanoid",
        version: "1.0",
        description: "Test Hero",
        atlas: {
          columns: 8,
          rows: 4,
          cellWidth: 64,
          cellHeight: 64,
          spacing: 0,
          safeMargin: 0,
          background: "transparent",
        },
        animations: {
          walk: {
            row: 1,
            frames: 6,
            fps: 10,
            loop: true,
          },
          slash: {
            row: 2,
            frames: 3,
            fps: 12,
            loop: false,
            slotSpan: [1, 2, 1],
          },
          cast: {
            row: 3,
            frames: 4,
            fps: 8,
            loop: false,
            frameIndices: [0, 2, 3, 5],
          },
        },
      };

      const tracks = parseTracksFromMeta(mockMeta);
      expect(tracks.length).toBe(3);

      const walk = tracks.find((t) => t.name === "walk");
      expect(walk?.type).toBe("grid");
      expect(walk?.frames).toBe(6);

      const slash = tracks.find((t) => t.name === "slash");
      expect(slash?.type).toBe("grid");
      expect(slash?.slotSpan).toEqual([1, 2, 1]);

      const cast = tracks.find((t) => t.name === "cast");
      expect(cast?.type).toBe("indexed");
      expect(cast?.frameIndices).toEqual([0, 2, 3, 5]);
    });

    it("falls back to layout row parsing when animations dictionary is absent", () => {
      const mockMeta: AtlasMetaDoc = {
        characterId: "chest",
        entityType: "object",
        version: "1.0",
        description: "Treasure Chest",
        atlas: {
          columns: 8,
          rows: 4,
          cellWidth: 64,
          cellHeight: 64,
          spacing: 0,
          safeMargin: 0,
          background: "transparent",
        },
        layout: {
          open: {
            row: 0,
            frames: 3,
            widthCells: 2,
          } as any,
        },
      };

      const tracks = parseTracksFromMeta(mockMeta);
      expect(tracks.length).toBe(1);
      expect(tracks[0].name).toBe("open");
      expect(tracks[0].slotSpan).toEqual([2, 2, 2]);
    });

    it("creates a new animation track from a selection box and assigns active track", async () => {
      const { result } = await renderCustomHook(() => useAtlasAnimationTracks());

      let newTrackName = "";
      await React.act(async () => {
        newTrackName = result.current.handleCreateTrackFromSelection(
          { x: 0, y: 128, width: 256, height: 64, row: 1 },
          8,
          64
        );
      });

      expect(newTrackName).toBe("anim_1");
      expect(result.current.tracks.length).toBe(1);
      expect(result.current.tracks[0].row).toBe(1);
      expect(result.current.tracks[0].frames).toBe(4);
      expect(result.current.selectedTrackName).toBe("anim_1");
    });
  });

  describe("AtlasAnimationPreview Bridge with ResolvedFrameRect", () => {
    it("renders the canvas and supports irregular resolved frames without crashing", async () => {
      const mockResolvedFrames: ResolvedFrameRect[] = [
        {
          id: "isl_0",
          x: 12,
          y: 15,
          width: 48,
          height: 52,
          trackName: "attack",
          frameIndex: 0,
          pivot: { x: 0.5, y: 0.9 },
        },
        {
          id: "isl_1",
          x: 75,
          y: 10,
          width: 55,
          height: 60,
          trackName: "attack",
          frameIndex: 1,
          pivot: { x: 0.45, y: 0.9 },
        },
      ];

      const { container } = await renderIntoDom(
        <AtlasAnimationPreview
          imageSrc="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          gridConfig={{
            columns: 8,
            rows: 4,
            cellWidth: 64,
            cellHeight: 64,
            spacing: 0,
            safeMargin: 0,
          }}
          tracks={[
            {
              name: "attack",
              type: "freeform",
              row: 0,
              frames: 2,
              fps: 8,
              loop: true,
            },
          ]}
          selectedTrackName="attack"
          selectedFrameIndex={0}
          origin={{ type: "feet", normalized: { x: 0.5, y: 1.0 } }}
          resolvedFrames={mockResolvedFrames}
          onSelectTrack={() => {}}
          onSelectFrame={() => {}}
        />
      );

      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();
      expect(container.textContent).toContain("attack");
    });
  });

  describe("useAtlasStudioState Orchestrator Integration", () => {
    it("initializes composite studio state and exposes all domain action handlers", async () => {
      const { result } = await renderCustomHook(() => useAtlasStudioState());

      expect(result.current.selectedPresetId).toBe("valen");
      expect(result.current.tracks.length).toBeGreaterThan(0);
      expect(typeof result.current.handleCreateTrackFromSelection).toBe("function");
      expect(typeof result.current.handleAddFreeformFrame).toBe("function");
      expect(typeof result.current.handleBakeIslands).toBe("function");
      expect(typeof result.current.handleAssignFramesToTrack).toBe("function");

      // Verify domain slices
      expect(result.current.tracksSlice).toBeDefined();
      expect(result.current.tracksSlice.tracks.length).toBeGreaterThan(0);
      expect(typeof result.current.tracksSlice.handleCreateTrackFromSelection).toBe("function");

      expect(result.current.presetSlice).toBeDefined();
      expect(result.current.presetSlice.selectedPresetId).toBe("valen");

      expect(result.current.textureSlice).toBeDefined();
      expect(typeof result.current.textureSlice.isTextureLoading).toBe("boolean");

      expect(result.current.slicingSlice).toBeDefined();
      expect(typeof result.current.slicingSlice.handleBakeIslands).toBe("function");

      expect(result.current.uiSlice).toBeDefined();
      expect(result.current.uiSlice.activeInspectorTab).toBe("slicing");
    });
  });
});
