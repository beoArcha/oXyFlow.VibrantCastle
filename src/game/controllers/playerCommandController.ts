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

/**
 * Context provided to PlayerCommandController to interact with game state.
 * Implements Dependency Inversion Principle (DIP) to decouple command logic from GameEngine.
 */
export interface IPlayerCommandContext {
  getPlayers(): Player[];
  notifyStateChanged(): void;
}

/**
 * Interface for unidirectional player command executions (equipment, potions, skill trees, spells).
 * Segregated interface following ISP and SRP.
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
    const p1Defaults = getDefaultSkillsForCharacter("valen");
    if (players[0]) {
      players[0].unlockedSkills = [...p1Defaults.unlockedSkills];
      players[0].skillPoints = p1Defaults.skillPoints;
      players[0].primarySpellId = p1Defaults.primarySpellId;
      players[0].secondarySpellId = p1Defaults.secondarySpellId;
    }
    if (players[1]) {
      const p2Defaults = getDefaultSkillsForCharacter("aurelia");
      players[1].unlockedSkills = [...p2Defaults.unlockedSkills];
      players[1].skillPoints = p2Defaults.skillPoints;
      players[1].primarySpellId = p2Defaults.primarySpellId;
      players[1].secondarySpellId = p2Defaults.secondarySpellId;
    }
    this.context.notifyStateChanged();
  }
}
