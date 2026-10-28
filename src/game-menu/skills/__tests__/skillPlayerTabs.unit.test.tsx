import { describe, it, expect } from "bun:test";
import React, { act } from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { SkillPlayerTabs } from "../SkillPlayerTabs";
import { GameEngine } from "@game/loop/engine";
import { SettingsStorage } from "@context/settings/settingsStorage";
import { DEFAULT_SETTINGS } from "@context/settings/settingsTypes";
import { I18nProvider } from "@context/I18nContext";
import {
  SettingsProvider,
  ControlsProvider,
  SaveGameProvider,
  GameSessionProvider,
  InventoryProvider,
  SkillsProvider,
} from "@context/GameContext";

describe("SkillPlayerTabs", () => {
  it("renders single-player badge and does not render fictional P2 tab in 1P mode", async () => {
    await cleanupDom();

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <SkillPlayerTabs />
      </IntegrationTestProviders>
    );

    expect(container.textContent).toContain("Valen (P1)");
    expect(container.textContent).not.toContain("Aurelia (P2)");
    expect(container.textContent).toContain("PU");

    const valenBadge = container.querySelector("#skill-badge-valen");
    expect(valenBadge).not.toBeNull();

    const p2Tab = container.querySelector("#skill-tab-aurelia");
    expect(p2Tab).toBeNull();

    await unmount();
  });

  it("renders both player tabs and allows switching in 2P co-op mode", async () => {
    await cleanupDom();

    const engine = new GameEngine();
    engine.setTwoPlayerMode(true);

    const mockStorageProvider = {
      getItem: () => JSON.stringify({ ...DEFAULT_SETTINGS, isTwoPlayer: true }),
      setItem: () => {},
    };
    const storage = new SettingsStorage(mockStorageProvider);

    const { container, unmount } = await renderIntoDom(
      <I18nProvider defaultLanguage="pl">
        <SettingsProvider storage={storage}>
          <ControlsProvider>
            <SaveGameProvider>
              <GameSessionProvider engine={engine}>
                <InventoryProvider engine={engine}>
                  <SkillsProvider engine={engine}>
                    <SkillPlayerTabs />
                  </SkillsProvider>
                </InventoryProvider>
              </GameSessionProvider>
            </SaveGameProvider>
          </ControlsProvider>
        </SettingsProvider>
      </I18nProvider>
    );

    expect(container.textContent).toContain("Valen (P1)");
    expect(container.textContent).toContain("Aurelia (P2)");
    expect(container.textContent).toContain("PU");

    const valenTab = container.querySelector("#skill-tab-valen") as HTMLElement;
    const aureliaTab = container.querySelector("#skill-tab-aurelia") as HTMLElement;

    expect(valenTab).not.toBeNull();
    expect(aureliaTab).not.toBeNull();

    await act(async () => {
      aureliaTab.click();
    });
    expect(aureliaTab.getAttribute("aria-selected")).toBe("true");

    await act(async () => {
      valenTab.click();
    });
    expect(valenTab.getAttribute("aria-selected")).toBe("true");

    engine.stop();
    await unmount();
  });
});
