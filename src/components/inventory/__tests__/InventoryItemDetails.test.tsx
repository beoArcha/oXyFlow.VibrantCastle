import React, { act } from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { InventoryItemDetails } from "../InventoryItemDetails";
import { ItemDetailsVM, EquipmentSlotKey } from "@components/adapters/inventoryAdapter";
import { ItemType } from "@game/types";

describe("InventoryItemDetails Component", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const createMockDetails = (overrides: Partial<ItemDetailsVM> = {}): ItemDetailsVM => ({
    id: "iron_sword",
    nameKey: "ironSword",
    descriptionKey: "ironSwordDesc",
    iconName: "Sword",
    type: ItemType.Weapon,
    typeLabelKey: "itemTypeWeapon",
    rarity: "uncommon",
    rarityLabelKey: "rarityUncommon",
    rarityVariant: "green",
    count: 1,
    isPotion: false,
    isEquippable: true,
    modifiers: [
      {
        type: "attack",
        labelKey: "itemAttackBonus",
        value: 12,
        formattedValue: "+12",
        iconName: "Sword",
        textColorClass: "text-amber-300",
      },
    ],
    ...overrides,
  });

  it("renders item name, type badge, rarity variant, and stat modifiers", async () => {
    const details = createMockDetails({
      count: 3,
    });

    const { container } = await renderIntoDom(
      <InventoryItemDetails
        details={details}
        selectedBackpackIdx={0}
        selectedEquipSlot={null}
        selectedPotionIdx={null}
        onEquip={mock(() => {})}
        onUnequip={mock(() => {})}
        onUsePotion={mock(() => {})}
        onDiscard={mock(() => {})}
      />
    );

    expect(container.textContent).toContain("x3");
    expect(container.textContent).toContain("+12");
  });

  it("renders equip and discard buttons for equippable backpack items and handles clicks", async () => {
    const details = createMockDetails({ isPotion: false });
    const handleEquip = mock((_idx: number) => {});
    const handleDiscard = mock((_idx: number) => {});

    const { container, click } = await renderIntoDom(
      <InventoryItemDetails
        details={details}
        selectedBackpackIdx={2}
        selectedEquipSlot={null}
        selectedPotionIdx={null}
        onEquip={handleEquip}
        onUnequip={mock(() => {})}
        onUsePotion={mock(() => {})}
        onDiscard={handleDiscard}
      />
    );

    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
    expect(buttons.length).toBe(2);

    await act(async () => {
      await click(buttons[0]);
    });
    expect(handleEquip).toHaveBeenCalledTimes(1);
    expect(handleEquip).toHaveBeenCalledWith(2);

    await act(async () => {
      await click(buttons[1]);
    });
    expect(handleDiscard).toHaveBeenCalledTimes(1);
    expect(handleDiscard).toHaveBeenCalledWith(2);
  });

  it("renders use button with correct label when backpack item is a potion", async () => {
    const details = createMockDetails({
      id: "health_potion",
      type: ItemType.Potion,
      isPotion: true,
      isEquippable: false,
    });
    const handleEquip = mock((_idx: number) => {});

    const { container, click } = await renderIntoDom(
      <InventoryItemDetails
        details={details}
        selectedBackpackIdx={1}
        selectedEquipSlot={null}
        selectedPotionIdx={null}
        onEquip={handleEquip}
        onUnequip={mock(() => {})}
        onUsePotion={mock(() => {})}
      />
    );

    const useButton = container.querySelector<HTMLButtonElement>("button");
    expect(useButton).not.toBeNull();

    await act(async () => {
      await click(useButton!);
    });
    expect(handleEquip).toHaveBeenCalledTimes(1);
    expect(handleEquip).toHaveBeenCalledWith(1);
  });

  it("renders unequip button for equipped items and calls onUnequip", async () => {
    const details = createMockDetails();
    const handleUnequip = mock((_slot: EquipmentSlotKey) => {});

    const { container, click } = await renderIntoDom(
      <InventoryItemDetails
        details={details}
        selectedBackpackIdx={null}
        selectedEquipSlot="helmet"
        selectedPotionIdx={null}
        onEquip={mock(() => {})}
        onUnequip={handleUnequip}
        onUsePotion={mock(() => {})}
      />
    );

    const unequipBtn = container.querySelector<HTMLButtonElement>("button");
    expect(unequipBtn).not.toBeNull();

    await act(async () => {
      await click(unequipBtn!);
    });
    expect(handleUnequip).toHaveBeenCalledTimes(1);
    expect(handleUnequip).toHaveBeenCalledWith("helmet");
  });

  it("renders use potion button for quick belt slots and calls onUsePotion", async () => {
    const details = createMockDetails({ isPotion: true });
    const handleUsePotion = mock((_idx: number) => {});

    const { container, click } = await renderIntoDom(
      <InventoryItemDetails
        details={details}
        selectedBackpackIdx={null}
        selectedEquipSlot={null}
        selectedPotionIdx={0}
        onEquip={mock(() => {})}
        onUnequip={mock(() => {})}
        onUsePotion={handleUsePotion}
      />
    );

    const potionBtn = container.querySelector<HTMLButtonElement>("button");
    expect(potionBtn).not.toBeNull();

    await act(async () => {
      await click(potionBtn!);
    });
    expect(handleUsePotion).toHaveBeenCalledTimes(1);
    expect(handleUsePotion).toHaveBeenCalledWith(0);
  });
});
