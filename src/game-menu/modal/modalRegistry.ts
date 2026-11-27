import { isDevToolsEnabled } from "@/app/appConfig";

/**
 * Typed Open/Closed Modal Registry.
 * Adding a new modal overlay requires adding one entry here — pause behavior,
 * global hotkeys, header shortcut hints, and navigation tabs update automatically.
 */

export enum ModalId {
  None = "none",
  Menu = "menu",
  Locations = "locations",
  Character = "character",
  Inventory = "inventory",
  SkillTree = "skillTree",
  Settings = "settings",
  Help = "help",
  Creation = "creation",
}

export type OpenModalId = Exclude<ModalId, ModalId.None>;

/** Single width shared by every player-facing game modal. */
export const GAME_MODAL_WIDTH_CLASS = "max-w-5xl";
export type ModalType = `${OpenModalId}`;

export type ModalIconKey =
  | "menu"
  | "locations"
  | "character"
  | "inventory"
  | "skillTree"
  | "settings"
  | "help"
  | "creation";

export interface ModalHeaderShortcutConfig {
  readonly hotkeyLabel: string;
  readonly labelKey: string;
  readonly iconKey: ModalIconKey;
  readonly order: number;
}

export interface ModalNavigationTabConfig {
  readonly labelKey: string;
  readonly keyLabel?: string;
  readonly iconKey: ModalIconKey;
  readonly order: number;
}

export type ModalDialogKind = "game" | "dev";

export interface ModalDefinition {
  readonly id: OpenModalId;
  readonly dialog: ModalDialogKind;
  readonly pausesGame: boolean;
  readonly hotkeys: readonly string[];
  readonly navigationTab: ModalNavigationTabConfig;
  readonly headerShortcut?: ModalHeaderShortcutConfig;
  /** Available only when developer tools are enabled (dev builds). */
  readonly devOnly?: boolean;
}

export const MODAL_REGISTRY: readonly ModalDefinition[] = [
  {
    id: ModalId.Menu,
    dialog: "game",
    pausesGame: true,
    hotkeys: ["m"],
    navigationTab: {
      labelKey: "navGame",
      keyLabel: "M",
      iconKey: "menu",
      order: 1,
    },
    headerShortcut: {
      hotkeyLabel: "M",
      labelKey: "menu",
      iconKey: "menu",
      order: 5,
    },
  },
  {
    id: ModalId.Locations,
    dialog: "game",
    pausesGame: true,
    hotkeys: [],
    navigationTab: {
      labelKey: "navMap",
      iconKey: "locations",
      order: 2,
    },
  },
  {
    id: ModalId.Character,
    dialog: "game",
    pausesGame: true,
    hotkeys: [],
    navigationTab: {
      labelKey: "navCharacter",
      iconKey: "character",
      order: 3,
    },
  },
  {
    id: ModalId.Inventory,
    dialog: "game",
    pausesGame: false,
    hotkeys: ["i"],
    navigationTab: {
      labelKey: "inventoryBtn",
      keyLabel: "I",
      iconKey: "inventory",
      order: 4,
    },
    headerShortcut: {
      hotkeyLabel: "I",
      labelKey: "inventoryBtn",
      iconKey: "inventory",
      order: 1,
    },
  },
  {
    id: ModalId.SkillTree,
    dialog: "game",
    pausesGame: false,
    hotkeys: ["k"],
    navigationTab: {
      labelKey: "headerSkillTree",
      keyLabel: "K",
      iconKey: "skillTree",
      order: 5,
    },
    headerShortcut: {
      hotkeyLabel: "K",
      labelKey: "headerSkillTree",
      iconKey: "skillTree",
      order: 2,
    },
  },
  {
    id: ModalId.Settings,
    dialog: "game",
    pausesGame: true,
    hotkeys: [],
    navigationTab: {
      labelKey: "settings",
      iconKey: "settings",
      order: 6,
    },
  },
  {
    id: ModalId.Help,
    dialog: "game",
    pausesGame: true,
    hotkeys: ["h", "?", "F1"],
    navigationTab: {
      labelKey: "headerHints",
      keyLabel: "H",
      iconKey: "help",
      order: 7,
    },
    headerShortcut: {
      hotkeyLabel: "H",
      labelKey: "headerHints",
      iconKey: "help",
      order: 4,
    },
  },
  {
    id: ModalId.Creation,
    dialog: "dev",
    devOnly: true,
    pausesGame: true,
    hotkeys: ["c"],
    navigationTab: {
      labelKey: "tabCreation",
      keyLabel: "C",
      iconKey: "creation",
      order: 8,
    },
    headerShortcut: {
      hotkeyLabel: "C",
      labelKey: "tabCreation",
      iconKey: "creation",
      order: 3,
    },
  },
];

const MODAL_BY_ID = new Map<string, ModalDefinition>(
  MODAL_REGISTRY.map((def) => [def.id, def])
);

export function getModalDefinition(modal: ModalId | ModalType): ModalDefinition | undefined {
  return MODAL_BY_ID.get(modal);
}

export function isGameModal(modal: ModalId | ModalType): boolean {
  return MODAL_BY_ID.get(modal)?.dialog === "game";
}

export function doesModalPauseGame(modal: ModalId | ModalType): boolean {
  return MODAL_BY_ID.get(modal)?.pausesGame ?? false;
}

/** False for dev-only modals (Creation) unless developer tools are enabled. */
export function isModalAvailable(modal: ModalId | ModalType): boolean {
  const def = MODAL_BY_ID.get(modal);
  return def !== undefined && (!def.devOnly || isDevToolsEnabled());
}

export function findModalByHotkey(rawKey: string): ModalDefinition | undefined {
  const lower = rawKey.toLowerCase();
  return MODAL_REGISTRY.find(
    (def) =>
      (def.hotkeys.includes(lower) || def.hotkeys.includes(rawKey)) &&
      isModalAvailable(def.id)
  );
}

export function getHeaderModalShortcuts(): readonly ModalDefinition[] {
  return MODAL_REGISTRY.filter(
    (def) => def.headerShortcut !== undefined && isModalAvailable(def.id)
  ).sort(
    (a, b) => (a.headerShortcut?.order ?? 0) - (b.headerShortcut?.order ?? 0)
  );
}

export function getNavigationModalDefinitions(): readonly ModalDefinition[] {
  return [...MODAL_REGISTRY].sort(
    (a, b) => a.navigationTab.order - b.navigationTab.order
  );
}
