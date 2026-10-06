import { describe, it, expect } from "bun:test";
import {
  exportSchemaToJson,
  buildAiPromptTemplate,
  SupportedSchemaType,
} from "@lib/schemas/openapiExporter";
import { spellCodec } from "@lib/codecs/spellCodec";
import { enemyCodec } from "@lib/codecs/enemyCodec";
import { itemCodec } from "@lib/codecs/itemCodec";
import rawSpells from "@data/skills/spells.json";
import rawEnemies from "@data/enemies/enemies.json";
import rawItems from "@data/items/items.json";

describe("Data Studio and AI Pipeline Integration", () => {
  const schemaTypes: SupportedSchemaType[] = ["spell", "enemy", "item", "visual_novel"];

  it("exports valid JSON Schema Draft-07 specs for all supported studio types", () => {
    schemaTypes.forEach((type) => {
      const exported = JSON.parse(exportSchemaToJson(type));
      expect(exported.$schema).toContain("json-schema.org");
      expect(exported.type).toBe("object");
      expect(exported.properties).toBeDefined();
    });
  });

  it("constructs AI prompt templates containing schema specification and design intent", () => {
    const prompt = buildAiPromptTemplate("spell", "Create an astral gravity piercing ray");
    expect(prompt).toContain("You are an expert game content designer.");
    expect(prompt).toContain("astral gravity piercing ray");
    expect(prompt).toContain('"type": "object"');
  });

  it("validates that canonical production data cleanly conforms to exported schemas and codecs", () => {
    // 1. Spells
    const sampleSpell = Object.values(rawSpells.spells)[0];
    const spellDecodeResult = spellCodec.decode(sampleSpell);
    expect(spellDecodeResult.isOk()).toBe(true);

    // 2. Enemies
    const sampleEnemy = Object.values(rawEnemies.enemies)[0];
    const enemyDecodeResult = enemyCodec.decode(sampleEnemy);
    expect(enemyDecodeResult.isOk()).toBe(true);

    // 3. Items
    const sampleItem = Object.values(rawItems)[0];
    const itemDecodeResult = itemCodec.decode(sampleItem);
    expect(itemDecodeResult.isOk()).toBe(true);
  });
});
