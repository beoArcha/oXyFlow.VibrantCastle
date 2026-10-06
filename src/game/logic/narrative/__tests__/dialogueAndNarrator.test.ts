import { describe, it, expect } from "bun:test";
import dialoguesVnJson from "@data/narrative/dialogues_vn.json";
import narratorReactiveJson from "@data/narrative/narrator_reactive.json";
import { DialogueGraphRunner } from "../dialogueGraphRunner";
import { ReactiveNarratorManager } from "../reactiveNarratorManager";
import { VisualNovelSceneJsonSchema } from "@lib/schemas/visualNovelSchema";
import { NarratorQuoteSchema } from "@lib/schemas/narratorSchema";

describe("Visual Novel Dialogue Runner & Reactive Narrator Engine", () => {
  const clocktowerScene = dialoguesVnJson.scenes.scene_clocktower_meeting as unknown as VisualNovelSceneJsonSchema;

  describe("DialogueGraphRunner", () => {
    it("starts at initialNodeId and advances along the narrative path", () => {
      const runner = new DialogueGraphRunner(clocktowerScene);
      const startNode = runner.start();
      expect(startNode).not.toBeNull();
      expect(startNode?.id).toBe("node_start");
      expect(runner.getHistory()).toEqual(["node_start"]);
      expect(runner.isFinished()).toBe(false);

      // Advance to Valen arrival
      const adv1 = runner.advance();
      expect(adv1.isOk()).toBe(true);
      if (!adv1.isOk()) return;
      expect(adv1.value?.id).toBe("node_valen_arrival");
      expect(adv1.value?.speaker).toBe("valen");
      expect(adv1.value?.emotion).toBe("stoic");

      // Advance to Aurelia reveal
      const adv2 = runner.advance();
      expect(adv2.isOk()).toBe(true);
      if (!adv2.isOk()) return;
      expect(adv2.value?.id).toBe("node_aurelia_reveal");
      expect(adv2.value?.speaker).toBe("aurelia");
      expect(adv2.value?.emotion).toBe("serene");

      // Advance to choice node
      const adv3 = runner.advance();
      expect(adv3.isOk()).toBe(true);
      if (!adv3.isOk()) return;
      expect(adv3.value?.id).toBe("node_valen_choice");
      expect(adv3.value?.choices?.length).toBe(2);
    });

    it("requires player choice selection on choice nodes and forbids blind advance", () => {
      const runner = new DialogueGraphRunner(clocktowerScene);
      runner.start();
      runner.advance(); // node_valen_arrival
      runner.advance(); // node_aurelia_reveal
      runner.advance(); // node_valen_choice

      const choices = runner.getAvailableChoices();
      expect(choices.length).toBe(2);
      expect(choices.map((c) => c.choiceId)).toContain("choice_cooperate");
      expect(choices.map((c) => c.choiceId)).toContain("choice_caution");

      // Blind advance should fail with gameplay error
      const blindAdvance = runner.advance();
      expect(blindAdvance.isOk()).toBe(false);
    });

    it("branches into selected dialogue path and proceeds to conclusion", () => {
      const runner = new DialogueGraphRunner(clocktowerScene);
      runner.start();
      runner.advance();
      runner.advance();
      runner.advance();

      // Choose cooperate branch
      const chooseRes = runner.choose("choice_cooperate");
      expect(chooseRes.isOk()).toBe(true);
      if (!chooseRes.isOk()) return;
      expect(chooseRes.value.id).toBe("node_branch_cooperate");
      expect(chooseRes.value.speaker).toBe("aurelia");
      expect(chooseRes.value.emotion).toBe("radiant");

      // Advance to pact formed
      const advPact = runner.advance();
      expect(advPact.isOk()).toBe(true);
      if (!advPact.isOk()) return;
      expect(advPact.value?.id).toBe("node_pact_formed");
      expect(advPact.value?.emotion).toBe("resolute");

      // Advance to conclusion
      const advConclusion = runner.advance();
      expect(advConclusion.isOk()).toBe(true);
      if (!advConclusion.isOk()) return;
      expect(advConclusion.value?.id).toBe("node_conclusion");
      expect(advConclusion.value?.nextNodeId).toBeNull();

      // Terminal node
      expect(runner.isFinished()).toBe(true);
      const advEnd = runner.advance();
      expect(advEnd.isOk()).toBe(true);
      if (!advEnd.isOk()) return;
      expect(advEnd.value).toBeNull();
    });

    it("evaluates choice requirements and hides unavailable choices", () => {
      const customScene: VisualNovelSceneJsonSchema = {
        sceneId: "test_scene",
        titleKey: "testTitle",
        initialNodeId: "node_1",
        backgroundId: "bg_test",
        nodes: {
          node_1: {
            id: "node_1",
            speaker: "valen",
            dialogueKey: "diag1",
            choices: [
              {
                choiceId: "free_choice",
                textKey: "textFree",
                targetNodeId: "node_2"
              },
              {
                choiceId: "high_level_choice",
                textKey: "textHighLevel",
                targetNodeId: "node_2",
                conditions: {
                  minPlayerLevel: 10
                }
              },
              {
                choiceId: "flag_choice",
                textKey: "textFlag",
                targetNodeId: "node_2",
                conditions: {
                  requiredStoryFlag: "bastion_key_found"
                }
              }
            ]
          },
          node_2: {
            id: "node_2",
            speaker: "valen",
            dialogueKey: "diag2",
            nextNodeId: null
          }
        }
      };

      // Context with level 5 and no story flags
      const runner = new DialogueGraphRunner(customScene, { playerLevel: 5 });
      runner.start();

      let available = runner.getAvailableChoices();
      expect(available.length).toBe(1);
      expect(available[0].choiceId).toBe("free_choice");

      // Upgrade level to 12
      runner.updateContext({ playerLevel: 12 });
      available = runner.getAvailableChoices();
      expect(available.length).toBe(2);
      expect(available.map((c) => c.choiceId)).toContain("high_level_choice");

      // Add story flag
      runner.updateContext({ storyFlags: new Set(["bastion_key_found"]) });
      available = runner.getAvailableChoices();
      expect(available.length).toBe(3);
    });
  });

  describe("ReactiveNarratorManager", () => {
    const quotes = narratorReactiveJson.quotes as NarratorQuoteSchema[];

    it("triggers quote on matching event type", () => {
      const manager = new ReactiveNarratorManager(quotes);
      const quote = manager.evaluateEvent("hazard_damage", { currentTimeMs: 1000 });
      expect(quote).not.toBeNull();
      expect(quote?.id).toBe("quote_hazard_fall");
      expect(quote?.quoteKey).toBe("narratorHazardFallQuote");
    });

    it("respects cooldown intervals between identical event triggers", () => {
      const manager = new ReactiveNarratorManager(quotes);

      // First trigger at t = 1000ms
      const q1 = manager.evaluateEvent("hazard_damage", { currentTimeMs: 1000 });
      expect(q1).not.toBeNull();

      // Trigger 5 seconds later (cooldown is 15s) -> should be blocked
      const q2 = manager.evaluateEvent("hazard_damage", { currentTimeMs: 6000 });
      expect(q2).toBeNull();

      // Trigger 16 seconds later (t = 17000ms) -> should succeed
      const q3 = manager.evaluateEvent("hazard_damage", { currentTimeMs: 17000 });
      expect(q3).not.toBeNull();
      expect(q3?.id).toBe("quote_hazard_fall");
    });

    it("evaluates contextual conditions such as low health percentage", () => {
      const manager = new ReactiveNarratorManager(quotes);

      // Low health event with hp = 50% (threshold is < 25%) -> blocked
      const qHigh = manager.evaluateEvent("low_health", { hpPercentage: 50, currentTimeMs: 1000 });
      expect(qHigh).toBeNull();

      // Low health event with hp = 15% -> succeeds
      const qLow = manager.evaluateEvent("low_health", { hpPercentage: 15, currentTimeMs: 2000 });
      expect(qLow).not.toBeNull();
      expect(qLow?.id).toBe("quote_low_health_warning");
    });

    it("respects maximum triggers per session cap", () => {
      const testQuotes: NarratorQuoteSchema[] = [
        {
          id: "capped_quote",
          eventType: "custom_event",
          quoteKey: "quoteKey",
          priority: 50,
          cooldownSeconds: 0,
          maxTriggersPerSession: 2
        }
      ];

      const manager = new ReactiveNarratorManager(testQuotes);
      expect(manager.evaluateEvent("custom_event", { currentTimeMs: 100 })).not.toBeNull();
      expect(manager.evaluateEvent("custom_event", { currentTimeMs: 200 })).not.toBeNull();
      // 3rd trigger exceeds cap of 2
      expect(manager.evaluateEvent("custom_event", { currentTimeMs: 300 })).toBeNull();

      // Reset restores trigger count
      manager.resetSession();
      expect(manager.evaluateEvent("custom_event", { currentTimeMs: 400 })).not.toBeNull();
    });
  });
});
