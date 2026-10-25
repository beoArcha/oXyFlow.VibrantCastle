import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Tooltip } from "../tooltip";

describe("Tooltip Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render trigger child element cleanly", async () => {
    // Arrange & Act
    await renderIntoDom(
      <Tooltip content="Courtyard Key">
        <button type="button" data-testid="target-btn">Hover Target</button>
      </Tooltip>,
      { mode: "none" }
    );
    const trigger = document.querySelector("[data-testid='target-btn']");

    // Assert
    expect(trigger).not.toBeNull();
    expect(trigger?.textContent).toBe("Hover Target");
  });

  it("should render popup content in portal when open is true", async () => {
    // Arrange & Act
    await renderIntoDom(
      <Tooltip content="Courtyard Key" open={true}>
        <button type="button">Target</button>
      </Tooltip>,
      { mode: "none" }
    );
    const popup = document.querySelector("[data-slot='tooltip-popup']");

    // Assert
    expect(popup).not.toBeNull();
    expect(popup?.textContent).toBe("Courtyard Key");
    expect(popup?.getAttribute("role")).toBe("tooltip");
  });

  it("should support compound syntax with Base UI primitives", async () => {
    // Arrange & Act
    await renderIntoDom(
      <Tooltip.Provider>
        <Tooltip.Root open={true}>
          <Tooltip.Trigger render={<button type="button">Compound Trigger</button>} />
          <Tooltip.Portal>
            <Tooltip.Positioner side="top">
              <Tooltip.Popup data-slot="tooltip-popup">Gargoyle Horn</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>,
      { mode: "none" }
    );
    const popup = document.querySelector("[data-slot='tooltip-popup']");

    // Assert
    expect(popup).not.toBeNull();
    expect(popup?.textContent).toBe("Gargoyle Horn");
  });

  it("should not render popup when disabled is true", async () => {
    // Arrange & Act
    await renderIntoDom(
      <Tooltip content="Secret" disabled={true} open={true}>
        <button type="button">Disabled Target</button>
      </Tooltip>,
      { mode: "none" }
    );
    const popup = document.querySelector("[data-slot='tooltip-popup']");

    // Assert
    expect(popup).toBeNull();
  });
});
