import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React, { useState, act } from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { setDevToolsOverride, isDevToolsEnabled } from "@/app/appConfig";
import { GameModalHost } from "../GameModalHost";
import { useAppHotkeys } from "../useAppHotkeys";
import { useModalCoordinator } from "@game-menu/menu/hooks/useModalCoordinator";
import {
  ModalId,
  findModalByHotkey,
  getHeaderModalShortcuts,
} from "@game-menu/modal/modalRegistry";

const HotkeyHarness: React.FC = () => {
  const [isPaused, setPaused] = useState(false);
  const coordinator = useModalCoordinator({
    setPaused,
    togglePause: () => setPaused((p) => !p),
  });

  useAppHotkeys({
    modalManager: coordinator.modalManager,
    onToggleModal: coordinator.toggleModal,
    onCloseModal: coordinator.closeModal,
    onOpenDefaultEscapeModal: coordinator.openLastGameModal,
    onTogglePause: coordinator.togglePause,
  });

  return (
    <IntegrationTestProviders defaultLanguage="pl">
      <div data-testid="active-modal">{coordinator.modalManager.activeModal}</div>
      <GameModalHost
        modalManager={coordinator.modalManager}
        activeSubTabs={coordinator.activeSubTabs}
        onSubTabChange={coordinator.setActiveSubTab}
        onClose={coordinator.closeModal}
        onNavigateModal={coordinator.openModal}
        onResume={coordinator.resumeGame}
        onStartRebind={mock()}
        renderDeveloperSuite={() => <div data-testid="dev-suite-stub">dev</div>}
      />
    </IntegrationTestProviders>
  );
};

const pressKey = async (key: string) => {
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
};

const headerHasCreation = () =>
  getHeaderModalShortcuts().some((def) => def.id === ModalId.Creation);

describe("developer tools flag: disabled (release build)", () => {
  beforeEach(() => setDevToolsOverride(false));
  afterEach(async () => {
    setDevToolsOverride(undefined);
    await cleanupDom();
  });

  it("reports the flag as off", () => {
    expect(isDevToolsEnabled()).toBe(false);
  });

  it("omits the Tworzenie header button", () => {
    expect(headerHasCreation()).toBe(false);
  });

  it("does not resolve the C hotkey to Creation", () => {
    expect(findModalByHotkey("c")).toBeUndefined();
    expect(findModalByHotkey("C")).toBeUndefined();
  });

  it("ignores C and never opens the Creation dialog", async () => {
    const { container, unmount } = await renderIntoDom(<HotkeyHarness />);
    const activeText = () =>
      container.querySelector('[data-testid="active-modal"]')?.textContent;

    await pressKey("c");
    expect(activeText()).toBe(ModalId.None);
    expect(document.body.querySelector('[data-testid="dev-suite-stub"]')).toBeNull();

    await unmount();
  });

  it("renders nothing for a stale Creation modal state", async () => {
    await cleanupDom();
    const { unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <GameModalHost
          modalManager={{ activeModal: ModalId.Creation } as never}
          onClose={mock()}
          onNavigateModal={mock()}
          onResume={mock()}
          onStartRebind={mock()}
          renderDeveloperSuite={() => <div data-testid="dev-suite-stub">dev</div>}
        />
      </IntegrationTestProviders>
    );

    expect(document.body.querySelector('[data-testid="dev-suite-stub"]')).toBeNull();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    await unmount();
  });
});

describe("developer tools flag: enabled (dev build)", () => {
  beforeEach(() => setDevToolsOverride(true));
  afterEach(async () => {
    setDevToolsOverride(undefined);
    await cleanupDom();
  });

  it("reports the flag as on", () => {
    expect(isDevToolsEnabled()).toBe(true);
  });

  it("shows the Tworzenie header button", () => {
    expect(headerHasCreation()).toBe(true);
  });

  it("resolves C to Creation", () => {
    expect(findModalByHotkey("c")?.id).toBe(ModalId.Creation);
  });

  it("C opens the Creation dialog", async () => {
    const { container, unmount } = await renderIntoDom(<HotkeyHarness />);
    const activeText = () =>
      container.querySelector('[data-testid="active-modal"]')?.textContent;

    await pressKey("c");
    expect(activeText()).toBe(ModalId.Creation);
    expect(document.body.querySelector('[data-testid="dev-suite-stub"]')).not.toBeNull();

    await unmount();
  });
});
