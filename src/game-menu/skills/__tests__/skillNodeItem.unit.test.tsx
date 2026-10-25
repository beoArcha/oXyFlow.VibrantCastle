import { describe, it, expect, mock } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { UiTestProviders } from "@test-utils/testProviders";
import { SkillNodeVM } from "../skills.mapper";
import { SkillNodeItem } from "../SkillNodeItem";

describe("SkillNodeItem", () => {
  const baseNodeVM: SkillNodeVM = {
    id: "skill_fireball",
    nameKey: "spellSolarFireballName",
    iconName: "Flame",
    pointCost: 2,
    tier: 2,
    isUnlocked: false,
    isUnlockable: true,
    isPrimary: false,
    isSecondary: false,
  };

  it("renders node name, point cost and icon for an unlockable skill", async () => {
    await cleanupDom();
    const onSelect = mock();

    const { container, unmount } = await renderIntoDom(
      <UiTestProviders defaultLanguage="pl">
        <SkillNodeItem
          node={baseNodeVM}
          isSelected={false}
          onSelect={onSelect}
        />
      </UiTestProviders>
    );

    expect(container.textContent).toContain("Słoneczna Kula Ognia");
    expect(container.textContent).toContain("2 PU");

    const nodeElement = container.querySelector("#skill-node-skill_fireball") as HTMLElement;
    expect(nodeElement).not.toBeNull();

    nodeElement.click();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("skill_fireball");

    await unmount();
  });

  it("renders learned badge when skill is unlocked", async () => {
    await cleanupDom();
    const onSelect = mock();
    const unlockedNode: SkillNodeVM = {
      ...baseNodeVM,
      isUnlocked: true,
      isUnlockable: false,
    };

    const { container, unmount } = await renderIntoDom(
      <UiTestProviders defaultLanguage="pl">
        <SkillNodeItem
          node={unlockedNode}
          isSelected={false}
          onSelect={onSelect}
        />
      </UiTestProviders>
    );

    expect(container.textContent).toContain("Odblokowane");
    await unmount();
  });

  it("renders locked state when skill cannot yet be unlocked", async () => {
    await cleanupDom();
    const onSelect = mock();
    const lockedNode: SkillNodeVM = {
      ...baseNodeVM,
      isUnlocked: false,
      isUnlockable: false,
    };

    const { container, unmount } = await renderIntoDom(
      <UiTestProviders defaultLanguage="pl">
        <SkillNodeItem
          node={lockedNode}
          isSelected={false}
          onSelect={onSelect}
        />
      </UiTestProviders>
    );

    expect(container.textContent).toContain("2 PU");
    expect(container.textContent).not.toContain("Odblokowane");
    await unmount();
  });

  it("displays dynamic primary and secondary key shortcuts when equipped", async () => {
    await cleanupDom();
    const onSelect = mock();
    const equippedNode: SkillNodeVM = {
      ...baseNodeVM,
      isUnlocked: true,
      isPrimary: true,
      isSecondary: true,
    };

    const { container, unmount } = await renderIntoDom(
      <UiTestProviders defaultLanguage="en">
        <SkillNodeItem
          node={equippedNode}
          isSelected={false}
          onSelect={onSelect}
          primaryKey="Q"
          secondaryKey="E"
        />
      </UiTestProviders>
    );

    expect(container.textContent).toContain("Q");
    expect(container.textContent).toContain("E");
    await unmount();
  });

  it("applies highlight styles when selected", async () => {
    await cleanupDom();
    const onSelect = mock();

    const { container, unmount } = await renderIntoDom(
      <UiTestProviders defaultLanguage="pl">
        <SkillNodeItem
          node={baseNodeVM}
          isSelected={true}
          onSelect={onSelect}
        />
      </UiTestProviders>
    );

    const nodeElement = container.querySelector("#skill-node-skill_fireball") as HTMLElement;
    expect(nodeElement.className).toContain("border-amber-400");
    await unmount();
  });
});
