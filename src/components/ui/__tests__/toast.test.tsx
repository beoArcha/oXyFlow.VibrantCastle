import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Toast, useToast } from "../index";

describe("Toast Primitive & useToast Hook", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("Toast Component", () => {
    it("renders nothing when message is empty and no children provided", async () => {
      const { container, unmount } = await renderIntoDom(<Toast message="" />);
      expect(container.innerHTML).toBe("");
      await unmount();
    });

    it("renders message with accessible role='status' and aria-live='polite'", async () => {
      const { container, unmount } = await renderIntoDom(
        <Toast message="Key successfully bound!" />
      );

      const toast = container.querySelector('[role="status"]');
      expect(toast).not.toBeNull();
      expect(toast?.getAttribute("aria-live")).toBe("polite");
      expect(toast?.textContent).toContain("Key successfully bound!");

      await unmount();
    });

    it("applies variant classes correctly", async () => {
      const { container, unmount } = await renderIntoDom(
        <Toast message="Warning alert" variant="warning" position="inline" />
      );

      const toast = container.querySelector('[role="status"]');
      expect(toast?.className).toContain("bg-orange-600");
      expect(toast?.className).toContain("w-full");

      await unmount();
    });

    it("auto-dismisses by invoking onDismiss after duration", async () => {
      const onDismiss = mock(() => {});

      const { unmount } = await renderIntoDom(
        <Toast message="Expiring soon" duration={50} onDismiss={onDismiss} />
      );

      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(onDismiss).toHaveBeenCalledTimes(1);

      await unmount();
    });
  });

  describe("useToast Hook", () => {
    it("initializes with empty message and updates on showToast and dismissToast", async () => {
      const { result, unmount } = await renderCustomHook(() => useToast(100));

      expect(result.current.toastMessage).toBe("");

      await act(async () => {
        result.current.showToast("Item saved!");
      });

      expect(result.current.toastMessage).toBe("Item saved!");

      await act(async () => {
        result.current.dismissToast();
      });

      expect(result.current.toastMessage).toBe("");

      await unmount();
    });

    it("clears message automatically after duration expires", async () => {
      const { result, unmount } = await renderCustomHook(() => useToast(60));

      await act(async () => {
        result.current.showToast("Quick notice");
      });

      expect(result.current.toastMessage).toBe("Quick notice");

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(result.current.toastMessage).toBe("");

      await unmount();
    });
  });
});
