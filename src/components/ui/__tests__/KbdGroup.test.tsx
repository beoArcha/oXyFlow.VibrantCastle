import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, renderIntoDom } from "@test-utils/domTestUtils";
import { KbdGroup } from "../KbdGroup";

describe("KbdGroup Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(() => {
    if (document.body) {
      document.body.innerHTML = "";
    }
  });

  it("renders null when keys array is empty", async () => {
    const { container, unmount } = await renderIntoDom(
      <KbdGroup keys={[]} />
    );

    expect(container.innerHTML).toBe("");
    await unmount();
  });

  it("renders keys using KbdKey badges", async () => {
    const { container, unmount } = await renderIntoDom(
      <KbdGroup keys={["KeyW", "KeyS"]} />
    );

    const keys = container.querySelectorAll("kbd");
    expect(keys.length).toBe(2);
    expect(keys[0]?.textContent).toBe("KeyW");
    expect(keys[1]?.textContent).toBe("KeyS");

    await unmount();
  });

  it("renders separator between keys", async () => {
    const { container, unmount } = await renderIntoDom(
      <KbdGroup keys={["Ctrl", "Alt", "Del"]} separator="+" />
    );

    const keys = container.querySelectorAll("kbd");
    expect(keys.length).toBe(3);

    expect(container.textContent).toContain("+");
    const separators = container.querySelectorAll("span");
    expect(separators.length).toBe(2);
    expect(separators[0]?.textContent).toBe("+");

    await unmount();
  });

  it("formats key labels with formatLabel callback", async () => {
    const { container, unmount } = await renderIntoDom(
      <KbdGroup
        keys={["ArrowUp", "ArrowDown"]}
        formatLabel={(k) => (k === "ArrowUp" ? "↑" : "↓")}
      />
    );

    const keys = container.querySelectorAll("kbd");
    expect(keys[0]?.textContent).toBe("↑");
    expect(keys[1]?.textContent).toBe("↓");

    await unmount();
  });

  it("limits number of displayed keys when maxKeys is specified", async () => {
    const { container, unmount } = await renderIntoDom(
      <KbdGroup keys={["KeyA", "KeyB", "KeyC", "KeyD"]} maxKeys={2} />
    );

    const keys = container.querySelectorAll("kbd");
    expect(keys.length).toBe(2);
    expect(keys[0]?.textContent).toBe("KeyA");
    expect(keys[1]?.textContent).toBe("KeyB");

    await unmount();
  });

  it("applies variant classes properly to keys", async () => {
    const { container, unmount } = await renderIntoDom(
      <KbdGroup keys={["Space"]} variant="cyan" />
    );

    const kbd = container.querySelector("kbd");
    expect(kbd?.className).toContain("text-cyan-200");

    await unmount();
  });
});
