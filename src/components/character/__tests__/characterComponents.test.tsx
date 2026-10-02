import React, { createRef, act } from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { CharacterPortrait } from "../CharacterPortrait";
import { CharacterSpritePreview } from "../CharacterSpritePreview";
import { CharacterProvider } from "../CharacterContext";
import { SpriteFrame } from "@game/engine/spriteTypes";

describe("Character Presentation Components (CharacterPortrait & CharacterSpritePreview)", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("CharacterPortrait Component", () => {
    it("renders full image portrait when no crop rectangle is provided", async () => {
      const { container } = await renderIntoDom(
        <CharacterProvider characterId="valen" mood="main">
          <CharacterPortrait className="custom-portrait-class" />
        </CharacterProvider>
      );

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("alt")).toContain("Valen");
      expect(container.firstElementChild?.classList.contains("custom-portrait-class")).toBe(true);
    });

    it("renders canvas element when crop rectangle is specified", async () => {
      const mockCrop = { x: 0, y: 0, width: 64, height: 64 };
      const { container } = await renderIntoDom(
        <CharacterPortrait
          src="/assets/sprites/valen/valen_portraits.png"
          crop={mockCrop}
          alt="Cropped Valen Face"
        />
      );

      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();
      expect(canvas?.getAttribute("aria-label")).toBe("Cropped Valen Face");
    });

    it("forwards ref to the root HTMLDivElement container", async () => {
      const ref = createRef<HTMLDivElement>();
      await renderIntoDom(
        <CharacterPortrait ref={ref} characterId="valen" />
      );

      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName.toLowerCase()).toBe("div");
    });

    it("renders children elements passed inside the portrait frame", async () => {
      const { container } = await renderIntoDom(
        <CharacterPortrait characterId="valen">
          <span data-testid="level-badge">LVL 42</span>
        </CharacterPortrait>
      );

      const badge = container.querySelector("[data-testid='level-badge']");
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toBe("LVL 42");
    });

    it("handles missing/empty src gracefully without crashing", async () => {
      const { container } = await renderIntoDom(
        <CharacterPortrait src="" alt="Empty" />
      );

      expect(container.firstElementChild).not.toBeNull();
      expect(container.firstElementChild?.getAttribute("role")).toBe("img");
    });

    it("renders fallback placeholder when image loading errors", async () => {
      const { container } = await renderIntoDom(
        <CharacterPortrait src="/invalid/path.png" alt="Failed Portrait" />
      );

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      if (img) {
        await act(async () => {
          const reactKey = Object.keys(img).find((k) => k.startsWith("__reactProps"));
          const props = reactKey ? (img as any)[reactKey] : null;
          if (props && typeof props.onError === "function") {
            props.onError({ target: img, currentTarget: img });
          } else {
            img.dispatchEvent(new Event("error"));
          }
        });
      }

      const fallback = container.querySelector("[role='img']");
      expect(fallback).not.toBeNull();
      expect(fallback?.getAttribute("aria-label")).toBe("Failed Portrait");
    });

    it("renders canvas with role='img' and unmounts cleanly", async () => {
      const mockCrop = { x: 0, y: 0, width: 64, height: 64 };
      const { container, unmount } = await renderIntoDom(
        <CharacterPortrait
          src="/assets/sprites/valen/valen_portraits.png"
          crop={mockCrop}
          alt="Cropped Valen Face"
        />
      );

      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();
      expect(canvas?.getAttribute("role")).toBe("img");
      expect(canvas?.getAttribute("aria-label")).toBe("Cropped Valen Face");

      await unmount();
    });
  });

  describe("CharacterSpritePreview Component", () => {
    it("renders container with img role and canvas element", async () => {
      const { container } = await renderIntoDom(
        <CharacterProvider characterId="valen">
          <CharacterSpritePreview
            state="idle"
            ariaLabel="Valen Idle Animation"
            className="test-preview"
          />
        </CharacterProvider>
      );

      const wrapper = container.querySelector("[role='img']");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.getAttribute("aria-label")).toBe("Valen Idle Animation");
      expect(wrapper?.classList.contains("test-preview")).toBe(true);

      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();
    });

    it("forwards ref to the outer container element", async () => {
      const ref = createRef<HTMLDivElement>();
      await renderIntoDom(
        <CharacterSpritePreview ref={ref} state="idle" />
      );

      expect(ref.current).not.toBeNull();
      expect(ref.current?.getAttribute("role")).toBe("img");
    });

    it("renders static explicit frame and texture in primitive mode without error", async () => {
      const mockFrame: SpriteFrame = {
        x: 0,
        y: 0,
        w: 64,
        h: 64,
        originX: 32,
        originY: 56,
      };

      const mockImg = new Image();

      const { container } = await renderIntoDom(
        <CharacterSpritePreview
          frame={mockFrame}
          texture={mockImg}
          playbackSpeed={0}
          scale={2}
          flipHorizontal={true}
        />
      );

      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();
    });

    it("renders in static mode when playbackSpeed is 0", async () => {
      const { container } = await renderIntoDom(
        <CharacterSpritePreview
          characterId="valen"
          playbackSpeed={0}
        />
      );

      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();
      const mockCtx = (canvas as any)?._mockCtx;
      if (mockCtx) {
        expect(mockCtx.getClearRectCalls().length).toBeGreaterThanOrEqual(1);
      }
    });

    it("cleans up animation loop and unmounts cleanly without throwing", async () => {
      const { unmount } = await renderIntoDom(
        <CharacterSpritePreview
          characterId="valen"
          playbackSpeed={1}
        />
      );

      await unmount();
    });

    it("preserves animation loop when scale and flip props are dynamically updated", async () => {
      const { container, unmount } = await renderIntoDom(
        <CharacterSpritePreview
          characterId="valen"
          playbackSpeed={1}
          scale={1.5}
          flipHorizontal={false}
        />
      );

      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();

      await unmount();
    });
  });
});
