import { SPELL_REGISTRY } from "@game/logic/magic";
import {
  useQuickPotion,
  calculatePlayerDerivedStats,
} from "@game/logic/inventory";
import type { InventoryState, Item } from "@game/types";
import { type PlayerTheme, resolvePlayerTheme } from "@styles/theme";
import type {
  PlayerStatusVM,
  SpellItemVM,
  PotionSlotVM,
  QuickBeltVM,
  HUDPlayerStatusData,
} from "@components/hud/types";

export type PlayerDerivedStats = ReturnType<typeof calculatePlayerDerivedStats>;

export interface ResolvePlayerStatusOptions {
  readonly characterName: string;
  readonly theme: PlayerTheme | "red";
  readonly playerNumber: 1 | 2;
  readonly attackFallback?: number;
}

export interface ResolveQuickBeltOptions {
  readonly playerNumber: 1 | 2;
  readonly primaryKeyLabel: string;
  readonly secondaryKeyLabel: string;
  readonly potionKeyRangeLabel: string;
  readonly primarySpellId?: string;
  readonly secondarySpellId?: string;
}

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
    health: Math.max(0, Math.round(player.health)),
    maxHealth: Math.max(1, Math.round(player.maxHealth)),
    mana: Math.max(0, Math.round(player.mana)),
    maxMana: Math.max(1, Math.round(player.maxMana)),
    stamina: Math.max(0, Math.round(player.stamina)),
    maxStamina: Math.max(1, Math.round(player.maxStamina)),
    attackPower: Math.round(derivedStats?.totalAttack ?? options.attackFallback ?? 10),
    skillPoints: typeof player.skillPoints === "number" ? Math.max(0, player.skillPoints) : 0,
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
  if (!def) return null;

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

/**
 * Pure projection of canvas viewport clicks to in-game world coordinates.
 */
export function resolveViewportCameraProjection(
  canvas: { readonly width: number; readonly height: number; readonly getBoundingClientRect: () => { readonly left: number; readonly top: number; readonly width: number; readonly height: number } },
  clientX: number,
  clientY: number,
  camera: { readonly x: number; readonly y: number },
  scaleFactor: number
): { readonly worldX: number; readonly worldY: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
  const canvasPxX = (clientX - rect.left) * scaleX;
  const canvasPxY = (clientY - rect.top) * scaleY;
  const safeScale = scaleFactor > 0 ? scaleFactor : 1;

  return {
    worldX: Math.round(camera.x + canvasPxX / safeScale - 16),
    worldY: Math.round(camera.y + canvasPxY / safeScale - 24),
  };
}

/**
 * Safely executes quick potion consumption command, shielding UI from direct engine mutations.
 */
export function executeQuickPotionUse(
  targetPlayer: { inventory: InventoryState } | null | undefined,
  slotIndex: number,
  onNotify?: () => void
): boolean {
  if (!targetPlayer || !targetPlayer.inventory) return false;
  useQuickPotion(targetPlayer as any, slotIndex);
  onNotify?.();
  return true;
}

/**
 * Calculates derived stats for a player, shielding UI components from direct @game/logic/inventory imports.
 */
export function resolvePlayerDerivedStats(
  player: any | null | undefined
): PlayerDerivedStats | null {
  if (!player || !player.inventory || !player.inventory.equipment) return null;
  return calculatePlayerDerivedStats(player);
}
