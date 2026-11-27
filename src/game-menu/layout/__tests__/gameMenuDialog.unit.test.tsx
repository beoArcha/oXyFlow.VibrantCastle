import { describe, it, expect, mock, beforeAll, afterAll } from "bun:test";
import { setDevToolsOverride } from "@/app/appConfig";
import React, { useState, act } from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { GameModalHost } from "../GameModalHost";
import { useAppHotkeys } from "../useAppHotkeys";
import { useModalCoordinator } from "@game-menu/menu/hooks/useModalCoordinator";
import { ModalId, GAME_MODAL_WIDTH_CLASS, type OpenModalId } from "@game-menu/modal/modalRegistry";
import { SettingsTabId } from "@game-menu/menu/menuTabRegistry";
import { BINDABLE_ACTION_CATALOG } from "@game-menu/modal/views/ControlsMenuTab";
import { translations } from "@i18n";
import type { ModalManager } from "@game-menu/menu/hooks/useModalManager";

beforeAll(() => setDevToolsOverride(true));
afterAll(() => setDevToolsOverride(undefined));

const ControlledHostHarness: React.FC<{
  initialModal?: ModalId;
  onResume?: () => void;
}> = ({ initialModal = ModalId.Menu, onResume = mock() }) => {
  const [activeModal, setActiveModal] = useState<ModalId>(initialModal);
  const modalManager = {
    activeModal,
    isAnyModalOpen: activeModal !== ModalId.None,
  } as unknown as ModalManager;

  return (
    <IntegrationTestProviders defaultLanguage="pl">
      <GameModalHost
        modalManager={modalManager}
        onClose={() => setActiveModal(ModalId.None)}
        onNavigateModal={(next) => setActiveModal(next as ModalId)}
        onResume={onResume}
        onStartRebind={mock()}
        renderDeveloperSuite={() => <div data-testid="dev-suite-stub">dev</div>}
      />
    </IntegrationTestProviders>
  );
};

const EscapeMemoryHarness: React.FC = () => {
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
      <div data-testid="paused-state">{String(isPaused)}</div>
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

const ALL_GAME_MODALS: readonly OpenModalId[] = [
  ModalId.Menu,
  ModalId.Locations,
  ModalId.Character,
  ModalId.Inventory,
  ModalId.SkillTree,
  ModalId.Settings,
  ModalId.Help,
];

describe("GameMenuDialog single shell", () => {
  it("keeps the exact same dialog DOM node when switching Menu -> Inventory -> SkillTree", async () => {
    await cleanupDom();
    const { click, unmount } = await renderIntoDom(<ControlledHostHarness />);

    const dialogAtMenu = document.body.querySelector('[role="dialog"]');
    expect(dialogAtMenu).not.toBeNull();

    const inventoryTab = document.body.querySelector("#tab-inventory") as HTMLButtonElement;
    expect(inventoryTab).not.toBeNull();
    await click(inventoryTab);

    const dialogAtInventory = document.body.querySelector('[role="dialog"]');
    expect(dialogAtInventory).toBe(dialogAtMenu);
    expect(document.body.textContent).toMatch(/Ekwipunek|Inventory/);

    const skillTreeTab = document.body.querySelector("#tab-skillTree") as HTMLButtonElement;
    expect(skillTreeTab).not.toBeNull();
    await click(skillTreeTab);

    const dialogAtSkillTree = document.body.querySelector('[role="dialog"]');
    expect(dialogAtSkillTree).toBe(dialogAtMenu);
    expect(document.body.querySelectorAll('[id^="skill-node-"]').length).toBeGreaterThan(0);

    await unmount();
  });

  it("renders Wznów [P] in the dialog header (outside any tablist) alongside the close button", async () => {
    await cleanupDom();
    const onResume = mock();
    const { click, unmount } = await renderIntoDom(
      <ControlledHostHarness onResume={onResume} />
    );

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    const resumeBtn = dialog.querySelector("button[title*='[P]']") as HTMLButtonElement;
    expect(resumeBtn).not.toBeNull();
    expect(resumeBtn.textContent).toMatch(/Wznów/);
    expect(resumeBtn.closest('[role="tablist"]')).toBeNull();

    const closeBtn = dialog.querySelector("button[aria-label='Close modal']");
    expect(closeBtn).not.toBeNull();
    expect(resumeBtn.parentElement).toBe(closeBtn?.parentElement);

    await click(resumeBtn);
    expect(onResume).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("applies fixed width and height classes and non-wrapping L1 tab row", async () => {
    await cleanupDom();
    const { unmount } = await renderIntoDom(<ControlledHostHarness />);

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.className).toContain(GAME_MODAL_WIDTH_CLASS);
    expect(dialog.className).toContain("h-[min(85vh,760px)]");

    const l1Tablist = document.body.querySelector("#modal-quick-navigation") as HTMLElement;
    expect(l1Tablist).not.toBeNull();
    expect(l1Tablist.className).toContain("flex-nowrap");
    expect(l1Tablist.className).toContain("overflow-x-auto");

    // Tab row is outside the scrollable ModalBody
    expect(l1Tablist.closest(".overflow-y-auto")).toBeNull();

    await unmount();
  });

  it("reopens the last-used game L1 tab on Esc when closed, ignoring Creation", async () => {
    await cleanupDom();
    const { container, unmount } = await renderIntoDom(<EscapeMemoryHarness />);

    const pressKey = async (key: string) => {
      await act(async () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      });
    };

    const activeText = () =>
      container.querySelector('[data-testid="active-modal"]')?.textContent;

    // Initial Esc opens Menu by default
    await pressKey("Escape");
    expect(activeText()).toBe(ModalId.Menu);

    // Switch to Inventory, close, and Esc reopens Inventory
    await pressKey("i");
    expect(activeText()).toBe(ModalId.Inventory);
    await pressKey("Escape");
    expect(activeText()).toBe(ModalId.None);
    await pressKey("Escape");
    expect(activeText()).toBe(ModalId.Inventory);

    // Switch to SkillTree, close, open/close Creation, Esc still reopens SkillTree
    await pressKey("k");
    expect(activeText()).toBe(ModalId.SkillTree);
    await pressKey("Escape");
    expect(activeText()).toBe(ModalId.None);

    await pressKey("c");
    expect(activeText()).toBe(ModalId.Creation);
    await pressKey("Escape");
    expect(activeText()).toBe(ModalId.None);

    await pressKey("Escape");
    expect(activeText()).toBe(ModalId.SkillTree);

    await unmount();
  });

  it("renders L1 tabs in order: Gra [M], Mapa, Postać, Ekwipunek [I], Magia [K], Ustawienia, Pomoc [H]", async () => {
    await cleanupDom();
    const { unmount } = await renderIntoDom(<ControlledHostHarness />);

    const l1Tabs = Array.from(
      document.body.querySelectorAll('#modal-quick-navigation [role="tab"]')
    ).map((el) => el.textContent?.trim());

    expect(l1Tabs).toEqual([
      "Gra[M]",
      "Mapa",
      "Postać",
      "Ekwipunek[I]",
      "Magia[K]",
      "Ustawienia",
      "Pomoc[H]",
    ]);

    await unmount();
  });

  it("renders an L2 tablist (4 tabs) ONLY on Ustawienia and at most 2 tablists in any L1", async () => {
    await cleanupDom();
    const { click, unmount } = await renderIntoDom(<ControlledHostHarness />);

    for (const modalId of ALL_GAME_MODALS) {
      const l1Btn = document.body.querySelector(`#tab-${modalId}`) as HTMLButtonElement;
      expect(l1Btn).not.toBeNull();
      await click(l1Btn);

      const tablists = document.body.querySelectorAll('[role="tablist"]');
      expect(tablists.length).toBeLessThanOrEqual(2);

      const settingsSubNav = document.body.querySelector("#settings-sub-navigation");
      if (modalId === ModalId.Settings) {
        expect(settingsSubNav).not.toBeNull();
        const l2Labels = Array.from(
          settingsSubNav!.querySelectorAll('[role="tab"]')
        ).map((el) => el.textContent?.trim());
        expect(l2Labels).toEqual(["Obraz", "Dźwięk", "Sterowanie", "Interfejs"]);

        // Also check every L2 tab inside Ustawienia keeps at most 2 tablists
        for (const subId of [
          SettingsTabId.Display,
          SettingsTabId.Audio,
          SettingsTabId.Controls,
          SettingsTabId.Interface,
        ]) {
          const subBtn = settingsSubNav!.querySelector(`#tab-${subId}`) as HTMLButtonElement;
          expect(subBtn).not.toBeNull();
          await click(subBtn);
          expect(document.body.querySelectorAll('[role="tablist"]').length).toBeLessThanOrEqual(2);
        }
      } else {
        expect(settingsSubNav).toBeNull();
        expect(tablists.length).toBe(1);
      }
    }

    await unmount();
  });

  it("removes duplicated keybinding rows from Help and deep-links Otwórz Sterowanie to Ustawienia > Sterowanie", async () => {
    await cleanupDom();
    const { click, unmount } = await renderIntoDom(<EscapeMemoryHarness />);

    // Open Help via hotkey H
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h", bubbles: true }));
    });

    const bodyTextInHelp = document.body.textContent ?? "";
    expect(bodyTextInHelp).toContain(translations.pl.crouchAimTitle);
    for (const { labelKey } of BINDABLE_ACTION_CATALOG) {
      const actionLabel = translations.pl[labelKey as keyof typeof translations.pl];
      expect(bodyTextInHelp).not.toContain(actionLabel);
    }

    const openControlsBtn = document.body.querySelector(
      "#help-open-controls-btn"
    ) as HTMLButtonElement;
    expect(openControlsBtn).not.toBeNull();
    expect(openControlsBtn.textContent).toContain("Otwórz Sterowanie");

    await click(openControlsBtn);

    const activeModalEl = document.body.querySelector('[data-testid="active-modal"]');
    expect(activeModalEl?.textContent).toBe(ModalId.Settings);

    const controlsSubTab = document.body.querySelector(
      `#settings-sub-navigation #tab-${SettingsTabId.Controls}`
    );
    expect(controlsSubTab?.getAttribute("aria-selected")).toBe("true");
    expect(document.body.textContent).toContain(translations.pl.keyMoveLeft);

    // Session memory: close with Esc and reopen with Esc -> restores Ustawienia > Sterowanie
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(activeModalEl?.textContent).toBe(ModalId.None);
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(activeModalEl?.textContent).toBe(ModalId.Settings);
    expect(
      document.body
        .querySelector(`#settings-sub-navigation #tab-${SettingsTabId.Controls}`)
        ?.getAttribute("aria-selected")
    ).toBe("true");

    await unmount();
  });
});
