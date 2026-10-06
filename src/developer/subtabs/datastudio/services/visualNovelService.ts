import {
  VALEN_PORTRAIT_EMOTIONS,
  AURELIA_PORTRAIT_EMOTIONS,
  VisualNovelSceneJsonSchema,
} from "@lib/schemas/visualNovelSchema";
import enemiesJson from "@data/enemies/enemies.json";
import { EnemyJsonSchema } from "@lib/schemas/enemySchema";

export const TACTICAL_SPEAKER_STANCES = [
  "neutral",
  "menacing",
  "enraged",
  "wounded",
  "triumphant",
  "combat_ready",
  "speaking",
] as const;

export const NARRATOR_STANCES = [
  "omniscient",
  "solemn",
  "foreboding",
  "triumphant",
  "mystic",
] as const;

export interface SpeakerOption {
  readonly value: string;
  readonly label: string;
  readonly category: "hero" | "boss" | "beast" | "narrator" | "custom";
}

export function discoverSceneSpeakers(
  scene: VisualNovelSceneJsonSchema,
  translations: {
    heroValen: string;
    heroAurelia: string;
    narrator: string;
    bossPrefix: string;
    enemyPrefix: string;
  }
): SpeakerOption[] {
  const optionsMap = new Map<string, SpeakerOption>();

  optionsMap.set("valen", {
    value: "valen",
    label: translations.heroValen,
    category: "hero",
  });
  optionsMap.set("aurelia", {
    value: "aurelia",
    label: translations.heroAurelia,
    category: "hero",
  });
  optionsMap.set("narrator", {
    value: "narrator",
    label: translations.narrator,
    category: "narrator",
  });

  const enemies = Object.values(enemiesJson.enemies as Record<string, EnemyJsonSchema>);
  for (const enemy of enemies) {
    const isBoss = enemy.id.includes("boss") || enemy.category === "boss" || enemy.stats.health >= 300;
    const prefix = isBoss ? translations.bossPrefix : translations.enemyPrefix;
    optionsMap.set(enemy.id, {
      value: enemy.id,
      label: `${prefix}: ${enemy.defaultName}`,
      category: isBoss ? "boss" : "beast",
    });
  }

  if (scene.nodes) {
    for (const node of Object.values(scene.nodes)) {
      if (node.speaker && !optionsMap.has(node.speaker)) {
        optionsMap.set(node.speaker, {
          value: node.speaker,
          label: node.speaker,
          category: "custom",
        });
      }
    }
  }

  return Array.from(optionsMap.values());
}

export function resolveEmotionsForSpeaker(speakerId: string): readonly string[] {
  if (speakerId === "valen") return VALEN_PORTRAIT_EMOTIONS;
  if (speakerId === "aurelia") return AURELIA_PORTRAIT_EMOTIONS;
  if (speakerId === "narrator") return NARRATOR_STANCES;
  return TACTICAL_SPEAKER_STANCES;
}

export function calculateGridCoordinates(
  emotion: string,
  emotionList: readonly string[]
): { row: number; col: number; index: number } {
  const index = emotionList.indexOf(emotion);
  const safeIndex = index >= 0 ? index : 0;
  return {
    row: Math.floor(safeIndex / 5),
    col: safeIndex % 5,
    index: safeIndex,
  };
}
