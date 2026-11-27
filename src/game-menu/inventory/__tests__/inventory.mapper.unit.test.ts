import { describe, it, expect } from "bun:test";
import { ItemType, type Item, type EquipmentState } from "@game/types";
import {
  resolveItemStatComparison,
  resolvePaperdollVM,
  resolveBackpackVM,
  resolveInventoryQuickBeltVM,
  resolveItemDetailsVM,
  resolveInventoryStatsVM,
} from "../inventory.mapper";

function buildItem(overrides: Partial<Item> = {}): Item {
  return {
    id: "test_item",
    nameKey: "itemSolarRapierName",
    descriptionKey: "itemSolarRapierDesc",
    type: ItemType.Weapon,
    icon: "Sword",
    rarity: "uncommon",
    ...overrides,
  };
}

function buildEquipment(overrides: Partial<EquipmentState> = {}): EquipmentState {
  return {
    mainHand: null,
    offHand: null,
    helmet: null,
    armor: null,
    amulet: null,
    ring: null,
    ...overrides,
  };
}

describe("inventory.mapper", () => {
  it("should compute positive, negative, and zero comparison deltas against the currently equipped slot item", () => {
    // Arrange
    const equipped = buildItem({
      id: "solar_rapier",
      nameKey: "itemSolarRapierName",
      type: ItemType.Weapon,
      attackBonus: 15,
      maxStaminaBonus: 10,
    });
    const candidate = buildItem({
      id: "frost_rapier",
      nameKey: "itemFrostRapierName",
      type: ItemType.Weapon,
      attackBonus: 22,
      maxManaBonus: 20,
    });
    const equipment = buildEquipment({ mainHand: equipped });

    // Act
    const comparison = resolveItemStatComparison(candidate, equipment);

    // Assert
    expect(comparison).not.toBeNull();
    expect(comparison?.targetSlot).toBe("mainHand");
    expect(comparison?.equippedItemNameKey).toBe("itemSolarRapierName");
    expect(
      comparison?.deltas.map(({ type, delta, formattedDelta, direction }) => ({
        type,
        delta,
        formattedDelta,
        direction,
      }))
    ).toEqual([
      { type: "attack", delta: 7, formattedDelta: "+7", direction: "up" },
      { type: "mana", delta: 20, formattedDelta: "+20", direction: "up" },
      { type: "stamina", delta: -10, formattedDelta: "-10", direction: "down" },
    ]);
  });

  it("should compute full positive deltas when the target equipment slot is empty", () => {
    // Arrange
    const ring = buildItem({
      id: "swift_ring",
      nameKey: "itemSwiftRingName",
      type: ItemType.Ring,
      maxStaminaBonus: 20,
    });
    const equipment = buildEquipment({ ring: null });

    // Act
    const comparison = resolveItemStatComparison(ring, equipment);

    // Assert
    expect(comparison?.targetSlot).toBe("ring");
    expect(comparison?.equippedItemNameKey).toBeNull();
    expect(
      comparison?.deltas.map(({ type, delta, formattedDelta, direction }) => ({
        type,
        delta,
        formattedDelta,
        direction,
      }))
    ).toEqual([
      { type: "stamina", delta: 20, formattedDelta: "+20", direction: "up" },
    ]);
  });

  it("should return neutral zero delta when candidate and equipped item share the same stat value", () => {
    // Arrange
    const equipped = buildItem({ id: "scholar_robe", type: ItemType.Armor, defenseBonus: 8, maxManaBonus: 50 });
    const candidate = buildItem({ id: "aether_robe", type: ItemType.Armor, defenseBonus: 8, maxManaBonus: 50 });
    const equipment = buildEquipment({ armor: equipped });

    // Act
    const comparison = resolveItemStatComparison(candidate, equipment);

    // Assert
    expect(
      comparison?.deltas.map(({ type, delta, formattedDelta, direction }) => ({
        type,
        delta,
        formattedDelta,
        direction,
      }))
    ).toEqual([
      { type: "defense", delta: 0, formattedDelta: "0", direction: "neutral" },
      { type: "mana", delta: 0, formattedDelta: "0", direction: "neutral" },
    ]);
  });

  it("should return null comparison for potions", () => {
    // Arrange
    const potion = buildItem({ id: "potion_health", type: ItemType.Potion, healHp: 45 });

    // Act
    const comparison = resolveItemStatComparison(potion, buildEquipment());

    // Assert
    expect(comparison).toBeNull();
  });

  it("should map paperdoll, quick belt, backpack, item details, and stats view models", () => {
    // Arrange
    const sword = buildItem({ id: "solar_rapier", attackBonus: 15 });
    const potion = buildItem({ id: "potion_health", type: ItemType.Potion, healHp: 45, count: 2 });

    // Act
    const paperdoll = resolvePaperdollVM(buildEquipment({ mainHand: sword }));
    const belt = resolveInventoryQuickBeltVM([potion, null, null], false);
    const backpack = resolveBackpackVM([sword, null], 16);
    const details = resolveItemDetailsVM(sword);
    const stats = resolveInventoryStatsVM({ totalAttack: 35, totalDefense: 12, maxHp: 150, maxMana: 120, maxStamina: 110 }, 90, 60, 80);

    // Assert
    expect(paperdoll.mainHand.isEmpty).toBe(false);
    expect(paperdoll.helmet.isEmpty).toBe(true);
    expect(belt.slots[0].keyLabel).toBe("7");
    expect(belt.slots[1].isEmpty).toBe(true);
    expect(backpack.occupiedCount).toBe(1);
    expect(backpack.isEmpty).toBe(false);
    expect(details?.isEquippable).toBe(true);
    expect(stats.hpDisplay).toBe("90 / 150");
  });
});
