import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { HelpNavigation } from "../HelpNavigation";

describe("HelpNavigation Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders all four navigation tabs with localized labels", async () => {
    const onSelectTab = mock(() => {});

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HelpNavigation activeTab="all" onSelectTab={onSelectTab} />
      </TestProviders>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(4);

    // Default locale in TestProviders has Polish translations
    expect(container.textContent).toContain("Wszystko");
    expect(container.textContent).toContain("Sterowanie");

    await unmount();
  });

  it("marks active tab as aria-selected=true", async () => {
    const onSelectTab = mock(() => {});

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HelpNavigation activeTab="controls" onSelectTab={onSelectTab} />
      </TestProviders>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("false");

    await unmount();
  });

  it("calls onSelectTab when a tab is clicked", async () => {
    const onSelectTab = mock((_tab: string) => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HelpNavigation activeTab="all" onSelectTab={onSelectTab} />
      </TestProviders>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    const shortcutsTab = tabs[1] as HTMLElement;

    await click(shortcutsTab);

    expect(onSelectTab).toHaveBeenCalledTimes(1);
    expect(onSelectTab.mock.calls[0]?.[0]).toBe("shortcuts");

    await unmount();
  });
});
