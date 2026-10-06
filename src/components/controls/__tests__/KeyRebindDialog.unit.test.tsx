import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { PlayerId } from "@game/types";
import { KeyRebindDialog } from "../KeyRebindDialog";

describe("KeyRebindDialog Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders null when target is null", async () => {
    const { container, unmount } = await renderIntoDom(
      <KeyRebindDialog target={null} onCancel={() => {}} />
    );

    expect(container.innerHTML).toBe("");
    await unmount();
  });

  it("renders accessible modal dialog when target is provided", async () => {
    const onCancel = mock(() => {});
    const target = {
      player: PlayerId.Player1,
      action: "jump" as const,
      label: "Jump High",
    };

    const { container, click, unmount } = await renderIntoDom(
      <KeyRebindDialog target={target} onCancel={onCancel} />
    );

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");

    const title = document.querySelector("#rebind-dialog-title");
    expect(title?.textContent).toBe("Jump High");

    const cancelBtn = document.querySelector("#cancel-rebind-btn");
    expect(cancelBtn).not.toBeNull();

    if (cancelBtn) {
      await click(cancelBtn);
      expect(onCancel).toHaveBeenCalledTimes(1);
    }

    await unmount();
  });
});
