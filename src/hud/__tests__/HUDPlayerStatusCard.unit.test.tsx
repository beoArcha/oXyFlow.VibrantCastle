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
    characterName: "Valen",
    playerNumber: 1,
    theme: "crimson",
    loreTitleKey: "valenLoreTitle",
    passiveNameKey: "valenPassiveName",
    passiveDescKey: "valenPassiveDesc",
    emblem: "sun",
    health: 80,
    maxHealth: 115,
    mana: 35,
    maxMana: 90,
    stamina: 90,
    maxStamina: 115,
    attackPower: 23,
    defensePower: 7,
    spellPowerMultiplier: 1.0,
    skillPoints: 0,
  };

  it("renders player vitals, lore title, passive trait, and attack/defense without noisy quality sticker", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerStatusCard
          status={baseStatusVM}
          assetQuality="mid"
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Valen");
    expect(container.textContent).toContain("P1");
    expect(container.textContent).toContain("Słoneczny Rycerz");
    expect(container.textContent).toContain("Solarny Hart");
    expect(container.textContent).toContain("80 / 115");
    expect(container.textContent).toContain("35 / 90");
    expect(container.textContent).toContain("90 / 115");
    expect(container.textContent).toContain("23");
    expect(container.textContent).toContain("7");
    expect(container.textContent).not.toContain("32b");

    await unmount();
  });

  it("renders Solar Gold-Crimson theme styling for Valen", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerStatusCard
          status={baseStatusVM}
          assetQuality="low"
        />
      </TestProviders>
    );

    expect(container.querySelector(".border-amber-700\\/45")).not.toBeNull();
    expect(container.querySelector(".text-amber-100")).not.toBeNull();
    expect(container.textContent).not.toContain("16b");

    await unmount();
  });

  it("renders Astral Cyan-Violet theme styling, spell bonus, and lore identity for Aurelia (Player 2)", async () => {
    const p2Status: PlayerStatusVM = {
      ...baseStatusVM,
      characterId: "aurelia",
      characterName: "Aurelia",
      playerNumber: 2,
      theme: "cyan",
      loreTitleKey: "aureliaLoreTitle",
      passiveNameKey: "aureliaPassiveName",
      passiveDescKey: "aureliaPassiveDesc",
      emblem: "astrolabe",
      health: 60,
      maxHealth: 90,
      attackPower: 18,
      defensePower: 4,
      spellPowerMultiplier: 1.15,
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
    expect(container.textContent).toContain("Uczona Arkanów");
    expect(container.textContent).toContain("Astralny Przepływ");
    expect(container.textContent).toContain("+15%");
    expect(container.textContent).not.toContain("Co-op");
    expect(container.textContent).not.toContain("HD");
    expect(container.querySelector(".border-cyan-700\\/45")).not.toBeNull();
    expect(container.querySelector(".text-cyan-50")).not.toBeNull();

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
