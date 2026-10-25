import { describe, it, expect, afterEach } from "bun:test";
import { act } from "react";
import { useModalManager } from "../useModalManager";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";

describe("useModalManager Hook", () => {
  afterEach(async () => {
    await cleanupDom();
  });

  it("initializes with no active modal and all flags false", async () => {
    const { result, unmount } = await renderCustomHook(() => useModalManager());

    expect(result.current.activeModal).toBe("none");
    expect(result.current.isMenuOpen).toBe(false);
    expect(result.current.isHelpOpen).toBe(false);
    expect(result.current.isInventoryOpen).toBe(false);
    expect(result.current.isSkillTreeOpen).toBe(false);
    expect(result.current.isCreationOpen).toBe(false);

    await unmount();
  });

  it("opens menu modal and updates corresponding flag", async () => {
    const { result, unmount } = await renderCustomHook(() => useModalManager());

    await act(async () => {
      result.current.openMenu();
    });

    expect(result.current.activeModal).toBe("menu");
    expect(result.current.isMenuOpen).toBe(true);
    expect(result.current.isHelpOpen).toBe(false);

    await unmount();
  });

  it("ensures mutual exclusion between modals", async () => {
    const { result, unmount } = await renderCustomHook(() => useModalManager());

    await act(async () => {
      result.current.openMenu();
    });
    expect(result.current.isMenuOpen).toBe(true);

    await act(async () => {
      result.current.openInventory();
    });
    expect(result.current.isMenuOpen).toBe(false);
    expect(result.current.isInventoryOpen).toBe(true);
    expect(result.current.activeModal).toBe("inventory");

    await act(async () => {
      result.current.openSkillTree();
    });
    expect(result.current.isInventoryOpen).toBe(false);
    expect(result.current.isSkillTreeOpen).toBe(true);
    expect(result.current.activeModal).toBe("skillTree");

    await act(async () => {
      result.current.openHelp();
    });
    expect(result.current.isSkillTreeOpen).toBe(false);
    expect(result.current.isHelpOpen).toBe(true);
    expect(result.current.activeModal).toBe("help");

    await act(async () => {
      result.current.openCreation();
    });
    expect(result.current.isHelpOpen).toBe(false);
    expect(result.current.isCreationOpen).toBe(true);
    expect(result.current.activeModal).toBe("creation");

    await unmount();
  });

  it("resets active modal to none when closeModal is called", async () => {
    const { result, unmount } = await renderCustomHook(() => useModalManager());

    await act(async () => {
      result.current.openMenu();
    });
    expect(result.current.activeModal).toBe("menu");

    await act(async () => {
      result.current.closeModal();
    });

    expect(result.current.activeModal).toBe("none");
    expect(result.current.isMenuOpen).toBe(false);

    await unmount();
  });
});
