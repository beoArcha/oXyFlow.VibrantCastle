import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderIntoDom, cleanupDom, setupDomEnvironment } from "@test-utils/domTestUtils";
import { GameErrorBoundary } from "../error-boundary";

describe("GameErrorBoundary Unit Tests", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render children normally when no exception is thrown", async () => {
    // Arrange
    const { container } = await renderIntoDom(
      <GameErrorBoundary>
        <div data-testid="child-content">Safe Content</div>
      </GameErrorBoundary>,
      { mode: "none" }
    );

    // Act
    const child = container.querySelector('[data-testid="child-content"]');

    // Assert
    expect(child).not.toBeNull();
    expect(child?.textContent).toBe("Safe Content");
  });

  it("should render fallback UI when a child component crashes", async () => {
    // Arrange
    const CrashingChild = () => {
      throw new Error("Simulated Citadel Crash");
    };

    // Suppress console.error during expected crash test
    const originalConsoleError = console.error;
    console.error = () => {};

    try {
      // Act
      const { container } = await renderIntoDom(
        <GameErrorBoundary fallbackTitle="Custom Anomaly Title">
          <CrashingChild />
        </GameErrorBoundary>,
        { mode: "none" }
      );

      // Assert
      const title = container.querySelector("h2");
      expect(title).not.toBeNull();
      expect(title?.textContent).toBe("Custom Anomaly Title");
      expect(container.textContent).toContain("Simulated Citadel Crash");
    } finally {
      console.error = originalConsoleError;
    }
  });

  it("should recover and invoke onReset when Retry button is clicked", async () => {
    // Arrange
    let resetCount = 0;
    const handleReset = () => {
      resetCount += 1;
    };

    let shouldCrash = true;
    const FailableChild = () => {
      if (shouldCrash) {
        throw new Error("Temporary Glitch");
      }
      return <div data-testid="recovered-content">Recovered!</div>;
    };

    const originalConsoleError = console.error;
    console.error = () => {};

    try {
      const { container, click } = await renderIntoDom(
        <GameErrorBoundary onReset={handleReset}>
          <FailableChild />
        </GameErrorBoundary>,
        { mode: "none" }
      );

      // Act
      shouldCrash = false;
      const retryButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Retry")
      );
      expect(retryButton).toBeDefined();
      if (retryButton) {
        await click(retryButton);
      }

      // Assert
      expect(resetCount).toBe(1);
    } finally {
      console.error = originalConsoleError;
    }
  });
});
