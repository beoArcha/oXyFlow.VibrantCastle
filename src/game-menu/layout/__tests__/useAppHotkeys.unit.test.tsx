import { describe, it, expect, mock, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import React, { useState, act } from "react";
import { setDevToolsOverride } from "@/app/appConfig";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { useModalCoordinator } from "@game-menu/menu/hooks/useModalCoordinator";
import { ModalId } from "@game-menu/modal/modalRegistry";
import { SettingsTabId } from "@game-menu/menu/menuTabRegistry";
import { useAppHotkeys } from "../useAppHotkeys";
import { GameModalHost } from "../GameModalHost";

beforeAll(() => setDevToolsOverride(true));
afterAll(() => setDevToolsOverride(undefined));

describe("useAppHotkeys navigation", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const HotkeyTestHarness: React.FC<{ initialModal?: ModalId }> = ({
    initialModal = ModalId.None,
  }) => {
    const [isPaused, setPaused] = useState(false);
    const coordinator = useModalCoordinator({
      setPaused,
      togglePause: () => setPaused((prev) => !prev),
    });

    React.useEffect(() => {
      if (initialModal !== ModalId.None) {
        coordinator.openModal(initialModal);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useAppHotkeys({
      modalManager: coordinator.modalManager,
      onToggleModal: coordinator.toggleModal,
      onCloseModal: coordinator.closeModal,
      onOpenDefaultEscapeModal: coordinator.openLastGameModal,
      onTogglePause: coordinator.togglePause,
      onStepL1Tab: coordinator.stepGameTab,
      onStepL2Tab: coordinator.stepSubTab,
    });

    return (
      <IntegrationTestProviders defaultLanguage="pl">
        <div data-testid="active-modal">{coordinator.modalManager.activeModal}</div>
        <div data-testid="active-sub">{coordinator.activeSubTabs[ModalId.Settings]}</div>
        <div data-testid="paused-state">{String(isPaused)}</div>
        <GameModalHost
          modalManager={coordinator.modalManager}
          activeSubTabs={coordinator.activeSubTabs}
          onSubTabChange={coordinator.setActiveSubTab}
          onClose={coordinator.closeModal}
          onNavigateModal={coordinator.openModal}
          onResume={coordinator.resumeGame}
          onStartRebind={mock()}
          renderDeveloperSuite={() => <div data-testid="dev-stub">dev</div>}
        />
      </IntegrationTestProviders>
    );
  };

  const pressKey = async (key: string) => {
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    });
  };

  it("should cycle L1 tabs with wrap on Q and E while the game dialog is open", async () => {
    // Arrange
    const { container, unmount } = await renderIntoDom(<HotkeyTestHarness initialModal={ModalId.Menu} />);
    const activeModalEl = container.querySelector('[data-testid="active-modal"]');

    // Act
    await pressKey("q");
    const afterQ = activeModalEl?.textContent;
    await pressKey("e");
    const afterE = activeModalEl?.textContent;

    // Assert
    expect(afterQ).toBe(ModalId.Help);
    expect(afterE).toBe(ModalId.Menu);

    await unmount();
  });

  it("should cycle L2 tabs with [ and ] on Settings and no-op on tabs without L2", async () => {
    // Arrange
    const { container, unmount } = await renderIntoDom(<HotkeyTestHarness initialModal={ModalId.Menu} />);
    const activeSubEl = container.querySelector('[data-testid="active-sub"]');

    // Act
    await pressKey("]");
    const subOnMenu = activeSubEl?.textContent;

    await pressKey("q"); // Menu -> Help
    await pressKey("q"); // Help -> Settings
    await pressKey("]");
    const afterRightBracket = activeSubEl?.textContent;
    await pressKey("[");
    const afterLeftBracket = activeSubEl?.textContent;

    // Assert
    expect(subOnMenu).toBe(SettingsTabId.Display);
    expect(afterRightBracket).toBe(SettingsTabId.Audio);
    expect(afterLeftBracket).toBe(SettingsTabId.Display);

    await unmount();
  });

  it("should resume game on P while game dialog is open and ignore C", async () => {
    // Arrange
    const { container, unmount } = await renderIntoDom(<HotkeyTestHarness initialModal={ModalId.Menu} />);
    const activeModalEl = container.querySelector('[data-testid="active-modal"]');
    const pausedEl = container.querySelector('[data-testid="paused-state"]');

    // Act
    await pressKey("c");
    const modalAfterC = activeModalEl?.textContent;
    await pressKey("p");
    const modalAfterP = activeModalEl?.textContent;
    const pausedAfterP = pausedEl?.textContent;

    // Assert
    expect(modalAfterC).toBe(ModalId.Menu);
    expect(modalAfterP).toBe(ModalId.None);
    expect(pausedAfterP).toBe("false");

    await unmount();
  });
});
