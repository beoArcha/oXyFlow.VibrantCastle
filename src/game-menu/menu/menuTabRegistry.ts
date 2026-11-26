/**
 * Typed Open/Closed Menu Tab Registry covering all 7 Menu subtabs
 * including the restored Developer & Creation Tools tab.
 */

export enum MenuTabId {
  Gameplay = "gameplay",
  Locations = "locations",
  Display = "display",
  Audio = "audio",
  Controls = "controls",
  Stats = "stats",
  Developer = "developer",
}

export interface MenuTabDefinition {
  readonly id: MenuTabId;
  readonly labelKey: string;
  readonly fallbackLabel?: string;
}

export const MENU_TAB_REGISTRY: readonly MenuTabDefinition[] = [
  { id: MenuTabId.Gameplay, labelKey: "settings" },
  { id: MenuTabId.Locations, labelKey: "locationLabel" },
  { id: MenuTabId.Display, labelKey: "displayTab" },
  { id: MenuTabId.Audio, labelKey: "musicVolume" },
  { id: MenuTabId.Controls, labelKey: "controlsHelp" },
  { id: MenuTabId.Stats, labelKey: "statsBtn" },
  { id: MenuTabId.Developer, labelKey: "tabCreation", fallbackLabel: "Deweloper" },
];
