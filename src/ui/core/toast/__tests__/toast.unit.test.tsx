import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Toast } from "../toast";

describe("Toast Primitive Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render nothing when message is empty and no children provided", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(<Toast message="" />);

    // Assert
    expect(container.innerHTML).toBe("");
  });

  it("should render message with role='status' and aria-live='polite'", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Toast message="Key successfully bound!" />
    );
    const toast = container.querySelector('[role="status"]');

    // Assert
    expect(toast).not.toBeNull();
    expect(toast?.getAttribute("aria-live")).toBe("polite");
    expect(toast?.textContent).toContain("Key successfully bound!");
  });

  it("should apply variant classes correctly via CVA", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Toast message="Warning alert" variant="warning" position="inline" />
    );
    const toast = container.querySelector('[role="status"]');

    // Assert
    expect(toast?.className).toContain("bg-orange-600");
    expect(toast?.className).toContain("w-full");
  });

  it("should invoke onDismiss after specified duration", async () => {
    // Arrange
    const onDismiss = mock(() => {});

    // Act
    await renderIntoDom(
      <Toast message="Expiring soon" duration={50} onDismiss={onDismiss} />
    );
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Assert
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
