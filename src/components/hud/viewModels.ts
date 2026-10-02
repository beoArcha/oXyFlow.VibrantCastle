import type { PlayerTheme } from "@styles/theme";

export interface PlayerIdentityVM {
  readonly characterId: string;
  readonly characterName: string;
  readonly playerNumber: 1 | 2;
  readonly theme: PlayerTheme;
}

export interface PlayerVitalsVM {
  readonly health: number;
  readonly maxHealth: number;
  readonly mana: number;
  readonly maxMana: number;
  readonly stamina: number;
  readonly maxStamina: number;
}

export interface PlayerCombatStatsVM {
  readonly attackPower: number;
  readonly skillPoints: number;
}

export interface PlayerStatusVM extends PlayerIdentityVM, PlayerVitalsVM, PlayerCombatStatsVM {}

export interface SpellItemVM {
  readonly id: string;
  readonly nameKey: string;
  readonly manaCost: number;
  readonly keyLabel: string;
  readonly variant: "cyan" | "purple";
}

export interface PotionSlotVM {
  readonly slotIndex: number;
  readonly keyLabel: string;
  readonly count: number;
  readonly isEmpty: boolean;
  readonly healHp?: number;
  readonly healMana?: number;
  readonly nameKey?: string;
}

export interface QuickBeltSpellsVM {
  readonly primarySpell: SpellItemVM | null;
  readonly secondarySpell: SpellItemVM | null;
  readonly primarySpellName: string;
  readonly secondarySpellName: string;
  readonly primaryKeyLabel: string;
  readonly secondaryKeyLabel: string;
}

export interface QuickBeltPotionsVM {
  readonly potionKeyRangeLabel: string;
  readonly potions: readonly PotionSlotVM[];
}

export interface QuickBeltVM extends QuickBeltSpellsVM, QuickBeltPotionsVM {
  readonly playerNumber: 1 | 2;
}
