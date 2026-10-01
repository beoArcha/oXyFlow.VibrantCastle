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
} from "@test-utils";
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
});
