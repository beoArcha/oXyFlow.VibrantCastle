import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { ItemSlot } from "../item-slot";

describe("ItemSlot RPG Primitive Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render empty slot placeholder when no item is provided", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <ItemSlot label="Primary Weapon" />,
      { mode: "none" }
    );
    const slot = container.querySelector("[role='button']");
    const label = container.querySelector("span");

    // Assert
    expect(slot).not.toBeNull();
    expect(label?.textContent).toBe("Primary Weapon");
    expect(slot?.getAttribute("aria-label")).toBe("Primary Weapon");
    expect(container.textContent).toContain("-");
  });

  it("should render equipped item with count and icon", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <ItemSlot
        slot={{
          id: "broadsword",
          iconName: "Sword",
          rarity: "rare",
          count: 3,
          nameKey: "Broadsword",
        }}
      />,
      { mode: "none" }
    );
    const badge = container.querySelector("span.font-mono");

    // Assert
    expect(badge?.textContent).toBe("x3");
  });

  it("should trigger onClick when clicked or activated with Enter/Space", async () => {
    // Arrange
    const handleClick = mock(() => {});
    const { container } = await renderIntoDom(
      <ItemSlot label="Necklace" onClick={handleClick} />,
      { mode: "none" }
    );
    const slot = container.querySelector("[role='button']") as HTMLDivElement;

    // Act - Click
    slot.click();
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Act - Keyboard Enter
    slot.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
