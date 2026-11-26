import type {
  SpellJsonSchema,
  EnemyJsonSchema,
  ItemJsonSchema,
  VisualNovelSceneJsonSchema,
  SkillTreeDagJsonSchema,
  SkillNodeJsonSchema,
} from "@lib/schemas";
import { detectDagCycle } from "@lib/schemas";

export type DataStudioEntityKind = "spell" | "enemy" | "item" | "vn";

export function createBlankSpellTemplate(): SpellJsonSchema {
  return {
    id: `custom_spell_${Date.now().toString().slice(-4)}`,
    magicDomain: "solar",
    castType: "instant",
    category: "offensive",
    triggerType: "action",
    nameKey: "spellSolarFlareName",
    descriptionKey: "spellSolarFlareDesc",
    manaCost: 15,
    staminaCost: 0,
    cooldownFrames: 30,
    damage: 35,
    color: "#f59e0b",
    iconName: "Flame",
    character: "valen",
    ownerType: "hero",
    tier: 1,
    minLevel: 1,
    projectileSpeed: 10,
    projectileConfig: {
      speed: 10,
      trajectory: "straight",
      radius: 10,
      pierceCount: 0,
      maxRange: 480,
    },
  };
}

export function createBlankEnemyTemplate(): EnemyJsonSchema {
  return {
    id: `custom_enemy_${Date.now().toString().slice(-4)}`,
    nameKey: "enemyShadowSentinel",
    defaultName: "Shadow Sentinel",
    category: "melee",
    isDummy: false,
    isAerial: false,
    dimensions: {
      width: 48,
      height: 64,
    },
    stats: {
      health: 180,
      maxHealth: 180,
      speed: 2.4,
      attackPower: 22,
      scoreReward: 250,
      defense: 6,
      xpReward: 40,
    },
    abilities: ["slash"],
    atlas: {
      presetId: "training_dummy",
      defaultAnimation: "idle",
      hitAnimation: "hit",
    },
    proceduralFallback: {
      bodyColor: "#b45309",
      accentColor: "#f59e0b",
      eyesColor: "#fef08a",
    },
  };
}

export function createBlankItemTemplate(): ItemJsonSchema {
  return {
    id: `custom_item_${Date.now().toString().slice(-4)}`,
    nameKey: "itemSolarBlade",
    descriptionKey: "itemSolarBladeDesc",
    type: "weapon",
    rarity: "rare",
    damageType: "fire",
    icon: "Sword",
    attackBonus: 18,
    defenseBonus: 0,
    maxHpBonus: 0,
    maxManaBonus: 10,
  };
}

export function buildAiSystemPrompt(
  kind: DataStudioEntityKind,
  objective: string
): string {
  const schemaContracts: Record<DataStudioEntityKind, string> = {
    spell: `{
  "id": "string (snake_case)",
  "magicDomain": "solar | astral | chrono | frost | shadow",
  "castType": "instant | channeled | chargeable | aura | sigil_trap",
  "category": "offensive | defensive | passive",
  "triggerType": "action | automatic | passive",
  "nameKey": "string",
  "descriptionKey": "string",
  "manaCost": number,
  "staminaCost": number,
  "cooldownFrames": number,
  "damage": number,
  "color": "#RRGGBB",
  "iconName": "LucideIconName",
  "character": "valen | aurelia",
  "ownerType": "hero | enemy | boss | unison"
}`,
    enemy: `{
  "id": "string (snake_case)",
  "nameKey": "string",
  "defaultName": "string",
  "category": "dummy | melee | ranged | aerial | turret | boss",
  "isDummy": boolean,
  "isAerial": boolean,
  "dimensions": { "width": number, "height": number },
  "stats": {
    "health": number,
    "maxHealth": number,
    "speed": number,
    "attackPower": number,
    "scoreReward": number,
    "defense": number
  },
  "proceduralFallback": { "bodyColor": "#RRGGBB" }
}`,
    item: `{
  "id": "string (snake_case)",
  "nameKey": "string",
  "descriptionKey": "string",
  "type": "weapon | shield | helmet | armor | amulet | necklace | ring | potion",
  "rarity": "common | uncommon | rare | legendary",
  "damageType": "physical | fire | frost | holy | astral | chrono | shadow",
  "icon": "LucideIconName",
  "attackBonus": number,
  "defenseBonus": number,
  "maxHpBonus": number,
  "maxManaBonus": number
}`,
    vn: `{
  "sceneId": "string",
  "titleKey": "string",
  "initialNodeId": "string",
  "backgroundId": "string",
  "nodes": {
    "node_start": {
      "id": "node_start",
      "speaker": "valen | aurelia | narrator",
      "position": "left | right | center",
      "emotion": "stoic | serene | radiant | serious",
      "dialogueKey": "string",
      "nextNodeId": "string (optional)",
      "choices": [{ "choiceId": "string", "textKey": "string", "targetNodeId": "string" }]
    }
  }
}`,
  };

  return [
    `You are a structured RPG content designer for Vibrant Castle.`,
    `Objective: ${objective}`,
    `Return ONLY valid JSON conforming strictly to this ${kind.toUpperCase()} schema:`,
    schemaContracts[kind],
  ].join("\n\n");
}

export interface DagSummary {
  readonly hasCycle: boolean;
  readonly cyclePath: string[] | null;
  readonly nodeCount: number;
  readonly edgeCount: number;
}

export function analyzeSkillTreeDag(tree: SkillTreeDagJsonSchema): DagSummary {
  const nodes = Object.values(tree.nodes);
  const edgeCount = nodes.reduce((sum, n) => sum + (n.prerequisites?.length ?? 0), 0);
  const cyclePath = detectDagCycle(tree.nodes);
  return {
    hasCycle: cyclePath !== null,
    cyclePath,
    nodeCount: nodes.length,
    edgeCount,
  };
}

export function extractVnScenes(raw: unknown): VisualNovelSceneJsonSchema[] {
  if (!raw || typeof raw !== "object") return [];
  const doc = raw as { scenes?: Record<string, VisualNovelSceneJsonSchema> };
  if (doc.scenes && typeof doc.scenes === "object") {
    return Object.values(doc.scenes);
  }
  return [];
}

export function extractSpellsList(raw: unknown): SpellJsonSchema[] {
  if (!raw || typeof raw !== "object") return [];
  const doc = raw as { spells?: Record<string, SpellJsonSchema> };
  if (doc.spells && typeof doc.spells === "object") {
    return Object.values(doc.spells);
  }
  return [];
}

export function extractEnemiesList(raw: unknown): EnemyJsonSchema[] {
  if (!raw || typeof raw !== "object") return [];
  const doc = raw as { enemies?: Record<string, EnemyJsonSchema> };
  if (doc.enemies && typeof doc.enemies === "object") {
    return Object.values(doc.enemies);
  }
  return [];
}

export function extractItemsList(raw: unknown): ItemJsonSchema[] {
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw)) {
    return raw as ItemJsonSchema[];
  }
  const rec = raw as Record<string, unknown>;
  if (rec.items && typeof rec.items === "object") {
    return Object.values(rec.items as Record<string, ItemJsonSchema>);
  }
  return Object.values(rec).filter(
    (entry): entry is ItemJsonSchema =>
      typeof entry === "object" && entry !== null && "id" in entry && "type" in entry
  );
}

export function extractSkillNodesById(raw: unknown): Record<string, SkillNodeJsonSchema> {
  const map: Record<string, SkillNodeJsonSchema> = {};
  if (!raw || typeof raw !== "object") return map;
  const dict = raw as { valen?: SkillNodeJsonSchema[]; aurelia?: SkillNodeJsonSchema[] };
  for (const list of [dict.valen, dict.aurelia]) {
    if (Array.isArray(list)) {
      for (const node of list) {
        map[node.id] = node;
      }
    }
  }
  return map;
}

export function downloadJsonFile(filename: string, payload: unknown): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
