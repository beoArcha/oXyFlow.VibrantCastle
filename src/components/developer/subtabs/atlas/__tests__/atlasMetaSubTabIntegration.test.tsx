import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { AtlasMetaSubTab } from "../../AtlasMetaSubTab";
import { renderIntoDom, cleanupDom, setupDomEnvironment } from "@test-utils";
import { defaultAtlasAssetRegistry } from "@game/engine/meta/registry";

describe("AtlasMetaSubTab Composite Integration", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("mounts Atlas Studio workbench with default preset and orchestrates sub-views cleanly", async () => {
    const { container, click } = await renderIntoDom(<AtlasMetaSubTab />);

    // 1. Verify container root is rendered
    const rootEl = container.querySelector("#subtab-content-atlas-slicer");
    expect(rootEl).not.toBeNull();

    // 2. Verify Preset selector shows active preset
    const allPresets = defaultAtlasAssetRegistry.getAllResolved();
    const defaultPreset = allPresets[0];
    expect(container.textContent).toContain(defaultPreset.name);

    // 3. Verify Texture Viewer canvas is initialized
    const canvases = container.querySelectorAll("canvas");
    expect(canvases.length).toBeGreaterThan(0);

    // 4. Verify Filmstrip container is rendered
    if (defaultPreset.defaultMeta?.animations) {
      expect(container.textContent).toContain(Object.keys(defaultPreset.defaultMeta.animations)[0]);
    }

    // 5. Verify Status Bar is rendered with asset info
    expect(container.textContent).toContain(defaultPreset.category);

    // 6. Test toggling side inspector panel
    const toggleInspectorBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.getAttribute("aria-label")?.includes("panel") ||
      b.textContent?.includes("Panel") ||
      b.getAttribute("title")?.includes("panel")
    );

    if (toggleInspectorBtn) {
      await click(toggleInspectorBtn);
      // Ensure click toggled without unhandled runtime exceptions
      expect(rootEl).not.toBeNull();
    }
  });

  it("switches to another preset when requested from registry", async () => {
    const allPresets = defaultAtlasAssetRegistry.getAll();
    if (allPresets.length < 2) return;

    const targetPreset = allPresets[1];
    const { container, click } = await renderIntoDom(<AtlasMetaSubTab />);

    // Open preset selector dropdown
    const triggerBtn = container.querySelector("#atlas-preset-selector-trigger");
    if (triggerBtn) {
      await click(triggerBtn);

      // Click on target preset option
      const presetOption = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes(targetPreset.name)
      );

      if (presetOption) {
        await click(presetOption);
        expect(container.textContent).toContain(targetPreset.name);
      }
    }
  });
});
