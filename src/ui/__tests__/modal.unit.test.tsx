import React, { createRef, act } from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  ConfirmDialog,
} from "@ui";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";

describe("Modal Component & Compound Dialogue Architecture", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("Visibility & Rendering Lifecycle", () => {
    it("renders nothing when isOpen is false", async () => {
      const { container } = await renderIntoDom(
        <Modal isOpen={false} onClose={() => {}} title="Hidden Modal">
          <p>Hidden Content</p>
        </Modal>
      );

      expect(container.innerHTML).toBe("");
    });

    it("renders modal dialog, title, subtitle, icon, and body when isOpen is true", async () => {
      const { container } = await renderIntoDom(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Pause Menu"
          subtitle="Game is paused"
          icon={<span data-testid="pause-icon">⏸</span>}
          headerRight={<span data-testid="header-extra">Extra</span>}
        >
          <p data-testid="modal-text">Continue playing</p>
        </Modal>
      );

      expect(document.body.querySelector("[role='dialog']")).not.toBeNull();
      expect(document.body.textContent).toContain("Pause Menu");
      expect(document.body.textContent).toContain("Game is paused");
      expect(document.body.textContent).toContain("Continue playing");
      expect(document.body.querySelector("[data-testid='pause-icon']")).not.toBeNull();
      expect(document.body.querySelector("[data-testid='header-extra']")).not.toBeNull();

      const dialog = document.body.querySelector("[role='dialog']");
      expect(dialog?.getAttribute("aria-modal")).toBe("true");
      expect(dialog?.getAttribute("aria-labelledby")).toBeTruthy();
    });

    it("renders into a custom portal container or document.body via Portal", async () => {
      const customPortal = document.createElement("div");
      customPortal.id = "custom-portal-root";
      document.body.appendChild(customPortal);

      await renderIntoDom(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Portal Test"
          portalContainer={customPortal}
        >
          <p>Inside Portal</p>
        </Modal>
      );

      expect(customPortal.querySelector("[role='dialog']")).not.toBeNull();
      expect(customPortal.textContent).toContain("Inside Portal");

      customPortal.remove();
    });

    it("supports inline rendering when usePortal is false", async () => {
      const { container } = await renderIntoDom(
        <Modal isOpen={true} onClose={() => {}} title="Inline Modal" usePortal={false}>
          <p>Inline Content</p>
        </Modal>
      );

      expect(container.querySelector("[role='dialog']")).not.toBeNull();
    });

    it("locks and restores document.body overflow style", async () => {
      document.body.style.overflow = "visible";

      const { unmount } = await renderIntoDom(
        <Modal isOpen={true} onClose={() => {}} title="Lock Test">
          <p>Content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe("hidden");

      await unmount();
      expect(document.body.style.overflow).toBe("visible");
    });
  });

  describe("Responsive Geometry & Mobile Landscape Fixes", () => {
    it("does not apply rigid min-h-[520px] and utilizes dynamic dvh sizing", async () => {
      await renderIntoDom(
        <Modal isOpen={true} onClose={() => {}} title="Responsive Test">
          <p>Content</p>
        </Modal>
      );

      const dialog = document.body.querySelector("[role='dialog']") as HTMLElement;
      expect(dialog.className).not.toContain("min-h-[520px]");
      expect(dialog.className).toContain("max-h-[92dvh]");
    });
  });

  describe("Domain Decoupling & Keyboard / User Interactions", () => {
    it("calls onClose when the close (X) button is clicked", async () => {
      const handleClose = mock(() => {});
      const { click } = await renderIntoDom(
        <Modal isOpen={true} onClose={handleClose} title="Close Button Test">
          <p>Body</p>
        </Modal>
      );

      const closeButton = document.body.querySelector("button:last-child") as HTMLButtonElement;
      expect(closeButton).not.toBeNull();

      await click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when clicking directly on the backdrop when closeOnBackdropClick is true", async () => {
      const handleClose = mock(() => {});
      const { click } = await renderIntoDom(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Backdrop Test"
          closeOnBackdropClick={true}
        >
          <p>Content</p>
        </Modal>
      );

      const backdrop = document.body.querySelector(".fixed.inset-0") as HTMLElement;
      await click(backdrop);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT call onClose when clicking backdrop if closeOnBackdropClick is false", async () => {
      const handleClose = mock(() => {});
      const { click } = await renderIntoDom(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="No Backdrop Close"
          closeOnBackdropClick={false}
        >
          <p>Content</p>
        </Modal>
      );

      const backdrop = document.body.querySelector(".fixed.inset-0") as HTMLElement;
      await click(backdrop);

      expect(handleClose).toHaveBeenCalledTimes(0);
    });

    it("does NOT call onClose when clicking inside the dialog content", async () => {
      const handleClose = mock(() => {});
      const { click } = await renderIntoDom(
        <Modal isOpen={true} onClose={handleClose} title="Inside Click Test">
          <button data-testid="inner-button">Action Button</button>
        </Modal>
      );

      const innerButton = document.body.querySelector("[data-testid='inner-button']") as HTMLElement;
      await click(innerButton);

      expect(handleClose).toHaveBeenCalledTimes(0);
    });

    it("calls onClose when Escape key is pressed by default", async () => {
      const handleClose = mock(() => {});
      await renderIntoDom(
        <Modal isOpen={true} onClose={handleClose} title="Escape Test">
          <p>Press ESC</p>
        </Modal>
      );

      await act(async () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT close on 'p' by default (game domain decoupled)", async () => {
      const handleClose = mock(() => {});
      await renderIntoDom(
        <Modal isOpen={true} onClose={handleClose} title="No Game Key Leak">
          <p>Test</p>
        </Modal>
      );

      await act(async () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "p", bubbles: true }));
      });

      expect(handleClose).toHaveBeenCalledTimes(0);
    });

    it("closes on custom keys when configured via closeKeys", async () => {
      const handleClose = mock(() => {});
      await renderIntoDom(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Custom Keys"
          closeKeys={["Escape", "p", "P"]}
        >
          <p>Pause Modal</p>
        </Modal>
      );

      await act(async () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "p", bubbles: true }));
      });

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT trigger close when keydown target is an input or textarea", async () => {
      const handleClose = mock(() => {});
      await renderIntoDom(
        <Modal isOpen={true} onClose={handleClose} title="Input Focus Protection">
          <input data-testid="modal-input" defaultValue="search" />
        </Modal>
      );

      const input = document.body.querySelector("[data-testid='modal-input']") as HTMLInputElement;
      input.focus();

      await act(async () => {
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });

      expect(handleClose).toHaveBeenCalledTimes(0);
    });
  });

  describe("Window Maximize & Resize Features", () => {
    it("toggles maximize state and applies full viewport classes", async () => {
      const { click } = await renderIntoDom(
        <Modal isOpen={true} onClose={() => {}} title="Maximize Test" allowMaximize={true}>
          <p>Max Content</p>
        </Modal>
      );

      const dialog = document.body.querySelector("[role='dialog']") as HTMLElement;
      expect(dialog.className).not.toContain("max-w-[98vw]");

      const buttons = document.body.querySelectorAll("button");
      const maximizeButton = buttons[0];
      await click(maximizeButton);

      expect(dialog.className).toContain("max-w-[98vw]");
      expect(dialog.className).toContain("h-[95dvh]");
    });
  });

  describe("Compound Component Architecture & Subcomponents", () => {
    it("supports complete low-level compound composition with footer and custom layout", async () => {
      const handleClose = mock(() => {});
      const { click } = await renderIntoDom(
        <Modal isOpen={true} onClose={handleClose}>
          <Modal.Content data-testid="compound-content" maxWidthClass="max-w-2xl">
            <Modal.Header data-testid="compound-header">
              <Modal.Title icon={<span data-testid="title-icon">⚔</span>}>
                Inventory Management
              </Modal.Title>
              <Modal.CloseButton data-testid="custom-close" />
            </Modal.Header>
            <Modal.Body data-testid="compound-body">
              <p>Custom Body List</p>
            </Modal.Body>
            <Modal.Footer data-testid="compound-footer">
              <button data-testid="confirm-btn">Confirm</button>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      );

      expect(document.body.querySelector("[data-testid='compound-content']")).not.toBeNull();
      expect(document.body.querySelector("[data-testid='compound-header']")).not.toBeNull();
      expect(document.body.querySelector("[data-testid='title-icon']")).not.toBeNull();
      expect(document.body.textContent).toContain("Inventory Management");
      expect(document.body.querySelector("[data-testid='compound-body']")).not.toBeNull();
      expect(document.body.textContent).toContain("Custom Body List");
      expect(document.body.querySelector("[data-testid='compound-footer']")).not.toBeNull();
      expect(document.body.querySelector("[data-testid='confirm-btn']")).not.toBeNull();

      const customClose = document.body.querySelector("[data-testid='custom-close']") as HTMLElement;
      await click(customClose);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("supports standalone named subcomponent exports", async () => {
      await renderIntoDom(
        <Modal isOpen={true} onClose={() => {}}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Standalone Header</ModalTitle>
              <ModalCloseButton />
            </ModalHeader>
            <ModalBody>Standalone Body</ModalBody>
            <ModalFooter>Standalone Footer</ModalFooter>
          </ModalContent>
        </Modal>
      );

      expect(document.body.textContent).toContain("Standalone Header");
      expect(document.body.textContent).toContain("Standalone Body");
      expect(document.body.textContent).toContain("Standalone Footer");
    });

    it("forwards refs to Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter, ModalCloseButton", async () => {
      const rootRef = createRef<HTMLDivElement>();
      const contentRef = createRef<HTMLDivElement>();
      const headerRef = createRef<HTMLDivElement>();
      const titleRef = createRef<HTMLHeadingElement>();
      const bodyRef = createRef<HTMLDivElement>();
      const footerRef = createRef<HTMLDivElement>();
      const closeRef = createRef<HTMLButtonElement>();

      await renderIntoDom(
        <Modal ref={rootRef} isOpen={true} onClose={() => {}}>
          <Modal.Content ref={contentRef}>
            <Modal.Header ref={headerRef}>
              <Modal.Title ref={titleRef}>Ref Title</Modal.Title>
              <Modal.CloseButton ref={closeRef} />
            </Modal.Header>
            <Modal.Body ref={bodyRef}>Ref Body</Modal.Body>
            <Modal.Footer ref={footerRef}>Ref Footer</Modal.Footer>
          </Modal.Content>
        </Modal>
      );

      expect(rootRef.current).not.toBeNull();
      expect(contentRef.current?.getAttribute("role")).toBe("dialog");
      expect(headerRef.current).not.toBeNull();
      expect(titleRef.current?.tagName.toLowerCase()).toBe("h2");
      expect(bodyRef.current).not.toBeNull();
      expect(footerRef.current).not.toBeNull();
      expect(closeRef.current?.tagName.toLowerCase()).toBe("button");
    });
  });

  describe("ConfirmDialog Component", () => {
    it("renders nothing when isOpen is false", async () => {
      const { container } = await renderIntoDom(
        <ConfirmDialog
          isOpen={false}
          title="Reset Character?"
          message="Are you sure you want to reset?"
          onConfirm={() => {}}
          onClose={() => {}}
          usePortal={false}
        />
      );

      expect(container.textContent).toBe("");
    });

    it("renders title, message, and action buttons when isOpen is true", async () => {
      const handleClose = mock(() => {});
      const handleConfirm = mock(() => {});

      const { container, click } = await renderIntoDom(
        <ConfirmDialog
          isOpen={true}
          title="Delete Save Slot"
          message="This action is irreversible and will delete your save."
          confirmLabel="Yes, Delete"
          cancelLabel="No, Keep"
          confirmVariant="danger"
          onClose={handleClose}
          onConfirm={handleConfirm}
          usePortal={false}
        />
      );

      expect(container.textContent).toContain("Delete Save Slot");
      expect(container.textContent).toContain("This action is irreversible and will delete your save.");
      expect(container.textContent).toContain("Yes, Delete");
      expect(container.textContent).toContain("No, Keep");

      const cancelBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("No, Keep")
      );
      expect(cancelBtn).toBeDefined();
      await click(cancelBtn!);
      expect(handleClose).toHaveBeenCalledTimes(1);

      const confirmBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Yes, Delete")
      );
      expect(confirmBtn).toBeDefined();
      await click(confirmBtn!);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it("disables cancel button and sets loading state on confirm button during isLoading", async () => {
      const { container } = await renderIntoDom(
        <ConfirmDialog
          isOpen={true}
          title="Processing Action"
          message="Please wait while saving..."
          isLoading={true}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onClose={() => {}}
          onConfirm={() => {}}
          usePortal={false}
        />
      );

      const cancelBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Cancel")
      ) as HTMLButtonElement;
      expect(cancelBtn.disabled).toBe(true);

      const confirmBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Confirm")
      ) as HTMLButtonElement;
      expect(confirmBtn.disabled).toBe(true);
    });
  });
});

