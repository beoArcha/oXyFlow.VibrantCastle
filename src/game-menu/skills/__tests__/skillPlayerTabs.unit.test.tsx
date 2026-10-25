import { describe, it, expect } from "bun:test";
import React, { act } from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { SkillPlayerTabs } from "../SkillPlayerTabs";

describe("SkillPlayerTabs", () => {
  it("renders character tabs and available skill points metric tile", async () => {
    await cleanupDom();

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <SkillPlayerTabs />
      </IntegrationTestProviders>
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

    await unmount();
  });
});
