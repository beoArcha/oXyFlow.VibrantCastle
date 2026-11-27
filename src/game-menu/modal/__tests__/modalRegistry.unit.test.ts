import { describe, it, expect } from "bun:test";
import { translations } from "@i18n";
import { SUPPORTED_LANGUAGES } from "@i18n/types";
import {
  MODAL_REGISTRY,
  ModalId,
  findModalByHotkey,
  getNavigationModalDefinitions,
  GAME_MODAL_WIDTH_CLASS,
} from "../modalRegistry";
import { SETTINGS_TAB_REGISTRY, SettingsTabId } from "@game-menu/menu/menuTabRegistry";
import { DEV_TOOL_REGISTRY } from "@developer/registry/devToolRegistry";

const expectResolvedLabel = (key: string) => {
  for (const lang of SUPPORTED_LANGUAGES) {
    const value = (translations[lang] as unknown as Record<string, string>)[key];
    expect(typeof value).toBe("string");
    expect(value.length).toBeGreaterThan(0);
    expect(value).not.toBe(key);
  }
};

describe("modal, menu and developer registry labels", () => {
  it("resolves every modal labelKey to a non-key string in PL and EN", () => {
    for (const def of MODAL_REGISTRY) {
      expectResolvedLabel(def.navigationTab.labelKey);
      if (def.headerShortcut) expectResolvedLabel(def.headerShortcut.labelKey);
    }
  });

  it("resolves every settings sub-tab labelKey to a non-key string in PL and EN", () => {
    for (const entry of SETTINGS_TAB_REGISTRY) {
      expectResolvedLabel(entry.labelKey);
    }
  });

  it("resolves every developer tool labelKey to a non-key string in PL and EN", () => {
    for (const entry of DEV_TOOL_REGISTRY) {
      expectResolvedLabel(entry.labelKey);
    }
  });

  it("orders game L1 tabs as Gra, Mapa, Postać, Ekwipunek, Magia, Ustawienia, Pomoc", () => {
    const gameDefs = getNavigationModalDefinitions().filter((d) => d.dialog === "game");
    expect(gameDefs.map((d) => d.id)).toEqual([
      ModalId.Menu,
      ModalId.Locations,
      ModalId.Character,
      ModalId.Inventory,
      ModalId.SkillTree,
      ModalId.Settings,
      ModalId.Help,
    ]);

    expect(gameDefs.map((d) => translations.pl[d.navigationTab.labelKey as keyof typeof translations.pl])).toEqual([
      "Gra",
      "Mapa",
      "Postać",
      "Ekwipunek",
      "Magia",
      "Ustawienia",
      "Pomoc",
    ]);

    expect(gameDefs.map((d) => translations.en[d.navigationTab.labelKey as keyof typeof translations.en])).toEqual([
      "Game",
      "Map",
      "Character",
      "Inventory",
      "Magic",
      "Settings",
      "Help",
    ]);
  });

  it("registers the 4 settings L2 tabs in order", () => {
    expect(SETTINGS_TAB_REGISTRY.map((s) => s.id)).toEqual([
      SettingsTabId.Display,
      SettingsTabId.Audio,
      SettingsTabId.Controls,
      SettingsTabId.Interface,
    ]);
    expect(
      SETTINGS_TAB_REGISTRY.map(
        (s) => translations.pl[s.labelKey as keyof typeof translations.pl]
      )
    ).toEqual(["Obraz", "Dźwięk", "Sterowanie", "Interfejs"]);
  });
});

describe("modal hotkeys and sizing", () => {
  it("maps M to ModalId.Menu (Gra) and F1/H/? to Help", () => {
    expect(findModalByHotkey("m")?.id).toBe(ModalId.Menu);
    expect(findModalByHotkey("F1")?.id).toBe(ModalId.Help);
    expect(findModalByHotkey("h")?.id).toBe(ModalId.Help);
    expect(findModalByHotkey("?")?.id).toBe(ModalId.Help);
  });

  it("uses one shared width class for game modals", () => {
    expect(GAME_MODAL_WIDTH_CLASS).toBe("max-w-5xl");
  });
});
