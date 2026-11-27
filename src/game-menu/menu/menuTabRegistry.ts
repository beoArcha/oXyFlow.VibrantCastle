/**
 * Typed Open/Closed Settings Sub-Tab Registry covering Ustawienia (Settings) L2 sections.
 */

export enum SettingsTabId {
  Display = "display",
  Audio = "audio",
  Controls = "controls",
  Interface = "interface",
}

export interface SettingsTabDefinition {
  readonly id: SettingsTabId;
  readonly labelKey: string;
}

export const SETTINGS_TAB_REGISTRY: readonly SettingsTabDefinition[] = [
  { id: SettingsTabId.Display, labelKey: "settingsTabDisplay" },
  { id: SettingsTabId.Audio, labelKey: "settingsTabAudio" },
  { id: SettingsTabId.Controls, labelKey: "settingsTabControls" },
  { id: SettingsTabId.Interface, labelKey: "settingsTabInterface" },
];
