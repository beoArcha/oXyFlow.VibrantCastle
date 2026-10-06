import {
  VALEN_PORTRAIT_EMOTIONS,
  AURELIA_PORTRAIT_EMOTIONS,
  VisualNovelSceneJsonSchema,
  VisualNovelNodeSchema,
  VisualNovelDocumentJsonSchema,
  VnSpeakerPosition,
} from "@lib/schemas/visualNovelSchema";
import enemiesJson from "@data/enemies/enemies.json";
import { EnemyJsonSchema } from "@lib/schemas/enemySchema";
import { StageActor, SceneSummaryOption } from "../types/visualNovelStudioTypes";

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
    const isBoss = enemy.category === "boss" || enemy.id.includes("boss");
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

const SPEAKER_EMOTION_REGISTRY: Record<string, readonly string[]> = {
  valen: VALEN_PORTRAIT_EMOTIONS,
  aurelia: AURELIA_PORTRAIT_EMOTIONS,
  narrator: NARRATOR_STANCES,
};

/**
 * Resolves available emotion/stance presets for a given speaker ID.
 * Open for extension (OCP) via the speaker emotion registry dictionary.
 */
export function resolveEmotionsForSpeaker(speakerId: string): readonly string[] {
  return SPEAKER_EMOTION_REGISTRY[speakerId] ?? TACTICAL_SPEAKER_STANCES;
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

/**
 * Discovers and formats summary information for all registered scenes in the Visual Novel document.
 */
export function getSceneSummaries(
  document: VisualNovelDocumentJsonSchema,
  titleResolver: (key: string) => string
): SceneSummaryOption[] {
  if (!document.scenes) return [];
  return Object.values(document.scenes).map((scene) => ({
    sceneId: scene.sceneId,
    title: scene.titleKey ? titleResolver(scene.titleKey) : scene.sceneId,
    nodeCount: scene.nodes ? Object.keys(scene.nodes).length : 0,
    characterCount: scene.metadata?.characters?.length ?? 0,
  }));
}

/**
 * Resolves the full theatrical cast (roster) of actors present on stage for a scene,
 * determining positions, active speaking state, and emotions for each actor.
 */
export function resolveSceneRoster(
  scene: VisualNovelSceneJsonSchema,
  currentNode: VisualNovelNodeSchema,
  activeSpeakerOverride: string,
  activeEmotionOverride: string,
  nameResolver: (keyOrId: string) => string
): StageActor[] {
  const actorsMap = new Map<string, { id: string; preferredPosition?: VnSpeakerPosition }>();

  if (scene.metadata?.characters) {
    for (const charId of scene.metadata.characters) {
      if (charId !== "narrator") {
        actorsMap.set(charId, { id: charId });
      }
    }
  }

  if (scene.nodes) {
    for (const node of Object.values(scene.nodes)) {
      if (node.speaker && node.speaker !== "narrator") {
        const existing = actorsMap.get(node.speaker);
        if (!existing) {
          actorsMap.set(node.speaker, {
            id: node.speaker,
            preferredPosition: node.position,
          });
        } else if (!existing.preferredPosition && node.position) {
          existing.preferredPosition = node.position;
        }
      }
    }
  }

  if (currentNode.speaker && currentNode.speaker !== "narrator" && !actorsMap.has(currentNode.speaker)) {
    actorsMap.set(currentNode.speaker, {
      id: currentNode.speaker,
      preferredPosition: currentNode.position ?? "center",
    });
  }

  const actorIds = Array.from(actorsMap.keys());
  const stageActors: StageActor[] = [];

  for (let i = 0; i < actorIds.length; i++) {
    const actorId = actorIds[i];
    const actorMeta = actorsMap.get(actorId);
    const isCurrentlySpeaking = currentNode.speaker === actorId;

    let position: VnSpeakerPosition = "center";
    if (isCurrentlySpeaking && currentNode.position) {
      position = currentNode.position;
    } else if (actorMeta?.preferredPosition) {
      position = actorMeta.preferredPosition;
    } else if (actorId === "valen") {
      position = "left";
    } else if (actorId === "aurelia") {
      position = "right";
    } else {
      position = i % 3 === 0 ? "left" : i % 3 === 1 ? "right" : "center";
    }

    let emotion = "neutral";
    if (isCurrentlySpeaking) {
      emotion = currentNode.emotion ?? activeEmotionOverride ?? "neutral";
    } else if (actorId === activeSpeakerOverride && activeEmotionOverride) {
      emotion = activeEmotionOverride;
    } else {
      const defaultEmotions = resolveEmotionsForSpeaker(actorId);
      emotion = defaultEmotions[0] ?? "neutral";
    }

    const isHero = actorId === "valen" || actorId === "aurelia";

    stageActors.push({
      id: actorId,
      displayName: nameResolver(isCurrentlySpeaking && currentNode.speakerNameKey ? currentNode.speakerNameKey : actorId),
      position,
      emotion,
      isActive: isCurrentlySpeaking,
      isNarrator: false,
      isHero,
    });
  }

  return stageActors;
}
