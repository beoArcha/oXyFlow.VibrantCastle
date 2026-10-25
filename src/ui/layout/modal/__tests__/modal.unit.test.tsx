import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Modal } from "../modal";
import { ConfirmDialog } from "../confirm-dialog";

describe("Modal & ConfirmDialog Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render modal with title and content when isOpen is true", async () => {
    // Arrange
    const handleClose = mock(() => {});

    // Act
    await renderIntoDom(
      <Modal isOpen={true} onClose={handleClose} title="Crypt Vault">
        <p data-testid="modal-content">Dusty Tomes</p>
      </Modal>,
      { mode: "none" }
    );
    const title = document.querySelector("h2");
    const content = document.querySelector("[data-testid='modal-content']");

    // Assert
    expect(title?.textContent).toBe("Crypt Vault");
    expect(content?.textContent).toBe("Dusty Tomes");
  });

  it("should not render modal markup in DOM when isOpen is false", async () => {
    // Arrange & Act
    await renderIntoDom(
      <Modal isOpen={false} onClose={() => {}} title="Hidden Vault">
        <p>Secret</p>
      </Modal>,
      { mode: "none" }
    );
    const title = document.querySelector("h2");

    // Assert
    expect(title).toBeNull();
  });

  it("should render ConfirmDialog and invoke onConfirm when clicked", async () => {
    // Arrange
    const handleConfirm = mock(() => {});
    const handleClose = mock(() => {});

    // Act
    await renderIntoDom(
      <ConfirmDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Banish Demon"
        message="Are you sure you want to proceed?"
        confirmLabel="Banish"
      />,
      { mode: "none" }
    );
    const buttons = Array.from(document.querySelectorAll("button"));
    const confirmBtn = buttons.find((btn) => btn.textContent?.includes("Banish"));
    confirmBtn?.click();

    // Assert
    expect(confirmBtn).toBeDefined();
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
