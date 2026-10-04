import { describe, it, expect, mock } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { SettingToggleRow, SettingOptionCard } from "@ui";

describe("Setting Controls (Design System)", () => {
  describe("SettingToggleRow", () => {
    it("renders title, description and icon properly", async () => {
      await cleanupDom();
      const onCheckedChange = mock();

      const { container, unmount } = await renderIntoDom(
        <SettingToggleRow
          title="RPG Buttons"
          description="Display shortcuts on HUD"
          icon={<span data-testid="test-icon">icon</span>}
          checked={true}
          onCheckedChange={onCheckedChange}
        />
      );

      expect(container.textContent).toContain("RPG Buttons");
      expect(container.textContent).toContain("Display shortcuts on HUD");
      expect(container.querySelector("[data-testid='test-icon']")).not.toBeNull();

      const switchBtn = container.querySelector("button[role='switch']");
      expect(switchBtn).not.toBeNull();
      expect(switchBtn?.getAttribute("aria-checked")).toBe("true");

      await unmount();
    });

    it("triggers onCheckedChange callback when clicked", async () => {
      await cleanupDom();
      let changedState: boolean | null = null;

      const { container, unmount } = await renderIntoDom(
        <SettingToggleRow
          title="Audio Subtitles"
          checked={false}
          onCheckedChange={(val) => {
            changedState = val;
          }}
        />
      );

      const label = container.querySelector("label");
      label?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(changedState).toBe(true);

      await unmount();
    });
  });

  describe("SettingOptionCard", () => {
    it("renders title and selected check indicator", async () => {
      await cleanupDom();
      const onSelect = mock();

      const { container, unmount } = await renderIntoDom(
        <SettingOptionCard
          selected={true}
          onSelect={onSelect}
          title="16:9 Widescreen"
          description="Standard aspect ratio"
        />
      );

      expect(container.textContent).toContain("16:9 Widescreen");
      expect(container.textContent).toContain("Standard aspect ratio");

      const card = container.firstElementChild as HTMLElement;
      expect(card.getAttribute("aria-pressed")).toBe("true");

      await unmount();
    });

    it("handles click and keyboard Enter to trigger onSelect", async () => {
      await cleanupDom();
      let selectCount = 0;

      const { container, unmount } = await renderIntoDom(
        <SettingOptionCard
          selected={false}
          onSelect={() => {
            selectCount++;
          }}
          title="Single Player"
        />
      );

      const card = container.firstElementChild as HTMLElement;
      card.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(selectCount).toBe(1);

      card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      expect(selectCount).toBe(2);

      await unmount();
    });
  });
});
