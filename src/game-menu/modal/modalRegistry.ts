/**
 * Typed Open/Closed Modal Registry.
 * Adding a new modal overlay requires adding one entry here — pause behavior,
 * global hotkeys, header shortcut hints, and navigation tabs update automatically.
 */

export enum ModalId {
  None = "none",
  Menu = "menu",
  Help = "help",
  Inventory = "inventory",
  SkillTree = "skillTree",
  Creation = "creation",
}

export type OpenModalId = Exclude<ModalId, ModalId.None>;
export type ModalType = `${OpenModalId}`;

export type ModalIconKey =
  | "menu"
  | "help"
  | "inventory"
  | "skillTree"
  | "creation";

export interface ModalHeaderShortcutConfig {
  readonly hotkeyLabel: string;
  readonly labelKey: string;
  readonly iconKey: ModalIconKey;
  readonly order: number;
}

export interface ModalNavigationTabConfig {
  readonly labelKey: string;
  readonly keyLabel: string;
  readonly iconKey: ModalIconKey;
  readonly order: number;
}

export interface ModalDefinition {
  readonly id: OpenModalId;
  readonly pausesGame: boolean;
  readonly hotkeys: readonly string[];
  readonly navigationTab: ModalNavigationTabConfig;
  readonly headerShortcut?: ModalHeaderShortcutConfig;
}

export const MODAL_REGISTRY: readonly ModalDefinition[] = [
  {
    id: ModalId.Menu,
    pausesGame: true,
    hotkeys: ["m"],
    navigationTab: {
      labelKey: "menu",
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
    id: ModalId.Help,
    pausesGame: true,
    hotkeys: ["h", "?"],
    navigationTab: {
      labelKey: "hints",
      keyLabel: "H",
      iconKey: "help",
      order: 2,
    },
    headerShortcut: {
      hotkeyLabel: "H",
      labelKey: "hints",
      iconKey: "help",
      order: 4,
    },
  },
  {
    id: ModalId.Inventory,
    pausesGame: false,
    hotkeys: ["i"],
    navigationTab: {
      labelKey: "inventoryBtn",
      keyLabel: "I",
      iconKey: "inventory",
      order: 3,
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
    pausesGame: false,
    hotkeys: ["k"],
    navigationTab: {
      labelKey: "skillTreeBtn",
      keyLabel: "K",
      iconKey: "skillTree",
      order: 4,
    },
    headerShortcut: {
      hotkeyLabel: "K",
      labelKey: "skillTreeBtn",
      iconKey: "skillTree",
      order: 2,
    },
  },
  {
    id: ModalId.Creation,
    pausesGame: true,
    hotkeys: ["c"],
    navigationTab: {
      labelKey: "tabCreation",
      keyLabel: "C",
      iconKey: "creation",
      order: 5,
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

export function doesModalPauseGame(modal: ModalId | ModalType): boolean {
  return MODAL_BY_ID.get(modal)?.pausesGame ?? false;
}

export function findModalByHotkey(rawKey: string): ModalDefinition | undefined {
  const lower = rawKey.toLowerCase();
  return MODAL_REGISTRY.find(
    (def) => def.hotkeys.includes(lower) || def.hotkeys.includes(rawKey)
  );
}

export function getHeaderModalShortcuts(): readonly ModalDefinition[] {
  return MODAL_REGISTRY.filter((def) => def.headerShortcut !== undefined).sort(
    (a, b) => (a.headerShortcut?.order ?? 0) - (b.headerShortcut?.order ?? 0)
  );
}

export function getNavigationModalDefinitions(): readonly ModalDefinition[] {
  return [...MODAL_REGISTRY].sort(
    (a, b) => a.navigationTab.order - b.navigationTab.order
  );
}
