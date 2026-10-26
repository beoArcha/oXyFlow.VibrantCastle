import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { KeyboundButton } from "../controls/KeyboundButton";

describe("<KeyboundButton /> (@ui/controls)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders button label and keyboard shortcut badge", async () => {
    const handleClick = mock(() => {});
    const { unmount } = await renderIntoDom(
      <KeyboundButton
        id="test-btn"
        label="Pause"
        kbdKey="P"
        kbdVariant="stone"
        onClick={handleClick}
      />
    );

    const btn = document.getElementById("test-btn") as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    expect(btn?.textContent).toContain("Pause");

    const kbd = btn?.querySelector("kbd[data-slot='kbd']");
    expect(kbd).not.toBeNull();
    expect(kbd?.textContent).toBe("P");

    btn?.click();
    expect(handleClick).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("supports responsiveLabel hiding on mobile viewports", async () => {
    const { unmount } = await renderIntoDom(
      <KeyboundButton
        id="responsive-btn"
        label="Hints"
        kbdKey="H"
        kbdVariant="amber"
        responsiveLabel
      />
    );

    const btn = document.getElementById("responsive-btn");
    const span = btn?.querySelector("span.hidden.sm\\:inline");
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe("Hints");

    const kbd = btn?.querySelector("kbd");
    expect(kbd?.textContent).toBe("H");

    await unmount();
  });

  it("renders children as fallback when label prop is omitted", async () => {
    const { unmount } = await renderIntoDom(
      <KeyboundButton id="child-btn" kbdKey="M">
        Menu
      </KeyboundButton>
    );

    const btn = document.getElementById("child-btn");
    expect(btn?.textContent).toContain("Menu");
    expect(btn?.querySelector("kbd")?.textContent).toBe("M");

    await unmount();
  });
});
