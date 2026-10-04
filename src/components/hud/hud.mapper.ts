import { SPELL_REGISTRY } from "@game/logic/magic";
import { calculatePlayerDerivedStats } from "@game/logic/inventory";
import { type InventoryState, type Item } from "@game/types";
import { resolvePlayerTheme } from "@styles/theme";
import { clampPositiveInt } from "@lib/math";
import { getLogger } from "@lib/logger";
import type {
  PlayerStatusVM,
  SpellItemVM,
  PotionSlotVM,
  QuickBeltVM,
  HUDPlayerStatusData,
  PlayerDerivedStats,
  ResolvePlayerStatusOptions,
  ResolveQuickBeltOptions,
} from "./types";

export type { PlayerDerivedStats, ResolvePlayerStatusOptions, ResolveQuickBeltOptions };

const logger = getLogger("hud.mapper");

/**
 * Transforms player snapshot data and derived stats into a clean PlayerStatusVM for HUD display.
 */
export function resolvePlayerStatusVM(
  player: HUDPlayerStatusData | null | undefined,
  derivedStats: PlayerDerivedStats | null | undefined,
  options: ResolvePlayerStatusOptions
): PlayerStatusVM | null {
  if (!player) return null;

  const theme = resolvePlayerTheme(options.theme);
  const fallbackCharacterId = theme === "crimson" ? "valen" : "aurelia";

  return {
    characterId: player.characterId || fallbackCharacterId,
    characterName: options.characterName,
    playerNumber: options.playerNumber,
    theme,
    health: clampPositiveInt(player.health),
    maxHealth: Math.max(1, clampPositiveInt(player.maxHealth)),
    mana: clampPositiveInt(player.mana),
    maxMana: Math.max(1, clampPositiveInt(player.maxMana)),
    stamina: clampPositiveInt(player.stamina),
    maxStamina: Math.max(1, clampPositiveInt(player.maxStamina)),
    attackPower: clampPositiveInt(derivedStats?.totalAttack ?? options.attackFallback ?? 10),
    skillPoints: typeof player.skillPoints === "number" ? clampPositiveInt(player.skillPoints) : 0,
  };
}

/**
 * Resolves spell details from the engine SPELL_REGISTRY into a presentation SpellItemVM.
 */
export function resolveSpellVM(
  spellId: string | null | undefined,
  keyLabel: string,
  variant: "cyan" | "purple"
): SpellItemVM | null {
  if (!spellId) return null;

  const def = SPELL_REGISTRY[spellId];
  if (!def) {
    logger.warn(`Unknown spellId "${spellId}" in SPELL_REGISTRY`);
    return null;
  }

  return {
    id: def.id,
    nameKey: def.nameKey,
    manaCost: def.manaCost,
    keyLabel,
    variant,
  };
}

/**
 * Resolves quick potion slots into an array of PotionSlotVM with key bindings and counts.
 */
export function resolvePotionSlotsVM(
  quickPotions: readonly (Item | null)[] | (Item | null)[] | undefined,
  isP1: boolean
): readonly PotionSlotVM[] {
  const slots: PotionSlotVM[] = [];

  for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
    const pot = quickPotions?.[slotIndex] ?? null;
    const keyLabel = isP1 ? String(slotIndex + 1) : String(slotIndex + 7);

    slots.push({
      slotIndex,
      keyLabel,
      count: pot ? pot.count || 1 : 0,
      isEmpty: pot === null,
      healHp: pot?.healHp,
      healMana: pot?.healMana,
      nameKey: pot?.nameKey,
    });
  }

  return slots;
}

/**
 * Resolves quick belt action slots (spells and potions) into a QuickBeltVM.
 */
export function resolveQuickBeltVM(
  player: { readonly inventory: InventoryState; readonly primarySpellId?: string; readonly secondarySpellId?: string } | null | undefined,
  options: ResolveQuickBeltOptions
): QuickBeltVM | null {
  if (!player) return null;

  const primarySpell = resolveSpellVM(
    options.primarySpellId ?? player.primarySpellId,
    options.primaryKeyLabel,
    "cyan"
  );
  const secondarySpell = resolveSpellVM(
    options.secondarySpellId ?? player.secondarySpellId,
    options.secondaryKeyLabel,
    "purple"
  );

  return {
    playerNumber: options.playerNumber,
    primarySpell,
    secondarySpell,
    primarySpellName: primarySpell ? primarySpell.nameKey : "",
    secondarySpellName: secondarySpell ? secondarySpell.nameKey : "",
    primaryKeyLabel: options.primaryKeyLabel,
    secondaryKeyLabel: options.secondaryKeyLabel,
    potionKeyRangeLabel: options.potionKeyRangeLabel,
    potions: resolvePotionSlotsVM(player.inventory?.quickPotions, options.playerNumber === 1),
  };
}

export { resolveViewportCameraProjection } from "@context/GameSessionContext";

/**
 * Calculates derived stats for a player, shielding UI components from direct @game/logic/inventory imports.
 */
export function resolvePlayerDerivedStats(
  player: any | null | undefined
): PlayerDerivedStats | null {
  if (!player || !player.inventory || !player.inventory.equipment) return null;
  return calculatePlayerDerivedStats(player);
}
