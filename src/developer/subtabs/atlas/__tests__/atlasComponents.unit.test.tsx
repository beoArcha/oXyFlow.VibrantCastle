import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom, setupDomEnvironment } from "@test-utils";
import { ATLAS_PRESETS } from "../assetPresets";
import { buildEditableMetaFromPreset } from "../atlasSlicerHelpers";
import { AtlasPresetPicker } from "../AtlasPresetPicker";
import { AtlasTextureViewer } from "../AtlasTextureViewer";
import { AtlasAnimationPreview } from "../AtlasAnimationPreview";
import { AtlasBackgroundPanel } from "../AtlasBackgroundPanel";
import { AtlasJsonExportPanel } from "../AtlasJsonExportPanel";

describe("Atlas Studio sub-components", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render preset buttons and emit selected preset id on click", async () => {
    // Arrange
    let selectedId = "";
    const { container, click } = await renderIntoDom(
      <AtlasPresetPicker
        categoryFilter="all"
        onCategoryFilterChange={() => {}}
        presetSearch=""
        onPresetSearchChange={() => {}}
        filteredPresets={ATLAS_PRESETS}
        activePresetId="valen"
        hasCustomImage={false}
        onSelectPreset={(id) => {
          selectedId = id;
        }}
        onUploadImage={() => {}}
        onUploadMeta={() => {}}
      />
    );
    const aureliaBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Aurelia (Mage / Heroine)")
    );

    // Act
    if (aureliaBtn) {
      await click(aureliaBtn);
    }

    // Assert
    expect(aureliaBtn).toBeDefined();
    expect(selectedId).toBe("aurelia");
  });

  it("should render AtlasTextureViewer canvas, tool buttons, and telemetry footer", async () => {
    // Arrange
    const canvasRef = React.createRef<HTMLCanvasElement | null>();

    // Act
    const { container } = await renderIntoDom(
      <AtlasTextureViewer
        sheetCanvasRef={canvasRef}
        toolMode="select"
        onToolModeChange={() => {}}
        inspectorOpen={true}
        onToggleInspector={() => {}}
        showGrid={true}
        onToggleGrid={() => {}}
        showTracks={true}
        onToggleTracks={() => {}}
        showMargins={false}
        onToggleMargins={() => {}}
        showFrames={true}
        onToggleFrames={() => {}}
        showChromaPreview={false}
        onToggleChromaPreview={() => {}}
        frameCount={16}
        zoom={0.75}
        onFitCanvas={() => {}}
        onResetZoom={() => {}}
        onZoomOut={() => {}}
        onZoomIn={() => {}}
        onCanvasMouseDown={() => {}}
        onCanvasMouseMove={() => {}}
        onStopPanning={() => {}}
        textureW={512}
        textureH={256}
        cursorCoords={null}
        selectedFrameObj={null}
      />
    );

    // Assert
    expect(container.querySelector("canvas")).not.toBeNull();
    expect(container.textContent).toContain("512×256px");
    expect(container.textContent).toContain("Ramki (16)");
  });

  it("should render AtlasAnimationPreview filmstrip and trigger reverse callback", async () => {
    // Arrange
    const previewRef = React.createRef<HTMLCanvasElement | null>();
    const meta = buildEditableMetaFromPreset(ATLAS_PRESETS[0]);
    let reversed = false;
    const { container, click } = await renderIntoDom(
      <AtlasAnimationPreview
        previewCanvasRef={previewRef}
        animations={meta.animations}
        activeTrackName="idle"
        activeTrack={meta.animations.idle}
        activeTrackFrames={[
          { id: "f0", x: 0, y: 0, width: 64, height: 64 },
          { id: "f1", x: 64, y: 0, width: 64, height: 64 },
        ]}
        anchor={meta.layout.anchor}
        isPlaying={false}
        playheadIdx={0}
        previewScale={1.5}
        flipX={false}
        showGroundLine={true}
        onionSkin={false}
        onSelectTrack={() => {}}
        onStepPrev={() => {}}
        onTogglePlay={() => {}}
        onStepNext={() => {}}
        onPreviewScaleChange={() => {}}
        onToggleFlipX={() => {}}
        onToggleGroundLine={() => {}}
        onToggleOnionSkin={() => {}}
        onUpdateMeta={() => {}}
        onReverseTrack={() => {
          reversed = true;
        }}
        onPingPongTrack={() => {}}
        onSelectFilmstripFrame={() => {}}
      />
    );
    const reverseBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Odwróć")
    );

    // Act
    if (reverseBtn) {
      await click(reverseBtn);
    }

    // Assert
    expect(container.querySelector("canvas")).not.toBeNull();
    expect(container.textContent).toContain("#1");
    expect(container.textContent).toContain("#2");
    expect(reversed).toBe(true);
  });

  it("should render AtlasBackgroundPanel and AtlasJsonExportPanel controls cleanly", async () => {
    // Arrange
    let autoDetected = false;
    let resetCalled = false;

    // Act
    const bgView = await renderIntoDom(
      <AtlasBackgroundPanel
        backgroundConfig={{ mode: "transparent", colorHex: "#ff00ff", tolerance: 18, removeAtRuntime: false }}
        chromaFeather={6}
        showChromaPreview={false}
        onUpdateMeta={() => {}}
        onAutoDetectBackground={() => {
          autoDetected = true;
        }}
        onEnableChromaPreview={() => {}}
        onChromaPreviewChange={() => {}}
        onChromaFeatherChange={() => {}}
        onBakeCleanPng={() => {}}
      />
    );
    const autoBtn = Array.from(bgView.container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Auto-wykryj tło")
    );
    if (autoBtn) await bgView.click(autoBtn);

    const jsonView = await renderIntoDom(
      <AtlasJsonExportPanel
        jsonDraft='{"atlas":{"columns":4,"rows":4}}'
        jsonError={null}
        onJsonDraftChange={() => {}}
        onCopyJson={() => {}}
        onDownloadJson={() => {}}
        onResetPreset={() => {
          resetCalled = true;
        }}
      />
    );
    const resetBtn = Array.from(jsonView.container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Resetuj")
    );
    if (resetBtn) await jsonView.click(resetBtn);

    // Assert
    expect(autoDetected).toBe(true);
    expect(jsonView.container.textContent).toContain("Poprawny meta.json");
    expect(resetCalled).toBe(true);
  });
});
