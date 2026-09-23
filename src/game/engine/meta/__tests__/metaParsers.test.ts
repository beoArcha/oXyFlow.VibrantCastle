import { describe, it, expect } from "bun:test";
import { defaultMetaParser, MetaParser } from "../MetaParser";

// Import real bundled asset metadata files
import valenMetaJson from "../../../../assets/characters/valen/valen_meta.json";
import aureliaMetaJson from "../../../../assets/characters/aurelia/aurelia_meta.json";
import gargoyleMetaJson from "../../../../assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_meta.json";
import dummyMetaJson from "../../../../assets/enemies/training_dummy/training_dummy_meta.json";
import gateMetaJson from "../../../../assets/structures/aether_gate/aether_gate_meta.json";

describe("SOLID MetaParser & Section Parsers Suite", () => {
  describe("1. Character Document Parsing (Valen & Aurelia)", () => {
    it("correctly parses Valen character metadata with portraits, wide frames and constraints", () => {
      const doc = defaultMetaParser.parseCharacter(valenMetaJson);

      // Info
      expect(doc.info.id).toBe("valen");
      expect(doc.info.entityType).toBe("humanoid");
      expect(doc.info.version).toBe("4.0");

      // Atlas
      expect(doc.atlas.columns).toBe(12);
      expect(doc.atlas.rows).toBe(8);
      expect(doc.atlas.background).toBe("transparent");

      // Variants
      expect(doc.variants.variants.low.scale).toBe(0.67);
      expect(doc.variants.variants.mid.scale).toBe(1.0);
      expect(doc.variants.variants.high.scale).toBe(1.5);
      expect(doc.variants.variants.high.cellWidth).toBe(128);

      // Animations & Wide Attack Frame Spans
      expect(doc.animations.animations.idle.frames).toBe(6);
      expect(doc.animations.animations.attack.wide).toBe(true);
      expect(doc.animations.animations.attack.slotSpan).toEqual([2, 3, 2, 3, 2]);
      expect(doc.animations.animations.crouch.frameIndices).toEqual([6, 7]);

      // Spatial Layout & Feet Origin
      expect(doc.layout.origin.type).toBe("feet");
      expect(doc.layout.origin.normalized.x).toBe(0.5);
      expect(doc.layout.origin.normalized.y).toBe(1.0);
      expect(doc.layout.naturalFacing).toBe("right");

      // Portrait Matrix (5x5 = 25 mood cells)
      expect(doc.portraits).toBeDefined();
      expect(doc.portraits?.columns).toBe(5);
      expect(doc.portraits?.rows).toBe(5);
      expect(doc.portraits?.map[0][0]).toBe("neutral");

      // Constraints
      expect(doc.constraints?.style).toBe("clean_2D_stylized");
      expect(doc.constraints?.noPainterly).toBe(true);
    });

    it("correctly parses Aurelia character metadata", () => {
      const doc = defaultMetaParser.parseCharacter(aureliaMetaJson);

      expect(doc.info.id).toBe("aurelia");
      expect(doc.info.entityType).toBe("humanoid");
      expect(doc.atlas.columns).toBe(12);
      expect(doc.atlas.rows).toBe(8);
      expect(doc.variants.variants.low.cellWidth).toBe(57);
      expect(doc.variants.variants.mid.cellWidth).toBe(114);
      expect(doc.portraits).toBeDefined();
    });
  });

  describe("2. Creature / Monster Document Parsing (Gargoyle & Training Dummy)", () => {
    it("correctly parses Clockwork Owl Gargoyle with center anchor and state machine", () => {
      const doc = defaultMetaParser.parseCreature(gargoyleMetaJson);

      expect(doc.info.id).toBe("clockwork_owl_gargoyle");
      expect(doc.info.entityType).toBe("creature");

      // Atlas & Margin
      expect(doc.atlas.columns).toBe(6);
      expect(doc.atlas.rows).toBe(5);
      expect(doc.atlas.safeMargin).toBe(10);

      // Aerial Center Anchor
      expect(doc.layout.origin.type).toBe("center");
      expect(doc.layout.origin.normalized.x).toBe(0.5);
      expect(doc.layout.origin.normalized.y).toBe(0.55);
      expect(doc.layout.naturalFacing).toBe("right");

      // State Machine Mapping
      expect(doc.states).toBeDefined();
      expect(doc.states?.states.idle.animation).toBe("fly");
      expect(doc.states?.states.attack.animation).toBe("attack");
      expect(doc.states?.states.hit.animation).toBe("hit");
      expect(doc.states?.states.death.animation).toBe("death");
    });

    it("correctly parses Training Dummy with left natural facing and bestiary frame", () => {
      const doc = defaultMetaParser.parseCreature(dummyMetaJson);

      expect(doc.info.id).toBe("training_dummy");
      expect(doc.info.entityType).toBe("object");

      // Natural Facing Left
      expect(doc.layout.naturalFacing).toBe("left");
      expect(doc.layout.origin.type).toBe("feet");

      // Bestiary info frame extraction
      expect(doc.infoFrames?.infoFrames.bestiary_default).toBe(0);
    });
  });

  describe("3. Structure Document Parsing (Aether Gate)", () => {
    it("correctly parses Aether Gate with interaction, render directives and infoFrames", () => {
      const doc = defaultMetaParser.parseStructure(gateMetaJson);

      expect(doc.info.id).toBe("aether_gate");
      expect(doc.info.entityType).toBe("structure");

      // Info Frames dictionary
      expect(doc.infoFrames?.infoFrames.default).toBe(0);
      expect(doc.infoFrames?.infoFrames.active).toBe(1);
      expect(doc.infoFrames?.infoFrames.highlight).toBe(2);

      // Gameplay Interaction & Triggers
      expect(doc.interaction?.type).toBe("victory_gate");
      expect(doc.interaction?.trigger?.onPlayerEnterRadius).toBe(true);
      expect(doc.interaction?.trigger?.radius).toBe(180);
      expect(doc.interaction?.effects?.playFanfare).toBe(true);
      expect(doc.interaction?.effects?.unlockNextStage).toBe(true);

      // Render Directives
      expect(doc.render?.layer).toBe("interactive");
      expect(doc.render?.zIndex).toBe(10);
      expect(doc.render?.blend).toBe("normal");

      // States mapping
      expect(doc.states?.states.inactive.animation).toBe("idle");
      expect(doc.states?.states.charging.animation).toBe("light_up");
      expect(doc.states?.states.activating.animation).toBe("action");
      expect(doc.states?.states.active.animation).toBe("close_up");
    });
  });

  describe("4. Resilience & Fallback Defaults", () => {
    it("safely handles null and empty inputs without crashing", () => {
      const docNull = defaultMetaParser.parseUniversal(null);
      expect(docNull.info.id).toBe("unknown");
      expect(docNull.info.entityType).toBe("humanoid");
      expect(docNull.atlas.columns).toBe(6);
      expect(docNull.atlas.rows).toBe(4);
      expect(docNull.animations.animations.idle).toBeDefined();

      const docEmpty = defaultMetaParser.parseUniversal({});
      expect(docEmpty.info.id).toBe("unnamed_entity");
      expect(docEmpty.layout.naturalFacing).toBe("right");
    });

    it("supports Dependency Inversion via constructor injection", () => {
      const mockInfoParser = {
        sectionName: "info",
        canParse: () => true,
        parse: () => ({
          id: "custom_injected_id",
          entityType: "custom_type",
          version: "9.9",
          description: "Mocked description",
        }),
      };

      const customParser = new MetaParser({ infoParser: mockInfoParser as any });
      const result = customParser.parseUniversal({});
      expect(result.info.id).toBe("custom_injected_id");
      expect(result.info.version).toBe("9.9");
    });
  });
});
