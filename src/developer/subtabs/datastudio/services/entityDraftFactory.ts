import { EnemyJsonSchema } from "@lib/schemas/enemySchema";
import { ItemJsonSchema } from "@lib/schemas/itemSchema";
import { SpellJsonSchema } from "@lib/schemas/spellsSchema";

/**
 * Safely creates a deep clone of a draft object to prevent accidental
 * mutation of statically imported JSON objects in module memory.
 */
export function cloneEntityDraft<T>(source: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(source);
  }
  return JSON.parse(JSON.stringify(source)) as T;
}

/**
 * Creates a valid default draft template for an enemy definition.
 */
export function createDefaultEnemyDraft(customId?: string): Partial<EnemyJsonSchema> {
  const id = customId ?? `enemy_custom_${Date.now().toString().slice(-4)}`;
  return {
    id,
    nameKey: "enemyCustomName",
    defaultName: "Custom Beast",
    category: "beast",
    isDummy: false,
    isAerial: false,
    dimensions: { width: 32, height: 32 },
    stats: {
      health: 100,
      maxHealth: 100,
      speed: 1.5,
      attackPower: 15,
      scoreReward: 50,
    },
    soulDrop: {
      soulId: `soul_${id}`,
      type: "bullet",
      dropRate: 0.15,
      grantedSkillId: "skill_dash",
      icon: "Sparkles",
      i18n: {
        nameKey: "soulName",
        descriptionKey: "soulDesc",
      },
    },
    proceduralFallback: {
      bodyColor: "#dc2626",
    },
  };
}

/**
 * Creates a valid default draft template for an item definition.
 */
export function createDefaultItemDraft(customId?: string): Partial<ItemJsonSchema> {
  const id = customId ?? `item_custom_${Date.now().toString().slice(-4)}`;
  return {
    id,
    nameKey: "itemCustomName",
    descriptionKey: "itemCustomDesc",
    type: "weapon",
    rarity: "common",
    icon: "Sword",
    attackBonus: 10,
    defenseBonus: 0,
    damageType: "physical",
    maxHpBonus: 0,
    maxManaBonus: 0,
  };
}

/**
 * Creates a valid default draft template for a spell definition.
 */
export function createDefaultSpellDraft(customId?: string): Partial<SpellJsonSchema> {
  const id = customId ?? `spell_custom_${Date.now().toString().slice(-4)}`;
  return {
    id,
    nameKey: "spellCustomName",
    descriptionKey: "spellCustomDesc",
    category: "offensive",
    triggerType: "action",
    magicDomain: "solar",
    castType: "instant",
    manaCost: 20,
    staminaCost: 0,
    cooldownFrames: 30,
    damage: 50,
    projectileSpeed: 8,
    color: "#f59e0b",
    iconName: "Flame",
  };
}
