import { describe, it, expect } from "bun:test";
import dialoguesVnJson from "@data/narrative/dialogues_vn.json";
import valenPortraitsMeta from "@assets/characters/valen/valen_portraits_meta.json";
import aureliaPortraitsMeta from "@assets/characters/aurelia/aurelia_portraits_meta.json";
import { visualNovelCodec } from "@lib/codecs/visualNovelCodec";
import {
  validateVisualNovelNode,
  validateVisualNovelScene,
  validateVisualNovelDocument,
  VisualNovelSceneJsonSchema
} from "../visualNovelSchema";
import { translations } from "@i18n/index";

describe("Visual Novel Scene Schema & Portrait Emotion Referential Integrity", () => {
  // Flatten 5x5 portrait matrix maps
  const valenEmotionsSet = new Set<string>();
  valenPortraitsMeta.portraits.map.forEach((row: string[]) => {
    row.forEach((emotion: string) => valenEmotionsSet.add(emotion));
  });

  const aureliaEmotionsSet = new Set<string>();
  aureliaPortraitsMeta.portraits.map.forEach((row: string[]) => {
    row.forEach((emotion: string) => aureliaEmotionsSet.add(emotion));
  });

  it("successfully decodes canonical dialogues_vn.json with visualNovelCodec", () => {
    const result = visualNovelCodec.decode(dialoguesVnJson);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;

    const doc = result.value;
    expect(doc.version).toBe("1.0");
    expect(doc.scenes["scene_clocktower_meeting"]).toBeDefined();

    const scene = doc.scenes["scene_clocktower_meeting"];
    expect(scene.sceneId).toBe("scene_clocktower_meeting");
    expect(scene.initialNodeId).toBe("node_start");
    expect(scene.backgroundId).toBe("bg_clocktower");
    expect(scene.metadata?.characters).toContain("valen");
    expect(scene.metadata?.characters).toContain("aurelia");
    expect(Object.keys(scene.nodes).length).toBeGreaterThanOrEqual(7);
  });

  it("verifies bidirectional round-trip encode and decode for Visual Novel document", () => {
    const decodeRes = visualNovelCodec.decode(dialoguesVnJson);
    expect(decodeRes.isOk()).toBe(true);
    if (!decodeRes.isOk()) return;

    const domainDoc = decodeRes.value;
    const encodeRes = visualNovelCodec.encode(domainDoc);
    expect(encodeRes.isOk()).toBe(true);
    if (!encodeRes.isOk()) return;

    const reDecodedRes = visualNovelCodec.decode(encodeRes.value);
    expect(reDecodedRes.isOk()).toBe(true);
    if (!reDecodedRes.isOk()) return;

    expect(reDecodedRes.value).toEqual(domainDoc);
  });

  it("verifies that all character emotions resolve to valid cells in 5x5 portrait matrices", () => {
    const result = visualNovelCodec.decode(dialoguesVnJson);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;

    const doc = result.value;
    for (const [sceneId, scene] of Object.entries(doc.scenes)) {
      for (const [nodeId, node] of Object.entries(scene.nodes)) {
        if (node.speaker === "valen" && node.emotion) {
          expect(valenEmotionsSet.has(node.emotion)).toBe(true);
        } else if (node.speaker === "aurelia" && node.emotion) {
          expect(aureliaEmotionsSet.has(node.emotion)).toBe(true);
        }
      }
    }
  });

  it("verifies that dialogue scene graph references (nextNodeId and choices.targetNodeId) are closed and valid", () => {
    const result = visualNovelCodec.decode(dialoguesVnJson);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;

    const doc = result.value;
    for (const [sceneId, scene] of Object.entries(doc.scenes)) {
      const nodeKeys = new Set(Object.keys(scene.nodes));

      // Initial node
      expect(nodeKeys.has(scene.initialNodeId)).toBe(true);

      for (const [nodeId, node] of Object.entries(scene.nodes)) {
        // Next node link
        if (node.nextNodeId) {
          expect(nodeKeys.has(node.nextNodeId)).toBe(true);
        }

        // Branch choices links
        if (node.choices) {
          for (const choice of node.choices) {
            expect(nodeKeys.has(choice.targetNodeId)).toBe(true);
          }
        }
      }
    }
  });

  it("verifies 100% translation coverage in PL and EN for all dialogue nodes and choices", () => {
    const result = visualNovelCodec.decode(dialoguesVnJson);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;

    const dictPl = translations.pl as unknown as Record<string, string>;
    const dictEn = translations.en as unknown as Record<string, string>;

    const doc = result.value;
    for (const [sceneId, scene] of Object.entries(doc.scenes)) {
      expect(dictPl[scene.titleKey]).toBeDefined();
      expect(dictEn[scene.titleKey]).toBeDefined();

      for (const [nodeId, node] of Object.entries(scene.nodes)) {
        // Dialogue text
        expect(dictPl[node.dialogueKey]).toBeDefined();
        expect(dictPl[node.dialogueKey]?.length).toBeGreaterThan(0);
        expect(dictEn[node.dialogueKey]).toBeDefined();
        expect(dictEn[node.dialogueKey]?.length).toBeGreaterThan(0);

        // Speaker name
        if (node.speakerNameKey) {
          expect(dictPl[node.speakerNameKey]).toBeDefined();
          expect(dictEn[node.speakerNameKey]).toBeDefined();
        }

        // Choices
        if (node.choices) {
          for (const choice of node.choices) {
            expect(dictPl[choice.textKey]).toBeDefined();
            expect(dictPl[choice.textKey]?.length).toBeGreaterThan(0);
            expect(dictEn[choice.textKey]).toBeDefined();
            expect(dictEn[choice.textKey]?.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("rejects invalid dialogue scenes with missing nodes or broken choice targets", () => {
    const invalidScene: VisualNovelSceneJsonSchema = {
      sceneId: "broken_scene",
      titleKey: "brokenTitle",
      initialNodeId: "missing_start",
      backgroundId: "bg_default",
      nodes: {
        node_1: {
          id: "node_1",
          speaker: "valen",
          dialogueKey: "dialogue1",
          choices: [
            {
              choiceId: "c1",
              textKey: "text1",
              targetNodeId: "non_existent_node"
            }
          ]
        }
      }
    };

    const valResult = validateVisualNovelScene(invalidScene);
    expect(valResult.success).toBe(false);
    if (!valResult.success) {
      const messages = valResult.errors.map((e) => e.message).join("; ");
      expect(messages).toContain("Initial node id 'missing_start' not found in scene nodes");
      expect(messages).toContain("Target node id 'non_existent_node' referenced by choice 'c1' not found in scene");
    }
  });
});
