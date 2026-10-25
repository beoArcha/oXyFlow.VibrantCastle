import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Badge } from "../badge";

describe("Badge Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render badge label and data-slot when mounted", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(<Badge>Elite</Badge>, { mode: "none" });
    const badge = container.querySelector("span");

    // Assert
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute("data-slot")).toBe("badge");
    expect(badge?.textContent).toBe("Elite");
  });

  it("should render adornment icon when icon prop is provided", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Badge icon={<span data-testid="badge-icon">*</span>}>Featured</Badge>,
      { mode: "none" }
    );
    const icon = container.querySelector("[data-testid='badge-icon']");

    // Assert
    expect(icon).not.toBeNull();
    expect(container.textContent).toContain("Featured");
  });

  it("should apply variant styling classes cleanly", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(<Badge variant="red">Danger</Badge>, {
      mode: "none",
    });
    const badge = container.querySelector("span");

    // Assert
    expect(badge?.className).toContain("bg-red-950/80");
  });
});
