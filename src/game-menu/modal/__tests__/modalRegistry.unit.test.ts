import { describe, it, expect } from "bun:test";
import { translations } from "@i18n";
import { SUPPORTED_LANGUAGES } from "@i18n/types";
import { MODAL_REGISTRY, ModalId, findModalByHotkey, GAME_MODAL_WIDTH_CLASS } from "../modalRegistry";
import { MENU_TAB_REGISTRY } from "@game-menu/menu/menuTabRegistry";
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

  it("resolves every menu tab labelKey to a non-key string in PL and EN", () => {
    for (const entry of MENU_TAB_REGISTRY) {
      expectResolvedLabel(entry.labelKey);
    }
  });

  it("resolves every developer tool labelKey to a non-key string in PL and EN", () => {
    for (const entry of DEV_TOOL_REGISTRY) {
      expectResolvedLabel(entry.labelKey);
    }
  });
});

describe("modal hotkeys and sizing", () => {
  it("maps F1 to the Help modal", () => {
    expect(findModalByHotkey("F1")?.id).toBe(ModalId.Help);
  });

  it("keeps H and ? as Help hotkeys", () => {
    expect(findModalByHotkey("h")?.id).toBe(ModalId.Help);
    expect(findModalByHotkey("?")?.id).toBe(ModalId.Help);
  });

  it("uses one shared width class for game modals", () => {
    expect(GAME_MODAL_WIDTH_CLASS).toBe("max-w-5xl");
  });
});
