import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { CharacterPortrait } from "../CharacterPortrait";
import { CHARACTER_MANIFESTS } from "@game/engine/characterManifests";

describe("CharacterPortrait", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders the manifest portrait for the given character without any provider", async () => {
    const { container } = await renderIntoDom(<CharacterPortrait characterId="valen" />);

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    const manifest = CHARACTER_MANIFESTS.valen;
    expect(img?.getAttribute("src")).toBe(manifest.portraitThumbUrl || manifest.portraitUrl || "");
    expect(img?.getAttribute("alt")).toBe("Valen");
    expect(img?.getAttribute("draggable")).toBe("false");
  });

  it("applies the lg size preset and merges the custom className", async () => {
    const { container } = await renderIntoDom(
      <CharacterPortrait characterId="valen" size="lg" className="custom-portrait" />
    );

    const img = container.querySelector("img");
    expect(img?.classList.contains("w-20")).toBe(true);
    expect(img?.classList.contains("h-20")).toBe(true);
    expect(img?.classList.contains("custom-portrait")).toBe(true);
  });

  it("fills its container when no size preset is given", async () => {
    const { container } = await renderIntoDom(<CharacterPortrait characterId="valen" />);

    const img = container.querySelector("img");
    expect(img?.classList.contains("w-full")).toBe(true);
    expect(img?.classList.contains("h-full")).toBe(true);
  });

  it("uses an explicit alt text when provided", async () => {
    const { container } = await renderIntoDom(
      <CharacterPortrait characterId="aurelia" alt="Aurelia close-up" />
    );

    expect(container.querySelector("img")?.getAttribute("alt")).toBe("Aurelia close-up");
  });

  it("falls back to the valen manifest for an unknown character id", async () => {
    const { container } = await renderIntoDom(<CharacterPortrait characterId="nobody" />);

    const img = container.querySelector("img");
    expect(img?.getAttribute("alt")).toBe("Valen");
    const manifest = CHARACTER_MANIFESTS.valen;
    expect(img?.getAttribute("src")).toBe(manifest.portraitThumbUrl || manifest.portraitUrl || "");
  });
});
