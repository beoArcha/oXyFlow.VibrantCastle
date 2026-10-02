import React from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import {
  AtlasViewerToolbar,
  AtlasCanvasView,
  AtlasViewerFooter,
  AtlasSheetViewer,
} from "../atlas";

describe("Atlas Sheet Viewer & Subcomponents", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("AtlasViewerToolbar Component", () => {
    it("renders tabs and triggers onSheetTypeChange when clicked", async () => {
      const handleSheetChange = mock((_type: "spritesheet" | "portraits") => {});
      const { container, click } = await renderIntoDom(
        <AtlasViewerToolbar
          sheetType="spritesheet"
          onSheetTypeChange={handleSheetChange}
          showGrid={true}
          onToggleGrid={() => {}}
          showLabels={true}
          onToggleLabels={() => {}}
          zoom={0.75}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onResetZoom={() => {}}
        />
      );

      const tabs = container.querySelectorAll("[role='tab']");
      expect(tabs.length).toBe(2);

      // Click portraits tab
      await click(tabs[1]);
      expect(handleSheetChange).toHaveBeenCalledWith("portraits");
    });

    it("triggers onToggleGrid when grid button is clicked", async () => {
      const handleToggleGrid = mock(() => {});
      const { container, click } = await renderIntoDom(
        <AtlasViewerToolbar
          sheetType="spritesheet"
          onSheetTypeChange={() => {}}
          showGrid={true}
          onToggleGrid={handleToggleGrid}
          showLabels={true}
          onToggleLabels={() => {}}
          zoom={0.75}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onResetZoom={() => {}}
        />
      );

      const buttons = container.querySelectorAll("button");
      // Find grid button
      const gridBtn = Array.from(buttons).find((b) => b.textContent?.includes("Grid"));
      expect(gridBtn).toBeDefined();

      if (gridBtn) {
        await click(gridBtn);
        expect(handleToggleGrid).toHaveBeenCalledTimes(1);
      }
    });

    it("hides Rows button when sheetType is portraits", async () => {
      const { container } = await renderIntoDom(
        <AtlasViewerToolbar
          sheetType="portraits"
          onSheetTypeChange={() => {}}
          showGrid={true}
          onToggleGrid={() => {}}
          showLabels={true}
          onToggleLabels={() => {}}
          zoom={0.75}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onResetZoom={() => {}}
        />
      );

      const rowsBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Rows")
      );
      expect(rowsBtn).toBeUndefined();
    });

    it("triggers zoom actions when zoom buttons are clicked", async () => {
      const handleZoomIn = mock(() => {});
      const handleZoomOut = mock(() => {});
      const handleResetZoom = mock(() => {});

      const { container, click } = await renderIntoDom(
        <AtlasViewerToolbar
          sheetType="spritesheet"
          onSheetTypeChange={() => {}}
          showGrid={true}
          onToggleGrid={() => {}}
          showLabels={true}
          onToggleLabels={() => {}}
          zoom={0.75}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      );

      expect(container.textContent).toContain("75%");

      const resetBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Reset")
      );
      expect(resetBtn).toBeDefined();

      if (resetBtn) {
        await click(resetBtn);
        expect(handleResetZoom).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("AtlasCanvasView Component", () => {
    it("renders image and overlays when activeUrl is provided", async () => {
      const { container } = await renderIntoDom(
        <AtlasCanvasView
          activeUrl="/assets/sprites/valen/valen_spritesheet_high.png"
          sheetType="spritesheet"
          zoom={1}
          showGrid={true}
          showLabels={true}
          imageDimensions={{ width: 1536, height: 1024 }}
          activeAnimation="idle"
          columns={12}
          rows={8}
          cellWidth={128}
          cellHeight={128}
        />
      );

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("/assets/sprites/valen/valen_spritesheet_high.png");

      // Verify animation highlight indicator
      expect(container.textContent).toContain("IDLE");
      expect(container.textContent).toContain("ROW 0");
    });

    it("displays loading fallback when activeUrl is empty", async () => {
      const { container } = await renderIntoDom(
        <AtlasCanvasView
          activeUrl=""
          sheetType="spritesheet"
          zoom={1}
          showGrid={true}
          showLabels={true}
          imageDimensions={{ width: 0, height: 0 }}
        />
      );

      expect(container.querySelector("img")).toBeNull();
      expect(container.textContent?.length).toBeGreaterThan(0);
    });
  });

  describe("AtlasViewerFooter Component", () => {
    it("displays texture dimensions, cell resolution, and quality badge", async () => {
      const { container } = await renderIntoDom(
        <AtlasViewerFooter
          imageDimensions={{ width: 1536, height: 1024 }}
          cellWidth={128}
          cellHeight={128}
          columns={12}
          rows={8}
          quality="high"
        />
      );

      expect(container.textContent).toContain("1536 × 1024 px");
      expect(container.textContent).toContain("128 × 128 px");
      expect(container.textContent).toContain("96");
      expect(container.textContent).toContain("HIGH");
    });
  });

  describe("AtlasSheetViewer Composite Component", () => {
    it("renders composite viewer with characterId, quality, and animation state", async () => {
      const { container } = await renderIntoDom(
        <AtlasSheetViewer
          characterId="valen"
          quality="high"
          activeAnimation="run"
          className="test-atlas-viewer"
        />
      );

      expect(container.querySelector(".test-atlas-viewer")).not.toBeNull();
      // Verify toolbar, canvas view, and footer are all assembled
      expect(container.querySelectorAll("[role='tab']").length).toBe(2);
      expect(container.textContent).toContain("HIGH");
    });

    it("switches to portraits grid and dynamically updates grid frame count to 5x5", async () => {
      const { container, click } = await renderIntoDom(
        <AtlasSheetViewer
          characterId="valen"
          quality="high"
        />
      );

      const tabs = container.querySelectorAll("[role='tab']");
      expect(tabs.length).toBe(2);
      await click(tabs[1]);

      // Portraits grid is 5x5 = 25 frames
      expect(container.textContent).toContain("25");
      expect(container.textContent).toContain("5×5");
    });
  });
});
