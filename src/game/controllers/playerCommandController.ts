import { Player, EquipmentState } from "../types";
import {
  useQuickPotion,
  equipItemFromBackpack,
  unequipSlotToBackpack,
  discardItemFromBackpack,
  calculatePlayerDerivedStats,
  createDefaultInventory,
} from "../logic/inventory";
import {
  unlockSkillNode,
  assignSpellToSlot,
  getDefaultSkillsForCharacter,
} from "../logic/skills";

import { GameEventBus } from "../engine/eventBus";

/**
 * Context provided to PlayerCommandController to interact with game state.
 */
export interface IPlayerCommandContext {
  getPlayers(): Player[];
  notifyStateChanged(): void;
  eventBus?: GameEventBus;
}

/**
 * Interface for unidirectional player command executions (equipment, potions, skill trees, spells).
 */
export interface IPlayerCommandController {
  equipPlayerItem(playerIndex: number, backpackIndex: number): boolean;
  unequipPlayerItem(playerIndex: number, slot: keyof EquipmentState): boolean;
  usePlayerPotion(playerIndex: number, slotIndex: number): boolean;
  discardPlayerItem(playerIndex: number, backpackIndex: number): boolean;
  resetPlayerInventoryToDefaults(): void;
  unlockPlayerSkill(playerIndex: number, nodeId: string): { success: boolean; messageKey?: string };
  assignPlayerSpell(playerIndex: number, spellId: string, slot: "primary" | "secondary"): boolean;
  resetPlayerSkillsToDefaults(): void;
  swapPlayerCharacters(): boolean;
  setPlayerCharacter(playerIndex: number, characterId: "valen" | "aurelia"): boolean;
}

/**
 * PlayerCommandController encapsulates all user-initiated UI commands modifying
 * player inventory, equipment, skill trees, quick potions, and assigned active spells.
 */
export class PlayerCommandController implements IPlayerCommandController {
  constructor(private readonly context: IPlayerCommandContext) {}

  public equipPlayerItem(playerIndex: number, backpackIndex: number): boolean {
    const players = this.context.getPlayers();
    const player = players[playerIndex];
    if (!player) return false;
    const success = equipItemFromBackpack(player, backpackIndex);
    if (success) {
      this.context.notifyStateChanged();
    }
    return success;
  }

  public unequipPlayerItem(playerIndex: number, slot: keyof EquipmentState): boolean {
    const players = this.context.getPlayers();
    const player = players[playerIndex];
    if (!player) return false;
    const success = unequipSlotToBackpack(player, slot);
    if (success) {
      this.context.notifyStateChanged();
    }
    return success;
  }

  public usePlayerPotion(playerIndex: number, slotIndex: number): boolean {
    const players = this.context.getPlayers();
    const player = players[playerIndex];
    if (!player) return false;
    const success = useQuickPotion(player, slotIndex);
    if (success) {
      this.context.eventBus?.emit("ITEM_CONSUMED", {
        playerIndex,
        slotIndex,
      });
      this.context.notifyStateChanged();
    }
    return success;
  }

  public discardPlayerItem(playerIndex: number, backpackIndex: number): boolean {
    const players = this.context.getPlayers();
    const player = players[playerIndex];
    if (!player) return false;
    const success = discardItemFromBackpack(player, backpackIndex);
    if (success) {
      this.context.notifyStateChanged();
    }
    return success;
  }

  public resetPlayerInventoryToDefaults(): void {
    const players = this.context.getPlayers();
    if (players[0]) {
      players[0].inventory = createDefaultInventory();
      const stats = calculatePlayerDerivedStats(players[0]);
      players[0].maxHealth = stats.maxHp;
      players[0].maxMana = stats.maxMana;
      players[0].maxStamina = stats.maxStamina;
    }
    if (players[1]) {
      players[1].inventory = createDefaultInventory();
      const stats = calculatePlayerDerivedStats(players[1]);
      players[1].maxHealth = stats.maxHp;
      players[1].maxMana = stats.maxMana;
      players[1].maxStamina = stats.maxStamina;
    }
    this.context.notifyStateChanged();
  }

  public unlockPlayerSkill(playerIndex: number, nodeId: string): { success: boolean; messageKey?: string } {
    const players = this.context.getPlayers();
    const player = players[playerIndex];
    if (!player) return { success: false, messageKey: "noSkillFound" };
    const result = unlockSkillNode(player, nodeId);
    if (result.success) {
      this.context.notifyStateChanged();
    }
    return result;
  }

  public assignPlayerSpell(playerIndex: number, spellId: string, slot: "primary" | "secondary"): boolean {
    const players = this.context.getPlayers();
    const player = players[playerIndex];
    if (!player) return false;
    const success = assignSpellToSlot(player, spellId, slot);
    if (success) {
      this.context.notifyStateChanged();
    }
    return success;
  }

  public resetPlayerSkillsToDefaults(): void {
    const players = this.context.getPlayers();
    if (players[0]) {
      const p1Char = players[0].characterId || "valen";
      const p1Defaults = getDefaultSkillsForCharacter(p1Char);
      players[0].unlockedSkills = [...p1Defaults.unlockedSkills];
      players[0].skillPoints = p1Defaults.skillPoints;
      players[0].primarySpellId = p1Defaults.primarySpellId;
      players[0].secondarySpellId = p1Defaults.secondarySpellId;
    }
    if (players[1]) {
      const p2Char = players[1].characterId || "aurelia";
      const p2Defaults = getDefaultSkillsForCharacter(p2Char);
      players[1].unlockedSkills = [...p2Defaults.unlockedSkills];
      players[1].skillPoints = p2Defaults.skillPoints;
      players[1].primarySpellId = p2Defaults.primarySpellId;
      players[1].secondarySpellId = p2Defaults.secondarySpellId;
    }
    this.context.notifyStateChanged();
  }

  public swapPlayerCharacters(): boolean {
    const players = this.context.getPlayers();
    if (!players || players.length === 0) return false;

    if (players.length === 1) {
      const p1 = players[0];
      const nextChar = p1.characterId === "aurelia" ? "valen" : "aurelia";
      return this.setPlayerCharacter(0, nextChar);
    }

    const p1 = players[0];
    const p2 = players[1];

    const tempCharId = p1.characterId;
    const tempCharName = p1.characterName;
    p1.characterId = p2.characterId;
    p1.characterName = p2.characterName;
    p2.characterId = tempCharId;
    p2.characterName = tempCharName;

    const tempSkills = p1.unlockedSkills;
    const tempPoints = p1.skillPoints;
    const tempPrimary = p1.primarySpellId;
    const tempSecondary = p1.secondarySpellId;

    p1.unlockedSkills = p2.unlockedSkills;
    p1.skillPoints = p2.skillPoints;
    p1.primarySpellId = p2.primarySpellId;
    p1.secondarySpellId = p2.secondarySpellId;

    p2.unlockedSkills = tempSkills;
    p2.skillPoints = tempPoints;
    p2.primarySpellId = tempPrimary;
    p2.secondarySpellId = tempSecondary;

    const tempInventory = p1.inventory;
    p1.inventory = p2.inventory;
    p2.inventory = tempInventory;

    const p1Stats = calculatePlayerDerivedStats(p1);
    p1.maxHealth = p1Stats.maxHp;
    p1.maxMana = p1Stats.maxMana;
    p1.maxStamina = p1Stats.maxStamina;

    const p2Stats = calculatePlayerDerivedStats(p2);
    p2.maxHealth = p2Stats.maxHp;
    p2.maxMana = p2Stats.maxMana;
    p2.maxStamina = p2Stats.maxStamina;

    this.context.notifyStateChanged();
    return true;
  }

  public setPlayerCharacter(playerIndex: number, characterId: "valen" | "aurelia"): boolean {
    const players = this.context.getPlayers();
    const player = players[playerIndex];
    if (!player) return false;

    if (player.characterId === characterId) {
      return true;
    }

    if (players.length > 1) {
      return this.swapPlayerCharacters();
    }

    player.characterId = characterId;
    player.characterName = characterId === "aurelia" ? "Aurelia" : "Valen";

    const defaults = getDefaultSkillsForCharacter(characterId);
    player.unlockedSkills = [...defaults.unlockedSkills];
    player.skillPoints = Math.max(player.skillPoints, defaults.skillPoints);
    player.primarySpellId = defaults.primarySpellId;
    player.secondarySpellId = defaults.secondarySpellId;

    const stats = calculatePlayerDerivedStats(player);
    player.maxHealth = stats.maxHp;
    player.maxMana = stats.maxMana;
    player.maxStamina = stats.maxStamina;

    this.context.notifyStateChanged();
    return true;
  }
}
