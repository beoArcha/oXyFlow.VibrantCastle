import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { ModalNavigationTabs } from "../ModalNavigationTabs";
import { ModalId, MODAL_REGISTRY, type ModalType } from "../modalRegistry";

describe("ModalNavigationTabs", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders one tab per registered modal in navigation order", async () => {
    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <ModalNavigationTabs currentModal={ModalId.Menu} onNavigate={mock(() => {})} />
      </IntegrationTestProviders>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(MODAL_REGISTRY.length);
    expect(tabs[0]?.textContent).toContain("[M]");
    expect(tabs[tabs.length - 1]?.textContent).toContain("[C]");

    await unmount();
  });

  it("hides the Creation tab when showCreation is false", async () => {
    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <ModalNavigationTabs
          currentModal={ModalId.Menu}
          onNavigate={mock(() => {})}
          showCreation={false}
        />
      </IntegrationTestProviders>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(MODAL_REGISTRY.length - 1);
    expect(container.textContent).not.toContain("[C]");

    await unmount();
  });

  it("marks the current modal as aria-selected", async () => {
    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <ModalNavigationTabs currentModal={ModalId.Help} onNavigate={mock(() => {})} />
      </IntegrationTestProviders>
    );

    const selected = Array.from(container.querySelectorAll('[role="tab"]')).filter(
      (tab) => tab.getAttribute("aria-selected") === "true"
    );
    expect(selected.length).toBe(1);
    expect(selected[0]?.textContent).toContain("[H]");

    await unmount();
  });

  it("calls onNavigate with the modal id of the clicked tab", async () => {
    const onNavigate = mock((_modal: ModalType) => {});

    const { container, click, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <ModalNavigationTabs currentModal={ModalId.Menu} onNavigate={onNavigate} />
      </IntegrationTestProviders>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    const inventoryTab = Array.from(tabs).find((tab) => tab.textContent?.includes("[I]"));
    expect(inventoryTab).toBeDefined();

    await click(inventoryTab as HTMLElement);

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate.mock.calls[0]?.[0]).toBe(ModalId.Inventory);

    await unmount();
  });
});
