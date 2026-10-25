import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Dialog } from "../dialog";

describe("Dialog Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render dialog content when open is true", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Dialog open={true}>
        <Dialog.Content data-testid="dialog-popup">
          <Dialog.Title>Gothic Gate</Dialog.Title>
          <Dialog.Description>A heavy iron gate blocks the path.</Dialog.Description>
        </Dialog.Content>
      </Dialog>,
      { mode: "none" }
    );
    const content = document.querySelector("[data-slot='dialog-content']");
    const title = document.querySelector("[data-slot='dialog-title']");
    const description = document.querySelector("[data-slot='dialog-description']");

    // Assert
    expect(content).not.toBeNull();
    expect(title?.textContent).toBe("Gothic Gate");
    expect(description?.textContent).toBe("A heavy iron gate blocks the path.");
  });

  it("should support backward-compatible simple props API", async () => {
    // Arrange
    const handleClose = mock(() => {});

    // Act
    await renderIntoDom(
      <Dialog isOpen={true} onClose={handleClose} title="Legacy Modal Title">
        <p>Simple Modal Body</p>
      </Dialog>,
      { mode: "none" }
    );
    const title = document.querySelector("[data-slot='dialog-title']");
    const closeBtn = document.querySelector("[data-slot='dialog-close']");

    // Assert
    expect(title?.textContent).toBe("Legacy Modal Title");
    expect(closeBtn).not.toBeNull();
  });

  it("should not render content in DOM when open is false", async () => {
    // Arrange & Act
    await renderIntoDom(
      <Dialog open={false}>
        <Dialog.Content>Hidden Content</Dialog.Content>
      </Dialog>,
      { mode: "none" }
    );
    const content = document.querySelector("[data-slot='dialog-content']");

    // Assert
    expect(content).toBeNull();
  });
});
