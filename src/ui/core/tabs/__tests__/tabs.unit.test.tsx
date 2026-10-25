import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Tabs } from "../tabs";

describe("Tabs Primitive Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const tabItems = [
    { id: "spells", label: "Grimoire Spells" },
    { id: "gear", label: "Relic Gear" },
    { id: "beasts", label: "Bestiary", disabled: true },
  ];

  it("should render tabs list from items array and highlight active tab", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Tabs items={tabItems} activeId="gear" onChange={() => {}} />,
      { mode: "none" }
    );
    const tabs = container.querySelectorAll("[role='tab']");

    // Assert
    expect(tabs.length).toBe(3);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
    expect(tabs[2].hasAttribute("disabled")).toBe(true);
  });

  it("should trigger onChange when clicking an inactive tab", async () => {
    // Arrange
    const handleChange = mock((id: string) => {});
    const { container } = await renderIntoDom(
      <Tabs items={tabItems} activeId="spells" onChange={handleChange} />,
      { mode: "none" }
    );
    const gearTab = container.querySelectorAll("[role='tab']")[1] as HTMLButtonElement;

    // Act
    gearTab.click();

    // Assert
    expect(handleChange).toHaveBeenCalledWith("gear");
  });

  it("should render compound tabs with content panel", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="details">Details</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">Overview Panel Content</Tabs.Content>
        <Tabs.Content value="details">Details Panel Content</Tabs.Content>
      </Tabs>,
      { mode: "none" }
    );
    const panel = container.querySelector("[role='tabpanel']");

    // Assert
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toBe("Overview Panel Content");
  });
});
