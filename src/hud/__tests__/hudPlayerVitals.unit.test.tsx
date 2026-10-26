import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { HUDPlayerVitals } from "../components/player/HUDPlayerVitals";
import { getPlayerThemeTokens } from "@styles/theme";

describe("<HUDPlayerVitals />", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const crimsonTheme = getPlayerThemeTokens("crimson");

  it("renders 3 progress bars for health, mana, and stamina", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerVitals
          health={80}
          maxHealth={100}
          mana={45}
          maxMana={50}
          stamina={90}
          maxStamina={100}
          themeTokens={crimsonTheme}
        />
      </TestProviders>
    );

    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(3);

    // Health bar check
    expect(progressBars[0].getAttribute("aria-valuenow")).toBe("80");
    expect(progressBars[0].getAttribute("aria-valuemax")).toBe("100");

    // Mana bar check
    expect(progressBars[1].getAttribute("aria-valuenow")).toBe("45");
    expect(progressBars[1].getAttribute("aria-valuemax")).toBe("50");

    // Stamina bar check
    expect(progressBars[2].getAttribute("aria-valuenow")).toBe("90");
    expect(progressBars[2].getAttribute("aria-valuemax")).toBe("100");

    await unmount();
  });
});
