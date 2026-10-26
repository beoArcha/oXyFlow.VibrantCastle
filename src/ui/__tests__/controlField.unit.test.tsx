import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { ControlField } from "../controls";

describe("<ControlField /> (@ui/controls)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders inline layout with icon, label, and control", async () => {
    const { unmount } = await renderIntoDom(
      <ControlField
        icon={<span data-testid="cpu-icon">⚡</span>}
        label="Log Level"
        layout="inline"
      >
        <button id="level-btn">DEBUG</button>
      </ControlField>
    );

    const root = document.querySelector("[data-slot='control-field']");
    expect(root?.getAttribute("data-layout")).toBe("inline");
    expect(root?.className).toContain("inline-flex");

    const icon = document.querySelector("[data-testid='cpu-icon']");
    expect(icon).not.toBeNull();

    const label = document.querySelector("label[data-slot='icon-label']");
    expect(label?.textContent).toContain("Log Level");
    // Verifies automatic htmlFor extraction from child id="level-btn"
    expect(label?.getAttribute("for")).toBe("level-btn");

    await unmount();
  });

  it("renders stacked layout with subtitle description", async () => {
    const { unmount } = await renderIntoDom(
      <ControlField
        label="Sampling Color"
        description="Pick chroma key color from viewport"
        layout="stacked"
      >
        <input id="color-hex" type="text" defaultValue="#00ff00" />
      </ControlField>
    );

    const root = document.querySelector("[data-slot='control-field']");
    expect(root?.getAttribute("data-layout")).toBe("stacked");
    expect(root?.className).toContain("flex-col");

    const description = document.querySelector("span[data-slot='text']");
    expect(description?.textContent).toBe("Pick chroma key color from viewport");

    await unmount();
  });

  it("renders spread layout (justify-between) and accessible error message", async () => {
    const { unmount } = await renderIntoDom(
      <ControlField
        label="Freeze AI"
        layout="spread"
        error="Simulation tick failed"
      >
        <input type="checkbox" id="freeze-chk" />
      </ControlField>
    );

    const root = document.querySelector("[data-slot='control-field']");
    expect(root?.getAttribute("data-layout")).toBe("spread");
    expect(root?.className).toContain("justify-between");

    const error = document.querySelector("[role='alert']");
    expect(error).not.toBeNull();
    expect(error?.textContent).toBe("Simulation tick failed");

    await unmount();
  });

  it("handles disabled state with muted styling and pointer-events-none", async () => {
    const { unmount } = await renderIntoDom(
      <ControlField label="Disabled Switch" disabled>
        <button id="btn-disabled">Off</button>
      </ControlField>
    );

    const root = document.querySelector("[data-slot='control-field']");
    expect(root?.className).toContain("opacity-60");
    expect(root?.className).toContain("pointer-events-none");

    await unmount();
  });
});
