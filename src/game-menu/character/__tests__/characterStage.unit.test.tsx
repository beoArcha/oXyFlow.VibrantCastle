import React from "react";
import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { CharacterStage } from "../CharacterStage";
import { assetLoader } from "@game/engine/assetLoader";
import type {
  AnimationName,
  SpriteAnimationTrack,
  SpriteAtlasMap,
  SpriteFrame,
} from "@game/engine/spriteTypes";

function makeFrames(count: number): SpriteFrame[] {
  return Array.from({ length: count }, (_, i) => ({
    x: i * 64,
    y: 0,
    w: 64,
    h: 64,
    originX: 32,
    originY: 56,
  }));
}

function makeTrack(name: AnimationName, frameCount: number): SpriteAnimationTrack {
  return {
    name,
    frameCount,
    frameDuration: 0.125,
    loop: true,
    row: 0,
    fps: 8,
    frames: makeFrames(frameCount),
  };
}

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
  animations: {
    idle: makeTrack("idle", 4),
    run: makeTrack("run", 6),
  },
} as unknown as SpriteAtlasMap;

function baseProps() {
  return {
    characterId: "valen" as const,
    activeAction: "idle" as AnimationName,
    onActionChange: () => {},
    playbackSpeed: 1,
    onSpeedChange: () => {},
    scale: 1,
    onScaleChange: () => {},
    flipHorizontal: false,
    onToggleFlip: () => {},
    isPlaying: true,
    onTogglePlay: () => {},
  };
}

describe("CharacterStage", () => {
  let spriteSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    await cleanupDom();
    spriteSpy = spyOn(assetLoader, "getActiveSpriteMap").mockReturnValue(fakeSpriteMap);
  });

  afterEach(async () => {
    spriteSpy.mockRestore();
    await cleanupDom();
  });

  describe("Without a loaded sprite map", () => {
    it("renders the character name badge and canvas, with no track buttons", async () => {
      spriteSpy.mockReturnValue(null);
      const { container } = await renderIntoDom(<CharacterStage {...baseProps()} />);

      expect(container.textContent).toContain("Valen");
      expect(container.querySelector("canvas")).not.toBeNull();
      const labels = Array.from(container.querySelectorAll("button")).map((b) => b.textContent?.trim());
      expect(labels).not.toContain("idle");
      expect(labels).not.toContain("run");
    });
  });

  describe("Composite rendering", () => {
    it("renders a canvas, track buttons, and frame counter for the active action", async () => {
      const { container } = await renderIntoDom(<CharacterStage {...baseProps()} />);

      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();
      expect(canvas?.width).toBe(280);
      expect(canvas?.height).toBe(220);
      expect(container.textContent).toContain("idle (1/4)");

      const trackLabels = Array.from(container.querySelectorAll("button")).map((b) => b.textContent?.trim());
      expect(trackLabels).toContain("idle");
      expect(trackLabels).toContain("run");
    });

    it("uses pixelated rendering by default and smooth when scalingFilter is smooth", async () => {
      const { container } = await renderIntoDom(<CharacterStage {...baseProps()} />);
      expect(container.querySelector("canvas")?.style.imageRendering).toBe("pixelated");

      const { container: smooth } = await renderIntoDom(
        <CharacterStage {...baseProps()} scalingFilter="smooth" />
      );
      expect(smooth.querySelector("canvas")?.style.imageRendering).toBe("auto");
    });
  });

  describe("Controls", () => {
    it("calls onActionChange with the clicked track name", async () => {
      const onActionChange = mock((_action: AnimationName) => {});
      const { container, click } = await renderIntoDom(
        <CharacterStage {...baseProps()} onActionChange={onActionChange} />
      );

      const runBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "run"
      );
      expect(runBtn).toBeDefined();
      if (runBtn) await click(runBtn);

      expect(onActionChange).toHaveBeenCalledWith("run");
    });

    it("shows Pause while playing and calls onTogglePlay when clicked", async () => {
      const onTogglePlay = mock(() => {});
      const { container, click } = await renderIntoDom(
        <CharacterStage {...baseProps()} isPlaying={true} onTogglePlay={onTogglePlay} />
      );

      const playBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Pause"
      );
      expect(playBtn).toBeDefined();
      if (playBtn) await click(playBtn);

      expect(onTogglePlay).toHaveBeenCalledTimes(1);
    });

    it("shows Play while paused", async () => {
      const { container } = await renderIntoDom(
        <CharacterStage {...baseProps()} isPlaying={false} />
      );
      const labels = Array.from(container.querySelectorAll("button")).map((b) => b.textContent?.trim());
      expect(labels).toContain("Play");
      expect(labels).not.toContain("Pause");
    });

    it("calls onToggleFlip when Flip is clicked", async () => {
      const onToggleFlip = mock(() => {});
      const { container, click } = await renderIntoDom(
        <CharacterStage {...baseProps()} onToggleFlip={onToggleFlip} />
      );

      const flipBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Flip"
      );
      expect(flipBtn).toBeDefined();
      if (flipBtn) await click(flipBtn);

      expect(onToggleFlip).toHaveBeenCalledTimes(1);
    });

    it("calls onSpeedChange and onScaleChange with the selected multiplier", async () => {
      const onSpeedChange = mock((_speed: number) => {});
      const onScaleChange = mock((_scale: number) => {});
      const { container, click } = await renderIntoDom(
        <CharacterStage
          {...baseProps()}
          onSpeedChange={onSpeedChange}
          onScaleChange={onScaleChange}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));
      const speedBtn = buttons.find((b) => b.textContent?.trim() === "1.5x");
      expect(speedBtn).toBeDefined();
      if (speedBtn) await click(speedBtn);
      expect(onSpeedChange).toHaveBeenCalledWith(1.5);

      // "2x" appears in both the Speed and Scale groups; the Scale group comes second.
      const twoXButtons = buttons.filter((b) => b.textContent?.trim() === "2x");
      expect(twoXButtons.length).toBe(2);
      const scaleBtn = twoXButtons[1];
      if (scaleBtn) await click(scaleBtn);
      expect(onScaleChange).toHaveBeenCalledWith(2);
      expect(onSpeedChange).toHaveBeenCalledTimes(1);
    });
  });
});
