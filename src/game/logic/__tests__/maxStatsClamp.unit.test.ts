import { describe, it, expect } from "bun:test";
import { createMockPlayer } from "@test-utils";
import { PlayerId, Player } from "../../types";
import {
  createDefaultInventory,
  equipItem,
  unequipItem,
  calculatePlayerDerivedStats,
  syncPlayerMaxStats,
  ITEM_REGISTRY,
} from "../inventory";
import { applyCharacterToPlayer } from "../../controllers/characterSwitchingHelper";

function makePlayer(characterId: "valen" | "aurelia" = "valen"): Player {
  const player = createMockPlayer({
    id: PlayerId.Player1,
    characterId,
    characterName: characterId === "valen" ? "Valen" : "Aurelia",
    unlockedSkills: [],
    characterProfiles: {},
    inventory: createDefaultInventory(),
  });
  syncPlayerMaxStats(player);
  player.health = player.maxHealth;
  player.mana = player.maxMana;
  player.stamina = player.maxStamina;
  return player;
}

describe("max stat clamping", () => {
  it("unequipping an HP item clamps current HP to the new maximum", () => {
    const player = makePlayer("valen");
    const before = player.maxHealth;
    expect(player.inventory.equipment.armor?.maxHpBonus).toBeGreaterThan(0);

    const res = unequipItem(player, "armor");
    expect(res.ok).toBe(true);

    expect(player.maxHealth).toBeLessThan(before);
    expect(player.health).toBe(player.maxHealth);
    expect(player.health).toBeLessThanOrEqual(player.maxHealth);
  });

  it("unequipping keeps current HP unchanged when it is still under the new maximum", () => {
    const player = makePlayer("valen");
    player.health = 50;

    unequipItem(player, "armor");

    expect(player.health).toBe(50);
  });

  it("equipping an HP item never raises current HP", () => {
    const player = makePlayer("valen");
    unequipItem(player, "armor");
    player.health = 40;
    const backpackIdx = player.inventory.backpack.findIndex((s) => s === null);
    player.inventory.backpack[backpackIdx] = { ...ITEM_REGISTRY.crimson_coat! };

    const res = equipItem(player, backpackIdx);
    expect(res.ok).toBe(true);

    expect(player.maxHealth).toBe(calculatePlayerDerivedStats(player).maxHp);
    expect(player.health).toBe(40);
  });

  it("switching hero clamps current HP, mana and stamina to the new hero's maximums", () => {
    const player = makePlayer("valen");
    // Valen base max HP is above Aurelia's, so the value must drop on switch.
    expect(player.maxHealth).toBeGreaterThan(calculatePlayerDerivedStats(makePlayer("aurelia")).maxHp);
    player.health = player.maxHealth;
    player.mana = player.maxMana;
    player.stamina = player.maxStamina;

    applyCharacterToPlayer(player, "aurelia");

    const expected = calculatePlayerDerivedStats(player);
    expect(player.maxHealth).toBe(expected.maxHp);
    expect(player.maxMana).toBe(expected.maxMana);
    expect(player.maxStamina).toBe(expected.maxStamina);
    expect(player.health).toBeLessThanOrEqual(player.maxHealth);
    expect(player.mana).toBeLessThanOrEqual(player.maxMana);
    expect(player.stamina).toBeLessThanOrEqual(player.maxStamina);
  });

  it("the derived maximum used by the inventory view includes equipment bonuses", () => {
    const player = makePlayer("valen");
    const profileBase = 115; // valen baseStats.maxHp
    const derived = calculatePlayerDerivedStats(player).maxHp;

    expect(derived).toBeGreaterThan(profileBase);
    expect(player.maxHealth).toBe(derived);
  });
});
