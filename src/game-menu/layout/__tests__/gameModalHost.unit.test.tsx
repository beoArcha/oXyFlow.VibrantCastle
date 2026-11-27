import { describe, it, expect, mock } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { GameModalHost } from "../GameModalHost";
import { ModalId } from "@game-menu/modal/modalRegistry";
import type { ModalManager } from "@game-menu/menu/hooks/useModalManager";

const managerFor = (activeModal: ModalId): ModalManager =>
  ({ activeModal } as unknown as ModalManager);

const renderHost = async (activeModal: ModalId) => {
  await cleanupDom();
  return renderIntoDom(
    <IntegrationTestProviders defaultLanguage="pl">
      <GameModalHost
        modalManager={managerFor(activeModal)}
        onClose={mock()}
        onNavigateModal={mock()}
        onResume={mock()}
        onStartRebind={mock()}
        renderDeveloperSuite={() => <div data-testid="dev-suite-stub">dev</div>}
      />
    </IntegrationTestProviders>
  );
};

const tablistTexts = (): string[] =>
  Array.from(document.body.querySelectorAll('[role="tablist"]')).map(
    (el) => el.textContent ?? ""
  );

describe("GameModalHost", () => {
  it("renders the game Menu without a Tworzenie sub-tab", async () => {
    const { unmount } = await renderHost(ModalId.Menu);

    const texts = tablistTexts().join(" | ");
    expect(texts).not.toMatch(/Tworzenie|Creation/);
    expect(document.body.textContent).toMatch(/Ekwipunek|Inventory/);

    await unmount();
  });

  it("renders the Creation modal without any game tablist", async () => {
    const { unmount } = await renderHost(ModalId.Creation);

    expect(document.body.querySelector('[data-testid="dev-suite-stub"]')).not.toBeNull();
    expect(document.body.querySelector("#modal-quick-navigation")).toBeNull();
    const texts = tablistTexts().join(" | ");
    expect(texts).not.toMatch(/Gra|Mapa|Postać|Ekwipunek|Magia|Ustawienia|Pomoc/);

    await unmount();
  });

  it.each([
    ["Menu (Gra)", ModalId.Menu],
    ["Locations (Mapa)", ModalId.Locations],
    ["Character (Postać)", ModalId.Character],
    ["Inventory (Ekwipunek)", ModalId.Inventory],
    ["SkillTree (Magia)", ModalId.SkillTree],
    ["Settings (Ustawienia)", ModalId.Settings],
    ["Help (Pomoc)", ModalId.Help],
  ])("renders %s with the shared game modal width", async (_name, modal) => {
    const { unmount } = await renderHost(modal);

    expect(document.body.querySelectorAll(".max-w-5xl").length).toBeGreaterThan(0);
    expect(document.body.querySelectorAll(".max-w-4xl").length).toBe(0);
    expect(document.body.querySelectorAll(".max-w-7xl").length).toBe(0);

    await unmount();
  });
});
