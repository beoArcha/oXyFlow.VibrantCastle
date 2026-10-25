import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Button } from "../button";
import { IconButton } from "../icon-button";

describe("Button Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render button with children and default data-slot when mounted", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(<Button>Click Me</Button>, { mode: "none" });
    const button = container.querySelector("button");

    // Assert
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe("Click Me");
    expect(button?.getAttribute("data-slot")).toBe("button");
    expect(button?.getAttribute("type")).toBe("button");
  });

  it("should execute onClick callback when clicked by user", async () => {
    // Arrange
    const handleClick = mock(() => {});
    const { container, click } = await renderIntoDom(
      <Button onClick={handleClick}>Action</Button>,
      { mode: "none" }
    );
    const button = container.querySelector("button")!;

    // Act
    await click(button);

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should disable button and set aria-disabled when disabled prop is true", async () => {
    // Arrange
    const handleClick = mock(() => {});
    const { container, click } = await renderIntoDom(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
      { mode: "none" }
    );
    const button = container.querySelector("button")!;

    // Act
    await click(button);

    // Assert
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(handleClick).toHaveBeenCalledTimes(0);
  });

  it("should show loading spinner and set aria-busy when isLoading is true", async () => {
    // Arrange
    const handleClick = mock(() => {});
    const { container, click } = await renderIntoDom(
      <Button isLoading onClick={handleClick}>
        Loading
      </Button>,
      { mode: "none" }
    );
    const button = container.querySelector("button")!;

    // Act
    await click(button);

    // Assert
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(handleClick).toHaveBeenCalledTimes(0);
  });
});

describe("IconButton Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should require accessible label and render data-slot icon-button", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <IconButton aria-label="Close dialog" icon={<span>X</span>} />,
      { mode: "none" }
    );
    const button = container.querySelector("button");

    // Assert
    expect(button).not.toBeNull();
    expect(button?.getAttribute("data-slot")).toBe("icon-button");
    expect(button?.getAttribute("aria-label")).toBe("Close dialog");
  });

  it("should not execute click handler when isLoading is true", async () => {
    // Arrange
    const handleClick = mock(() => {});
    const { container, click } = await renderIntoDom(
      <IconButton
        isLoading
        aria-label="Refresh"
        onClick={handleClick}
        icon={<span>R</span>}
      />,
      { mode: "none" }
    );
    const button = container.querySelector("button")!;

    // Act
    await click(button);

    // Assert
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(handleClick).toHaveBeenCalledTimes(0);
  });
});
