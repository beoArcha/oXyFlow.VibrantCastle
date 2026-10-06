import { MAGIC_DOMAINS, SPELL_CAST_TYPES, DAMAGE_TYPES } from "./spellsSchema";
import { SOUL_TYPES } from "./enemySchema";
import { ITEM_TYPES, ITEM_RARITIES } from "./itemSchema";
import { VN_SPEAKER_POSITIONS } from "./visualNovelSchema";

export interface JsonSchemaProperty {
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  enum?: readonly string[];
  items?: JsonSchemaProperty | JsonSchemaObject;
  properties?: Record<string, JsonSchemaProperty | JsonSchemaObject>;
  required?: string[];
  minimum?: number;
}

export interface JsonSchemaObject {
  $schema?: string;
  title: string;
  description: string;
  type: "object";
  properties: Record<string, JsonSchemaProperty | JsonSchemaObject>;
  required: string[];
  additionalProperties?: boolean;
}

export type SupportedSchemaType = "spell" | "enemy" | "item" | "visual_novel";

export const SPELL_JSON_SCHEMA: JsonSchemaObject = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SpellDefinition",
  description: "Declarative magic spell or skill definition for combat and progression.",
  type: "object",
  required: [
    "id",
    "nameKey",
    "descriptionKey",
    "category",
    "triggerType",
    "domain",
    "castType",
    "manaCost",
    "staminaCost",
    "cooldownFrames",
    "damage",
    "color",
    "iconName",
  ],
  properties: {
    id: { type: "string", description: "Unique spell identifier (e.g. spell_solar_ray)" },
    nameKey: { type: "string", description: "i18n translation key for display name" },
    descriptionKey: { type: "string", description: "i18n translation key for spell description" },
    category: { type: "string", enum: ["active", "passive", "unison"] },
    triggerType: { type: "string", enum: ["cast", "auto", "unison_combo", "on_hit"] },
    domain: { type: "string", enum: MAGIC_DOMAINS },
    castType: { type: "string", enum: SPELL_CAST_TYPES },
    manaCost: { type: "number", minimum: 0 },
    staminaCost: { type: "number", minimum: 0 },
    cooldownFrames: { type: "number", minimum: 0 },
    damage: { type: "number", minimum: 0 },
    color: { type: "string", description: "Hex color code for particles and projectile core" },
    iconName: { type: "string", description: "Icon identifier matching UI icon registry" },
    projectileSpeed: { type: "number", minimum: 0 },
  },
  additionalProperties: true,
};

export const ENEMY_JSON_SCHEMA: JsonSchemaObject = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "EnemyTemplate",
  description: "Declarative enemy creature template with physics, combat stats, and soul drops.",
  type: "object",
  required: [
    "id",
    "nameKey",
    "behavior",
    "health",
    "damage",
    "speed",
    "width",
    "height",
    "spriteScale",
    "color",
    "isBoss",
  ],
  properties: {
    id: { type: "string", description: "Unique enemy identifier (e.g. gargoyle_scout)" },
    nameKey: { type: "string", description: "i18n translation key for enemy name" },
    behavior: {
      type: "string",
      enum: ["patrol", "flying_sine", "static_turret", "leap_charge", "stalker"],
    },
    health: { type: "number", minimum: 1 },
    damage: { type: "number", minimum: 0 },
    speed: { type: "number", minimum: 0 },
    width: { type: "number", minimum: 1 },
    height: { type: "number", minimum: 1 },
    spriteScale: { type: "number", minimum: 0.1 },
    color: { type: "string", description: "Fallback render color" },
    isBoss: { type: "boolean" },
    soulDrop: {
      type: "object",
      title: "EnemySoulDrop",
      description: "Granted soul ability when defeated",
      required: ["soulId", "type", "dropRate", "grantedSkillId", "icon", "i18n"],
      properties: {
        soulId: { type: "string" },
        type: { type: "string", enum: SOUL_TYPES },
        dropRate: { type: "number", minimum: 0 },
        grantedSkillId: { type: "string" },
        icon: { type: "string" },
        i18n: {
          type: "object",
          title: "SoulTranslations",
          description: "i18n keys for soul name and description",
          required: ["nameKey", "descriptionKey"],
          properties: {
            nameKey: { type: "string" },
            descriptionKey: { type: "string" },
          },
        },
      },
    },
  },
  additionalProperties: true,
};

export const ITEM_JSON_SCHEMA: JsonSchemaObject = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ItemDefinition",
  description: "Declarative item or equipment definition with stat bonuses and rarity.",
  type: "object",
  required: ["id", "nameKey", "descriptionKey", "type", "rarity", "tier", "cost", "icon"],
  properties: {
    id: { type: "string", description: "Unique item identifier" },
    nameKey: { type: "string", description: "i18n name key" },
    descriptionKey: { type: "string", description: "i18n description key" },
    type: { type: "string", enum: ITEM_TYPES },
    rarity: { type: "string", enum: ITEM_RARITIES },
    tier: { type: "number", minimum: 1 },
    cost: { type: "number", minimum: 0 },
    icon: { type: "string", description: "Icon key" },
    damageType: { type: "string", enum: DAMAGE_TYPES },
    stats: {
      type: "object",
      title: "ItemStats",
      description: "Numerical stat modifiers",
      required: [],
      properties: {
        attack: { type: "number" },
        defense: { type: "number" },
        hpBonus: { type: "number" },
        manaBonus: { type: "number" },
        staminaBonus: { type: "number" },
      },
    },
  },
  additionalProperties: true,
};

export const VISUAL_NOVEL_SCENE_JSON_SCHEMA: JsonSchemaObject = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "VisualNovelScene",
  description: "Declarative Visual Novel dialogue scene with branch choices and speaker nodes.",
  type: "object",
  required: ["sceneId", "titleKey", "initialNodeId", "backgroundId", "nodes"],
  properties: {
    sceneId: { type: "string", description: "Unique scene identifier" },
    titleKey: { type: "string", description: "i18n key for scene title" },
    initialNodeId: { type: "string", description: "Entry node ID" },
    backgroundId: { type: "string", description: "Background asset key" },
    musicCue: { type: "string", description: "Audio cue key" },
    nodes: {
      type: "object",
      title: "SceneNodesMap",
      description: "Map of node IDs to node definitions",
      required: [],
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const SCHEMA_REGISTRY: Record<SupportedSchemaType, JsonSchemaObject> = {
  spell: SPELL_JSON_SCHEMA,
  enemy: ENEMY_JSON_SCHEMA,
  item: ITEM_JSON_SCHEMA,
  visual_novel: VISUAL_NOVEL_SCENE_JSON_SCHEMA,
};

export function exportSchemaToJson(type: SupportedSchemaType): string {
  const schema = SCHEMA_REGISTRY[type];
  return JSON.stringify(schema, null, 2);
}

export function buildAiPromptTemplate(type: SupportedSchemaType, userIntent = "Create a balanced entity"): string {
  const schema = SCHEMA_REGISTRY[type];
  return `You are an expert game content designer.
Your task: ${userIntent}
You MUST output ONLY valid JSON adhering strictly to the following JSON Schema:
${JSON.stringify(schema, null, 2)}
Output strictly JSON without markdown wrappers or code block markers.`;
}
