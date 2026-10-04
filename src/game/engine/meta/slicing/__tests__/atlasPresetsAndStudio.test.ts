import { describe, it, expect } from "bun:test";
import { ATLAS_PRESETS } from "@developer/subtabs/atlas/assetPresets";
import { defaultAtlasSlicingEngine } from "../AtlasSlicingEngine";
import { defaultMetaParser } from "../../MetaParser";

describe("Atlas Presets & Studio Slicing Integration", () => {
  it("includes all 10 standard game presets (characters, enemies, structures, portraits)", () => {
    expect(ATLAS_PRESETS.length).toBe(10);

    const ids = ATLAS_PRESETS.map((p) => p.id);
    expect(ids).toContain("valen");
    expect(ids).toContain("aurelia");
    expect(ids).toContain("clockwork_owl_gargoyle");
    expect(ids).toContain("training_dummy");
    expect(ids).toContain("aether_gate");
    expect(ids).toContain("chrono_lever");
    expect(ids).toContain("grand_portcullis");
    expect(ids).toContain("hazard_thorns");
    expect(ids).toContain("valen_portraits");
    expect(ids).toContain("aurelia_portraits");
  });

  it("verifies all presets have valid metadata geometries and categories", () => {
    for (const preset of ATLAS_PRESETS) {
      expect(preset.name).toBeDefined();
      expect(preset.category).toMatch(/^(character|enemy|structure|portrait|custom)$/);
      expect(preset.imageSrc).toBeDefined();
      expect(preset.defaultMeta).toBeDefined();

      const atlas = preset.defaultMeta.atlas;
      expect(atlas).toBeDefined();
      expect(atlas.columns).toBeGreaterThanOrEqual(1);
      expect(atlas.rows).toBeGreaterThanOrEqual(1);

      const cellW =
        preset.defaultMeta.variants?.high?.cellWidth ||
        preset.defaultMeta.atlas?.cellWidth ||
        128;
      const cellH =
        preset.defaultMeta.variants?.high?.cellHeight ||
        preset.defaultMeta.atlas?.cellHeight ||
        128;

      expect(cellW).toBeGreaterThanOrEqual(16);
      expect(cellH).toBeGreaterThanOrEqual(16);
    }
  });

  it("resolves sliced frames cleanly for every preset via AtlasSlicingEngine", () => {
    for (const preset of ATLAS_PRESETS) {
      const doc = preset.defaultMeta;
      const cols = doc.atlas.columns;
      const rows = doc.atlas.rows;
      const cellW = doc.variants?.high?.cellWidth || doc.atlas.cellWidth || 128;
      const cellH = doc.variants?.high?.cellHeight || doc.atlas.cellHeight || 128;

      const textureW = cols * cellW;
      const textureH = rows * cellH;

      const frames = defaultAtlasSlicingEngine.resolveFrames(doc as any, textureW, textureH);
      expect(frames.length).toBeGreaterThan(0);

      // Verify no NaN coordinates or zero dimensions
      for (const frame of frames) {
        expect(Number.isFinite(frame.x)).toBe(true);
        expect(Number.isFinite(frame.y)).toBe(true);
        expect(frame.width).toBeGreaterThan(0);
        expect(frame.height).toBeGreaterThan(0);
        expect(frame.x + frame.width).toBeLessThanOrEqual(textureW + 1);
        expect(frame.y + frame.height).toBeLessThanOrEqual(textureH + 1);
      }
    }
  });

  it("correctly slices portraits grid (5x5) with emotions and dialogue expressions", () => {
    const valenPortraits = ATLAS_PRESETS.find((p) => p.id === "valen_portraits")!;
    expect(valenPortraits).toBeDefined();
    expect(valenPortraits.category).toBe("portrait");

    const frames = defaultAtlasSlicingEngine.resolveFrames(
      valenPortraits.defaultMeta as any,
      5 * 232,
      5 * 270
    );

    // 5 rows x 5 frames = 25 emotional portrait tiles
    expect(frames.length).toBe(25);
    expect(frames[0].width).toBe(232);
    expect(frames[0].height).toBe(270);
  });

  it("parses and validates structure assets with startCol and widthCells", () => {
    const chronoLever = ATLAS_PRESETS.find((p) => p.id === "chrono_lever")!;
    expect(chronoLever).toBeDefined();
    expect(chronoLever.category).toBe("structure");

    const parsed = defaultMetaParser.parseStructure(chronoLever.defaultMeta);
    expect(parsed.atlas.columns).toBe(6);
    expect(parsed.atlas.rows).toBe(3);
    expect(parsed.animations?.animations?.idle).toBeDefined();
    expect(parsed.animations?.animations?.activating).toBeDefined();
    expect(parsed.animations?.animations?.active).toBeDefined();
  });

  it("supports visual slotSpan widening (e.g. 2-cell wide slash attack)", () => {
    const valen = ATLAS_PRESETS.find((p) => p.id === "valen")!;
    const doc = JSON.parse(JSON.stringify(valen.defaultMeta));

    // Mock a wide attack track with frame 1 being double-width
    doc.animations.heavy_slash = {
      row: 2,
      frames: 3,
      fps: 10,
      loop: false,
      wide: true,
      slotSpan: [1, 2, 1], // frame 0 is 1 cell, frame 1 is 2 cells, frame 2 is 1 cell
    };

    const cellW = 128;
    const cellH = 128;
    const frames = defaultAtlasSlicingEngine.resolveFrames(
      doc,
      doc.atlas.columns * cellW,
      doc.atlas.rows * cellH
    );

    const slashFrames = frames.filter((f) => f.trackName === "heavy_slash");
    expect(slashFrames.length).toBe(3);
    expect(slashFrames[0].x).toBe(0);
    expect(slashFrames[0].width).toBe(128);
    expect(slashFrames[1].x).toBe(128);
    expect(slashFrames[1].width).toBe(256); // 2 * 128
    expect(slashFrames[2].x).toBe(384); // 128 + 256
    expect(slashFrames[2].width).toBe(128);
  });
});
