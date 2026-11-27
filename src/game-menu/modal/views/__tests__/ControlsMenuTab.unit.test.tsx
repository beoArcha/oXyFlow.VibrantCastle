import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { gameInputs } from "@game/loop/input";
import { PlayerId } from "@game/types";
import { ControlsMenuTab } from "../ControlsMenuTab";

function findDialogButton(label: string): HTMLElement | undefined {
  const dialog = document.querySelector('[role="dialog"]');
  return Array.from(dialog?.querySelectorAll("button") ?? []).find(
    (btn) => btn.textContent?.trim() === label
  ) as HTMLElement | undefined;
}

describe("ControlsMenuTab keyboard reset", () => {
  beforeEach(() => {
    setupDomEnvironment();
    gameInputs.resetToDefaults();
  });

  afterEach(async () => {
    await cleanupDom();
    gameInputs.resetToDefaults();
  });

  it("keeps keyboard bindings unchanged until the reset is confirmed", async () => {
    gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyX"]);

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <ControlsMenuTab onStartRebind={() => {}} />
      </TestProviders>
    );

    await click(container.querySelector("#reset-keyboard-bindings-btn") as HTMLElement);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toEqual(["KeyX"]);

    await click(findDialogButton("Anuluj") as HTMLElement);
    expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toEqual(["KeyX"]);

    await click(container.querySelector("#reset-keyboard-bindings-btn") as HTMLElement);
    await click(findDialogButton("Przywróć") as HTMLElement);

    expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).not.toEqual(["KeyX"]);
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await unmount();
  });
});
