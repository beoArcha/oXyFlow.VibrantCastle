import { describe, it, expect } from "bun:test";
import type { ResolvedFrameRect } from "@game/engine/meta/types";
import { ATLAS_PRESETS } from "../assetPresets";
import {
  buildEditableMetaFromPreset,
  normalizeAnimationsMap,
  resolveFramesForMeta,
} from "../atlasSlicerHelpers";
import {
  filterAtlasPresets,
  resolveActiveTrackFrames,
  buildReversedTrackIndices,
  buildPingPongTrackIndices,
  parseEditableMetaJson,
  parseUploadedMetaJson,
} from "../atlasSequenceHelpers";

describe("AtlasSlicer pure helpers", () => {
  it("should normalize nested animations map and fall back to idle when empty", () => {
    // Arrange
    const nestedRaw = {
      animations: {
        walk: { row: 1, frames: 6, fps: 12, loop: true },
      },
    };

    // Act
    const normalizedNested = normalizeAnimationsMap(nestedRaw);
    const normalizedEmpty = normalizeAnimationsMap({});

    // Assert
    expect(normalizedNested.walk).toEqual({
      row: 1,
      frames: 6,
      fps: 12,
      loop: true,
      wide: undefined,
      slotSpan: undefined,
      frameIndices: undefined,
      startCol: undefined,
      widthCells: undefined,
      pingPong: undefined,
    });
    expect(normalizedEmpty.idle).toEqual({ row: 0, frames: 4, fps: 8, loop: true });
  });

  it("should build editable meta doc from preset with high variant dimensions", () => {
    // Arrange
    const valen = ATLAS_PRESETS[0];

    // Act
    const doc = buildEditableMetaFromPreset(valen);

    // Assert
    expect(doc.atlas.columns).toBeGreaterThan(0);
    expect(doc.atlas.rows).toBeGreaterThan(0);
    expect(doc.slicing.method).toBeDefined();
    expect(Object.keys(doc.animations).length).toBeGreaterThan(0);
  });

  it("should filter presets by category and search query across name, id, and tags", () => {
    // Arrange
    const portraitCategory = "portrait" as const;

    // Act
    const portraits = filterAtlasPresets(ATLAS_PRESETS, portraitCategory, "");
    const mageByTag = filterAtlasPresets(ATLAS_PRESETS, "all", "staff");

    // Assert
    expect(portraits.map((p) => p.id)).toEqual(["valen_portraits", "aurelia_portraits"]);
    expect(mageByTag.map((p) => p.id)).toEqual(["aurelia"]);
  });

  it("should resolve active track frames using explicit frameIndices before row matching", () => {
    // Arrange
    const frames: ResolvedFrameRect[] = [
      { id: "f0", x: 0, y: 0, width: 32, height: 32, row: 0 },
      { id: "f1", x: 32, y: 0, width: 32, height: 32, row: 0 },
      { id: "f2", x: 64, y: 0, width: 32, height: 32, row: 0 },
    ];
    const track = { row: 0, frames: 2, fps: 8, loop: true, frameIndices: [2, 0] };

    // Act
    const active = resolveActiveTrackFrames(track, "custom", frames);

    // Assert
    expect(active.map((f) => f.id)).toEqual(["f2", "f0"]);
  });

  it("should build reversed and ping-pong frame index sequences", () => {
    // Arrange
    const frames: ResolvedFrameRect[] = [
      { id: "f0", x: 0, y: 0, width: 32, height: 32, row: 0 },
      { id: "f1", x: 32, y: 0, width: 32, height: 32, row: 0 },
      { id: "f2", x: 64, y: 0, width: 32, height: 32, row: 0 },
      { id: "f3", x: 96, y: 0, width: 32, height: 32, row: 0 },
    ];
    const track = { row: 0, frames: 4, fps: 8, loop: true };

    // Act
    const reversed = buildReversedTrackIndices(track, frames, frames);
    const pingPong = buildPingPongTrackIndices(track, frames, frames);

    // Assert
    expect(reversed).toEqual([3, 2, 1, 0]);
    expect(pingPong).toEqual([0, 1, 2, 3, 2, 1]);
  });

  it("should validate atlas section in editable JSON and handle malformed JSON", () => {
    // Arrange
    const missingAtlas = JSON.stringify({ animations: {} });
    const validMeta = JSON.stringify(buildEditableMetaFromPreset(ATLAS_PRESETS[0]));

    // Act
    const missingRes = parseEditableMetaJson(missingAtlas);
    const brokenRes = parseUploadedMetaJson("{ broken");
    const validRes = parseEditableMetaJson(validMeta);

    // Assert
    expect(missingRes.ok).toBe(false);
    expect(brokenRes.ok).toBe(false);
    expect(validRes.ok).toBe(true);
  });

  it("should resolve baked freeform frames and small textures safely without inverted rects", () => {
    // Arrange
    const baseMeta = buildEditableMetaFromPreset(ATLAS_PRESETS[0]);
    const freeformMeta = {
      ...baseMeta,
      slicing: {
        ...baseMeta.slicing,
        method: "freeform_rects" as const,
        frames: {
          isl_0: { id: "isl_0", x: 10, y: 12, width: 40, height: 50 },
        },
      },
    };
    const smallGridMeta = {
      ...baseMeta,
      animations: {},
      atlas: { ...baseMeta.atlas, columns: 2, rows: 2 },
      slicing: { method: "by_count" as const, grid: { columns: 2, rows: 2, spacing: 0, safeMargin: 0 } },
    };

    // Act
    const freeformFrames = resolveFramesForMeta(freeformMeta, 256, 256);
    const smallFrames = resolveFramesForMeta(smallGridMeta, 16, 16);

    // Assert
    expect(freeformFrames).toHaveLength(1);
    expect(freeformFrames[0].id).toBe("isl_0");
    expect(smallFrames).toHaveLength(4);
    expect(smallFrames[0].width).toBe(8);
    expect(smallFrames[0].height).toBe(8);
  });
});
