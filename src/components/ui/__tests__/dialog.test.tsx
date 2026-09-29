import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Dialog } from "../Dialog";
import { Button } from "../Button";

describe("Dialog Primitive", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders nothing when isOpen is false", async () => {
    const { container, unmount } = await renderIntoDom(
      <Dialog isOpen={false} onClose={() => {}}>
        <p>Dialog Hidden Content</p>
      </Dialog>
    );

    expect(container.innerHTML).toBe("");
    await unmount();
  });

  it("renders with title and description using default header layout", async () => {
    const { unmount } = await renderIntoDom(
      <Dialog
        isOpen={true}
        onClose={() => {}}
        title="Sanctuary Anomaly"
        description="A spiritual perturbation occurred."
        maxWidthClass="max-w-md"
      >
        <p>Inner sanctuary status</p>
      </Dialog>
    );

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");

    const titleEl = document.querySelector("h2");
    expect(titleEl?.textContent).toBe("Sanctuary Anomaly");

    expect(document.body.textContent).toContain("A spiritual perturbation occurred.");
    expect(document.body.textContent).toContain("Inner sanctuary status");

    await unmount();
  });

  it("supports compound composition with Dialog.Header, Dialog.Title, and Dialog.Footer", async () => {
    const onClose = mock(() => {});

    const { click, unmount } = await renderIntoDom(
      <Dialog isOpen={true} onClose={onClose} showCloseButton={false}>
        <Dialog.Header>
          <Dialog.Title>Custom Vault Dialogue</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <p>Vault contents inspected.</p>
        </Dialog.Body>
        <Dialog.Footer>
          <Button id="vault-dismiss-btn" onClick={onClose}>
            Dismiss
          </Button>
        </Dialog.Footer>
      </Dialog>
    );

    expect(document.body.textContent).toContain("Custom Vault Dialogue");
    expect(document.body.textContent).toContain("Vault contents inspected.");

    const dismissBtn = document.querySelector("#vault-dismiss-btn");
    expect(dismissBtn).not.toBeNull();

    if (dismissBtn) {
      await click(dismissBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    }

    await unmount();
  });

  it("triggers onClose when close button is clicked", async () => {
    const onClose = mock(() => {});

    const { click, unmount } = await renderIntoDom(
      <Dialog isOpen={true} onClose={onClose} title="Closable Dialog">
        <p>Content</p>
      </Dialog>
    );

    const closeBtn = document.querySelector(".lucide-x")?.closest("button");
    expect(closeBtn).toBeDefined();

    if (closeBtn) {
      await click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    }

    await unmount();
  });
});
