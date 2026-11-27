import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom, setupDomEnvironment } from "@test-utils";
import { ATLAS_PRESETS } from "../assetPresets";
import { AtlasSlicerSubtab } from "../AtlasSlicerSubtab";

describe("Given the AtlasSlicerSubtab workbench", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("When mounted with default configuration", () => {
    it("Then it should render the preset list, texture viewer canvas, and inspector tabs", async () => {
      // Given
      const { container } = await renderIntoDom(<AtlasSlicerSubtab />);

      // When
      const rootEl = container.querySelector("#subtab-content-atlas-slicer");
      const canvases = container.querySelectorAll("canvas");

      // Then
      expect(rootEl).not.toBeNull();
      expect(canvases.length).toBe(2);
      for (const preset of ATLAS_PRESETS) {
        expect(container.textContent).toContain(preset.name);
      }
      expect(container.textContent).toContain("Podgląd");
      expect(container.textContent).toContain("Cięcie i Ścieżki");
      expect(container.textContent).toContain("Tło i Alpha");
      expect(container.textContent).toContain("JSON");
    });
  });

  describe("When switching to another preset in the preset list", () => {
    it("Then it should update the inspector track options, frame count, and JSON metadata", async () => {
      // Given
      const { container, click } = await renderIntoDom(<AtlasSlicerSubtab />);
      const portraitPresetBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Valen Portraits (5x5)")
      );
      expect(portraitPresetBtn).toBeDefined();

      // When
      if (portraitPresetBtn) {
        await click(portraitPresetBtn);
      }

      // Then
      expect(container.textContent).toContain("Ramki (25)");

      const jsonTab = Array.from(container.querySelectorAll('[role="tab"]')).find((el) =>
        el.textContent?.includes("JSON")
      );
      expect(jsonTab).toBeDefined();
      if (jsonTab) {
        await click(jsonTab);
      }
      const textarea = container.querySelector("textarea");
      expect(textarea?.value).toContain('"columns": 5');
      expect(textarea?.value).toContain('"rows": 5');
    });
  });

  describe("When switching inspector tabs and toggling inspector visibility", () => {
    it("Then it should switch between Slicing, Chroma, and collapse the inspector panel", async () => {
      // Given
      const { container, click } = await renderIntoDom(<AtlasSlicerSubtab />);
      const slicingTab = Array.from(container.querySelectorAll('[role="tab"]')).find((el) =>
        el.textContent?.includes("Cięcie i Ścieżki")
      );

      // When
      if (slicingTab) {
        await click(slicingTab);
      }

      // Then
      expect(container.textContent).toContain("Ścieżki Animacji");

      // When
      const toggleBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Ukryj Inspektor")
      );
      if (toggleBtn) {
        await click(toggleBtn);
      }

      // Then
      expect(container.textContent).toContain("Pokaż Inspektor");
      expect(container.querySelectorAll("canvas").length).toBe(1);
    });
  });
});
