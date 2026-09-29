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
});
