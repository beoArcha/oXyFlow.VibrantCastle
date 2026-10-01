import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import {
  getFrameCoordinates,
  renderAnimationFrame,
  AtlasAnimationFrameScrubber,
  AtlasAnimationSpeedScale,
  AtlasAnimationAnchorPresets,
  AtlasAnimationPlaybackControls,
} from "../preview";
import {
  renderIntoDom,
  cleanupDom,
  setupDomEnvironment,
  createMockContext2D,
} from "@test-utils";
import { t } from "@/i18n";
import { AtlasAnimationTrackDefinition, AtlasGridConfig, ResolvedFrameRect } from "../types";

describe("AtlasAnimationPreview Decomposition & Math", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("getFrameCoordinates", () => {
    const gridConfig: AtlasGridConfig = {
      columns: 8,
      rows: 4,
      cellWidth: 64,
      cellHeight: 64,
      spacing: 0,
      safeMargin: 0,
    };

    it("calculates regular grid coordinates correctly", () => {
      const track: AtlasAnimationTrackDefinition = {
        name: "walk",
        row: 2,
        frames: 4,
        fps: 8,
        loop: true,
      };

      const coords0 = getFrameCoordinates(0, track, gridConfig, []);
      expect(coords0).toEqual({ x: 0, y: 128, w: 64, h: 64, pivot: undefined });

      const coords2 = getFrameCoordinates(2, track, gridConfig, []);
      expect(coords2).toEqual({ x: 128, y: 128, w: 64, h: 64, pivot: undefined });
    });

    it("calculates multi-span coordinates when slotSpan is defined", () => {
      const track: AtlasAnimationTrackDefinition = {
        name: "slash",
        row: 1,
        frames: 3,
        fps: 10,
        loop: false,
        slotSpan: [1, 2, 1],
      };

      const coords1 = getFrameCoordinates(1, track, gridConfig, []);
      expect(coords1.x).toBe(64);
      expect(coords1.w).toBe(128); // 2 cells wide
      expect(coords1.y).toBe(64);

      const coords2 = getFrameCoordinates(2, track, gridConfig, []);
      expect(coords2.x).toBe(192); // 64 + 128
      expect(coords2.w).toBe(64);
    });

    it("uses matching resolvedFrames if available", () => {
      const track: AtlasAnimationTrackDefinition = {
        name: "custom",
        row: 0,
        frames: 2,
        fps: 8,
        loop: true,
      };

      const matchingFrames: ResolvedFrameRect[] = [
        {
          id: "f0",
          x: 10,
          y: 20,
          width: 30,
          height: 40,
          trackName: "custom",
          frameIndex: 0,
          pivot: { x: 0.5, y: 0.9 },
        },
      ];

      const coords = getFrameCoordinates(0, track, gridConfig, matchingFrames);
      expect(coords.x).toBe(10);
      expect(coords.y).toBe(20);
      expect(coords.w).toBe(30);
      expect(coords.h).toBe(40);
      expect(coords.pivot).toEqual({ x: 0.5, y: 0.9 });
    });
  });

  describe("Subcomponents render and user interaction", () => {
    it("renders AtlasAnimationFrameScrubber and triggers onSelectFrame", async () => {
      const onSelect = mock();
      const { container } = await renderIntoDom(
        <AtlasAnimationFrameScrubber
          totalFrames={4}
          currentFrame={1}
          onSelectFrame={onSelect}
        />
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBe(4);
      expect(buttons[0].textContent).toContain("#0");
      expect(buttons[1].textContent).toContain("#1");

      buttons[2].click();
      expect(onSelect).toHaveBeenCalledWith(2);
    });

    it("renders AtlasAnimationSpeedScale and responds to speed clicks", async () => {
      const onSpeedChange = mock();
      const onScaleChange = mock();

      const { container } = await renderIntoDom(
        <AtlasAnimationSpeedScale
          speedMultiplier={1.0}
          onSpeedChange={onSpeedChange}
          scale={2}
          onScaleChange={onScaleChange}
        />
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBe(8); // 4 speed + 4 scale

      const speed2x = Array.from(buttons).find((b) => b.textContent?.trim() === "2x");
      speed2x?.click();
      expect(onSpeedChange).toHaveBeenCalledWith(2.0);

      const scale4x = Array.from(buttons).find((b) => b.textContent?.trim() === "4x");
      scale4x?.click();
      expect(onScaleChange).toHaveBeenCalledWith(4);
    });

    it("renders AtlasAnimationAnchorPresets and triggers onOriginChange", async () => {
      const onOriginChange = mock();
      const onFpsChange = mock();

      const { container } = await renderIntoDom(
        <AtlasAnimationAnchorPresets
          fps={12}
          onFpsChange={onFpsChange}
          origin={{ type: "feet", normalized: { x: 0.5, y: 1.0 } }}
          onOriginChange={onOriginChange}
        />
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBe(3); // feet, center, top_left

      buttons[1].click(); // center
      expect(onOriginChange).toHaveBeenCalledWith({
        type: "center",
        normalized: { x: 0.5, y: 0.5 },
      });
    });

    it("renders AtlasAnimationPlaybackControls and toggles loop/play", async () => {
      const onTogglePlay = mock();
      const onToggleLoop = mock();
      const onToggleFlipX = mock();
      const onToggleGroundLine = mock();
      const onTogglePivot = mock();
      const onToggleOnionSkinning = mock();
      const onStepPrev = mock();
      const onStepNext = mock();

      const { container } = await renderIntoDom(
        <AtlasAnimationPlaybackControls
          isPlaying={true}
          onTogglePlay={onTogglePlay}
          loop={true}
          onToggleLoop={onToggleLoop}
          flipX={false}
          onToggleFlipX={onToggleFlipX}
          showGroundLine={true}
          onToggleGroundLine={onToggleGroundLine}
          showPivot={true}
          onTogglePivot={onTogglePivot}
          onionSkinning={false}
          onToggleOnionSkinning={onToggleOnionSkinning}
          onStepPrev={onStepPrev}
          onStepNext={onStepNext}
        />
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBe(8);

      buttons[0].click(); // play/pause
      expect(onTogglePlay).toHaveBeenCalledTimes(1);

      buttons[3].click(); // loop
      expect(onToggleLoop).toHaveBeenCalledTimes(1);
    });
  });

  describe("renderAnimationFrame execution & resilience", () => {
    const gridConfig: AtlasGridConfig = {
      columns: 12,
      rows: 8,
      cellWidth: 128,
      cellHeight: 128,
      spacing: 0,
      safeMargin: 0,
    };

    const track: AtlasAnimationTrackDefinition = {
      name: "idle",
      row: 0,
      frames: 6,
      fps: 8,
      loop: true,
    };

    it("renders sprite frame even when offscreenCanvas is null (direct draw fallback)", () => {
      const mockCanvas = document.createElement("canvas");
      const mockCtx = createMockContext2D(256, 256);
      mockCanvas.getContext = () => mockCtx as any;

      const mockImage = {
        width: 1536,
        height: 1024,
      } as HTMLImageElement;

      renderAnimationFrame(mockCanvas, null, {
        frameIdx: 0,
        image: mockImage,
        track,
        gridConfig,
        scale: 2,
        showPivot: true,
        showGroundLine: true,
        flipX: false,
        origin: { type: "feet", normalized: { x: 0.5, y: 1.0 } },
        onionSkinning: false,
      });

      // Canvas dimensions must be scaled (128 * 2 = 256)
      expect(mockCanvas.width).toBe(256);
      expect(mockCanvas.height).toBe(256);

      // Verify that drawImage was actually called to draw the character sprite
      const drawCalls = mockCtx.getDrawImageCalls();
      expect(drawCalls.length).toBeGreaterThanOrEqual(1);
      const firstCallArgs = drawCalls[0];
      expect(firstCallArgs[0]).toBe(mockImage);
      expect(firstCallArgs[1]).toBe(0); // sx
      expect(firstCallArgs[2]).toBe(0); // sy
      expect(firstCallArgs[3]).toBe(128); // sw
      expect(firstCallArgs[4]).toBe(128); // sh
      expect(firstCallArgs[5]).toBe(0); // dx
      expect(firstCallArgs[6]).toBe(0); // dy
      expect(firstCallArgs[7]).toBe(256); // dw
      expect(firstCallArgs[8]).toBe(256); // dh
    });

    it("renders onion skinning when enabled", () => {
      const mockCanvas = document.createElement("canvas");
      const mockCtx = createMockContext2D(256, 256);
      mockCanvas.getContext = () => mockCtx as any;

      const mockImage = {
        width: 1536,
        height: 1024,
      } as HTMLImageElement;

      renderAnimationFrame(mockCanvas, null, {
        frameIdx: 1,
        image: mockImage,
        track,
        gridConfig,
        scale: 2,
        showPivot: false,
        showGroundLine: false,
        flipX: false,
        onionSkinning: true,
      });

      const drawCalls = mockCtx.getDrawImageCalls();
      // Should have at least 2 draw calls: 1 for previous frame (onion skin) and 1 for current frame
      expect(drawCalls.length).toBe(2);
    });

    it("verifies all atlas toolbar and studio keys are properly translated without exposing raw keys", () => {
      const keysToCheck = [
        "atlasStudioGridShort",
        "atlasStudioTracksShort",
        "atlasStudioFramesShort",
        "atlasStudioToggleChroma",
        "atlasStudioChromaShort",
        "atlasStudioAutoIslandsTitle",
        "atlasStudioBakeIslandsDesc",
        "atlasStudioBakeSuccess",
        "atlasStudioBakeIslandsBtn",
        "atlasStudioFreeformFramesTitle",
        "atlasStudioAddFrameBtn",
        "atlasStudioFrameColId",
        "atlasStudioFrameColTrack",
        "atlasStudioGridConfigTitle",
        "atlasStudioGridCellWidth",
        "atlasStudioGridCellHeight",
        "atlasStudioGridSpacing",
        "atlasStudioGridSafeMargin",
        "atlasStudioSlicingStrategyLabel",
        "atlasStudioFramesSelected",
        "atlasStudioSelectTrackPlaceholder",
        "atlasStudioNewTrackNamePlaceholder",
        "atlasStudioCreateTrackBtn",
      ];

      for (const key of keysToCheck) {
        const plTranslation = t("pl", key);
        const enTranslation = t("en", key);

        // Neither Polish nor English should return the raw key
        expect(plTranslation).not.toBe(key);
        expect(enTranslation).not.toBe(key);
        expect(plTranslation.length).toBeGreaterThan(0);
        expect(enTranslation.length).toBeGreaterThan(0);
      }
    });
  });
});
