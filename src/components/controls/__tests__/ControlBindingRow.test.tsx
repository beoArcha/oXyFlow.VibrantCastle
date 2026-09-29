import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { ControlBindingRow } from "../ControlBindingRow";

describe("ControlBindingRow Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders action label and children elements", async () => {
    const { container, unmount } = await renderIntoDom(
      <ControlBindingRow
        label="Jump Action"
        rebindLabel="Remap"
        onRebind={() => {}}
      >
        <span id="test-badge">Space</span>
      </ControlBindingRow>
    );

    expect(container.textContent).toContain("Jump Action");
    expect(container.textContent).toContain("Remap");
    const badge = container.querySelector("#test-badge");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("Space");

    await unmount();
  });

  it("fires onRebind when button is clicked", async () => {
    const handleRebind = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <ControlBindingRow
        label="Attack"
        rebindLabel="Change Key"
        onRebind={handleRebind}
      >
        <span>Z</span>
      </ControlBindingRow>
    );

    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    if (button) {
      await click(button);
      expect(handleRebind).toHaveBeenCalledTimes(1);
    }

    await unmount();
  });

  it("disables button when disabled prop is true", async () => {
    const handleRebind = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <ControlBindingRow
        label="Dash"
        rebindLabel="Remap"
        disabled={true}
        onRebind={handleRebind}
      >
        <span>Shift</span>
      </ControlBindingRow>
    );

    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.disabled).toBe(true);

    if (button) {
      await click(button);
      expect(handleRebind).not.toHaveBeenCalled();
    }

    await unmount();
  });

  it("applies active listening classes when isListening is true", async () => {
    const { container, unmount } = await renderIntoDom(
      <ControlBindingRow
        id="listening-row"
        label="Potion"
        rebindLabel="Listening..."
        isListening={true}
        onRebind={() => {}}
      >
        <span>1</span>
      </ControlBindingRow>
    );

    const row = container.querySelector("#listening-row");
    expect(row).not.toBeNull();
    expect(row?.className).toContain("border-amber-500");

    await unmount();
  });
});
