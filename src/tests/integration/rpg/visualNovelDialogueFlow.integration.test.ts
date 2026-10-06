import { describe, it, expect, beforeEach } from "bun:test";
import { visualNovelCodec } from "@lib/codecs/visualNovelCodec";
import rawVnData from "@data/narrative/dialogues_vn.json";
import { DialogueGraphRunner } from "@game/logic/narrative/dialogueGraphRunner";
import { ReactiveNarratorManager } from "@game/logic/narrative/reactiveNarratorManager";
import { NarratorQuoteSchema } from "@lib/schemas/narratorSchema";

describe("Visual Novel Dialogue Runner and Reactive Narrator Integration", () => {
  let narrator: ReactiveNarratorManager;

  const sampleQuotes: NarratorQuoteSchema[] = [
    {
      id: "quote_combat_crit",
      eventType: "critical_hit",
      quoteKey: "narratorCritQuote",
      priority: 2,
      cooldownSeconds: 5,
      maxTriggersPerSession: 3,
    },
    {
      id: "quote_low_hp",
      eventType: "low_health",
      quoteKey: "narratorLowHpQuote",
      priority: 5,
      cooldownSeconds: 10,
    },
  ];

  beforeEach(() => {
    narrator = new ReactiveNarratorManager(sampleQuotes);
  });

  it("decodes visual novel scene and traverses branch choices via DialogueGraphRunner", () => {
    const vnResult = visualNovelCodec.decode(rawVnData);
    expect(vnResult.isOk()).toBe(true);
    const vnDoc = vnResult.unwrap();

    const scene = vnDoc.scenes["scene_clocktower_meeting"];
    expect(scene).toBeDefined();

    const runner = new DialogueGraphRunner(scene);
    const firstNode = runner.start();
    expect(runner.isFinished()).toBe(false);
    expect(firstNode).toBeDefined();
    expect(firstNode?.id).toBe("node_start");
    expect(firstNode?.speaker).toBe("narrator");

    // Advance to Valen arrival
    const advanceValen = runner.advance();
    expect(advanceValen.isOk()).toBe(true);
    const nodeValen = advanceValen.unwrap();
    expect(nodeValen?.id).toBe("node_valen_arrival");
    expect(nodeValen?.speaker).toBe("valen");

    // Advance to Aurelia reveal
    const advanceAurelia = runner.advance();
    expect(advanceAurelia.isOk()).toBe(true);
    const nodeAurelia = advanceAurelia.unwrap();
    expect(nodeAurelia?.id).toBe("node_aurelia_reveal");

    // Advance to choice node
    const advanceChoice = runner.advance();
    expect(advanceChoice.isOk()).toBe(true);
    const choiceNode = advanceChoice.unwrap();
    expect(choiceNode?.id).toBe("node_valen_choice");
    expect(choiceNode?.choices).toBeDefined();

    const choices = runner.getAvailableChoices();
    expect(choices.length).toBeGreaterThanOrEqual(2);

    // Select cooperation branch
    const chooseResult = runner.choose("choice_cooperate");
    expect(chooseResult.isOk()).toBe(true);
    const selected = chooseResult.unwrap();
    expect(selected?.id).toBe("node_branch_cooperate");
  });

  it("coordinates narrative commentary triggered by simulated player actions", () => {
    const quote = narrator.evaluateEvent("critical_hit", {
      playerLevel: 10,
      hpPercentage: 80,
      currentTimeMs: 1000,
    });

    expect(quote).not.toBeNull();
    expect(quote?.quoteKey).toBe("narratorCritQuote");

    // Immediate second trigger is suppressed by cooldown
    const rapidQuote = narrator.evaluateEvent("critical_hit", {
      playerLevel: 10,
      hpPercentage: 80,
      currentTimeMs: 2000, // only 1s later, cooldown is 5s
    });
    expect(rapidQuote).toBeNull();
  });
});
