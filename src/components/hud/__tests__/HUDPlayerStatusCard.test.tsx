import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { HUDPlayerStatusCard } from "../HUDPlayerStatusCard";
import type { PlayerStatusVM } from "../types";

describe("HUDPlayerStatusCard Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const baseStatusVM: PlayerStatusVM = {
    characterId: "valen",
    characterName: "Valen Frost",
    playerNumber: 1,
    theme: "crimson",
    health: 80,
    maxHealth: 100,
    mana: 35,
    maxMana: 50,
    stamina: 90,
    maxStamina: 100,
    attackPower: 24,
    skillPoints: 0,
  };

  it("renders player vitals, name, and attack power from PlayerStatusVM", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerStatusCard
          status={baseStatusVM}
          assetQuality="mid"
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Valen Frost");
    expect(container.textContent).toContain("P1");
    expect(container.textContent).toContain("80 / 100");
    expect(container.textContent).toContain("35 / 50");
    expect(container.textContent).toContain("90 / 100");
    expect(container.textContent).toContain("24");
    expect(container.textContent).toContain("32b");

    await unmount();
  });

  it("renders crimson theme styling for Player 1", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerStatusCard
          status={baseStatusVM}
          assetQuality="low"
        />
      </TestProviders>
    );

    expect(container.querySelector(".text-red-400")).not.toBeNull();
    expect(container.querySelector(".border-red-900\\/60")).not.toBeNull();
    expect(container.textContent).toContain("16b");

    await unmount();
  });

  it("renders cyan theme styling and Co-op badge for Player 2 without skill points", async () => {
    const p2Status: PlayerStatusVM = {
      ...baseStatusVM,
      characterId: "aurelia",
      characterName: "Aurelia",
      playerNumber: 2,
      theme: "cyan",
      health: 60,
      maxHealth: 80,
    };

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerStatusCard
          status={p2Status}
          assetQuality="high"
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Aurelia");
    expect(container.textContent).toContain("P2");
    expect(container.textContent).toContain("Co-op");
    expect(container.textContent).toContain("HD");
    expect(container.querySelector(".text-cyan-400")).not.toBeNull();
    expect(container.querySelector(".border-cyan-900\\/60")).not.toBeNull();

    await unmount();
  });

  it("renders level up skill points button when skillPoints > 0 and calls onOpenSkillTree", async () => {
    const onOpenSkillTree = mock(() => {});
    const levelUpStatus: PlayerStatusVM = {
      ...baseStatusVM,
      skillPoints: 3,
    };

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerStatusCard
          status={levelUpStatus}
          assetQuality="mid"
          onOpenSkillTree={onOpenSkillTree}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("+3");
    const skillButton = container.querySelector("button");
    expect(skillButton).not.toBeNull();

    await click(skillButton!);
    expect(onOpenSkillTree).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("supports legacy flattened player data correctly", async () => {
    const legacyPlayer = {
      characterId: "valen" as const,
      health: 75,
      maxHealth: 100,
      mana: 25,
      maxMana: 50,
      stamina: 50,
      maxStamina: 100,
      isDead: false,
      skillPoints: 1,
    };

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerStatusCard
          player={legacyPlayer}
          playerNumber={1}
          characterName="Legacy Hero"
          themeColor="red"
          assetQuality="mid"
          attackPower={18}
          onOpenSkillTree={() => {}}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Legacy Hero");
    expect(container.textContent).toContain("75 / 100");
    expect(container.textContent).toContain("+1");

    await unmount();
  });
});
