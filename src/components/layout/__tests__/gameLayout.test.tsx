import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import {
  GameLayout,
  GameLayoutRoot,
  GameLayoutHeader,
  GameLayoutBrand,
  GameLayoutActions,
  GameLayoutHotkeyGroup,
  GameLayoutHotkeyHint,
  GameLayoutMain,
} from "../GameLayout";
import { HelpCircle } from "lucide-react";

describe("GameLayout Compound Component", () => {
  let unmount: (() => Promise<void>) | null = null;

  beforeEach(() => {
    unmount = null;
  });

  afterEach(async () => {
    if (unmount) {
      await unmount();
      unmount = null;
    }
    cleanupDom();
  });

  it("renders GameLayout.Root with default ID and calls onInteract on click/keydown", async () => {
    const handleInteract = mock();
    const rendered = await renderIntoDom(
      <GameLayout.Root onInteract={handleInteract}>
        <span>Viewport Content</span>
      </GameLayout.Root>
    );
    unmount = rendered.unmount;

    const rootEl = rendered.container.querySelector("#game-root-container");
    expect(rootEl).not.toBeNull();
    expect(rendered.container.textContent).toContain("Viewport Content");

    await rendered.click(rootEl!);
    expect(handleInteract).toHaveBeenCalledTimes(1);
  });

  it("renders GameLayout.Header with custom and default classes", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.Header className="custom-header">
        <span>Header Navigation</span>
      </GameLayout.Header>
    );
    unmount = rendered.unmount;

    const header = rendered.container.querySelector("#game-header");
    expect(header).not.toBeNull();
    expect(header?.classList.contains("custom-header")).toBe(true);
    expect(header?.textContent).toContain("Header Navigation");
  });

  it("renders GameLayout.Brand with title, subtitle, and default icon", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.Brand title="Castle of Legends" subtitle="A 2D Roguelite Odyssey" />
    );
    unmount = rendered.unmount;

    const titleEl = rendered.container.querySelector("#app-title");
    const descEl = rendered.container.querySelector("#app-description");

    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe("Castle of Legends");
    expect(descEl).not.toBeNull();
    expect(descEl?.textContent).toBe("A 2D Roguelite Odyssey");
  });

  it("renders GameLayout.Brand with custom icon and without subtitle when omitted", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.Brand
        title="Minimal Title"
        icon={<span id="custom-logo">🏰</span>}
      />
    );
    unmount = rendered.unmount;

    expect(rendered.container.querySelector("#custom-logo")).not.toBeNull();
    expect(rendered.container.querySelector("#app-description")).toBeNull();
  });

  it("renders GameLayout.Actions and GameLayout.HotkeyGroup", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.Actions>
        <GameLayout.HotkeyGroup>
          <span>Hotkey 1</span>
        </GameLayout.HotkeyGroup>
      </GameLayout.Actions>
    );
    unmount = rendered.unmount;

    expect(rendered.container.textContent).toContain("Hotkey 1");
  });

  it("renders GameLayout.HotkeyHint and handles button clicks", async () => {
    const handleClick = mock();
    const rendered = await renderIntoDom(
      <GameLayout.HotkeyHint
        hotkey="H"
        label="Help"
        icon={<HelpCircle data-testid="help-icon" size={13} />}
        onClick={handleClick}
      />
    );
    unmount = rendered.unmount;

    const button = rendered.container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain("Help");
    expect(button?.textContent).toContain("H");
    expect(rendered.container.querySelector("[data-testid='help-icon']")).not.toBeNull();

    await rendered.click(button!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders GameLayout.Main with default ID and full viewport styling", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.Main>
        <div id="canvas-wrapper">Canvas</div>
      </GameLayout.Main>
    );
    unmount = rendered.unmount;

    const main = rendered.container.querySelector("#game-main-content");
    expect(main).not.toBeNull();
    expect(rendered.container.querySelector("#canvas-wrapper")).not.toBeNull();
  });

  it("supports both compound and named imports identically", () => {
    expect(GameLayout.Root).toBe(GameLayoutRoot);
    expect(GameLayout.Header).toBe(GameLayoutHeader);
    expect(GameLayout.Brand).toBe(GameLayoutBrand);
    expect(GameLayout.Actions).toBe(GameLayoutActions);
    expect(GameLayout.HotkeyGroup).toBe(GameLayoutHotkeyGroup);
    expect(GameLayout.HotkeyHint).toBe(GameLayoutHotkeyHint);
    expect(GameLayout.Main).toBe(GameLayoutMain);
  });
});
