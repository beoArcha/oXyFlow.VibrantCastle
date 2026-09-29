import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import App from "./App";

describe("App Root Component", () => {
  let unmount: (() => Promise<void>) | null = null;

  beforeEach(() => {
    unmount = null;
  });

  afterEach(async () => {
    if (unmount) {
      await unmount();
      unmount = null;
    }
    cleanupDom();
  });

  it("mounts full application tree without error", async () => {
    const rendered = await renderIntoDom(<App />);
    unmount = rendered.unmount;

    expect(rendered.container.querySelector("#game-root-container")).not.toBeNull();
    expect(rendered.container.querySelector("#game-header")).not.toBeNull();
    expect(rendered.container.querySelector("#app-title")).not.toBeNull();
    expect(rendered.container.querySelector("#game-main-content")).not.toBeNull();
  });

  it("opens Help modal when clicking Hints hotkey button and dismisses on close", async () => {
    const rendered = await renderIntoDom(<App />);
    unmount = rendered.unmount;

    // Initially no modal
    expect(document.querySelector("[role='dialog']")).toBeNull();

    // Find the Hints button (contains 'H')
    const buttons = Array.from(rendered.container.querySelectorAll("header button"));
    const hintsBtn = buttons.find((btn) => btn.textContent?.includes("H"));
    expect(hintsBtn).toBeDefined();

    await rendered.click(hintsBtn!);

    // Help modal is now open in portal
    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    // Close the modal
    const closeBtn = document.querySelector(".lucide-x")?.closest("button");
    expect(closeBtn).not.toBeNull();
    await rendered.click(closeBtn!);

    expect(document.querySelector("[role='dialog']")).toBeNull();
  });

  it("opens Menu modal when clicking Menu hotkey button", async () => {
    const rendered = await renderIntoDom(<App />);
    unmount = rendered.unmount;

    const buttons = Array.from(rendered.container.querySelectorAll("header button"));
    const menuBtn = buttons.find((btn) => btn.textContent?.includes("M"));
    expect(menuBtn).toBeDefined();

    await rendered.click(menuBtn!);

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
  });
});
