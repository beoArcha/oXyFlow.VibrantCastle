import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { ItemIcon, getDefaultIconNameForType } from "../item-icon";

describe("ItemIcon RPG Primitive Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render known icon svg cleanly", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <ItemIcon name="Sword" size={20} className="text-amber-300" />,
      { mode: "none" }
    );
    const svg = container.querySelector("svg");

    // Assert
    expect(svg).not.toBeNull();
  });

  it("should fallback to Package icon for unknown name", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <ItemIcon name="NonExistentItemXYZ" size={16} />,
      { mode: "none" }
    );
    const svg = container.querySelector("svg");

    // Assert
    expect(svg).not.toBeNull();
  });

  it("should resolve default icon names for item types", () => {
    // Assert
    expect(getDefaultIconNameForType("weapon")).toBe("Sword");
    expect(getDefaultIconNameForType("shield")).toBe("Shield");
    expect(getDefaultIconNameForType("helmet")).toBe("Crown");
    expect(getDefaultIconNameForType("potion")).toBe("FlaskConical");
    expect(getDefaultIconNameForType("unknown")).toBe("Package");
  });
});
