import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { renderCustomHook, setupDomEnvironment, cleanupDom } from "@test-utils";
import { useAppHotkeys, type UseAppHotkeysOptions } from "../useAppHotkeys";
import { ModalId } from "@game-menu/modal/modalRegistry";
import type { ModalManager } from "@game-menu/menu/hooks/useModalManager";

interface HotkeySpies {
  readonly onToggleModal: ReturnType<typeof mock>;
  readonly onCloseModal: ReturnType<typeof mock>;
  readonly onOpenDefaultEscapeModal: ReturnType<typeof mock>;
  readonly onTogglePause: ReturnType<typeof mock>;
}

function createSpies(): HotkeySpies {
  return {
    onToggleModal: mock(() => {}),
    onCloseModal: mock(() => {}),
    onOpenDefaultEscapeModal: mock(() => {}),
    onTogglePause: mock(() => {}),
  };
}

function createModalManager(activeModal: ModalId = ModalId.None): ModalManager {
  return { activeModal } as unknown as ModalManager;
}

async function mountHotkeys(
  spies: HotkeySpies,
  overrides: Partial<UseAppHotkeysOptions> = {},
  activeModal: ModalId = ModalId.None
) {
  return renderCustomHook(() =>
    useAppHotkeys({
      modalManager: createModalManager(activeModal),
      onToggleModal: spies.onToggleModal,
      onCloseModal: spies.onCloseModal,
      onOpenDefaultEscapeModal: spies.onOpenDefaultEscapeModal,
      onTogglePause: spies.onTogglePause,
      ...overrides,
    })
  );
}

function press(key: string, init: KeyboardEventInit = {}): void {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, ...init }));
}

describe("useAppHotkeys bindings", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("toggles the Help modal on 'h', 'H', '?' and 'F1'", async () => {
    const spies = createSpies();
    const { unmount } = await mountHotkeys(spies);

    press("h");
    press("H");
    press("?");
    press("F1");

    expect(spies.onToggleModal).toHaveBeenCalledTimes(4);
    for (const call of spies.onToggleModal.mock.calls) {
      expect(call[0]).toBe(ModalId.Help);
    }

    await unmount();
  });

  it("toggles the Menu, Inventory and SkillTree modals on 'm', 'i' and 'k'", async () => {
    const spies = createSpies();
    const { unmount } = await mountHotkeys(spies);

    press("M");
    press("i");
    press("K");

    expect(spies.onToggleModal.mock.calls.map((c) => c[0])).toEqual([
      ModalId.Menu,
      ModalId.Inventory,
      ModalId.SkillTree,
    ]);

    await unmount();
  });

  it("closes the active modal on Escape", async () => {
    const spies = createSpies();
    const { unmount } = await mountHotkeys(spies, {}, ModalId.Inventory);

    press("Escape");

    expect(spies.onCloseModal).toHaveBeenCalledTimes(1);
    expect(spies.onOpenDefaultEscapeModal).not.toHaveBeenCalled();

    await unmount();
  });

  it("opens the default escape modal on Escape when no modal is open", async () => {
    const spies = createSpies();
    const { unmount } = await mountHotkeys(spies, {}, ModalId.None);

    press("Escape");

    expect(spies.onOpenDefaultEscapeModal).toHaveBeenCalledTimes(1);
    expect(spies.onCloseModal).not.toHaveBeenCalled();

    await unmount();
  });

  it("ignores key events typed inside an input or textarea", async () => {
    const spies = createSpies();
    const { unmount } = await mountHotkeys(spies);

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "h", bubbles: true }));

    expect(spies.onToggleModal).not.toHaveBeenCalled();
    document.body.removeChild(input);

    await unmount();
  });

  it("ignores key events targeting a contentEditable element", async () => {
    const spies = createSpies();
    const { unmount } = await mountHotkeys(spies);

    const editable = document.createElement("div");
    editable.contentEditable = "true";
    document.body.appendChild(editable);
    editable.dispatchEvent(new KeyboardEvent("keydown", { key: "h", bubbles: true }));

    expect(spies.onToggleModal).not.toHaveBeenCalled();
    document.body.removeChild(editable);

    await unmount();
  });

  it("ignores all hotkeys while a key is being rebound", async () => {
    const spies = createSpies();
    const { unmount } = await mountHotkeys(spies, { isRebinding: true });

    press("h");
    press("m");
    press("Escape");

    expect(spies.onToggleModal).not.toHaveBeenCalled();
    expect(spies.onOpenDefaultEscapeModal).not.toHaveBeenCalled();
    expect(spies.onCloseModal).not.toHaveBeenCalled();

    await unmount();
  });

  it("ignores hotkeys pressed with Ctrl, Meta or Alt so browser shortcuts keep working", async () => {
    const spies = createSpies();
    const { unmount } = await mountHotkeys(spies);

    press("c", { ctrlKey: true });
    press("c", { metaKey: true });
    press("p", { ctrlKey: true });
    press("h", { altKey: true });

    expect(spies.onToggleModal).not.toHaveBeenCalled();
    expect(spies.onTogglePause).not.toHaveBeenCalled();

    await unmount();
  });

  it("removes the keydown listener on unmount", async () => {
    const spies = createSpies();
    const { unmount } = await mountHotkeys(spies);

    await unmount();
    press("h");

    expect(spies.onToggleModal).not.toHaveBeenCalled();
  });
});
