import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import {
  AtlasGridOverlay,
  AtlasRowHighlight,
  AtlasRowLabels,
} from "../atlas";

describe("Atlas Visual Overlays", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("AtlasGridOverlay Component", () => {
    it("renders grid cells corresponding to columns * rows count", async () => {
      const { container } = await renderIntoDom(
        <AtlasGridOverlay columns={4} rows={3} activeRow={1} />
      );

      const cells = container.querySelectorAll("span");
      expect(cells.length).toBe(12);
      expect(cells[0].textContent).toBe("0,0");
      expect(cells[11].textContent).toBe("2,3");
    });

    it("highlights cells on the activeRow", async () => {
      const { container } = await renderIntoDom(
        <AtlasGridOverlay columns={3} rows={2} activeRow={1} />
      );

      const gridContainer = container.querySelector("[style*='grid']") as HTMLElement;
      expect(gridContainer).not.toBeNull();
      const cellDivs = gridContainer.children;
      expect(cellDivs.length).toBe(6);

      // Row 0 cells (0, 1, 2) should not have activeRow classes
      expect(cellDivs[0].className).not.toContain("bg-amber-500/10");
      // Row 1 cells (3, 4, 5) should have activeRow classes
      expect(cellDivs[3].className).toContain("bg-amber-500/10");
      expect(cellDivs[4].className).toContain("bg-amber-500/10");
    });
  });

  describe("AtlasRowHighlight Component", () => {
    it("renders highlight indicator with animation name and active row index", async () => {
      const { container } = await renderIntoDom(
        <AtlasRowHighlight
          activeRow={2}
          animationName="jump"
          cellHeight={128}
          zoom={1}
        />
      );

      expect(container.textContent).toContain("JUMP (ROW 2)");
    });

    it("positions container accurately according to row offset and zoom", async () => {
      const { container } = await renderIntoDom(
        <AtlasRowHighlight
          activeRow={3}
          animationName="fall"
          cellHeight={100}
          zoom={0.5}
        />
      );

      const highlightDiv = container.querySelector(".border-2") as HTMLDivElement;
      expect(highlightDiv).not.toBeNull();
      // top = 3 * 100 * 0.5 = 150px
      // height = 100 * 0.5 = 50px
      expect(highlightDiv.style.top).toBe("150px");
      expect(highlightDiv.style.height).toBe("50px");
    });
  });

  describe("AtlasRowLabels Component", () => {
    it("renders row animation names with localized labels", async () => {
      const rows = [
        { row: 0, name: "idle" as const, labelKey: "animIdle" },
        { row: 1, name: "run" as const, labelKey: "animRun" },
      ];

      const { container } = await renderIntoDom(
        <AtlasRowLabels
          rows={rows}
          activeRow={0}
          cellHeight={100}
          zoom={1}
        />
      );

      // Active row 0 has indicator "▶ "
      expect(container.textContent).toContain("▶");
      const activeSpan = Array.from(container.querySelectorAll("span")).find(
        (s) => s.textContent?.includes("▶")
      );
      expect(activeSpan).toBeDefined();
      expect(activeSpan?.className).toContain("bg-amber-600");
    });
  });
});
