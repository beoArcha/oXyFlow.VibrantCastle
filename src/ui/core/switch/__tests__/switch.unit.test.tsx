import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Switch } from "../switch";

describe("Switch Primitive Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render switch button with role='switch' and aria-checked attribute", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Switch checked={true} onCheckedChange={() => {}} />,
      { mode: "none" }
    );
    const button = container.querySelector("button");

    // Assert
    expect(button).not.toBeNull();
    expect(button?.getAttribute("role")).toBe("switch");
    expect(button?.getAttribute("aria-checked")).toBe("true");
  });

  it("should invoke onCheckedChange with toggled value when clicked", async () => {
    // Arrange
    const handleCheckedChange = mock((checked: boolean) => {});
    const { container } = await renderIntoDom(
      <Switch checked={false} onCheckedChange={handleCheckedChange} />,
      { mode: "none" }
    );
    const button = container.querySelector("button");

    // Act
    button?.click();

    // Assert
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it("should not trigger onCheckedChange when disabled is true", async () => {
    // Arrange
    const handleCheckedChange = mock(() => {});
    const { container } = await renderIntoDom(
      <Switch checked={false} disabled={true} onCheckedChange={handleCheckedChange} />,
      { mode: "none" }
    );
    const button = container.querySelector("button");

    // Act
    button?.click();

    // Assert
    expect(handleCheckedChange).toHaveBeenCalledTimes(0);
    expect(button?.disabled).toBe(true);
  });
});
