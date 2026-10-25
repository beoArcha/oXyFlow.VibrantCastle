import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { HUDNarratorBanner } from "../HUDNarratorBanner";

describe("HUDNarratorBanner Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders narration subtitle in quotes with title badge", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDNarratorBanner
          narration="The bastion fell silent as ancient gears stirred."
          isAnimating={false}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("The bastion fell silent as ancient gears stirred.");
    expect(container.textContent).toContain('"');

    await unmount();
  });

  it("applies scale animation style when isAnimating is true", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDNarratorBanner
          narration="Beware the clockwork gargoyles."
          isAnimating={true}
        />
      </TestProviders>
    );

    const banner = container.querySelector(".scale-105");
    expect(banner).not.toBeNull();
    expect(banner?.className).toContain("border-amber-400");

    await unmount();
  });

  it("renders idle prompt when narration is null", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDNarratorBanner
          narration={null}
          isAnimating={false}
        />
      </TestProviders>
    );

    // Polish translation in default TestProviders
    expect(container.textContent).toContain("Zrób krok");
    const idlePrompt = container.querySelector(".opacity-40");
    expect(idlePrompt).not.toBeNull();

    await unmount();
  });
});
