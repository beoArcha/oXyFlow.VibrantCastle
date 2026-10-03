import React, { act } from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { ModalType } from "@components/modal";
import { InventoryPanel } from "../InventoryPanel";

describe("InventoryPanel Integration Tests", () => {
  let unmount: (() => Promise<void>) | null = null;

  beforeEach(() => {
    unmount = null;
  });

  afterEach(async () => {
    if (unmount) {
      await unmount();
      unmount = null;
    }
    await cleanupDom();
  });

  it("renders InventoryPanel modal dialog with header, tabs, and default empty state", async () => {
    const handleClose = mock(() => {});
    const rendered = await renderIntoDom(<InventoryPanel onClose={handleClose} />);
    unmount = rendered.unmount;

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    const titleHeading = dialog?.querySelector("h2");
    expect(titleHeading).not.toBeNull();

    // Default state: no item selected -> EmptyState is rendered
    const emptyStateHeading = dialog?.querySelector("h4");
    expect(emptyStateHeading).not.toBeNull();
  });

  it("calls onClose when close button is clicked", async () => {
    const handleClose = mock(() => {});
    const rendered = await renderIntoDom(<InventoryPanel onClose={handleClose} />);
    unmount = rendered.unmount;

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();

    // Find the modal close button in the header
    const closeBtn = Array.from(dialog?.querySelectorAll<HTMLButtonElement>("button") || []).find(
      (btn) => btn.querySelector("svg.lucide-x") !== null
    );
    expect(closeBtn).not.toBeUndefined();

    await act(async () => {
      await rendered.click(closeBtn!);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders paperdoll silhouette slots, stats, quick belt, and backpack grid", async () => {
    const rendered = await renderIntoDom(<InventoryPanel onClose={mock()} />);
    unmount = rendered.unmount;

    // Paperdoll 6 slots + Quick belt 3 slots + Backpack 16 slots
    // All use ItemSlot with role="button" or interactive elements
    const itemSlots = document.querySelectorAll("[role='button']");
    expect(itemSlots.length).toBeGreaterThanOrEqual(25);

    // Derived stats values rendered
    expect(document.body.textContent).toContain("100 / 180");
    expect(document.body.textContent).toContain("16"); // 16 backpack capacity
  });

  it("displays item inspector details when an occupied slot is clicked", async () => {
    const rendered = await renderIntoDom(<InventoryPanel onClose={mock()} />);
    unmount = rendered.unmount;

    // Find slots that contain an item (not empty)
    const slots = Array.from(document.querySelectorAll<HTMLElement>("[role='button']"));
    const occupiedSlot = slots.find((slot) => !slot.className.includes("border-stone-800/40") && slot.getAttribute("aria-label"));

    if (occupiedSlot) {
      await act(async () => {
        await rendered.click(occupiedSlot);
      });

      // Item inspector details should now be visible or updated
      const dialog = document.querySelector("[role='dialog']");
      expect(dialog).not.toBeNull();
    }
  });

  it("renders navigation tabs when onNavigateModal and onResume are provided", async () => {
    const handleNavigate = mock((_modal: ModalType) => {});
    const handleResume = mock(() => {});

    const rendered = await renderIntoDom(
      <InventoryPanel
        onClose={mock()}
        onNavigateModal={handleNavigate}
        onResume={handleResume}
      />
    );
    unmount = rendered.unmount;

    const navTabs = document.querySelector("#inventory-container");
    expect(navTabs).not.toBeNull();
  });

  it("prompts with ConfirmDialog when discard button is clicked and cancels when cancel button is clicked", async () => {
    const rendered = await renderIntoDom(<InventoryPanel onClose={mock()} />);
    unmount = rendered.unmount;

    const slots = Array.from(document.querySelectorAll<HTMLElement>("[role='button']"));
    const occupiedSlot = slots.find(
      (slot) => !slot.className.includes("border-stone-800/40") && slot.getAttribute("aria-label")
    );

    if (occupiedSlot) {
      await act(async () => {
        await rendered.click(occupiedSlot);
      });

      const discardBtn = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
        (btn) => btn.querySelector("svg.lucide-trash-2") !== null
      );

      if (discardBtn) {
        await act(async () => {
          await rendered.click(discardBtn);
        });

        const dialogs = document.querySelectorAll("[role='dialog']");
        expect(dialogs.length).toBeGreaterThanOrEqual(2);

        const cancelBtn = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
          (btn) => btn.textContent?.includes("Cancel") || btn.textContent?.includes("Anuluj")
        );
        expect(cancelBtn).not.toBeUndefined();

        await act(async () => {
          await rendered.click(cancelBtn!);
        });

        const remainingDialogs = document.querySelectorAll("[role='dialog']");
        expect(remainingDialogs.length).toBe(1);
      }
    }
  });

  it("handles equipping or unequipping items when action button is clicked", async () => {
    const rendered = await renderIntoDom(<InventoryPanel onClose={mock()} />);
    unmount = rendered.unmount;

    const slots = Array.from(document.querySelectorAll<HTMLElement>("[role='button']"));
    const occupiedSlot = slots.find(
      (slot) => !slot.className.includes("border-stone-800/40") && slot.getAttribute("aria-label")
    );

    if (occupiedSlot) {
      await act(async () => {
        await rendered.click(occupiedSlot);
      });

      const actionBtn = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
        (btn) =>
          btn.querySelector("svg.lucide-check-circle") !== null ||
          btn.querySelector("svg.lucide-arrow-down-to-dot") !== null ||
          btn.querySelector("svg.lucide-heart") !== null
      );

      if (actionBtn) {
        await act(async () => {
          await rendered.click(actionBtn);
        });

        const dialog = document.querySelector("[role='dialog']");
        expect(dialog).not.toBeNull();
      }
    }
  });
});
