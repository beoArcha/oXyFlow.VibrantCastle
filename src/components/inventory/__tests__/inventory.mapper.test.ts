import { describe, it, expect } from "bun:test";
import { Item, ItemType, EquipmentState } from "@game/types";
import {
  resolveRarityVariant,
  resolveRarityLabelKey,
  resolveItemTypeLabelKey,
  resolveItemSlotVM,
  resolvePaperdollVM,
  resolveBackpackVM,
  resolveInventoryQuickBeltVM,
  resolveStatModifiersVM,
  resolveItemDetailsVM,
  resolveInventoryStatsVM,
} from "../inventory.mapper";

describe("inventory.mapper - Engine to UI Data Transformation", () => {
  const createMockItem = (overrides: Partial<Item> = {}): Item => ({
    id: "test_sword",
    nameKey: "testSword",
    descriptionKey: "testSwordDesc",
    type: ItemType.Weapon,
    rarity: "common",
    icon: "Sword",
    count: 1,
    attackBonus: 10,
    ...overrides,
  });

  describe("resolveRarityVariant", () => {
    it("maps all supported rarities to semantic color variants", () => {
      expect(resolveRarityVariant("common")).toBe("stone");
      expect(resolveRarityVariant("uncommon")).toBe("green");
      expect(resolveRarityVariant("rare")).toBe("cyan");
      expect(resolveRarityVariant("legendary")).toBe("amber");
    });

    it("falls back to stone for null, undefined or unknown rarities", () => {
      expect(resolveRarityVariant(null)).toBe("stone");
      expect(resolveRarityVariant(undefined)).toBe("stone");
      expect(resolveRarityVariant("mythic" as any)).toBe("stone");
    });
  });

  describe("resolveRarityLabelKey", () => {
    it("maps rarities to appropriate i18n translation keys", () => {
      expect(resolveRarityLabelKey("common")).toBe("rarityCommon");
      expect(resolveRarityLabelKey("uncommon")).toBe("rarityUncommon");
      expect(resolveRarityLabelKey("rare")).toBe("rarityRare");
      expect(resolveRarityLabelKey("legendary")).toBe("rarityLegendary");
    });

    it("falls back to rarityCommon for missing values", () => {
      expect(resolveRarityLabelKey(null)).toBe("rarityCommon");
      expect(resolveRarityLabelKey(undefined)).toBe("rarityCommon");
    });
  });

  describe("resolveItemTypeLabelKey", () => {
    it("maps all ItemTypes to i18n keys", () => {
      expect(resolveItemTypeLabelKey(ItemType.Weapon)).toBe("itemTypeWeapon");
      expect(resolveItemTypeLabelKey(ItemType.Shield)).toBe("itemTypeShield");
      expect(resolveItemTypeLabelKey(ItemType.Helmet)).toBe("itemTypeHelmet");
      expect(resolveItemTypeLabelKey(ItemType.Armor)).toBe("itemTypeArmor");
      expect(resolveItemTypeLabelKey(ItemType.Amulet)).toBe("itemTypeAmulet");
      expect(resolveItemTypeLabelKey(ItemType.Ring)).toBe("itemTypeRing");
      expect(resolveItemTypeLabelKey(ItemType.Potion)).toBe("itemTypePotion");
    });

    it("falls back to itemTypeWeapon for missing type", () => {
      expect(resolveItemTypeLabelKey(null)).toBe("itemTypeWeapon");
      expect(resolveItemTypeLabelKey(undefined)).toBe("itemTypeWeapon");
    });
  });

  describe("resolveItemSlotVM", () => {
    it("transforms a valid item into populated ItemSlotVM", () => {
      const item = createMockItem({
        id: "flame_blade",
        nameKey: "flameBlade",
        icon: "Flame",
        rarity: "rare",
        count: 1,
      });

      const vm = resolveItemSlotVM(item, "Weapon Slot", "Sword");

      expect(vm.id).toBe("flame_blade");
      expect(vm.nameKey).toBe("flameBlade");
      expect(vm.iconName).toBe("Flame");
      expect(vm.rarity).toBe("rare");
      expect(vm.rarityVariant).toBe("cyan");
      expect(vm.count).toBe(1);
      expect(vm.isEmpty).toBe(false);
      expect(vm.label).toBe("Weapon Slot");
      expect(vm.placeholderIconName).toBe("Sword");
    });

    it("transforms null or undefined into empty ItemSlotVM", () => {
      const vm = resolveItemSlotVM(null, "Helmet Slot", "Crown");

      expect(vm.id).toBeNull();
      expect(vm.nameKey).toBeNull();
      expect(vm.iconName).toBeNull();
      expect(vm.rarity).toBeNull();
      expect(vm.rarityVariant).toBe("stone");
      expect(vm.isEmpty).toBe(true);
      expect(vm.label).toBe("Helmet Slot");
      expect(vm.placeholderIconName).toBe("Crown");
    });
  });

  describe("resolvePaperdollVM", () => {
    it("handles null equipment gracefully with 6 empty slots", () => {
      const vm = resolvePaperdollVM(null);

      expect(vm.slots).toHaveLength(6);
      expect(vm.helmet.isEmpty).toBe(true);
      expect(vm.mainHand.isEmpty).toBe(true);
      expect(vm.armor.isEmpty).toBe(true);
      expect(vm.offHand.isEmpty).toBe(true);
      expect(vm.amulet.isEmpty).toBe(true);
      expect(vm.ring.isEmpty).toBe(true);
    });

    it("correctly resolves populated equipment slots", () => {
      const equipment: EquipmentState = {
        helmet: createMockItem({ id: "iron_helm", type: ItemType.Helmet }),
        mainHand: createMockItem({ id: "steel_sword", type: ItemType.Weapon }),
        armor: createMockItem({ id: "leather_armor", type: ItemType.Armor }),
        offHand: null,
        amulet: null,
        ring: createMockItem({ id: "gold_ring", type: ItemType.Ring }),
      };

      const vm = resolvePaperdollVM(equipment);

      expect(vm.helmet.id).toBe("iron_helm");
      expect(vm.helmet.isEmpty).toBe(false);
      expect(vm.mainHand.id).toBe("steel_sword");
      expect(vm.mainHand.isEmpty).toBe(false);
      expect(vm.armor.id).toBe("leather_armor");
      expect(vm.armor.isEmpty).toBe(false);
      expect(vm.offHand.isEmpty).toBe(true);
      expect(vm.amulet.isEmpty).toBe(true);
      expect(vm.ring.id).toBe("gold_ring");
      expect(vm.ring.isEmpty).toBe(false);
    });
  });

  describe("resolveBackpackVM", () => {
    it("resolves backpack with correct occupied count and default capacity of 16", () => {
      const backpack: (Item | null)[] = [
        createMockItem({ id: "item_1" }),
        null,
        createMockItem({ id: "item_2" }),
      ];

      const vm = resolveBackpackVM(backpack, 16);

      expect(vm.totalCapacity).toBe(16);
      expect(vm.occupiedCount).toBe(2);
      expect(vm.slots).toHaveLength(16);
      expect(vm.slots[0].id).toBe("item_1");
      expect(vm.slots[0].isEmpty).toBe(false);
      expect(vm.slots[1].isEmpty).toBe(true);
      expect(vm.slots[2].id).toBe("item_2");
      expect(vm.slots[15].isEmpty).toBe(true);
    });

    it("handles undefined backpack by producing empty slots", () => {
      const vm = resolveBackpackVM(undefined, 8);

      expect(vm.totalCapacity).toBe(8);
      expect(vm.occupiedCount).toBe(0);
      expect(vm.slots).toHaveLength(8);
      expect(vm.slots.every((s) => s.isEmpty)).toBe(true);
    });
  });

  describe("resolveInventoryQuickBeltVM", () => {
    it("resolves P1 key bindings (1, 2, 3)", () => {
      const potions: (Item | null)[] = [
        createMockItem({ id: "hp_pot", type: ItemType.Potion, healHp: 50, count: 3 }),
        null,
        createMockItem({ id: "mana_pot", type: ItemType.Potion, healMana: 30, count: 1 }),
      ];

      const vm = resolveInventoryQuickBeltVM(potions, true);

      expect(vm.isP1).toBe(true);
      expect(vm.slots).toHaveLength(3);
      expect(vm.slots[0].keyLabel).toBe("1");
      expect(vm.slots[0].healHp).toBe(50);
      expect(vm.slots[0].count).toBe(3);
      expect(vm.slots[1].keyLabel).toBe("2");
      expect(vm.slots[1].isEmpty).toBe(true);
      expect(vm.slots[2].keyLabel).toBe("3");
      expect(vm.slots[2].healMana).toBe(30);
    });

    it("resolves P2 key bindings (7, 8, 9)", () => {
      const vm = resolveInventoryQuickBeltVM(null, false);

      expect(vm.isP1).toBe(false);
      expect(vm.slots[0].keyLabel).toBe("7");
      expect(vm.slots[1].keyLabel).toBe("8");
      expect(vm.slots[2].keyLabel).toBe("9");
      expect(vm.slots.every((s) => s.isEmpty)).toBe(true);
    });
  });

  describe("resolveStatModifiersVM", () => {
    it("formats combat and healing modifiers accurately", () => {
      const item = createMockItem({
        attackBonus: 15,
        defenseBonus: 5,
        maxHpBonus: 20,
        maxManaBonus: 10,
        maxStaminaBonus: 8,
        healHp: 40,
        healMana: 25,
        healStamina: 15,
        manaRegenBonus: 0.1,
        staminaRegenBonus: 0.2,
      });

      const modifiers = resolveStatModifiersVM(item);

      expect(modifiers).toHaveLength(10);

      const attackMod = modifiers.find((m) => m.type === "attack");
      expect(attackMod?.formattedValue).toBe("+15");
      expect(attackMod?.labelKey).toBe("itemAttackBonus");
      expect(attackMod?.iconName).toBe("Sword");

      const defMod = modifiers.find((m) => m.type === "defense");
      expect(defMod?.formattedValue).toBe("+5");
      expect(defMod?.labelKey).toBe("itemDefenseBonus");

      const healHpMod = modifiers.find((m) => m.type === "healHp");
      expect(healHpMod?.formattedValue).toBe("+40");
      expect(healHpMod?.labelKey).toBe("itemHealHp");
    });

    it("returns empty array for items with no modifiers or null", () => {
      expect(resolveStatModifiersVM(createMockItem({ attackBonus: undefined }))).toEqual([]);
      expect(resolveStatModifiersVM(null)).toEqual([]);
    });
  });

  describe("resolveItemDetailsVM", () => {
    it("resolves an equippable weapon item", () => {
      const item = createMockItem({
        id: "frost_rapier",
        nameKey: "frostRapier",
        descriptionKey: "frostRapierDesc",
        type: ItemType.Weapon,
        rarity: "uncommon",
        attackBonus: 12,
      });

      const vm = resolveItemDetailsVM(item);

      expect(vm).not.toBeNull();
      expect(vm?.id).toBe("frost_rapier");
      expect(vm?.typeLabelKey).toBe("itemTypeWeapon");
      expect(vm?.rarityVariant).toBe("green");
      expect(vm?.isEquippable).toBe(true);
      expect(vm?.isPotion).toBe(false);
      expect(vm?.modifiers).toHaveLength(1);
    });

    it("resolves a potion item", () => {
      const item = createMockItem({
        id: "health_potion",
        type: ItemType.Potion,
        healHp: 50,
        count: 5,
      });

      const vm = resolveItemDetailsVM(item);

      expect(vm).not.toBeNull();
      expect(vm?.isPotion).toBe(true);
      expect(vm?.isEquippable).toBe(false);
      expect(vm?.count).toBe(5);
    });

    it("returns null for null item", () => {
      expect(resolveItemDetailsVM(null)).toBeNull();
    });
  });

  describe("resolveInventoryStatsVM", () => {
    it("formats and rounds derived stats cleanly", () => {
      const derived = {
        totalAttack: 25.4,
        totalDefense: 8.6,
        maxHp: 120.2,
        maxMana: 80.9,
        maxStamina: 100,
        manaRegen: 0.1,
        staminaRegen: 0.25,
      };

      const vm = resolveInventoryStatsVM(derived, 95.8, 40.2, 75.1);

      expect(vm.attack).toBe(25);
      expect(vm.defense).toBe(9);
      expect(vm.currentHp).toBe(96);
      expect(vm.maxHp).toBe(120);
      expect(vm.hpDisplay).toBe("96 / 120");
      expect(vm.manaDisplay).toBe("40 / 81");
      expect(vm.staminaDisplay).toBe("75 / 100");
      expect(vm.manaRegen).toBe(0.1);
      expect(vm.staminaRegen).toBe(0.25);
    });

    it("uses robust fallback values when derived stats are missing", () => {
      const vm = resolveInventoryStatsVM(null);

      expect(vm.attack).toBe(20);
      expect(vm.defense).toBe(5);
      expect(vm.maxHp).toBe(100);
      expect(vm.hpDisplay).toBe("0 / 100");
    });
  });
});
