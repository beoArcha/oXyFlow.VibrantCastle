import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import {
  AtlasViewportToolbar,
  AtlasSelectionFloatingAction,
  AtlasViewerStatusBar,
  AtlasTextureCanvas,
  TRACK_COLORS,
  useAtlasViewerInteractions,
} from "../subtabs/atlas/viewer";
import {
  AtlasHeaderToolbar,
  useAtlasStudioState,
  AtlasTextureViewer,
  AtlasAnimationPreview,
  AtlasSlicingInspector,
} from "../subtabs/atlas";
import {
  SlicingMethodTabs,
  SlicingGridConfigCard,
  SlicingAutoIslandsCard,
  SlicingTrackAssignmentBar,
  SlicingFreeformTable,
  SlicingTracksManager,
} from "../subtabs/atlas/slicing";
import { AtlasMetaSubTab } from "../subtabs/AtlasMetaSubTab";

describe("Phase 4: Atlas Studio Decomposition & Optimization Suite", () => {
  describe("1. Component and Hook Exports Verification", () => {
    it("verifies Atlas Viewer subcomponents and hooks are correctly exported", () => {
      expect(typeof AtlasViewportToolbar).toBe("function");
      expect(typeof AtlasSelectionFloatingAction).toBe("function");
      expect(typeof AtlasViewerStatusBar).toBe("function");
      expect(typeof AtlasTextureCanvas).toBe("function");
      expect(typeof useAtlasViewerInteractions).toBe("function");
      expect(Array.isArray(TRACK_COLORS)).toBe(true);
      expect(TRACK_COLORS.length).toBeGreaterThan(0);
    });

    it("verifies Atlas Studio state hook, toolbar, and main orchestrators are exported", () => {
      expect(typeof useAtlasStudioState).toBe("function");
      expect(typeof AtlasHeaderToolbar).toBe("function");
      expect(typeof AtlasTextureViewer).toBe("function");
      expect(typeof AtlasAnimationPreview).toBe("function");
      expect(typeof AtlasSlicingInspector).toBe("function");
      expect(typeof AtlasMetaSubTab).toBe("function");
    });

    it("verifies Atlas Slicing subcomponents are exported", () => {
      expect(typeof SlicingMethodTabs).toBe("function");
      expect(typeof SlicingGridConfigCard).toBe("function");
      expect(typeof SlicingAutoIslandsCard).toBe("function");
      expect(typeof SlicingTrackAssignmentBar).toBe("function");
      expect(typeof SlicingFreeformTable).toBe("function");
      expect(typeof SlicingTracksManager).toBe("function");
    });
  });

  describe("2. Architecture & File Length Verification (AGENT.md Compliance)", () => {
    const checkFileLines = (relPath: string, maxLines: number) => {
      const fullPath = path.resolve(__dirname, "..", relPath);
      const content = fs.readFileSync(fullPath, "utf-8");
      const lineCount = content.split("\n").length;
      expect(lineCount).toBeLessThanOrEqual(maxLines);
    };

    it("verifies AtlasMetaSubTab orchestrator is under 250 lines", () => {
      checkFileLines("subtabs/AtlasMetaSubTab.tsx", 250);
    });

    it("verifies AtlasTextureViewer orchestrator is under 300 lines", () => {
      checkFileLines("subtabs/atlas/AtlasTextureViewer.tsx", 300);
    });

    it("verifies AtlasSlicingInspector orchestrator is under 320 lines", () => {
      checkFileLines("subtabs/atlas/AtlasSlicingInspector.tsx", 320);
    });

    it("verifies AtlasViewer subcomponents are modular and compact", () => {
      checkFileLines("subtabs/atlas/viewer/AtlasViewportToolbar.tsx", 200);
      checkFileLines("subtabs/atlas/viewer/AtlasSelectionFloatingAction.tsx", 180);
      checkFileLines("subtabs/atlas/viewer/AtlasViewerStatusBar.tsx", 100);
      checkFileLines("subtabs/atlas/viewer/AtlasTextureCanvas.tsx", 300);
      checkFileLines("subtabs/atlas/viewer/useAtlasViewerInteractions.ts", 320);
      checkFileLines("subtabs/atlas/viewer/useAtlasResolvedFrames.ts", 220);
    });

    it("verifies AtlasSlicing subcomponents are modular and compact", () => {
      checkFileLines("subtabs/atlas/slicing/SlicingMethodTabs.tsx", 100);
      checkFileLines("subtabs/atlas/slicing/SlicingGridConfigCard.tsx", 200);
      checkFileLines("subtabs/atlas/slicing/SlicingAutoIslandsCard.tsx", 170);
      checkFileLines("subtabs/atlas/slicing/SlicingTrackAssignmentBar.tsx", 100);
      checkFileLines("subtabs/atlas/slicing/SlicingFreeformTable.tsx", 200);
      checkFileLines("subtabs/atlas/slicing/SlicingTracksManager.tsx", 320);
    });
  });
});
