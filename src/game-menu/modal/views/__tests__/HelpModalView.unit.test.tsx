import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { HelpModalView } from "../HelpModalView";

describe("HelpModalView", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("lists a shortcut chip for every game modal with a key label, and no dev-only Creation key", async () => {
    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <HelpModalView />
      </IntegrationTestProviders>
    );

    const text = container.textContent ?? "";
    expect(text).toContain("[M]");
    expect(text).toContain("[I]");
    expect(text).toContain("[K]");
    expect(text).toContain("[H]");
    expect(text).not.toContain("[C]");

    await unmount();
  });

  it("renders the controls deep link and invokes onOpenControls when it is clicked", async () => {
    const onOpenControls = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <HelpModalView onOpenControls={onOpenControls} />
      </IntegrationTestProviders>
    );

    const button = container.querySelector("#help-open-controls-btn") as HTMLElement | null;
    expect(button).not.toBeNull();

    await click(button!);
    expect(onOpenControls).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("omits the controls deep link when no onOpenControls handler is provided", async () => {
    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <HelpModalView />
      </IntegrationTestProviders>
    );

    expect(container.querySelector("#help-open-controls-btn")).toBeNull();

    await unmount();
  });
});
