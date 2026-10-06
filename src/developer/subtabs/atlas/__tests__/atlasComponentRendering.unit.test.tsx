import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { AtlasTextureViewer } from "../AtlasTextureViewer";
import { AtlasInspectorDock } from "../AtlasInspectorDock";
import { AtlasBackgroundPanel } from "../AtlasBackgroundPanel";
import {
  renderIntoDom,
  cleanupDom,
  setupDomEnvironment,
} from "@test-utils";
import { AtlasGridConfig, AtlasAnimationTrackDefinition, AtlasMetaDoc } from "../types";
import { IFreeformFrameRect } from "@game/engine/meta/types";

describe("Atlas Studio - Component Rendering & UI Integration", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const mockGrid: AtlasGridConfig = {
    columns: 4,
    rows: 4,
    cellWidth: 32,
    cellHeight: 32,
    spacing: 0,
    safeMargin: 0,
  };

  const mockTracks: AtlasAnimationTrackDefinition[] = [
    {
      name: "walk",
      row: 0,
      frames: 4,
      fps: 8,
      loop: true,
    },
  ];

  const mockMetaDoc: AtlasMetaDoc = {
    characterId: "hero",
    entityType: "humanoid",
    version: "1.0",
    description: "Hero Atlas",
    atlas: {
      columns: 4,
      rows: 4,
      cellWidth: 32,
      cellHeight: 32,
      spacing: 0,
      safeMargin: 0,
      background: "transparent",
    },
    animations: {
      walk: { row: 0, frames: 4, fps: 8, loop: true },
    },
  };

  describe("AtlasTextureViewer Rendering", () => {
    it("renders viewport toolbar, canvas container, and status bar cleanly", async () => {
      const { container } = await renderIntoDom(
        <AtlasTextureViewer
          imageSrc="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          gridConfig={mockGrid}
          tracks={mockTracks}
          metaDoc={mockMetaDoc}
          selectedTrackName="walk"
          selectedFrameIndex={0}
        />
      );

      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();

      // Viewport toolbar buttons should be rendered
      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("AtlasInspectorDock Segmented Navigation", () => {
    it("renders slicing tab by default and switches to background and json tabs", async () => {
      const StatefulDock = () => {
        const [tab, setTab] = React.useState<any>("slicing");
        return (
          <AtlasInspectorDock
            activeTab={tab}
            onTabChange={setTab}
            gridConfig={mockGrid}
            tracks={mockTracks}
            metaDoc={mockMetaDoc}
          />
        );
      };

      const { container, click } = await renderIntoDom(<StatefulDock />);

      // Verify header tabs in CardHeader
      const header = container.querySelector(".border-b");
      const dockTabs = header?.querySelectorAll('[role="radio"]');
      expect(dockTabs?.length).toBe(3);

      // Switch to background tab
      if (dockTabs?.[1]) {
        await click(dockTabs[1]);
      }
      expect(container.textContent).toContain("Chroma Key");

      // Switch to json export tab
      const updatedHeader = container.querySelector(".border-b");
      const updatedTabs = updatedHeader?.querySelectorAll('[role="radio"]');
      if (updatedTabs?.[2]) {
        await click(updatedTabs[2]);
      }
      expect(container.textContent).toContain("characterId");
    });
  });

  describe("AtlasBackgroundPanel Shared UI Controls Integration", () => {
    it("interacts with SegmentedControl mode switch and Switch runtime removal toggle", async () => {
      let finalConfig: any = null;

      const StatefulBackground = () => {
        const [config, setConfig] = React.useState({
          mode: "transparent" as const,
          colorHex: "#00ff00",
          tolerance: 15,
          removeAtRuntime: true,
        });

        return (
          <AtlasBackgroundPanel
            assetId="hero"
            imageSrc="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            backgroundConfig={config}
            onBackgroundConfigChange={(cfg) => {
              finalConfig = cfg;
              setConfig(cfg as any);
            }}
            onRequestEyedropper={() => {}}
          />
        );
      };

      const { container, click } = await renderIntoDom(<StatefulBackground />);

      // Click "color" in SegmentedControl
      const modeOptions = container.querySelectorAll('[role="radio"]');
      expect(modeOptions.length).toBeGreaterThanOrEqual(2);

      await click(modeOptions[1]);
      expect(finalConfig?.mode).toBe("color");

      // Verify switch is rendered in color mode and toggleable
      const switchControl = container.querySelector('[role="switch"]');
      expect(switchControl).not.toBeNull();

      if (switchControl) {
        await click(switchControl);
      }
      expect(finalConfig?.removeAtRuntime).toBe(false);
    });
  });

  describe("AtlasPresetSelector Decomposed Rendering", () => {
    it("renders trigger button and toggles dropdown popover", async () => {
      let selectedId = "valen";
      const { AtlasPresetSelector } = await import("../AtlasPresetSelector");

      const { container, click } = await renderIntoDom(
        <AtlasPresetSelector
          selectedPresetId={selectedId}
          onSelectPreset={(id) => {
            selectedId = id;
          }}
        />
      );

      const triggerBtn = container.querySelector("button");
      expect(triggerBtn).not.toBeNull();
      expect(triggerBtn?.textContent).toContain("Valen");

      // Click to open dropdown
      if (triggerBtn) {
        await click(triggerBtn);
      }

      // Popover should be visible with search input
      const searchInput = container.querySelector('input[type="text"]');
      expect(searchInput).not.toBeNull();
    });
  });

  describe("AtlasStatusBar Decomposed Rendering", () => {
    it("renders status metrics and dismisses errors cleanly", async () => {
      let errorDismissed = false;
      const { AtlasStatusBar } = await import("../AtlasStatusBar");

      const mockError = {
        name: "AssetError",
        code: "ASSET_CORRUPTED",
        message: "Failed to decode texture buffer",
      } as any;

      const { container, click } = await renderIntoDom(
        <AtlasStatusBar
          assetId="hero"
          assetName="Valen"
          category="character"
          slicingMethod="by_count"
          frameCount={12}
          textureWidth={512}
          textureHeight={512}
          durationMs={0.42}
          error={mockError}
          onClearError={() => {
            errorDismissed = true;
          }}
        />
      );

      // Verify error banner is rendered
      expect(container.textContent).toContain("ASSET_CORRUPTED");
      expect(container.textContent).toContain("Failed to decode texture buffer");

      // Click dismiss button
      const dismissBtn = container.querySelector("button.underline");
      expect(dismissBtn).not.toBeNull();
      if (dismissBtn) {
        await click(dismissBtn);
      }
      expect(errorDismissed).toBe(true);
    });
  });

  describe("animationGeometry - resolveAnimationSourceRect", () => {
    it("resolves regular grid frames, slotSpan frames, and irregular resolved frames accurately", async () => {
      const { resolveAnimationSourceRect } = await import("../preview/animationGeometry");

      const track: AtlasAnimationTrackDefinition = {
        name: "slash",
        row: 1,
        frames: 3,
        fps: 8,
        loop: false,
        slotSpan: [1, 2, 1],
      };

      const grid: AtlasGridConfig = {
        columns: 4,
        rows: 4,
        cellWidth: 32,
        cellHeight: 32,
        spacing: 0,
        safeMargin: 0,
      };

      // Frame 0: col 0, span 1 -> width 32
      const f0 = resolveAnimationSourceRect(track, 0, grid);
      expect(f0).toEqual({ x: 0, y: 32, width: 32, height: 32, pivot: undefined });

      // Frame 1: col 1, span 2 -> width 64
      const f1 = resolveAnimationSourceRect(track, 1, grid);
      expect(f1).toEqual({ x: 32, y: 32, width: 64, height: 32, pivot: undefined });

      // Frame 2: col 3, span 1 -> width 32
      const f2 = resolveAnimationSourceRect(track, 2, grid);
      expect(f2).toEqual({ x: 96, y: 32, width: 32, height: 32, pivot: undefined });

      // Resolved frames override
      const resolved = [
        { id: "f0", x: 10, y: 15, width: 48, height: 50, trackName: "slash", frameIndex: 0 },
      ];
      const fResolved = resolveAnimationSourceRect(track, 0, grid, resolved);
      expect(fResolved.x).toBe(10);
      expect(fResolved.y).toBe(15);
      expect(fResolved.width).toBe(48);
      expect(fResolved.height).toBe(50);
    });
  });

  describe("AtlasTextureCanvas Loading Overlay", () => {
    it("renders animated loading overlay when isLoading is true", async () => {
      const { AtlasTextureCanvas } = await import("../viewer/AtlasTextureCanvas");
      const canvasRef = { current: null };

      const { container } = await renderIntoDom(
        <AtlasTextureCanvas
          canvasRef={canvasRef}
          image={null}
          zoom={1}
          panOffset={{ x: 0, y: 0 }}
          isPanning={false}
          previewChroma={false}
          pixelBuffer={null}
          showGrid={false}
          showTracks={false}
          showMargins={false}
          showFrames={false}
          resolvedFrames={[]}
          selectedTrackName={null}
          selectedFrameIndex={null}
          dragStart={null}
          dragCurrent={null}
          activeSelection={null}
          isLoading={true}
        />
      );

      expect(container.textContent).toContain("Loading Texture...");
    });
  });

  describe("AtlasSlicingFreeformTable Interactive Operations", () => {
    it("renders freeform frames, edits frame attributes, toggles selection, and handles deletion", async () => {
      const { AtlasSlicingFreeformTable } = await import("../slicing/AtlasSlicingFreeformTable");

      const initialFrames: IFreeformFrameRect[] = [
        { id: "frame_0", x: 10, y: 20, width: 32, height: 48, trackName: "idle" },
        { id: "frame_1", x: 50, y: 20, width: 32, height: 48, trackName: "idle" },
      ];

      let added = false;
      let deletedId: string | null = null;
      let updatedField: any = null;

      const StatefulTable = () => {
        const [tableFrames, setTableFrames] = React.useState(initialFrames);
        const [sel, setSel] = React.useState<string[]>(["frame_0"]);

        return (
          <AtlasSlicingFreeformTable
            frames={tableFrames}
            selectedFrameIds={sel}
            onToggleSelectFrame={(id) => {
              setSel((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
            }}
            onSelectAll={(ids) => setSel(ids)}
            onDeselectAll={() => setSel([])}
            onAddFrame={() => {
              added = true;
            }}
            onUpdateFrameField={(id, field, val) => {
              updatedField = { id, field, val };
              setTableFrames((prev) =>
                prev.map((f) => (f.id === id ? { ...f, [field]: val } : f))
              );
            }}
            onDeleteFrame={(id) => {
              deletedId = id;
              setTableFrames((prev) => prev.filter((f) => f.id !== id));
            }}
          />
        );
      };

      const { container, click, changeInput } = await renderIntoDom(<StatefulTable />);

      // Verify rows are rendered
      expect(container.textContent).toContain("frame_0");
      expect(container.textContent).toContain("frame_1");

      // Verify "Add Frame" button
      const addBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Add") || b.textContent?.includes("Dodaj")
      );
      expect(addBtn).toBeDefined();
      if (addBtn) {
        await click(addBtn);
        expect(added).toBe(true);
      }

      // Verify editing a number input (e.g. frame_0 X position)
      const inputs = container.querySelectorAll('input[type="number"]');
      expect(inputs.length).toBeGreaterThanOrEqual(4);
      const firstXInput = inputs[0] as HTMLInputElement;
      expect(firstXInput.value).toBe("10");

      await changeInput(firstXInput, "15");
      expect(updatedField).toEqual({ id: "frame_0", field: "x", val: 15 });

      // Verify delete button on first row
      const deleteBtn = container.querySelector("tbody tr td:last-child button");
      expect(deleteBtn).not.toBeNull();
      if (deleteBtn) {
        await click(deleteBtn);
        expect(deletedId).toBe("frame_0");
      }
    });
  });

  describe("AtlasTrackSlotSpanEditor Component", () => {
    it("renders frame tiles, displays spans, handles adjustments and respects limits", async () => {
      const { AtlasTrackSlotSpanEditor } = await import("../slicing/AtlasTrackSlotSpanEditor");

      const adjustments: { frameIndex: number; delta: number }[] = [];

      const { container, click } = await renderIntoDom(
        <AtlasTrackSlotSpanEditor
          framesCount={3}
          slotSpan={[1, 2, 8]}
          onAdjustSlotSpan={(frameIndex, delta) => {
            adjustments.push({ frameIndex, delta });
          }}
        />
      );

      // Verify 3 tiles rendered with spans
      expect(container.textContent).toContain("#0");
      expect(container.textContent).toContain("1x");
      expect(container.textContent).toContain("#1");
      expect(container.textContent).toContain("2x");
      expect(container.textContent).toContain("#2");
      expect(container.textContent).toContain("8x");

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBe(6); // 2 buttons per tile

      // Tile 0 (span 1): minus button (buttons[0]) should be disabled
      expect((buttons[0] as HTMLButtonElement).disabled).toBe(true);
      // Tile 0: plus button (buttons[1]) should be enabled
      expect((buttons[1] as HTMLButtonElement).disabled).toBe(false);
      await click(buttons[1]);
      expect(adjustments).toContainEqual({ frameIndex: 0, delta: 1 });

      // Tile 1 (span 2): both buttons enabled
      expect((buttons[2] as HTMLButtonElement).disabled).toBe(false);
      expect((buttons[3] as HTMLButtonElement).disabled).toBe(false);
      await click(buttons[2]);
      expect(adjustments).toContainEqual({ frameIndex: 1, delta: -1 });

      // Tile 2 (span 8): minus enabled, plus disabled (max 8)
      expect((buttons[4] as HTMLButtonElement).disabled).toBe(false);
      expect((buttons[5] as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe("AtlasStatusBarErrorBanner with Generic Alert", () => {
    it("renders error banner with code, message, details and handles dismiss", async () => {
      const { AtlasStatusBarErrorBanner } = await import("../status/AtlasStatusBarErrorBanner");
      const { AssetError, ErrorCode } = await import("@lib/errors");

      let cleared = false;
      const testError = new AssetError("Resource not found", ErrorCode.ASSET_NOT_FOUND, {
        details: { resourceId: "atlas_hero" },
      });

      const { container, click } = await renderIntoDom(
        <AtlasStatusBarErrorBanner
          error={testError}
          onClearError={() => {
            cleared = true;
          }}
        />
      );

      expect(container.querySelector('[role="alert"]')).not.toBeNull();
      expect(container.textContent).toContain("NOT_FOUND");
      expect(container.textContent).toContain("Resource not found");
      expect(container.textContent).toContain("atlas_hero");

      const dismissBtn = container.querySelector('button[aria-label="Dismiss error"]');
      expect(dismissBtn).not.toBeNull();
      if (dismissBtn) {
        await click(dismissBtn);
        expect(cleared).toBe(true);
      }
    });
  });
});
