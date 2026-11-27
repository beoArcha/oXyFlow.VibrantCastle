/**
 * Typed Open/Closed Menu Tab Registry covering the game Menu subtabs.
 * The developer tools ("Tworzenie") live in their own dialog, not here.
 */

export enum MenuTabId {
  Gameplay = "gameplay",
  Locations = "locations",
  Display = "display",
  Audio = "audio",
  Controls = "controls",
  Stats = "stats",
}

export interface MenuTabDefinition {
  readonly id: MenuTabId;
  readonly labelKey: string;
}

export const MENU_TAB_REGISTRY: readonly MenuTabDefinition[] = [
  { id: MenuTabId.Gameplay, labelKey: "settings" },
  { id: MenuTabId.Locations, labelKey: "locationLabel" },
  { id: MenuTabId.Display, labelKey: "tabDisplay" },
  { id: MenuTabId.Audio, labelKey: "tabAudio" },
  { id: MenuTabId.Controls, labelKey: "controlsHelp" },
  { id: MenuTabId.Stats, labelKey: "statsBtn" },
];
