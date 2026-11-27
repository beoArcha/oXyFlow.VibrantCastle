import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { act } from "react";
import {
  renderCustomHook,
  cleanupDom,
  setupDomEnvironment,
} from "@test-utils";
import { useAtlasSlicerState } from "../hooks/useAtlasSlicerState";

describe("useAtlasSlicerState hook", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should initialize with default preset and resolved frames", async () => {
    // Arrange & Act
    const { result } = await renderCustomHook(() => useAtlasSlicerState());

    // Assert
    expect(result.current.activePreset?.id).toBe("valen");
    expect(result.current.resolvedFrames.length).toBeGreaterThan(0);
    expect(result.current.jsonError).toBeNull();
    expect(result.current.jsonDraft).toContain('"columns"');
  });

  it("should switch preset and invoke onPresetSelected callback", async () => {
    // Arrange
    let resetCalled = 0;
    const { result } = await renderCustomHook(() =>
      useAtlasSlicerState({
        onPresetSelected: () => {
          resetCalled += 1;
        },
      })
    );

    // Act
    await act(async () => {
      result.current.handleSelectPreset("valen_portraits");
    });

    // Assert
    expect(result.current.activePreset?.id).toBe("valen_portraits");
    expect(result.current.meta.atlas.columns).toBe(5);
    expect(result.current.meta.atlas.rows).toBe(5);
    expect(result.current.resolvedFrames.length).toBe(25);
    expect(resetCalled).toBe(1);
  });

  it("should add and delete animation tracks cleanly", async () => {
    // Arrange
    const { result } = await renderCustomHook(() => useAtlasSlicerState());

    // Act
    await act(async () => {
      result.current.setNewTrackName("heavy_slash");
    });
    await act(async () => {
      result.current.handleAddTrack();
    });

    // Assert
    expect(result.current.meta.animations.heavy_slash).toBeDefined();
    expect(result.current.activeTrackName).toBe("heavy_slash");

    // Act
    await act(async () => {
      result.current.handleDeleteActiveTrack();
    });

    // Assert
    expect(result.current.meta.animations.heavy_slash).toBeUndefined();
  });

  it("should reverse and ping-pong active track frames", async () => {
    // Arrange
    const { result } = await renderCustomHook(() => useAtlasSlicerState());
    const initialCount = result.current.activeTrackFrames.length;

    // Act
    await act(async () => {
      result.current.handleReverseTrack();
    });
    const reversedLen = result.current.activeTrack?.frameIndices?.length ?? 0;

    await act(async () => {
      result.current.handlePingPongTrack();
    });

    // Assert
    expect(reversedLen).toBe(initialCount);
    expect(result.current.activeTrack?.frameIndices?.length).toBe(
      initialCount + Math.max(0, initialCount - 2)
    );
  });

  it("should report error on invalid live JSON draft and recover on valid JSON", async () => {
    // Arrange
    const { result } = await renderCustomHook(() => useAtlasSlicerState());
    const validDraft = result.current.jsonDraft;

    // Act
    await act(async () => {
      result.current.handleJsonDraftChange("{ invalid");
    });

    // Assert
    expect(result.current.jsonError).not.toBeNull();

    // Act
    await act(async () => {
      result.current.handleJsonDraftChange(validDraft);
    });

    // Assert
    expect(result.current.jsonError).toBeNull();
  });

  it("should reject malformed uploaded meta.json file without overwriting meta", async () => {
    // Arrange
    const { result } = await renderCustomHook(() => useAtlasSlicerState());
    const originalCols = result.current.meta.atlas.columns;
    const brokenFile = new globalThis.File(["{ bad json"], "broken.json", {
      type: "application/json",
    });

    // Act
    await act(async () => {
      result.current.handleUploadMeta(brokenFile);
      await new Promise((resolve) => setTimeout(resolve, 25));
    });

    // Assert
    expect(result.current.jsonError).toBe("Nieprawidłowy plik JSON.");
    expect(result.current.meta.atlas.columns).toBe(originalCols);
  });
});
