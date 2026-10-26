import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { HUDPanel } from "../components/common/HUDPanel";

describe("<HUDPanel /> (src/hud/components/common)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders with default glassmorphic styling and padding", async () => {
    const { unmount } = await renderIntoDom(
      <HUDPanel id="hud-card">
        <span>Content</span>
      </HUDPanel>
    );

    const panel = document.getElementById("hud-card");
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute("data-slot")).toBe("hud-panel");
    expect(panel?.className).toContain("backdrop-blur-md");
    expect(panel?.className).toContain("rounded-2xl");
    expect(panel?.className).toContain("shadow-2xl");

    await unmount();
  });

  it("supports dynamic border colors and subtle variant", async () => {
    const { unmount } = await renderIntoDom(
      <HUDPanel
        id="subtle-hud"
        variant="subtle"
        borderColor="border-red-950/70"
        padding="sm"
      >
        <span>Subtle</span>
      </HUDPanel>
    );

    const panel = document.getElementById("subtle-hud");
    expect(panel?.className).toContain("border-red-950/70");
    expect(panel?.className).toContain("bg-stone-950/70");

    await unmount();
  });
});
