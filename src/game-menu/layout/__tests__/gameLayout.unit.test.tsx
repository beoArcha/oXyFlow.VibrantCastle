import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { GameLayout } from "../GameLayout";
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

  it("renders Root with the game root id and calls onInteract on pointer and key events", async () => {
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

    rootEl?.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(handleInteract).toHaveBeenCalledTimes(1);

    rootEl?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(handleInteract).toHaveBeenCalledTimes(2);
  });

  it("merges a custom className into the Header's base classes", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.Header className="custom-header">
        <span>Header Navigation</span>
      </GameLayout.Header>
    );
    unmount = rendered.unmount;

    const header = rendered.container.querySelector("header");
    expect(header).not.toBeNull();
    expect(header?.classList.contains("custom-header")).toBe(true);
    expect(header?.classList.contains("shrink-0")).toBe(true);
    expect(header?.textContent).toContain("Header Navigation");
  });

  it("renders Brand title and subtitle when no location name is given", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.Brand title="Castle of Legends" subtitle="A 2D Roguelite Odyssey" />
    );
    unmount = rendered.unmount;

    const heading = rendered.container.querySelector("h1");
    expect(heading?.textContent).toBe("Castle of Legends");
    expect(rendered.container.textContent).toContain("A 2D Roguelite Odyssey");
    expect(rendered.container.querySelector("[title]")).toBeNull();
  });

  it("renders Brand location name with a title attribute and hides the subtitle", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.Brand title="Castle" locationName="Grand Bastion" subtitle="Ignored subtitle" />
    );
    unmount = rendered.unmount;

    const locationEl = rendered.container.querySelector("[title='Grand Bastion']");
    expect(locationEl).not.toBeNull();
    expect(locationEl?.textContent).toContain("Grand Bastion");
    expect(rendered.container.textContent).not.toContain("Ignored subtitle");
  });

  it("renders Actions and HotkeyGroup children with a default navigation landmark", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.Actions>
        <GameLayout.HotkeyGroup>
          <span>Hotkey 1</span>
        </GameLayout.HotkeyGroup>
      </GameLayout.Actions>
    );
    unmount = rendered.unmount;

    expect(rendered.container.textContent).toContain("Hotkey 1");
    expect(rendered.container.querySelector("nav")?.getAttribute("aria-label")).toBe(
      "Primary navigation"
    );
  });

  it("uses a custom aria-label for HotkeyGroup when provided", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.HotkeyGroup ariaLabel="Dev tools">
        <span>Tool</span>
      </GameLayout.HotkeyGroup>
    );
    unmount = rendered.unmount;

    expect(rendered.container.querySelector("nav")?.getAttribute("aria-label")).toBe("Dev tools");
  });

  it("renders HotkeyHint with its hotkey, icon, default tooltip and click handler", async () => {
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
    expect(button?.getAttribute("title")).toBe("Help [H]");
    expect(rendered.container.querySelector("[data-testid='help-icon']")).not.toBeNull();

    await rendered.click(button!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("prefers an explicit tooltip over the derived label and hotkey title", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.HotkeyHint label="Map" hotkey="M" tooltip="Open the map" />
    );
    unmount = rendered.unmount;

    expect(rendered.container.querySelector("button")?.getAttribute("title")).toBe("Open the map");
  });

  it("reflects the pressed state through aria-pressed on HotkeyHint", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.HotkeyHint label="Stats" ariaPressed={true} active />
    );
    unmount = rendered.unmount;

    expect(rendered.container.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
  });

  it("renders Main as the main landmark containing the viewport", async () => {
    const rendered = await renderIntoDom(
      <GameLayout.Main>
        <div id="canvas-wrapper">Canvas</div>
      </GameLayout.Main>
    );
    unmount = rendered.unmount;

    const main = rendered.container.querySelector("main");
    expect(main).not.toBeNull();
    expect(main?.querySelector("#canvas-wrapper")).not.toBeNull();
  });

  it("exposes every part on the compound object", () => {
    expect(typeof GameLayout.Root).toBe("function");
    expect(typeof GameLayout.Header).toBe("function");
    expect(typeof GameLayout.Brand).toBe("function");
    expect(typeof GameLayout.Actions).toBe("function");
    expect(typeof GameLayout.HotkeyGroup).toBe("function");
    expect(typeof GameLayout.HotkeyHint).toBe("function");
    expect(typeof GameLayout.Main).toBe("function");
  });
});
