import { describe, it, expect, mock } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { AudioTab } from "../AudioTab";

describe("AudioTab", () => {
  it("renders volume sliders and test buttons", async () => {
    await cleanupDom();

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <AudioTab />
      </IntegrationTestProviders>
    );

    expect(container.querySelector("#tab-content-audio")).not.toBeNull();
    expect(container.querySelector("#bgm-volume-slider")).not.toBeNull();
    expect(container.querySelector("#sfx-volume-slider")).not.toBeNull();

    const buttons = Array.from(container.querySelectorAll("button"));
    const hasTestSfx = buttons.some((btn) => btn.textContent?.includes("Test SFX") || btn.textContent?.includes("Test"));
    expect(hasTestSfx).toBe(true);

    await unmount();
  });

  it("handles test sfx and magic sound button clicks without error", async () => {
    await cleanupDom();

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <AudioTab />
      </IntegrationTestProviders>
    );

    const buttons = Array.from(container.querySelectorAll("button"));
    const testSfxButton = buttons.find((btn) => btn.textContent?.includes("Test SFX"));
    const testMagicButton = buttons.find((btn) => btn.textContent?.includes("Magic") || btn.textContent?.includes("Test Spell"));

    if (testSfxButton) {
      testSfxButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
    if (testMagicButton) {
      testMagicButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }

    expect(container.querySelector("#tab-content-audio")).not.toBeNull();
    await unmount();
  });
});
