import { describe, it, expect } from "bun:test";
import { defaultMetaParser, MetaParser } from "../MetaParser";
import { defaultPortraitMatrixParser } from "../parsers/PortraitMatrixParser";
import { defaultAtlasSlicingEngine } from "../slicing/AtlasSlicingEngine";
import valenPortraitsMeta from "../../../../assets/characters/valen/valen_portraits_meta.json";
import aureliaPortraitsMeta from "../../../../assets/characters/aurelia/aurelia_portraits_meta.json";

describe("Portrait Metadata & Multi-Strategy Slicing Suite (Phase 2)", () => {
  describe("1. PortraitMatrixParser Resilience & Auto-Inference", () => {
    it("parses explicit portraits matrix configuration", () => {
      const raw = {
        entityId: "test_portrait",
        entityType: "portrait",
        portraits: {
          columns: 4,
          rows: 3,
          cellWidth: 100,
          cellHeight: 120,
          spacing: 2,
          map: [
            ["neutral", "smile", "laugh", "wink"],
            ["sad", "crying", "mourn", "despair"],
            ["angry", "furious", "glare", "rage"],
          ],
        },
      };

      const parsed = defaultPortraitMatrixParser.parse(raw);
      expect(parsed).toBeDefined();
      expect(parsed?.columns).toBe(4);
      expect(parsed?.rows).toBe(3);
      expect(parsed?.cellWidth).toBe(100);
      expect(parsed?.cellHeight).toBe(120);
      expect(parsed?.spacing).toBe(2);
      expect(parsed?.map?.[0][1]).toBe("smile");
      expect(parsed?.map?.[2][3]).toBe("rage");
    });

    it("auto-infers 5x5 portrait matrix when portraits key is missing but entityType is portrait", () => {
      const rawWithoutPortraitsKey = {
        entityId: "npc_dialogue",
        entityType: "portrait",
        atlas: {
          columns: 5,
          rows: 5,
          cellWidth: 200,
          cellHeight: 250,
          spacing: 0,
        },
        animations: {
          row_0_happy: { row: 0, frames: 5 },
          row_1_sad: { row: 1, frames: 5 },
          row_2_angry: { row: 2, frames: 5 },
          row_3_surprised: { row: 3, frames: 5 },
          row_4_stoic: { row: 4, frames: 5 },
        },
      };

      expect(defaultPortraitMatrixParser.canParse(rawWithoutPortraitsKey)).toBe(true);
      const parsed = defaultPortraitMatrixParser.parse(rawWithoutPortraitsKey);
      expect(parsed).toBeDefined();
      expect(parsed?.columns).toBe(5);
      expect(parsed?.rows).toBe(5);
      expect(parsed?.cellWidth).toBe(200);
      expect(parsed?.cellHeight).toBe(250);
      expect(parsed?.map?.length).toBe(5);
      expect(parsed?.map?.[0][0]).toBe("row_0_happy_f0");
      expect(parsed?.map?.[4][4]).toBe("row_4_stoic_f4");
    });
  });

  describe("2. MetaParser.parsePortrait() & Role-Based Composite Documents", () => {
    it("accurately parses valen_portraits_meta.json as IPortraitMetaDocument", () => {
      const doc = defaultMetaParser.parsePortrait(valenPortraitsMeta);

      expect(doc.info.id).toBe("valen_portraits");
      expect(doc.info.entityType).toBe("portrait");
      expect(doc.atlas.columns).toBe(5);
      expect(doc.atlas.rows).toBe(5);
      expect(doc.atlas.cellWidth).toBe(232);
      expect(doc.atlas.cellHeight).toBe(270);
      expect(doc.portraits).toBeDefined();
      expect(doc.portraits.columns).toBe(5);
      expect(doc.portraits.rows).toBe(5);
      expect(doc.portraits.map?.[0][0]).toBe("neutral");
      expect(doc.portraits.map?.[2][3]).toBe("angry");
      expect(doc.slicing?.method).toBe("by_count");
    });

    it("accurately parses aurelia_portraits_meta.json as IPortraitMetaDocument", () => {
      const doc = defaultMetaParser.parsePortrait(aureliaPortraitsMeta);

      expect(doc.info.id).toBe("aurelia_portraits");
      expect(doc.info.entityType).toBe("portrait");
      expect(doc.atlas.columns).toBe(5);
      expect(doc.atlas.rows).toBe(5);
      expect(doc.atlas.cellWidth).toBe(235);
      expect(doc.atlas.cellHeight).toBe(268);
      expect(doc.portraits).toBeDefined();
      expect(doc.portraits.map?.[0][0]).toBe("curious");
      expect(doc.portraits.map?.[4][4]).toBe("transcendent");
      expect(doc.slicing?.method).toBe("by_count");
    });
  });

  describe("3. MetaParser.parseAuto() Dynamic Dispatching (OCP & ISP)", () => {
    it("dispatches portrait documents to parsePortrait", () => {
      const doc = defaultMetaParser.parseAuto(valenPortraitsMeta);
      expect(doc.info.entityType).toBe("portrait");
      expect((doc as any).portraits).toBeDefined();
    });

    it("dispatches humanoid documents to parseCharacter", () => {
      const rawChar = {
        entityId: "test_hero",
        entityType: "humanoid",
        atlas: { columns: 12, rows: 8, cellWidth: 128, cellHeight: 128 },
      };
      const doc = defaultMetaParser.parseAuto(rawChar);
      expect(doc.info.entityType).toBe("humanoid");
    });

    it("dispatches creature documents to parseCreature", () => {
      const rawCreature = {
        entityId: "test_boss",
        entityType: "creature",
        atlas: { columns: 8, rows: 6, cellWidth: 128, cellHeight: 128 },
      };
      const doc = defaultMetaParser.parseAuto(rawCreature);
      expect(doc.info.entityType).toBe("creature");
    });

    it("dispatches structure documents to parseStructure", () => {
      const rawStructure = {
        entityId: "aether_gate",
        entityType: "structure",
        atlas: { columns: 8, rows: 4, cellWidth: 128, cellHeight: 128 },
      };
      const doc = defaultMetaParser.parseAuto(rawStructure);
      expect(doc.info.entityType).toBe("structure");
    });
  });

  describe("4. AtlasSlicingEngine Integration with Portrait Matrix", () => {
    it("slices all 25 emotion frames (5x5) using GridCount strategy", () => {
      const doc = defaultMetaParser.parsePortrait(valenPortraitsMeta);
      const frames = defaultAtlasSlicingEngine.resolveFrames(doc, 1160, 1350);

      expect(frames.length).toBe(25);
      expect(frames[0].width).toBe(232);
      expect(frames[0].height).toBe(270);
      expect(frames[0].col).toBe(0);
      expect(frames[0].row).toBe(0);
      expect(frames[24].col).toBe(4);
      expect(frames[24].row).toBe(4);
    });

    it("slices portrait sheet using CellSize strategy equivalently", () => {
      const doc = {
        slicing: {
          method: "by_cell_size" as const,
          cellSize: {
            cellWidth: 232,
            cellHeight: 270,
            spacing: 0,
            margin: 0,
          },
        },
      };
      const frames = defaultAtlasSlicingEngine.resolveFrames(doc, 1160, 1350);

      expect(frames.length).toBe(25);
      expect(frames[0].width).toBe(232);
      expect(frames[0].height).toBe(270);
    });
  });
});
