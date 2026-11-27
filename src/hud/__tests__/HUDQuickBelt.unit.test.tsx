import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { HUDQuickBelt } from "../HUDQuickBelt";
import type { QuickBeltVM } from "../types";

describe("HUDQuickBelt Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const baseBeltVM: QuickBeltVM = {
    playerNumber: 1,
    characterId: "valen",
    theme: "crimson",
    primarySpell: {
      id: "fireball",
      nameKey: "skillFireball",
      manaCost: 15,
      keyLabel: "U",
      variant: "cyan",
      canAfford: true,
    },
    secondarySpell: {
      id: "aegis",
      nameKey: "skillAegis",
      manaCost: 20,
      keyLabel: "O",
      variant: "purple",
      canAfford: true,
    },
    primarySpellName: "Kula Ognia",
    secondarySpellName: "Egida Cieni",
    primaryKeyLabel: "U",
    secondaryKeyLabel: "O",
    potions: [
      {
        slotIndex: 0,
        keyLabel: "1",
        count: 3,
        isEmpty: false,
        healHp: 50,
        nameKey: "potionHealth",
      },
      {
        slotIndex: 1,
        keyLabel: "2",
        count: 2,
        isEmpty: false,
        healMana: 30,
        nameKey: "potionMana",
      },
      {
        slotIndex: 2,
        keyLabel: "3",
        count: 0,
        isEmpty: true,
      },
    ],
  };

  it("renders equipped spells with mana costs and key labels", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDQuickBelt
          belt={baseBeltVM}
          onUsePotion={() => {}}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Kula Ognia");
    expect(container.textContent).toContain("15");
    expect(container.textContent).toContain("U");

    expect(container.textContent).toContain("Egida Cieni");
    expect(container.textContent).toContain("20");
    expect(container.textContent).toContain("O");

    await unmount();
  });

  it("renders 3 compact potion slots with counts, key hints, and calls onUsePotion on click", async () => {
    const onUsePotion = mock((slotIndex: number) => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDQuickBelt
          belt={baseBeltVM}
          onUsePotion={onUsePotion}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("x3");
    expect(container.textContent).toContain("x2");
    expect(container.textContent).toContain("1");
    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("3");

    const slot0Button = container.querySelectorAll("button")[0];
    expect(slot0Button).not.toBeNull();
    await click(slot0Button!);
    expect(onUsePotion).toHaveBeenCalledWith(0);

    await unmount();
  });

  it("renders RPG buttons [I] and [K] when showRpgButtons is enabled and handles clicks", async () => {
    const onOpenInventory = mock(() => {});
    const onOpenSkillTree = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDQuickBelt
          belt={baseBeltVM}
          onUsePotion={() => {}}
          onOpenInventory={onOpenInventory}
          onOpenSkillTree={onOpenSkillTree}
          showRpgButtons={true}
        />
      </TestProviders>
    );

    const invBtn = container.querySelector("#flank-inventory-btn");
    const skillBtn = container.querySelector("#flank-skilltree-btn");
    expect(invBtn).not.toBeNull();
    expect(skillBtn).not.toBeNull();

    await click(invBtn!);
    expect(onOpenInventory).toHaveBeenCalledTimes(1);

    await click(skillBtn!);
    expect(onOpenSkillTree).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("hides RPG buttons by default", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDQuickBelt
          belt={baseBeltVM}
          onUsePotion={() => {}}
          showRpgButtons={false}
        />
      </TestProviders>
    );

    expect(container.querySelector("#flank-inventory-btn")).toBeNull();
    expect(container.querySelector("#flank-skilltree-btn")).toBeNull();

    await unmount();
  });

  it("supports Player 2 belt with P2 tag and +7 offset potion keys from ViewModel", async () => {
    const p2Belt: QuickBeltVM = {
      ...baseBeltVM,
      playerNumber: 2,
      characterId: "aurelia",
      theme: "cyan",
      potions: [
        { slotIndex: 0, keyLabel: "7", count: 1, isEmpty: false },
        { slotIndex: 1, keyLabel: "8", count: 0, isEmpty: true },
        { slotIndex: 2, keyLabel: "9", count: 0, isEmpty: true },
      ],
    };

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDQuickBelt
          belt={p2Belt}
          onUsePotion={() => {}}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("P2");
    expect(container.textContent).toContain("7");
    expect(container.textContent).toContain("8");
    expect(container.textContent).toContain("9");

    await unmount();
  });
});
