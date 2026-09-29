import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { SkillsProvider, useSkills } from "../SkillsContext";
import gameEngine from "@game/loop/engine";

describe("SkillsContext & useSkills Hook", () => {
  beforeEach(async () => {
    await cleanupDom();
    gameEngine.resetPlayerSkillsToDefaults();
  });

  afterEach(async () => {
    gameEngine.resetPlayerSkillsToDefaults();
    await cleanupDom();
  });

  const createWrapper = () => {
    return function TestSkillsWrapper({ children }: { children: React.ReactNode }) {
      return <SkillsProvider engine={gameEngine}>{children}</SkillsProvider>;
    };
  };

  it("initializes with active character, skill tree nodes and selected skill", async () => {
    const { result, unmount } = await renderCustomHook(() => useSkills(), {
      wrapper: createWrapper(),
    });

    expect(result.current.activePlayerIndex).toBe(0);
    expect(result.current.activeCharacter).toBe("valen");
    expect(result.current.skillTreeNodes.length).toBeGreaterThan(0);
    expect(result.current.selectedSkillId).not.toBeNull();
    expect(result.current.selectedNode).toBeDefined();

    await unmount();
  });

  it("allows selecting different skills", async () => {
    const { result, unmount } = await renderCustomHook(() => useSkills(), {
      wrapper: createWrapper(),
    });

    const secondNode = result.current.skillTreeNodes[1];
    expect(secondNode).toBeDefined();

    await act(async () => {
      result.current.setSelectedSkillId(secondNode.id);
    });

    expect(result.current.selectedSkillId).toBe(secondNode.id);
    expect(result.current.selectedNode?.id).toBe(secondNode.id);

    await unmount();
  });

  it("evaluates skill prerequisites and unlock status via evaluateSkill", async () => {
    const { result, unmount } = await renderCustomHook(() => useSkills(), {
      wrapper: createWrapper(),
    });

    const firstNode = result.current.skillTreeNodes[0];
    const evaluation = result.current.evaluateSkill(firstNode.id);

    expect(evaluation).toBeDefined();
    expect(typeof evaluation.canUnlock).toBe("boolean");
    expect(typeof evaluation.isUnlocked).toBe("boolean");

    await unmount();
  });

  it("handles unlocking skills and assigning spells", async () => {
    const { result, unmount } = await renderCustomHook(() => useSkills(), {
      wrapper: createWrapper(),
    });

    const firstNode = result.current.skillTreeNodes[0];
    let unlockRes = { success: false };
    await act(async () => {
      unlockRes = result.current.unlockSkill(firstNode.id);
    });

    expect(typeof unlockRes.success).toBe("boolean");

    // Assign spell to slot
    let assignRes = false;
    await act(async () => {
      assignRes = result.current.assignSpell(firstNode.id, "primary");
    });
    expect(typeof assignRes).toBe("boolean");

    await unmount();
  });

  it("resets skills to defaults and resets active player index", async () => {
    const { result, unmount } = await renderCustomHook(() => useSkills(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.setActivePlayerIndex(1);
    });
    expect(result.current.activePlayerIndex).toBe(1);

    await act(async () => {
      result.current.resetToDefaults();
    });

    expect(result.current.activePlayerIndex).toBe(0);

    await unmount();
  });

  it("guarantees snapshot immutability so mutating activePlayer.unlockedSkills does not mutate engine state", async () => {
    const { result, unmount } = await renderCustomHook(() => useSkills(), {
      wrapper: createWrapper(),
    });

    const activePlayer = result.current.activePlayer;
    expect(activePlayer).toBeDefined();

    const originalCount = gameEngine.players[0].unlockedSkills.length;
    activePlayer?.unlockedSkills.push("unauthorized_mutated_skill");

    expect(gameEngine.players[0].unlockedSkills.length).toBe(originalCount);
    expect(gameEngine.players[0].unlockedSkills.includes("unauthorized_mutated_skill")).toBe(false);

    await unmount();
  });

  it("returns safe unlock evaluation for non-existent skill id", async () => {
    const { result, unmount } = await renderCustomHook(() => useSkills(), {
      wrapper: createWrapper(),
    });

    const evaluation = result.current.evaluateSkill("non_existent_skill_node_id");
    expect(evaluation.canUnlock).toBe(false);
    expect(evaluation.isUnlocked).toBe(false);
    expect(evaluation.reasonKey).toBeDefined();

    await unmount();
  });
});
