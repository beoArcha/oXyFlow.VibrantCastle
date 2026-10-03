import { describe, it, expect, mock } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { MenuPanel } from "../MenuPanel";

describe("MenuPanel", () => {
  it("renders with default gameplay tab and navigation tabs", async () => {
    await cleanupDom();

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <MenuPanel />
      </IntegrationTestProviders>
    );

    expect(container.querySelector("#settings-menu-panel")).not.toBeNull();
    expect(container.querySelector("#tab-content-gameplay")).not.toBeNull();

    const tabButtons = container.querySelectorAll("nav button, div[role='tablist'] button");
    expect(tabButtons.length).toBeGreaterThan(0);

    await unmount();
  });

  it("renders initialTab when specified (e.g. audio tab)", async () => {
    await cleanupDom();

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <MenuPanel initialTab="audio" />
      </IntegrationTestProviders>
    );

    expect(container.querySelector("#tab-content-audio")).not.toBeNull();
    expect(container.querySelector("#tab-content-gameplay")).toBeNull();

    await unmount();
  });

  it("renders locations tab when initialTab is locations", async () => {
    await cleanupDom();

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <MenuPanel initialTab="locations" />
      </IntegrationTestProviders>
    );

    expect(container.querySelector("#tab-content-locations")).not.toBeNull();
    await unmount();
  });

  it("renders stats tab when initialTab is stats", async () => {
    await cleanupDom();

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <MenuPanel initialTab="stats" />
      </IntegrationTestProviders>
    );

    expect(container.querySelector("#game-statistics-panel")).not.toBeNull();
    await unmount();
  });

  it("renders keyboard mapper with onStartRebind support", async () => {
    await cleanupDom();
    const onStartRebind = mock();

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <MenuPanel initialTab="keyboard" onStartRebind={onStartRebind} />
      </IntegrationTestProviders>
    );

    const keyboardPanel = container.querySelector(".animate-in");
    expect(keyboardPanel).not.toBeNull();

    await unmount();
  });
});
