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
});
