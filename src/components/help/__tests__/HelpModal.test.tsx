import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { HelpModal } from "../HelpModal";

describe("HelpModal Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders HelpModal in a dialog portal with title, subtitle, banner, and return button", async () => {
    const onClose = mock(() => {});

    const { unmount } = await renderIntoDom(
      <TestProviders>
        <HelpModal onClose={onClose} />
      </TestProviders>
    );

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    // Title and subtitle
    expect(dialog?.textContent).toContain("Księga Porad & Sterowanie");
    expect(dialog?.textContent).toContain("Słoneczny Bastion — Przewodnik po Mechanikach i Skrótach");

    // Close / return button
    expect(dialog?.textContent).toContain("Wróć do gry");

    await unmount();
  });

  it("renders all sections when defaultTab is 'all'", async () => {
    const onClose = mock(() => {});

    const { unmount } = await renderIntoDom(
      <TestProviders>
        <HelpModal onClose={onClose} defaultTab="all" />
      </TestProviders>
    );

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    // Shortcuts section exists
    expect(dialog?.querySelector("#shortcuts-heading")).not.toBeNull();
    // Controls section exists
    expect(dialog?.querySelector("#controls-heading")).not.toBeNull();
    // Mechanics section exists
    expect(dialog?.querySelector("#mechanics-heading")).not.toBeNull();

    await unmount();
  });

  it("filters and displays only shortcuts section when shortcuts tab is selected", async () => {
    const onClose = mock(() => {});

    const { click, unmount } = await renderIntoDom(
      <TestProviders>
        <HelpModal onClose={onClose} defaultTab="all" />
      </TestProviders>
    );

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    const tabs = dialog?.querySelectorAll('[role="tab"]') || [];
    const shortcutsTab = tabs[1] as HTMLElement;
    expect(shortcutsTab).toBeDefined();
    await click(shortcutsTab);

    // Shortcuts section is present
    expect(dialog?.querySelector("#shortcuts-heading")).not.toBeNull();
    // Controls and mechanics sections are hidden
    expect(dialog?.querySelector("#controls-heading")).toBeNull();
    expect(dialog?.querySelector("#mechanics-heading")).toBeNull();

    await unmount();
  });

  it("filters and displays only controls section when controls tab is selected", async () => {
    const onClose = mock(() => {});

    const { click, unmount } = await renderIntoDom(
      <TestProviders>
        <HelpModal onClose={onClose} defaultTab="all" />
      </TestProviders>
    );

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    const tabs = dialog?.querySelectorAll('[role="tab"]') || [];
    const controlsTab = tabs[2] as HTMLElement;
    expect(controlsTab).toBeDefined();
    await click(controlsTab);

    expect(dialog?.querySelector("#controls-heading")).not.toBeNull();
    expect(dialog?.querySelector("#shortcuts-heading")).toBeNull();
    expect(dialog?.querySelector("#mechanics-heading")).toBeNull();

    await unmount();
  });

  it("filters and displays only mechanics section when mechanics tab is selected", async () => {
    const onClose = mock(() => {});

    const { click, unmount } = await renderIntoDom(
      <TestProviders>
        <HelpModal onClose={onClose} defaultTab="all" />
      </TestProviders>
    );

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    const tabs = dialog?.querySelectorAll('[role="tab"]') || [];
    const mechanicsTab = tabs[3] as HTMLElement;
    expect(mechanicsTab).toBeDefined();
    await click(mechanicsTab);

    expect(dialog?.querySelector("#mechanics-heading")).not.toBeNull();
    expect(dialog?.querySelector("#shortcuts-heading")).toBeNull();
    expect(dialog?.querySelector("#controls-heading")).toBeNull();

    await unmount();
  });

  it("calls onClose callback when return button is clicked", async () => {
    const onClose = mock(() => {});

    const { click, unmount } = await renderIntoDom(
      <TestProviders>
        <HelpModal onClose={onClose} />
      </TestProviders>
    );

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    const allButtons = Array.from(dialog?.querySelectorAll("button") || []);
    const returnBtn = allButtons.find((btn) => btn.textContent?.includes("Wróć do gry"));

    expect(returnBtn).toBeDefined();
    if (returnBtn) {
      await click(returnBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    }

    await unmount();
  });

  it("renders ModalNavigationTabs when onNavigateModal and onResume are provided", async () => {
    const onClose = mock(() => {});
    const onNavigateModal = mock(() => {});
    const onResume = mock(() => {});

    const { unmount } = await renderIntoDom(
      <TestProviders>
        <HelpModal
          onClose={onClose}
          onNavigateModal={onNavigateModal}
          onResume={onResume}
        />
      </TestProviders>
    );

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    // ModalNavigationTabs has id="modal-quick-navigation"
    const navTabs = dialog?.querySelector("#modal-quick-navigation");
    expect(navTabs).not.toBeNull();

    await unmount();
  });
});
