import { describe, it, expect, mock } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { MenuModal } from "../MenuModal";

describe("MenuModal", () => {
  it("renders modal header and content into document body", async () => {
    await cleanupDom();
    const onClose = mock();

    const { unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <MenuModal onClose={onClose} initialTab="gameplay" />
      </IntegrationTestProviders>
    );

    // Modal renders via React Portal into document.body
    const menuPanel = document.body.querySelector("#settings-menu-panel");
    expect(menuPanel).not.toBeNull();

    // Verify presence of gameplay tab content (EN or PL)
    expect(document.body.textContent).toMatch(/Gameplay|Rozgrywka/);

    await unmount();
  });

  it("renders navigation tabs and opens initialTab when provided", async () => {
    await cleanupDom();
    const onClose = mock();
    const onNavigateModal = mock();
    const onResume = mock();

    const { unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <MenuModal
          onClose={onClose}
          onNavigateModal={onNavigateModal}
          onResume={onResume}
          initialTab="audio"
        />
      </IntegrationTestProviders>
    );

    expect(document.body.querySelector("#tab-content-audio")).not.toBeNull();

    await unmount();
  });

  it("invokes onClose when close button is clicked", async () => {
    await cleanupDom();
    const onClose = mock();

    const { unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <MenuModal onClose={onClose} />
      </IntegrationTestProviders>
    );

    const allButtons = Array.from(document.body.querySelectorAll("button"));
    const closeButton = allButtons.find((btn) => btn.getAttribute("aria-label")?.toLowerCase().includes("close") || btn.getAttribute("aria-label")?.toLowerCase().includes("zamknij") || btn.querySelector("svg.lucide-x") !== null);

    expect(closeButton).toBeDefined();

    if (closeButton) {
      closeButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(onClose).toHaveBeenCalled();
    }

    await unmount();
  });
});
