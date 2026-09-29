import { describe, it, expect } from "bun:test";
import { SpriteExtractorFactory } from "../SpriteExtractorFactory";
import { HumanoidSpriteExtractor } from "../HumanoidSpriteExtractor";
import { MonsterSpriteExtractor } from "../MonsterSpriteExtractor";
import { ObjectSpriteExtractor } from "../ObjectSpriteExtractor";
import { PortraitSpriteExtractor } from "../PortraitSpriteExtractor";
import { defaultAtlasSlicingEngine } from "../../meta/slicing/AtlasSlicingEngine";
import { BaseExtractionMeta } from "../ISpriteSheetExtractor";

describe("Sprite Extractors & AtlasSlicingEngine Integration", () => {
  const humanoidExtractor = new HumanoidSpriteExtractor();
  const monsterExtractor = new MonsterSpriteExtractor();
  const objectExtractor = new ObjectSpriteExtractor();
  const portraitExtractor = new PortraitSpriteExtractor();

  describe("HumanoidSpriteExtractor with slicing strategies", () => {
    it("slices humanoid tracks using 'by_count' slicing config matching AtlasSlicingEngine exactly", () => {
      const meta: BaseExtractionMeta = {
        characterId: "valen_test",
        entityType: "humanoid",
        atlas: { columns: 12, rows: 8 },
        slicing: {
          method: "by_count",
          grid: { columns: 12, rows: 8 },
        },
        animations: {
          idle: { row: 0, frames: 6, fps: 5, loop: true },
          run: { row: 1, frames: 8, fps: 8, loop: true },
          attack: { row: 4, frames: 3, slotSpan: [2, 3, 2], wide: true, fps: 6, loop: false },
        },
      };

      const sheetW = 1536;
      const sheetH = 1024;

      const engineFrames = defaultAtlasSlicingEngine.resolveFrames(meta, sheetW, sheetH);
      const extractedTracks = humanoidExtractor.extract(meta, "high", { width: sheetW, height: sheetH });

      expect(extractedTracks.idle).toBeDefined();
      expect(extractedTracks.idle.frameCount).toBe(6);
      expect(extractedTracks.run.frameCount).toBe(8);
      expect(extractedTracks.attack.frameCount).toBe(3);
      expect(extractedTracks.attack.supportsWide).toBe(true);

      // Verify geometry matches AtlasSlicingEngine for attack track
      const engineAttackFrames = engineFrames.filter((f) => f.trackName === "attack");
      expect(engineAttackFrames.length).toBe(3);

      for (let i = 0; i < 3; i++) {
        expect(extractedTracks.attack.frames[i].x).toBe(engineAttackFrames[i].x);
        expect(extractedTracks.attack.frames[i].y).toBe(engineAttackFrames[i].y);
        expect(extractedTracks.attack.frames[i].w).toBe(engineAttackFrames[i].width);
        expect(extractedTracks.attack.frames[i].h).toBe(engineAttackFrames[i].height);
      }
    });

    it("slices humanoid tracks using 'by_cell_size' slicing config", () => {
      const meta: BaseExtractionMeta = {
        characterId: "rogue_cell",
        entityType: "humanoid",
        slicing: {
          method: "by_cell_size",
          cellSize: {
            cellWidth: 64,
            cellHeight: 64,
            offsetX: 0,
            offsetY: 0,
            spacingX: 0,
            spacingY: 0,
          },
        },
        animations: {
          idle: { row: 0, frames: 4, fps: 6 },
          dash: { row: 1, frames: 2, slotSpan: [2, 2], fps: 10 },
        },
      };

      const extracted = humanoidExtractor.extract(meta, "mid", { width: 512, height: 256 });
      expect(extracted.idle.frameCount).toBe(4);
      expect(extracted.idle.frames[0].w).toBe(64);
      expect(extracted.idle.frames[0].h).toBe(64);

      expect(extracted.dash.frameCount).toBe(2);
      expect(extracted.dash.frames[0].w).toBe(128); // 2 cells wide
      expect(extracted.dash.frames[0].isWide).toBe(true);
    });

    it("slices humanoid tracks using 'freeform_rects' slicing config with custom pivots", () => {
      const meta: BaseExtractionMeta = {
        characterId: "freeform_hero",
        entityType: "humanoid",
        slicing: {
          method: "freeform_rects",
          frames: {
            idle_0: { x: 10, y: 12, width: 48, height: 80, pivot: { x: 0.5, y: 1.0 } },
            idle_1: { x: 70, y: 10, width: 50, height: 82, pivot: { x: 0.5, y: 1.0 } },
            attack_0: { x: 130, y: 5, width: 110, height: 90, pivot: { x: 0.4, y: 0.95 } },
          },
        },
        animations: {
          idle: { row: 0, frames: 2, fps: 5 },
          attack: { row: 1, frames: 1, fps: 8 },
        },
      };

      const extracted = humanoidExtractor.extract(meta, "high", { width: 500, height: 500 });
      expect(extracted.idle.frameCount).toBe(2);
      expect(extracted.idle.frames[0].x).toBe(10);
      expect(extracted.idle.frames[0].w).toBe(48);
      expect(extracted.idle.frames[0].originX).toBe(24);
      expect(extracted.idle.frames[0].originY).toBe(80);

      expect(extracted.attack.frameCount).toBe(1);
      expect(extracted.attack.frames[0].x).toBe(130);
      expect(extracted.attack.frames[0].w).toBe(110);
      expect(extracted.attack.frames[0].originX).toBe(Math.round(110 * 0.4));
      expect(extracted.attack.frames[0].originY).toBe(Math.round(90 * 0.95));
    });

    it("extracts pre-computed 'auto_islands' frames at runtime with zero CPU flood-fill overhead", () => {
      // Authoring saved detected auto-islands into JSON slicing.frames
      const meta: BaseExtractionMeta = {
        characterId: "smart_island_hero",
        entityType: "humanoid",
        slicing: {
          method: "auto_islands",
          autoIslands: { minIslandPixels: 10 },
          frames: {
            idle_0: { x: 5, y: 8, width: 52, height: 78, trackName: "idle", frameIndex: 0 },
            idle_1: { x: 65, y: 6, width: 54, height: 80, trackName: "idle", frameIndex: 1 },
            cast_0: { x: 130, y: 2, width: 85, height: 85, trackName: "cast", frameIndex: 0 },
          },
        },
        animations: {
          idle: { row: 0, frames: 2 },
          cast: { row: 1, frames: 1 },
        },
      };

      const t0 = performance.now();
      // No pixelBuffer provided: pure mathematical bounding box extraction
      const extracted = humanoidExtractor.extract(meta, "high", { width: 1000, height: 1000 });
      const elapsed = performance.now() - t0;
      expect(elapsed).toBeLessThan(50); // Ultra fast memory lookup without CPU flood fill
      expect(extracted.idle.frameCount).toBe(2);
      expect(extracted.idle.frames[0].x).toBe(5);
      expect(extracted.idle.frames[1].x).toBe(65);
      expect(extracted.cast.frameCount).toBe(1);
      expect(extracted.cast.frames[0].w).toBe(85);
    });

    it("retains 100% backward compatibility when slicing section is omitted", () => {
      const legacyMeta: BaseExtractionMeta = {
        characterId: "legacy_valen",
        entityType: "humanoid",
        atlas: { columns: 12, rows: 8 },
        animations: {
          idle: { row: 0, frames: 6 },
          run: { row: 1, frames: 8 },
        },
      };

      const extracted = humanoidExtractor.extract(legacyMeta, "high", { width: 1200, height: 800 });
      expect(extracted.idle).toBeDefined();
      expect(extracted.idle.frameCount).toBe(6);
      expect(extracted.run).toBeDefined();
      expect(extracted.move).toBeDefined(); // alias check
    });
  });

  describe("MonsterSpriteExtractor with slicing strategies", () => {
    it("slices monster animations using 'by_count' slicing config", () => {
      const meta: BaseExtractionMeta = {
        characterId: "owl_gargoyle",
        entityType: "monster",
        atlas: { columns: 8, rows: 4 },
        slicing: {
          method: "by_count",
          grid: { columns: 8, rows: 4 },
        },
        animations: {
          idle: { row: 0, frames: 4, fps: 6, anchor: "center" },
          attack: { row: 1, frames: 2, slotSpan: [2, 2], anchor: "bottom_center" },
        },
      };

      const extracted = monsterExtractor.extract(meta, "high", { width: 800, height: 400 });
      expect(extracted.idle.frameCount).toBe(4);
      expect(extracted.idle.frames[0].w).toBe(100);
      expect(extracted.idle.frames[0].originY).toBe(50); // center anchor

      expect(extracted.attack.frameCount).toBe(2);
      expect(extracted.attack.frames[0].w).toBe(200); // 2 cells wide
      expect(extracted.attack.frames[0].originY).toBe(100); // bottom_center anchor
    });

    it("slices monster animations using 'freeform_rects'", () => {
      const meta: BaseExtractionMeta = {
        characterId: "gargoyle_freeform",
        entityType: "monster",
        slicing: {
          method: "freeform_rects",
          frames: {
            hover_0: { x: 0, y: 0, width: 120, height: 110, pivot: { x: 0.5, y: 0.5 } },
            swoop_0: { x: 130, y: 20, width: 160, height: 90, pivot: { x: 0.5, y: 0.8 } },
          },
        },
        animations: {
          hover: { row: 0, frames: 1 },
          swoop: { row: 1, frames: 1 },
        },
      };

      const extracted = monsterExtractor.extract(meta, "high", { width: 500, height: 300 });
      expect(extracted.hover.frameCount).toBe(1);
      expect(extracted.hover.frames[0].w).toBe(120);
      expect(extracted.hover.frames[0].originY).toBe(55); // pivot 0.5 * 110

      expect(extracted.swoop.frameCount).toBe(1);
      expect(extracted.swoop.frames[0].originY).toBe(Math.round(90 * 0.8));
    });
  });

  describe("ObjectSpriteExtractor with slicing strategies", () => {
    it("slices interactive object using 'by_count' slicing config", () => {
      const meta: BaseExtractionMeta = {
        objectId: "aether_gate",
        entityType: "interactive_object",
        atlas: { columns: 6, rows: 1 },
        slicing: {
          method: "by_count",
          grid: { columns: 6, rows: 1 },
        },
        animations: {
          active: { row: 0, frames: 6, fps: 8, loop: true, anchor: "bottom_center" },
        },
      };

      const extracted = objectExtractor.extract(meta, "high", { width: 600, height: 100 });
      expect(extracted.objectId).toBe("aether_gate");
      expect(extracted.animations.active.frameCount).toBe(6);
      expect(extracted.animations.active.frames[0].w).toBe(100);
      expect(extracted.animations.active.frames[0].originY).toBe(100); // bottom_center anchor
    });

    it("slices interactive object using 'freeform_rects'", () => {
      const meta: BaseExtractionMeta = {
        objectId: "chrono_lever",
        entityType: "interactive_object",
        slicing: {
          method: "freeform_rects",
          frames: {
            off_0: { x: 10, y: 10, width: 40, height: 80, pivot: { x: 0.5, y: 1.0 } },
            on_0: { x: 60, y: 10, width: 40, height: 80, pivot: { x: 0.5, y: 1.0 } },
          },
        },
        animations: {
          off: { row: 0, frames: 1 },
          on: { row: 1, frames: 1 },
        },
      };

      const extracted = objectExtractor.extract(meta, "high", { width: 200, height: 100 });
      expect(extracted.animations.off.frameCount).toBe(1);
      expect(extracted.animations.on.frameCount).toBe(1);
      expect(extracted.animations.off.frames[0].x).toBe(10);
      expect(extracted.animations.on.frames[0].x).toBe(60);
    });
  });

  describe("PortraitSpriteExtractor with slicing strategies", () => {
    it("slices portrait matrix using 'by_count' slicing config", () => {
      const meta: BaseExtractionMeta = {
        characterId: "valen_portraits",
        entityType: "portrait",
        portraits: {
          columns: 3,
          rows: 2,
          map: [
            ["neutral", "serious", "thoughtful"],
            ["calm", "confident", "concerned"],
          ],
        },
        slicing: {
          method: "by_count",
          grid: { columns: 3, rows: 2 },
        },
      };

      const extracted = portraitExtractor.extract(meta, "high", { width: 300, height: 200 });
      expect(extracted.columns).toBe(3);
      expect(extracted.rows).toBe(2);
      expect(extracted.moods.length).toBe(6);
      expect(extracted.moodMap.neutral).toBeDefined();
      expect(extracted.moodMap.confident).toBeDefined();

      expect(extracted.moodMap.neutral.x).toBe(0);
      expect(extracted.moodMap.neutral.y).toBe(0);
      expect(extracted.moodMap.confident.x).toBe(100);
      expect(extracted.moodMap.confident.y).toBe(100);
    });

    it("slices portrait matrix using 'freeform_rects' with custom mood IDs", () => {
      const meta: BaseExtractionMeta = {
        characterId: "aurelia_custom_portraits",
        entityType: "portrait",
        portraits: {
          columns: 2,
          rows: 1,
          map: [["focused", "triumphant"]],
        },
        slicing: {
          method: "freeform_rects",
          frames: {
            focused: { x: 5, y: 5, width: 95, height: 110 },
            triumphant: { x: 110, y: 8, width: 100, height: 112 },
          },
        },
      };

      const extracted = portraitExtractor.extract(meta, "high", { width: 300, height: 200 });
      expect(extracted.moodMap.focused).toBeDefined();
      expect(extracted.moodMap.focused.x).toBe(5);
      expect(extracted.moodMap.focused.width).toBe(95);

      expect(extracted.moodMap.triumphant).toBeDefined();
      expect(extracted.moodMap.triumphant.x).toBe(110);
      expect(extracted.moodMap.triumphant.width).toBe(100);
    });
  });

  describe("Factory dispatch & overall performance", () => {
    it("dispatches automatically via SpriteExtractorFactory.extract()", () => {
      const meta: BaseExtractionMeta = {
        characterId: "factory_humanoid",
        entityType: "humanoid",
        slicing: {
          method: "by_count",
          grid: { columns: 6, rows: 2 },
        },
        animations: {
          idle: { row: 0, frames: 6 },
        },
      };

      const extracted = SpriteExtractorFactory.extract(meta, "high", { width: 600, height: 200 });
      expect(extracted.idle).toBeDefined();
      expect(extracted.idle.frameCount).toBe(6);
    });
  });
});
