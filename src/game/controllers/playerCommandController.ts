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
import {
  applyCharacterToPlayer,
  swapPlayerProgression,
  cloneInventoryState,
} from "./characterSwitchingHelper";

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
      const p1Char = players[0].characterId || "valen";
      if (players[0].characterProfiles?.[p1Char]) {
        players[0].characterProfiles[p1Char]!.inventory = cloneInventoryState(players[0].inventory);
      }
    }
    if (players[1]) {
      players[1].inventory = createDefaultInventory();
      const stats = calculatePlayerDerivedStats(players[1]);
      players[1].maxHealth = stats.maxHp;
      players[1].maxMana = stats.maxMana;
      players[1].maxStamina = stats.maxStamina;
      const p2Char = players[1].characterId || "aurelia";
      if (players[1].characterProfiles?.[p2Char]) {
        players[1].characterProfiles[p2Char]!.inventory = cloneInventoryState(players[1].inventory);
      }
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
      if (players[0].characterProfiles?.[p1Char]) {
        players[0].characterProfiles[p1Char] = {
          characterId: p1Char,
          unlockedSkills: [...p1Defaults.unlockedSkills],
          skillPoints: p1Defaults.skillPoints,
          primarySpellId: p1Defaults.primarySpellId,
          secondarySpellId: p1Defaults.secondarySpellId,
          inventory: cloneInventoryState(players[0].inventory),
        };
      }
    }
    if (players[1]) {
      const p2Char = players[1].characterId || "aurelia";
      const p2Defaults = getDefaultSkillsForCharacter(p2Char);
      players[1].unlockedSkills = [...p2Defaults.unlockedSkills];
      players[1].skillPoints = p2Defaults.skillPoints;
      players[1].primarySpellId = p2Defaults.primarySpellId;
      players[1].secondarySpellId = p2Defaults.secondarySpellId;
      if (players[1].characterProfiles?.[p2Char]) {
        players[1].characterProfiles[p2Char] = {
          characterId: p2Char,
          unlockedSkills: [...p2Defaults.unlockedSkills],
          skillPoints: p2Defaults.skillPoints,
          primarySpellId: p2Defaults.primarySpellId,
          secondarySpellId: p2Defaults.secondarySpellId,
          inventory: cloneInventoryState(players[1].inventory),
        };
      }
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

    swapPlayerProgression(players[0], players[1]);
    this.context.notifyStateChanged();
    return true;
  }

  public setPlayerCharacter(playerIndex: number, characterId: "valen" | "aurelia"): boolean {
    const players = this.context.getPlayers();
    if (playerIndex < 0 || playerIndex >= players.length) {
      return false;
    }

    const targetPlayer = players[playerIndex];
    if (!targetPlayer) return false;

    if (players.length === 1) {
      if (targetPlayer.characterId === characterId) {
        return true;
      }
      applyCharacterToPlayer(targetPlayer, characterId);
      this.context.notifyStateChanged();
      return true;
    }

    // Two-player co-op mode: validate playerIndex & enforce mutual exclusion
    const otherIndex = 1 - playerIndex;
    const otherPlayer = players[otherIndex];
    const complementaryId: "valen" | "aurelia" = characterId === "aurelia" ? "valen" : "aurelia";

    if (targetPlayer.characterId === characterId) {
      if (otherPlayer && otherPlayer.characterId === characterId) {
        applyCharacterToPlayer(otherPlayer, complementaryId);
        this.context.notifyStateChanged();
      }
      return true;
    }

    if (otherPlayer && otherPlayer.characterId === characterId) {
      return this.swapPlayerCharacters();
    }

    applyCharacterToPlayer(targetPlayer, characterId);
    if (otherPlayer) {
      applyCharacterToPlayer(otherPlayer, complementaryId);
    }
    this.context.notifyStateChanged();
    return true;
  }
}
