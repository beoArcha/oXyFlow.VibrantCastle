import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { HUDPotionSlotButton } from "../components/belt/HUDPotionSlotButton";
import type { PotionSlotVM } from "../types";

describe("<HUDPotionSlotButton />", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders active potion with stack count, shortcut key, and fires onUsePotion on click", async () => {
    const onUsePotion = mock((slotIndex: number) => {});
    const slot: PotionSlotVM = {
      slotIndex: 1,
      keyLabel: "2",
      count: 5,
      isEmpty: false,
      healHp: 50,
      nameKey: "potionHealth",
    };

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPotionSlotButton
          slot={slot}
          playerNumber={1}
          onUsePotion={onUsePotion}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("x5");
    expect(container.textContent).toContain("2");

    const btn = container.querySelector("button");
    expect(btn).not.toBeNull();
    await click(btn!);

    expect(onUsePotion).toHaveBeenCalledWith(1);
    await unmount();
  });

  it("renders empty slot state with dimmed opacity and empty label", async () => {
    const slot: PotionSlotVM = {
      slotIndex: 2,
      keyLabel: "3",
      count: 0,
      isEmpty: true,
    };

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPotionSlotButton
          slot={slot}
          playerNumber={2}
          onUsePotion={() => {}}
        />
      </TestProviders>
    );

    expect(container.textContent).not.toContain("x");
    expect(container.textContent).toContain("3");
    const btn = container.querySelector("button");
    expect(btn?.getAttribute("aria-label")).toBeTruthy();

    await unmount();
  });
});
