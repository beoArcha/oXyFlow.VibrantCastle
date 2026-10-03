import { describe, it, expect, mock } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { I18nProvider } from "@context/I18nContext";
import { VolumePresetBar } from "../audio/VolumePresetBar";

describe("VolumePresetBar (Shared Menu Control)", () => {
  it("renders all default presets with proper active highlighting", async () => {
    await cleanupDom();
    const onSelectPercent = mock();

    const { container, unmount } = await renderIntoDom(
      <I18nProvider defaultLanguage="en">
        <VolumePresetBar activePercent={50} onSelectPercent={onSelectPercent} />
      </I18nProvider>
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(5);

    // 0% should be Mute / Wycisz label
    expect(["Mute", "Wycisz"]).toContain(buttons[0].textContent?.trim() || "");
    expect(buttons[1].textContent).toBe("25%");
    expect(buttons[2].textContent).toBe("50%");
    expect(buttons[3].textContent).toBe("75%");
    expect(buttons[4].textContent).toBe("100%");

    // 50% should have active classes (bg-amber-600)
    expect(buttons[2].className).toContain("bg-amber-600");
    expect(buttons[0].className).not.toContain("bg-amber-600");

    await unmount();
  });

  it("calls onSelectPercent when preset button is clicked", async () => {
    await cleanupDom();
    let selectedPercent: number | null = null;

    const { container, unmount } = await renderIntoDom(
      <I18nProvider defaultLanguage="en">
        <VolumePresetBar
          activePercent={0}
          onSelectPercent={(p) => {
            selectedPercent = p;
          }}
        />
      </I18nProvider>
    );

    const buttons = container.querySelectorAll("button");
    buttons[3].dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectedPercent).toBe(75);

    await unmount();
  });
});
