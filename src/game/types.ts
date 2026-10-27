import type { GameTranslationDictionary } from "@i18n/types";

/**
 * Shared types, interfaces, and enums for the 2D Game Engine.
 * Re-exports modularized domain contracts from ./types/
 */

export * from "./types/common";
export * from "./types/enums";
export * from "./types/items";
export * from "./types/magic";
export * from "./types/entities";
export * from "./types/settings";

export type TranslationDictionary = GameTranslationDictionary;
export type { GameTranslationDictionary };
