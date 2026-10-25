import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { ProgressBar } from "../progress-bar";

describe("ProgressBar Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render progressbar with correct aria attributes and width percentage", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <ProgressBar value={75} max={100} label="Health" variant="health" />,
      { mode: "none" }
    );
    const progressbar = container.querySelector("[role='progressbar']");
    const fill = container.querySelector("[data-slot='progress-fill']");

    // Assert
    expect(progressbar).not.toBeNull();
    expect(progressbar?.getAttribute("aria-valuenow")).toBe("75");
    expect(progressbar?.getAttribute("aria-valuemax")).toBe("100");
    expect((fill as HTMLElement)?.style.width).toBe("75%");
  });

  it("should clamp progressbar value between 0 and 100 percent when out of bounds", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <ProgressBar value={150} max={100} label="Overcharged" />,
      { mode: "none" }
    );
    const fill = container.querySelector("[data-slot='progress-fill']");

    // Assert
    expect((fill as HTMLElement)?.style.width).toBe("100%");
  });

  it("should clamp progressbar value to zero when negative value is passed", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <ProgressBar value={-20} max={100} label="Dead" />,
      { mode: "none" }
    );
    const fill = container.querySelector("[data-slot='progress-fill']");

    // Assert
    expect((fill as HTMLElement)?.style.width).toBe("0%");
  });
});
