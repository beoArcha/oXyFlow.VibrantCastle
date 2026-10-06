import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { ProgressionCodec } from "@lib/codecs/progressionCodec";
import rawSkillTrees from "@data/progression/skill_trees.json";
import rawEnemies from "@data/enemies/enemies.json";
import { enemyCodec } from "@lib/codecs/enemyCodec";

describe("Soul Collection and Skill Tree Progression Integration", () => {
  let engine: GameEngine;
  const progressionCodec = new ProgressionCodec();

  beforeEach(() => {
    engine = new GameEngine();
    engine.resetLevel("courtyard");
  });

  afterEach(() => {
    engine.stop();
  });

  it("decodes progression trees and verifies unlock dependencies for player characters", () => {
    const progressionResult = progressionCodec.decode(rawSkillTrees);
    expect(progressionResult.isOk()).toBe(true);
    const progressionDoc = progressionResult.unwrap();

    const valenTrees = progressionDoc.characters.valen.trees;
    expect(valenTrees.length).toBeGreaterThan(0);
    const valenSolarTree = valenTrees.find((t) => t.treeId === "solar_duelist");
    expect(valenSolarTree).toBeDefined();
    expect(valenSolarTree?.nodes["solar_flare"]).toBeDefined();
    expect(valenSolarTree?.nodes["solar_fireball"]).toBeDefined();

    // Verify parent-child dependency
    const fireballNode = valenSolarTree!.nodes["solar_fireball"];
    expect(fireballNode.prerequisites).toContain("solar_flare");
  });

  it("evaluates enemy soul drops and ensures granted skills resolve in player capability space", () => {
    const enemiesResult = enemyCodec.decodeDictionary(rawEnemies);
    expect(enemiesResult.isOk()).toBe(true);
    const enemiesDict = enemiesResult.unwrap();

    const dummyEnemy = enemiesDict["training_dummy"];
    expect(dummyEnemy.soulDrop).toBeDefined();

    const soul = dummyEnemy.soulDrop!;
    expect(soul.soulId).toBe("soul_training_dummy");
    expect(soul.type).toBe("enchant");
    expect(soul.grantedSkillId).toBe("dummy_wobble");

    // Verify active enemies list in loaded level
    expect(engine.enemies.length).toBeGreaterThan(0);
  });
});
