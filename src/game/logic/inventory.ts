import { Item, ItemType, InventoryState, EquipmentState, Player, SoundType } from "@game/types";
import { gameAudio } from "@game/engine/audioEngine";
import { statsManager } from "./stats";
import itemsData from "@data/items/items.json";
import { inventoryLogger } from "@game/logger/gameLogger";
import { Result, ok, err, GameplayError, ErrorCode } from "@lib/errors";
import { itemCodec } from "@lib/codecs";
import {
  calculatePlayerDerivedStats,
  createDefaultInventory as createDefaultInvWithRegistry,
  PlayerDerivedStats,
} from "./inventoryStats";

export { calculatePlayerDerivedStats };
export type { PlayerDerivedStats };

/**
 * Master Registry of Items available in the game (loaded and validated via itemCodec).
 */
const decodedItemsRes = itemCodec.decodeDictionary(itemsData);
if (!decodedItemsRes.isOk()) {
  inventoryLogger.error("Failed to decode canonical items.json via itemCodec", {
    error: decodedItemsRes.error.message,
  });
}

export const ITEM_REGISTRY: Record<string, Item> = decodedItemsRes.isOk()
  ? (decodedItemsRes.value as unknown as Record<string, Item>)
  : {};

/**
 * Creates default initial inventory for a new game / player.
 * Matches classic isometric RPGs layout with equipped starter gear and a few potions in the belt.
 */
export function createDefaultInventory(): InventoryState {
  return createDefaultInvWithRegistry(ITEM_REGISTRY);
}

export interface EquipResult {
  equipped: Item;
  swappedItem: Item | null;
  targetSlot: string;
}

export interface UnequipResult {
  unequipped: Item;
  backpackIndex: number;
  slot: keyof EquipmentState;
}

export interface PotionConsumptionResult {
  consumed: Item;
  remainingCount: number;
  healedType: "health" | "mana" | "stamina" | "none";
}

/**
 * Equips an item from backpack to its designated equipment slot, returning a typed Result.
 */
export function equipItem(player: Player, backpackIndex: number): Result<EquipResult, GameplayError> {
  const item = player.inventory.backpack[backpackIndex];
  if (!item) {
    const error = new GameplayError("No item found in backpack slot", ErrorCode.GAMEPLAY_ITEM_NOT_FOUND, {
      details: { backpackIndex, playerId: player.id },
    });
    inventoryLogger.warn(error.message, error.toLogContext());
    return err(error);
  }

  let targetSlot: keyof EquipmentState | null = null;
  switch (item.type) {
    case ItemType.Weapon:
      targetSlot = "mainHand";
      break;
    case ItemType.Shield:
      targetSlot = "offHand";
      break;
    case ItemType.Helmet:
      targetSlot = "helmet";
      break;
    case ItemType.Armor:
      targetSlot = "armor";
      break;
    case ItemType.Amulet:
      targetSlot = "amulet";
      break;
    case ItemType.Ring:
      targetSlot = "ring";
      break;
    case ItemType.Potion: {
      const emptyPotionIdx = player.inventory.quickPotions.findIndex(s => s === null);
      if (emptyPotionIdx !== -1) {
        player.inventory.quickPotions[emptyPotionIdx] = item;
        player.inventory.backpack[backpackIndex] = null;
        gameAudio.playSFX(SoundType.SFX_UNLOCK);
        inventoryLogger.debug(`Player ${player.id} equipped potion to belt slot ${emptyPotionIdx}`, {
          playerId: player.id,
          itemId: item.id,
          slot: emptyPotionIdx,
        });
        return ok({
          equipped: item,
          swappedItem: null,
          targetSlot: `quickPotion_${emptyPotionIdx}`,
        });
      }
      const error = new GameplayError("Quick potion belt is full", ErrorCode.GAMEPLAY_SLOT_LOCKED, {
        details: { backpackIndex, beltCapacity: player.inventory.quickPotions.length, playerId: player.id },
      });
      inventoryLogger.warn(error.message, error.toLogContext());
      return err(error);
    }
    default: {
      const error = new GameplayError(`Cannot equip item of unsupported type: '${item.type}'`, ErrorCode.GAMEPLAY_INVALID_ACTION, {
        details: { itemType: item.type, itemId: item.id, playerId: player.id },
      });
      inventoryLogger.warn(error.message, error.toLogContext());
      return err(error);
    }
  }

  if (targetSlot) {
    const previous = player.inventory.equipment[targetSlot];
    player.inventory.equipment[targetSlot] = item;
    player.inventory.backpack[backpackIndex] = previous;
    gameAudio.playSFX(SoundType.SFX_UNLOCK);

    // Update max stats dynamically
    const stats = calculatePlayerDerivedStats(player);
    player.maxHealth = stats.maxHp;
    player.maxMana = stats.maxMana;
    player.maxStamina = stats.maxStamina;

    inventoryLogger.debug(`Player ${player.id} equipped '${item.nameKey || item.id}' to slot ${targetSlot}`, {
      playerId: player.id,
      itemId: item.id,
      targetSlot,
      swappedItemId: previous?.id ?? null,
    });

    return ok({
      equipped: item,
      swappedItem: previous,
      targetSlot,
    });
  }

  const error = new GameplayError(`Item '${item.nameKey || item.id}' could not be equipped`, ErrorCode.GAMEPLAY_INVALID_ACTION);
  inventoryLogger.warn(error.message, error.toLogContext());
  return err(error);
}

/**
 * Equips an item from backpack to its designated equipment slot (backwards-compatible wrapper).
 */
export function equipItemFromBackpack(player: Player, backpackIndex: number): boolean {
  return equipItem(player, backpackIndex).ok;
}

/**
 * Unequips item from equipment slot back to first available backpack space, returning a typed Result.
 */
export function unequipItem(player: Player, slot: keyof EquipmentState): Result<UnequipResult, GameplayError> {
  const item = player.inventory.equipment[slot];
  if (!item) {
    const error = new GameplayError(`Equipment slot '${slot}' is empty`, ErrorCode.GAMEPLAY_ITEM_NOT_FOUND, {
      details: { slot, playerId: player.id },
    });
    inventoryLogger.warn(error.message, error.toLogContext());
    return err(error);
  }

  const emptyIdx = player.inventory.backpack.findIndex(s => s === null);
  if (emptyIdx === -1) {
    const error = new GameplayError("Cannot unequip item: Backpack is full", ErrorCode.GAMEPLAY_SLOT_LOCKED, {
      details: { slot, backpackCapacity: player.inventory.backpack.length, playerId: player.id },
    });
    inventoryLogger.warn(error.message, error.toLogContext());
    return err(error);
  }

  player.inventory.backpack[emptyIdx] = item;
  player.inventory.equipment[slot] = null;
  gameAudio.playSFX(SoundType.SFX_UNLOCK);

  const stats = calculatePlayerDerivedStats(player);
  player.maxHealth = stats.maxHp;
  player.maxMana = stats.maxMana;
  player.maxStamina = stats.maxStamina;

  inventoryLogger.debug(`Player ${player.id} unequipped '${item.nameKey || item.id}' from slot ${slot}`, {
    playerId: player.id,
    itemId: item.id,
    slot,
    backpackIndex: emptyIdx,
  });

  return ok({
    unequipped: item,
    backpackIndex: emptyIdx,
    slot,
  });
}

/**
 * Unequips item from equipment slot back to first available backpack space (backwards-compatible wrapper).
 */
export function unequipSlotToBackpack(player: Player, slot: keyof EquipmentState): boolean {
  return unequipItem(player, slot).ok;
}

/**
 * Consumes a potion from quick belt slot (1, 2, or 3), returning a typed Result.
 */
export function consumePotion(player: Player, slotIndex: number): Result<PotionConsumptionResult, GameplayError> {
  const potion = player.inventory.quickPotions[slotIndex];
  if (!potion || (potion.count !== undefined && potion.count <= 0)) {
    const error = new GameplayError(`Quick potion slot ${slotIndex + 1} is empty`, ErrorCode.GAMEPLAY_ITEM_NOT_FOUND, {
      details: { slotIndex, playerId: player.id },
    });
    inventoryLogger.warn(error.message, error.toLogContext());
    return err(error);
  }

  let healedType: "health" | "mana" | "stamina" | "none" = "none";
  if (potion.healHp) {
    player.health = Math.min(player.maxHealth, player.health + potion.healHp);
    statsManager.recordPotionUsed(player.id, "health");
    healedType = "health";
  } else if (potion.healMana) {
    player.mana = Math.min(player.maxMana, player.mana + potion.healMana);
    statsManager.recordPotionUsed(player.id, "mana");
    healedType = "mana";
  } else if (potion.healStamina) {
    player.stamina = Math.min(player.maxStamina, player.stamina + potion.healStamina);
    statsManager.recordPotionUsed(player.id, "stamina");
    healedType = "stamina";
  }

  gameAudio.playSFX(SoundType.SFX_POTION);

  let remaining = potion.count ?? 1;
  if (potion.count !== undefined) {
    potion.count--;
    remaining = potion.count;
    if (potion.count <= 0) {
      player.inventory.quickPotions[slotIndex] = null;
    }
  }

  inventoryLogger.debug(`Player ${player.id} consumed potion '${potion.nameKey || potion.id}'`, {
    playerId: player.id,
    potionId: potion.id,
    healedType,
    remainingCount: remaining,
  });

  return ok({
    consumed: potion,
    remainingCount: remaining,
    healedType,
  });
}

/**
 * Consumes a potion from quick belt slot (backwards-compatible wrapper).
 */
export function useQuickPotion(player: Player, slotIndex: number): boolean {
  return consumePotion(player, slotIndex).ok;
}

/**
 * Drops or discards an item from player backpack, returning a typed Result.
 */
export function discardItem(player: Player, backpackIndex: number): Result<Item, GameplayError> {
  const item = player.inventory.backpack[backpackIndex];
  if (!item) {
    const error = new GameplayError("No item found to discard", ErrorCode.GAMEPLAY_ITEM_NOT_FOUND, {
      details: { backpackIndex, playerId: player.id },
    });
    inventoryLogger.warn(error.message, error.toLogContext());
    return err(error);
  }
  player.inventory.backpack[backpackIndex] = null;
  gameAudio.playSFX(SoundType.SFX_UNLOCK);
  inventoryLogger.debug(`Player ${player.id} discarded item '${item.nameKey || item.id}'`, {
    playerId: player.id,
    itemId: item.id,
    backpackIndex,
  });
  return ok(item);
}

/**
 * Drops or discards an item from player backpack (backwards-compatible wrapper).
 */
export function discardItemFromBackpack(player: Player, backpackIndex: number): boolean {
  return discardItem(player, backpackIndex).ok;
}
