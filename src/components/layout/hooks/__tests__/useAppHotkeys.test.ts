import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { renderCustomHook, setupDomEnvironment, cleanupDom } from "@test-utils";
import { useAppHotkeys, AppHotkeysModalManager } from "../useAppHotkeys";

function createMockModalManager(overrides: Partial<AppHotkeysModalManager> = {}): AppHotkeysModalManager {
  return {
    activeModal: "none",
    isMenuOpen: false,
    isHelpOpen: false,
    isInventoryOpen: false,
    isSkillTreeOpen: false,
    isCreationOpen: false,
    openMenu: mock(() => {}),
    openHelp: mock(() => {}),
    openInventory: mock(() => {}),
    openSkillTree: mock(() => {}),
    openCreation: mock(() => {}),
    closeModal: mock(() => {}),
    ...overrides,
  };
}

describe("useAppHotkeys Hook", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("triggers onOpenHelp on 'h', 'H', '?', and 'F1' when help modal is closed", async () => {
    const onOpenHelp = mock(() => {});
    const onCloseModal = mock(() => {});
    const modalManager = createMockModalManager({ isHelpOpen: false });

    const { unmount } = await renderCustomHook(() =>
      useAppHotkeys({
        modalManager,
        onOpenHelp,
        onOpenMenu: () => {},
        onOpenCreation: () => {},
        onCloseModal,
        onTogglePause: () => {},
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    expect(onOpenHelp).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "H" }));
    expect(onOpenHelp).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    expect(onOpenHelp).toHaveBeenCalledTimes(3);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "F1" }));
    expect(onOpenHelp).toHaveBeenCalledTimes(4);
    expect(onCloseModal).toHaveBeenCalledTimes(0);

    await unmount();
  });

  it("triggers onCloseModal when help modal is already open", async () => {
    const onOpenHelp = mock(() => {});
    const onCloseModal = mock(() => {});
    const modalManager = createMockModalManager({ isHelpOpen: true });

    const { unmount } = await renderCustomHook(() =>
      useAppHotkeys({
        modalManager,
        onOpenHelp,
        onOpenMenu: () => {},
        onOpenCreation: () => {},
        onCloseModal,
        onTogglePause: () => {},
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    expect(onCloseModal).toHaveBeenCalledTimes(1);
    expect(onOpenHelp).toHaveBeenCalledTimes(0);

    await unmount();
  });

  it("handles Menu hotkey 'm' / 'M'", async () => {
    const onOpenMenu = mock(() => {});
    const onCloseModal = mock(() => {});
    const modalManager = createMockModalManager({ isMenuOpen: false });

    const { unmount } = await renderCustomHook(() =>
      useAppHotkeys({
        modalManager,
        onOpenHelp: () => {},
        onOpenMenu,
        onOpenCreation: () => {},
        onCloseModal,
        onTogglePause: () => {},
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }));
    expect(onOpenMenu).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("handles Creation hotkey 'c' / 'C'", async () => {
    const onOpenCreation = mock(() => {});
    const onCloseModal = mock(() => {});
    const modalManager = createMockModalManager({ isCreationOpen: false });

    const { unmount } = await renderCustomHook(() =>
      useAppHotkeys({
        modalManager,
        onOpenHelp: () => {},
        onOpenMenu: () => {},
        onOpenCreation,
        onCloseModal,
        onTogglePause: () => {},
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "c" }));
    expect(onOpenCreation).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("handles Pause toggle hotkey 'p' / 'P'", async () => {
    const onTogglePause = mock(() => {});
    const modalManager = createMockModalManager();

    const { unmount } = await renderCustomHook(() =>
      useAppHotkeys({
        modalManager,
        onOpenHelp: () => {},
        onOpenMenu: () => {},
        onOpenCreation: () => {},
        onCloseModal: () => {},
        onTogglePause,
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
    expect(onTogglePause).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "P" }));
    expect(onTogglePause).toHaveBeenCalledTimes(2);

    await unmount();
  });

  it("handles Inventory hotkey 'i' / 'I' via modalManager methods", async () => {
    const modalManager = createMockModalManager({ isInventoryOpen: false });

    const { unmount } = await renderCustomHook(() =>
      useAppHotkeys({
        modalManager,
        onOpenHelp: () => {},
        onOpenMenu: () => {},
        onOpenCreation: () => {},
        onCloseModal: () => {},
        onTogglePause: () => {},
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "i" }));
    expect(modalManager.openInventory).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("handles Skill Tree hotkey 'k' / 'K' via modalManager methods", async () => {
    const modalManager = createMockModalManager({ isSkillTreeOpen: false });

    const { unmount } = await renderCustomHook(() =>
      useAppHotkeys({
        modalManager,
        onOpenHelp: () => {},
        onOpenMenu: () => {},
        onOpenCreation: () => {},
        onCloseModal: () => {},
        onTogglePause: () => {},
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(modalManager.openSkillTree).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("handles Escape key: closes active modal and cancels rebind if open", async () => {
    const onCloseModal = mock(() => {});
    const onCancelRebind = mock(() => {});
    const onOpenMenu = mock(() => {});
    const modalManager = createMockModalManager({ activeModal: "inventory" });

    const { unmount } = await renderCustomHook(() =>
      useAppHotkeys({
        modalManager,
        onOpenHelp: () => {},
        onOpenMenu,
        onOpenCreation: () => {},
        onCloseModal,
        onTogglePause: () => {},
        onCancelRebind,
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onCloseModal).toHaveBeenCalledTimes(1);
    expect(onCancelRebind).toHaveBeenCalledTimes(1);
    expect(onOpenMenu).toHaveBeenCalledTimes(0);

    await unmount();
  });

  it("handles Escape key: opens menu when no modal is open", async () => {
    const onOpenMenu = mock(() => {});
    const modalManager = createMockModalManager({ activeModal: "none" });

    const { unmount } = await renderCustomHook(() =>
      useAppHotkeys({
        modalManager,
        onOpenHelp: () => {},
        onOpenMenu,
        onOpenCreation: () => {},
        onCloseModal: () => {},
        onTogglePause: () => {},
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onOpenMenu).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("ignores key events when typing inside an input or textarea element", async () => {
    const onOpenHelp = mock(() => {});
    const modalManager = createMockModalManager();

    const { unmount } = await renderCustomHook(() =>
      useAppHotkeys({
        modalManager,
        onOpenHelp,
        onOpenMenu: () => {},
        onOpenCreation: () => {},
        onCloseModal: () => {},
        onTogglePause: () => {},
      })
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "h", bubbles: true }));

    expect(onOpenHelp).toHaveBeenCalledTimes(0);
    document.body.removeChild(input);

    await unmount();
  });

  it("ignores hotkeys completely when isRebinding is true", async () => {
    const onOpenHelp = mock(() => {});
    const modalManager = createMockModalManager();

    const { unmount } = await renderCustomHook(() =>
      useAppHotkeys({
        modalManager,
        onOpenHelp,
        onOpenMenu: () => {},
        onOpenCreation: () => {},
        onCloseModal: () => {},
        onTogglePause: () => {},
        isRebinding: true,
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    expect(onOpenHelp).toHaveBeenCalledTimes(0);

    await unmount();
  });
});
