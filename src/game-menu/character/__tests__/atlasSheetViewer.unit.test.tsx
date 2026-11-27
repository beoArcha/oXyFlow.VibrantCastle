import React from "react";
import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { AtlasSheetViewer } from "../AtlasSheetViewer";
import { assetLoader } from "@game/engine/assetLoader";
import type { SpriteAtlasMap } from "@game/engine/spriteTypes";

const fakeSpriteMap = {
  meta: {
    characterId: "valen",
    quality: "high",
    imageUrl: "/assets/sprites/valen/valen_spritesheet_high.png",
    sheetWidth: 1536,
    sheetHeight: 1024,
    cellWidth: 128,
    cellHeight: 128,
    scale: 1,
    originX: 32,
    originY: 56,
  },
  animations: {},
} as unknown as SpriteAtlasMap;

describe("AtlasSheetViewer", () => {
  let spriteSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    await cleanupDom();
    spriteSpy = spyOn(assetLoader, "getActiveSpriteMap").mockReturnValue(fakeSpriteMap);
  });

  afterEach(async () => {
    spriteSpy.mockRestore();
    await cleanupDom();
  });

  it("renders nothing when no sprite map is loaded for the character", async () => {
    spriteSpy.mockReturnValue(null);
    const { container } = await renderIntoDom(<AtlasSheetViewer characterId="valen" />);

    expect(container.firstElementChild).toBeNull();
  });

  it("renders the atlas image, sheet dimensions, and cell size", async () => {
    const { container } = await renderIntoDom(
      <AtlasSheetViewer characterId="valen" className="test-atlas-viewer" />
    );

    expect(container.querySelector(".test-atlas-viewer")).not.toBeNull();
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/assets/sprites/valen/valen_spritesheet_high.png");
    expect(img?.getAttribute("alt")).toBe("Valen sprite atlas");
    expect(container.textContent).toContain("Valen");
    expect(container.textContent).toContain("1536×1024px");
    expect(container.textContent).toContain("cell 128×128");
  });

  it("shows the active animation badge when one is provided", async () => {
    const { container } = await renderIntoDom(
      <AtlasSheetViewer characterId="valen" activeAnimation="run" />
    );

    expect(container.textContent).toContain("run");
  });

  it("omits the animation badge when no active animation is given", async () => {
    const { container } = await renderIntoDom(<AtlasSheetViewer characterId="valen" />);

    expect(container.textContent).not.toContain("run");
  });
});
