import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React, { useState, act } from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { ConfirmDialog } from "@ui";
import { GameMenuDialog } from "@game-menu/layout/GameMenuDialog";
import { useModalCoordinator } from "@game-menu/menu/hooks/useModalCoordinator";
import { ModalId } from "@game-menu/modal/modalRegistry";
import { SettingsTabId } from "@game-menu/menu/menuTabRegistry";
import {
  useMenuGamepad,
  MENU_CONTEXT_ACTION_EVENT,
  type UseMenuGamepadOptions,
} from "../useMenuGamepad";

interface MockPadConfig {
  buttons?: Record<number, boolean | { pressed: boolean; value: number }>;
  axes?: number[];
  buttonCount?: number;
  connected?: boolean;
}

function createMockGamepad(cfg: MockPadConfig = {}): Gamepad {
  const count = cfg.buttonCount ?? 16;
  const buttons = Array.from({ length: count }, (_, idx) => {
    const entry = cfg.buttons?.[idx];
    if (typeof entry === "boolean") {
      return { pressed: entry, touched: entry, value: entry ? 1 : 0 };
    }
    if (entry) {
      return { pressed: entry.pressed, touched: entry.pressed, value: entry.value };
    }
    return { pressed: false, touched: false, value: 0 };
  });

  return {
    id: "Mock Standard Gamepad",
    index: 0,
    connected: cfg.connected ?? true,
    mapping: "standard",
    timestamp: 0,
    axes: cfg.axes ?? [0, 0, 0, 0],
    buttons,
    hapticActuators: [],
    vibrationActuator: null,
  } as unknown as Gamepad;
}

describe("useMenuGamepad", () => {
  let originalGetGamepads: typeof navigator.getGamepads | undefined;
  let originalRaf: typeof globalThis.requestAnimationFrame;
  let originalCancelRaf: typeof globalThis.cancelAnimationFrame;
  let originalSetInterval: typeof globalThis.setInterval;
  let originalClearInterval: typeof globalThis.clearInterval;

  let currentPads: (Gamepad | null)[] = [];
  let rafQueue: Array<{ id: number; cb: FrameRequestCallback }> = [];
  let intervalQueue: Array<{ id: number; cb: () => void }> = [];
  let nextHandleId = 1;
  let fakeNowMs = 1000;

  const flushRaf = async (atMs?: number) => {
    if (atMs !== undefined) fakeNowMs = atMs;
    const pending = [...rafQueue];
    rafQueue = [];
    await act(async () => {
      for (const item of pending) {
        item.cb(fakeNowMs);
      }
    });
  };

  const flushIntervals = async (atMs?: number) => {
    if (atMs !== undefined) fakeNowMs = atMs;
    const pending = [...intervalQueue];
    await act(async () => {
      for (const item of pending) {
        item.cb();
      }
    });
  };

  beforeEach(async () => {
    await cleanupDom();
    currentPads = [];
    rafQueue = [];
    intervalQueue = [];
    nextHandleId = 1;
    fakeNowMs = 1000;

    originalGetGamepads = navigator.getGamepads;
    originalRaf = globalThis.requestAnimationFrame;
    originalCancelRaf = globalThis.cancelAnimationFrame;
    originalSetInterval = globalThis.setInterval;
    originalClearInterval = globalThis.clearInterval;

    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => currentPads,
    });

    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      const id = nextHandleId++;
      rafQueue.push({ id, cb });
      return id;
    }) as typeof requestAnimationFrame;

    globalThis.cancelAnimationFrame = ((id: number) => {
      rafQueue = rafQueue.filter((item) => item.id !== id);
    }) as typeof cancelAnimationFrame;

    globalThis.setInterval = ((cb: TimerHandler) => {
      const id = nextHandleId++;
      if (typeof cb === "function") {
        intervalQueue.push({ id, cb: cb as () => void });
      }
      return id as unknown as ReturnType<typeof setInterval>;
    }) as unknown as typeof setInterval;

    globalThis.clearInterval = ((id: ReturnType<typeof setInterval>) => {
      const numericId = Number(id);
      intervalQueue = intervalQueue.filter((item) => item.id !== numericId);
    }) as unknown as typeof clearInterval;
  });

  afterEach(async () => {
    await cleanupDom();
    if (originalGetGamepads) {
      Object.defineProperty(navigator, "getGamepads", {
        configurable: true,
        value: originalGetGamepads,
      });
    }
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCancelRaf;
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
  });

  const MenuGamepadHarness: React.FC<{
    initialModal?: ModalId;
    initialConfirmOpen?: boolean;
    isRebinding?: boolean;
    onCancelRebind?: () => void;
    onContextAction?: (target: HTMLElement | null) => void;
  }> = ({
    initialModal = ModalId.Menu,
    initialConfirmOpen = false,
    isRebinding = false,
    onCancelRebind,
    onContextAction,
  }) => {
    const [, setPaused] = useState(false);
    const [showLegend, setShowLegend] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(initialConfirmOpen);
    const coordinator = useModalCoordinator({
      setPaused,
      togglePause: () => setPaused((p) => !p),
    });

    React.useEffect(() => {
      if (initialModal !== ModalId.None) {
        coordinator.openModal(initialModal);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isGameOpen = coordinator.modalManager.activeModal !== ModalId.None;

    useMenuGamepad({
      isGameDialogOpen: isGameOpen,
      isAnyDialogOpen: coordinator.modalManager.isAnyModalOpen,
      isRebinding,
      onOpenGameDialog: coordinator.openLastGameModal,
      onClose: coordinator.closeModal,
      onStepL1Tab: coordinator.stepGameTab,
      onStepL2Tab: coordinator.stepSubTab,
      onToggleLegend: () => setShowLegend((prev) => !prev),
      onContextAction,
      onCancelRebind,
      now: () => fakeNowMs,
    });

    return (
      <IntegrationTestProviders defaultLanguage="pl">
        <div data-testid="active-modal">{coordinator.modalManager.activeModal}</div>
        <div data-testid="active-settings-sub">{coordinator.activeSubTabs[ModalId.Settings]}</div>
        <div data-testid="confirm-open">{String(confirmOpen)}</div>
        <GameMenuDialog
          isOpen={isGameOpen}
          activeModal={coordinator.modalManager.activeModal}
          activeSubTabs={coordinator.activeSubTabs}
          onSubTabChange={coordinator.setActiveSubTab}
          onClose={coordinator.closeModal}
          onNavigateModal={coordinator.openModal}
          onResume={coordinator.resumeGame}
          onStartRebind={mock()}
          showLegend={showLegend}
        />
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
          title="Confirm"
          message="Are you sure?"
        />
      </IntegrationTestProviders>
    );
  };

  it("should cycle L1 tabs forward and wrap around on RB and backward on LB", async () => {
    // Arrange
    const { container, unmount } = await renderIntoDom(<MenuGamepadHarness initialModal={ModalId.Help} />);
    const activeModalEl = container.querySelector('[data-testid="active-modal"]');

    // Act
    currentPads = [createMockGamepad({ buttons: { 5: true } })];
    await flushRaf(1050);
    const afterRbWrap = activeModalEl?.textContent;

    currentPads = [createMockGamepad({ buttons: { 5: false } })];
    await flushRaf(1100);
    currentPads = [createMockGamepad({ buttons: { 4: true } })];
    await flushRaf(1150);
    const afterLbWrap = activeModalEl?.textContent;

    // Assert
    expect(afterRbWrap).toBe(ModalId.Menu);
    expect(afterLbWrap).toBe(ModalId.Help);

    await unmount();
  });

  it("should cycle L2 tabs on Settings via LT/RT and no-op on tabs without L2", async () => {
    // Arrange
    const { container, unmount } = await renderIntoDom(<MenuGamepadHarness initialModal={ModalId.Menu} />);
    const subEl = container.querySelector('[data-testid="active-settings-sub"]');

    // Act
    currentPads = [createMockGamepad({ buttons: { 7: true } })];
    await flushRaf(1050);
    const subOnMenu = subEl?.textContent;

    currentPads = [createMockGamepad({ buttons: { 5: true } })]; // Move off Menu, release RT
    await flushRaf(1100);
    for (let i = 0; i < 4; i++) {
      currentPads = [createMockGamepad()];
      await flushRaf(1120 + i * 20);
      currentPads = [createMockGamepad({ buttons: { 5: true } })];
      await flushRaf(1130 + i * 20);
    }
    currentPads = [createMockGamepad()];
    await flushRaf(1250);
    currentPads = [createMockGamepad({ buttons: { 7: true } })];
    await flushRaf(1300);
    const afterRtOnSettings = subEl?.textContent;

    currentPads = [createMockGamepad()];
    await flushRaf(1350);
    currentPads = [createMockGamepad({ buttons: { 6: true } })];
    await flushRaf(1400);
    const afterLtOnSettings = subEl?.textContent;

    // Assert
    expect(subOnMenu).toBe(SettingsTabId.Display);
    expect(afterRtOnSettings).toBe(SettingsTabId.Audio);
    expect(afterLtOnSettings).toBe(SettingsTabId.Display);

    await unmount();
  });

  it("should close ConfirmDialog before closing the main game dialog when B is pressed", async () => {
    // Arrange
    const { container, unmount } = await renderIntoDom(
      <MenuGamepadHarness initialModal={ModalId.Menu} initialConfirmOpen={true} />
    );
    const activeModalEl = container.querySelector('[data-testid="active-modal"]');
    const confirmEl = container.querySelector('[data-testid="confirm-open"]');

    // Act
    currentPads = [createMockGamepad({ buttons: { 1: true } })];
    await flushRaf(1050);
    const modalAfterFirstB = activeModalEl?.textContent;
    const confirmAfterFirstB = confirmEl?.textContent;

    currentPads = [createMockGamepad({ buttons: { 1: false } })];
    await flushRaf(1100);
    currentPads = [createMockGamepad({ buttons: { 1: true } })];
    await flushRaf(1150);
    const modalAfterSecondB = activeModalEl?.textContent;

    // Assert
    expect(confirmAfterFirstB).toBe("false");
    expect(modalAfterFirstB).toBe(ModalId.Menu);
    expect(modalAfterSecondB).toBe(ModalId.None);

    await unmount();
  });

  it("should activate the currently focused element when A is pressed", async () => {
    // Arrange
    const { unmount } = await renderIntoDom(<MenuGamepadHarness initialModal={ModalId.Menu} />);
    const inventoryTab = document.body.querySelector("#tab-inventory") as HTMLButtonElement;
    const clickSpy = mock();
    inventoryTab.addEventListener("click", clickSpy);
    inventoryTab.focus();

    // Act
    currentPads = [createMockGamepad({ buttons: { 0: true } })];
    await flushRaf(1050);

    // Assert
    expect(clickSpy).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("should enforce 400 ms repeat delay and 120 ms repeat interval for held navigation", async () => {
    // Arrange
    const stepL1 = mock();
    const HookOnlyHarness: React.FC<Partial<UseMenuGamepadOptions>> = () => {
      useMenuGamepad({
        isGameDialogOpen: true,
        onOpenGameDialog: mock(),
        onClose: mock(),
        onStepL1Tab: stepL1,
        onStepL2Tab: mock(),
        now: () => fakeNowMs,
      });
      return null;
    };
    const { unmount } = await renderIntoDom(<HookOnlyHarness />);

    // Act
    currentPads = [createMockGamepad({ buttons: { 5: true } })];
    await flushRaf(1000); // Initial edge
    await flushRaf(1350); // Before 400ms delay -> no repeat
    await flushRaf(1400); // At 400ms delay -> 1st repeat
    await flushRaf(1480); // Before 120ms interval -> no repeat
    await flushRaf(1520); // At 120ms interval -> 2nd repeat

    // Assert
    expect(stepL1).toHaveBeenCalledTimes(3);

    await unmount();
  });

  it("should not schedule requestAnimationFrame navigation polling while dialog is closed", async () => {
    // Arrange
    const stepL1 = mock();
    const onClose = mock();
    const ClosedHarness: React.FC = () => {
      useMenuGamepad({
        isGameDialogOpen: false,
        isAnyDialogOpen: false,
        onOpenGameDialog: mock(),
        onClose,
        onStepL1Tab: stepL1,
        onStepL2Tab: mock(),
        now: () => fakeNowMs,
      });
      return null;
    };
    const { unmount } = await renderIntoDom(<ClosedHarness />);

    // Act
    currentPads = [createMockGamepad({ buttons: { 0: true, 1: true, 5: true, 13: true } })];
    await flushIntervals(1100);

    // Assert
    expect(rafQueue).toHaveLength(0);
    expect(stepL1).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    await unmount();
  });

  it("should open the game dialog when LB+RB is held for 0.5 s and ignore shorter presses", async () => {
    // Arrange
    const { container, unmount } = await renderIntoDom(<MenuGamepadHarness initialModal={ModalId.None} />);
    const activeModalEl = container.querySelector('[data-testid="active-modal"]');

    // Act
    currentPads = [createMockGamepad({ buttonCount: 8, buttons: { 4: true, 5: true } })];
    await flushIntervals(1000); // Chord starts
    await flushIntervals(1350); // 350ms -> still closed
    const modalAt350Ms = activeModalEl?.textContent;

    currentPads = [createMockGamepad({ buttonCount: 8, buttons: { 4: false, 5: false } })];
    await flushIntervals(1400); // Released early -> reset

    currentPads = [createMockGamepad({ buttonCount: 8, buttons: { 4: true, 5: true } })];
    await flushIntervals(1500); // New hold starts
    await flushIntervals(2000); // 500ms elapsed -> opens
    const modalAt500Ms = activeModalEl?.textContent;

    // Assert
    expect(modalAt350Ms).toBe(ModalId.None);
    expect(modalAt500Ms).toBe(ModalId.Menu);

    await unmount();
  });

  it("should toggle legend footer on Y and dispatch context event on X", async () => {
    // Arrange
    const onContextAction = mock();
    const { unmount } = await renderIntoDom(
      <MenuGamepadHarness initialModal={ModalId.Menu} onContextAction={onContextAction} />
    );
    const contextListener = mock();
    document.body.addEventListener(MENU_CONTEXT_ACTION_EVENT, contextListener);

    // Act
    currentPads = [createMockGamepad({ buttons: { 2: true, 3: true } })];
    await flushRaf(1050);

    // Assert
    expect(document.body.querySelector('[data-testid="menu-legend-footer"]')).toBeNull();
    expect(contextListener).toHaveBeenCalledTimes(1);
    expect(onContextAction).toHaveBeenCalledTimes(1);

    document.body.removeEventListener(MENU_CONTEXT_ACTION_EVENT, contextListener);
    await unmount();
  });

  it("should move focus on D-pad down and dispatch ArrowRight on left stick right", async () => {
    // Arrange
    const { unmount } = await renderIntoDom(<MenuGamepadHarness initialModal={ModalId.Menu} />);
    const initialFocused = document.activeElement;
    const arrowListener = mock();
    document.body.addEventListener("keydown", arrowListener);

    // Act
    currentPads = [createMockGamepad({ buttons: { 13: true } })];
    await flushRaf(1050);
    const afterDownFocused = document.activeElement;

    currentPads = [createMockGamepad({ axes: [0.8, 0] })];
    await flushRaf(1100);

    // Assert
    expect(afterDownFocused).not.toBe(initialFocused);
    expect(arrowListener).toHaveBeenCalled();

    document.body.removeEventListener("keydown", arrowListener);
    await unmount();
  });

  it("should open and close the game dialog when Start (9) is pressed", async () => {
    // Arrange
    const { container, unmount } = await renderIntoDom(<MenuGamepadHarness initialModal={ModalId.None} />);
    const activeModalEl = container.querySelector('[data-testid="active-modal"]');

    // Act
    currentPads = [createMockGamepad({ buttons: { 9: true } })];
    await flushIntervals(1050);
    const afterStartOpen = activeModalEl?.textContent;

    currentPads = [createMockGamepad({ buttons: { 9: false } })];
    await flushRaf(1100);
    currentPads = [createMockGamepad({ buttons: { 9: true } })];
    await flushRaf(1150);
    const afterStartClose = activeModalEl?.textContent;

    // Assert
    expect(afterStartOpen).toBe(ModalId.Menu);
    expect(afterStartClose).toBe(ModalId.None);

    await unmount();
  });
});
