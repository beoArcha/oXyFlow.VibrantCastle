import React from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { CharacterStageControls } from "../CharacterStageControls";
import { CharacterStage } from "../CharacterStage";
import { CharacterPortrait } from "../CharacterPortrait";
import { CharacterProvider } from "../CharacterContext";

describe("CharacterStage & Controls Architecture", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("CharacterStageControls Component", () => {
    it("renders animation action buttons and responds to click", async () => {
      const onActionChange = mock((_action: string) => {});
      const { container, click } = await renderIntoDom(
        <CharacterStageControls
          activeAction="idle"
          onActionChange={onActionChange}
          isPlaying={true}
          onTogglePlay={() => {}}
          flipHorizontal={false}
          onToggleFlip={() => {}}
          playbackSpeed={1.0}
          onSpeedChange={() => {}}
          scale={1.5}
          onScaleChange={() => {}}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));
      // 8 animation buttons: [0] = idle, [1] = run, [2] = jump, ...
      expect(buttons.length).toBeGreaterThanOrEqual(8);
      const runBtn = buttons[1];
      expect(runBtn).toBeDefined();
      if (runBtn) {
        await click(runBtn);
        expect(onActionChange).toHaveBeenCalledWith("run");
      }
    });

    it("triggers play/pause and flip toggles", async () => {
      const onTogglePlay = mock(() => {});
      const onToggleFlip = mock(() => {});

      const { container, click } = await renderIntoDom(
        <CharacterStageControls
          activeAction="idle"
          onActionChange={() => {}}
          isPlaying={true}
          onTogglePlay={onTogglePlay}
          flipHorizontal={false}
          onToggleFlip={onToggleFlip}
          playbackSpeed={1.0}
          onSpeedChange={() => {}}
          scale={1.5}
          onScaleChange={() => {}}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));
      // [8] is Play/Pause button, [9] is Flip button
      const playBtn = buttons[8];
      expect(playBtn).toBeDefined();
      if (playBtn) {
        await click(playBtn);
        expect(onTogglePlay).toHaveBeenCalledTimes(1);
      }

      const flipBtn = buttons[9];
      expect(flipBtn).toBeDefined();
      if (flipBtn) {
        await click(flipBtn);
        expect(onToggleFlip).toHaveBeenCalledTimes(1);
      }
    });

    it("triggers playback speed and zoom scale changes", async () => {
      const onSpeedChange = mock((_spd: number) => {});
      const onScaleChange = mock((_scl: number) => {});

      const { container, click } = await renderIntoDom(
        <CharacterStageControls
          activeAction="idle"
          onActionChange={() => {}}
          isPlaying={true}
          onTogglePlay={() => {}}
          flipHorizontal={false}
          onToggleFlip={() => {}}
          playbackSpeed={1.0}
          onSpeedChange={onSpeedChange}
          scale={1.5}
          onScaleChange={onScaleChange}
        />
      );

      const buttons = Array.from(container.querySelectorAll("button"));
      const speedBtn = buttons.find((b) => b.textContent?.trim() === "1.5x");
      expect(speedBtn).toBeDefined();
      if (speedBtn) {
        await click(speedBtn);
        expect(onSpeedChange).toHaveBeenCalledWith(1.5);
      }

      const scaleBtn = buttons.find((b) => b.textContent?.trim() === "2.5x");
      expect(scaleBtn).toBeDefined();
      if (scaleBtn) {
        await click(scaleBtn);
        expect(onScaleChange).toHaveBeenCalledWith(2.5);
      }
    });
  });

  describe("CharacterStage Composite Component", () => {
    it("renders stage controls, portrait card, canvas viewport, and metadata telemetry tags", async () => {
      const { container } = await renderIntoDom(
        <CharacterStage
          characterId="valen"
          quality="high"
          scalingFilter="pixelated"
          activeAction="idle"
          onActionChange={() => {}}
          playbackSpeed={1.0}
          onSpeedChange={() => {}}
          scale={1.5}
          onScaleChange={() => {}}
          flipHorizontal={false}
          onToggleFlip={() => {}}
          isPlaying={true}
          onTogglePlay={() => {}}
        />
      );

      expect(container.textContent?.toLowerCase()).toContain("valen");
      expect(container.querySelector("canvas")).not.toBeNull();
      expect(container.textContent).toContain("HIGH TIER");
      expect(container.textContent).toContain("PIXELATED");
    });

    it("works cleanly in uncontrolled mode with internal state defaults", async () => {
      const { container } = await renderIntoDom(
        <CharacterStage
          characterId="aurelia"
          quality="mid"
        />
      );

      expect(container.textContent?.toLowerCase()).toContain("aurelia");
      expect(container.textContent).toContain("MID TIER");
    });
  });

  describe("CharacterPortrait Sizing & Variants", () => {
    it("applies semantic size presets (xs, sm, md, lg, xl, fill)", async () => {
      const { container } = await renderIntoDom(
        <CharacterProvider characterId="valen">
          <CharacterPortrait size="lg" />
        </CharacterProvider>
      );

      const portrait = container.querySelector(".w-24.h-24");
      expect(portrait).not.toBeNull();
    });

    it("applies visual style variants (framed, circle)", async () => {
      const { container: framedContainer } = await renderIntoDom(
        <CharacterProvider characterId="valen">
          <CharacterPortrait variant="framed" />
        </CharacterProvider>
      );
      const framed = framedContainer.querySelector(".border-\\[\\#8d4325\\]");
      expect(framed).not.toBeNull();

      const { container: circleContainer } = await renderIntoDom(
        <CharacterProvider characterId="valen">
          <CharacterPortrait variant="circle" />
        </CharacterProvider>
      );
      const circle = circleContainer.querySelector(".rounded-full");
      expect(circle).not.toBeNull();
    });
  });
});
