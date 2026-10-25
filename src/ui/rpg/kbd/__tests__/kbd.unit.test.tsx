import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { KbdKey } from "../kbd-key";
import { KbdGroup } from "../kbd-group";

describe("KbdKey Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render semantic kbd tag and data-slot when mounted", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(<KbdKey>ESC</KbdKey>, { mode: "none" });
    const kbd = container.querySelector("kbd");

    // Assert
    expect(kbd).not.toBeNull();
    expect(kbd?.getAttribute("data-slot")).toBe("kbd");
    expect(kbd?.textContent).toBe("ESC");
  });

  it("should apply variant styling cleanly without hardcoded hexes", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(<KbdKey variant="amber">SPACE</KbdKey>, {
      mode: "none",
    });
    const kbd = container.querySelector("kbd");

    // Assert
    expect(kbd?.className).toContain("bg-amber-950/80");
  });
});

describe("KbdGroup Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render list of keys with separator between them", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <KbdGroup keys={["Ctrl", "Shift", "P"]} separator="+" />,
      { mode: "none" }
    );
    const keys = container.querySelectorAll("kbd");
    const group = container.querySelector("[data-slot='kbd-group']");

    // Assert
    expect(group).not.toBeNull();
    expect(keys.length).toBe(3);
    expect(container.textContent).toContain("+");
  });

  it("should return null when keys array is empty", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(<KbdGroup keys={[]} />, { mode: "none" });

    // Assert
    expect(container.children.length).toBe(0);
  });
});
