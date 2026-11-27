import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { IntegrationTestProviders } from "@test-utils/testProviders";
import { DisplayTab } from "../DisplayTab";
import { DEFAULT_SETTINGS } from "@context";
import defaultGameEngine from "@game/loop/engine";

describe("DisplayTab - Parallax Quality", () => {
  beforeEach(async () => {
    await cleanupDom();
    defaultGameEngine.applySettings({ display: DEFAULT_SETTINGS.display });
  });

  afterEach(async () => {
    await cleanupDom();
    defaultGameEngine.applySettings({ display: DEFAULT_SETTINGS.display });
  });

  it("should update parallaxQuality in settings and engine snapshot when an option is selected", async () => {
    // Arrange
    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <DisplayTab />
      </IntegrationTestProviders>
    );

    const autoCard = container.querySelector("#parallax-quality-auto");
    const simplifiedCard = container.querySelector("#parallax-quality-simplified") as HTMLElement | null;
    expect(autoCard?.getAttribute("aria-pressed")).toBe("true");
    expect(simplifiedCard).not.toBeNull();

    // Act
    await act(async () => {
      simplifiedCard?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Assert
    expect(simplifiedCard?.getAttribute("aria-pressed")).toBe("true");
    expect(autoCard?.getAttribute("aria-pressed")).toBe("false");
    expect(defaultGameEngine.settings.display.parallaxQuality).toBe("simplified");
    expect(defaultGameEngine.resolvedParallaxQuality).toBe("simplified");

    await unmount();
  });
});
