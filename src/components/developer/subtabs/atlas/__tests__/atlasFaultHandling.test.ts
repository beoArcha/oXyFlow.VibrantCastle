import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { useAtlasTexture } from "../hooks/useAtlasTexture";
import { useAtlasPresets } from "../hooks/useAtlasPresets";
import { useAtlasAnimationTracks } from "../hooks/useAtlasAnimationTracks";
import { useAtlasSlicingConfig } from "../hooks/useAtlasSlicingConfig";
import { AssetError, ParserError, ErrorCode, GameBaseError } from "@lib/errors";
import { LoggerManager, LogLevel } from "@lib/logger";
import {
  renderCustomHook,
  cleanupDom,
  setupDomEnvironment,
} from "@test-utils";

describe("Atlas Studio - Fault Handling & Error Resilience", () => {
  beforeEach(() => {
    setupDomEnvironment();
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
    LoggerManager.getInstance().ringBuffer.clear();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("Texture loading fault cases (useAtlasTexture)", () => {
    it("emits AssetError with ASSET_LOAD_FAILED when image fails to load", async () => {
      // Mock Image to simulate error event on bad URL
      const originalImage = global.Image;
      class FailingImage {
        crossOrigin = "";
        complete = false;
        naturalWidth = 0;
        naturalHeight = 0;
        private _src = "";
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(value: string) {
          this._src = value;
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 0);
        }
        get src() {
          return this._src;
        }
      }
      (global as any).Image = FailingImage;

      try {
        const { result } = await renderCustomHook(() =>
          useAtlasTexture("https://invalid-corrupted-domain.xyz/broken_texture.png")
        );

        // Allow async failure handler to trigger inside act
        await React.act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 30));
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.image).toBeNull();
        expect(result.current.error).toBeInstanceOf(AssetError);
        expect(result.current.error?.code).toBe(ErrorCode.ASSET_LOAD_FAILED);
      } finally {
        global.Image = originalImage;
      }
    });
  });

  describe("File upload validation fault cases (useAtlasPresets)", () => {
    it("rejects non-image files with ASSET_CORRUPTED in handleImageUpload", async () => {
      const { result } = await renderCustomHook(() =>
        useAtlasPresets({ parseTracksFromMeta: () => [] })
      );

      const fakeTextFile = new globalThis.File(["not an image"], "notes.txt", {
        type: "text/plain",
      });

      const fakeEvent = {
        target: {
          files: [fakeTextFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await React.act(async () => {
        result.current.handleImageUpload(fakeEvent);
      });

      expect(result.current.errorState).toBeInstanceOf(AssetError);
      expect((result.current.errorState as AssetError).code).toBe(ErrorCode.ASSET_CORRUPTED);
      expect(result.current.errorState?.message).toContain("Invalid graphic file type");
    });

    it("rejects malformed JSON with PARSER_INVALID_FORMAT in handleJsonUpload", async () => {
      const { result } = await renderCustomHook(() =>
        useAtlasPresets({ parseTracksFromMeta: () => [] })
      );

      const malformedJsonFile = new globalThis.File(["{ invalid json content:"], "broken.json", {
        type: "application/json",
      });

      const fakeEvent = {
        target: {
          files: [malformedJsonFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await React.act(async () => {
        result.current.handleJsonUpload(fakeEvent);
        await new Promise((resolve) => setTimeout(resolve, 40));
      });

      expect(result.current.errorState).toBeInstanceOf(ParserError);
      expect((result.current.errorState as ParserError).code).toBe(ErrorCode.PARSER_INVALID_FORMAT);
    });

    it("rejects empty JSON files with PARSER_INVALID_FORMAT", async () => {
      const { result } = await renderCustomHook(() =>
        useAtlasPresets({ parseTracksFromMeta: () => [] })
      );

      const emptyFile = new globalThis.File(["   "], "empty.json", {
        type: "application/json",
      });

      const fakeEvent = {
        target: {
          files: [emptyFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await React.act(async () => {
        result.current.handleJsonUpload(fakeEvent);
        await new Promise((resolve) => setTimeout(resolve, 40));
      });

      expect(result.current.errorState).toBeInstanceOf(ParserError);
      expect(result.current.errorState?.message).toContain("JSON file is empty");
    });
  });

  describe("Empty state operations (Tracks & Slicing)", () => {
    it("gracefully ignores reorder requests when no track is selected", async () => {
      const { result } = await renderCustomHook(() => useAtlasAnimationTracks());

      await React.act(async () => {
        result.current.setSelectedTrackName(null);
        result.current.handleReorderTrackFrames(0, 1);
        result.current.handleReverseTrack();
        result.current.handlePingPongTrack();
        result.current.handleClearTrackFrames();
      });

      expect(result.current.tracks.length).toBe(0);
    });

    it("gracefully handles deleting non-existent freeform frames without throwing", async () => {
      let capturedError: GameBaseError | null = null;
      const { result } = await renderCustomHook(() =>
        useAtlasSlicingConfig({
          metaDoc: {
            characterId: "test",
            entityType: "humanoid",
            version: "1.0",
            description: "",
            atlas: { columns: 4, rows: 4, cellWidth: 32, cellHeight: 32, spacing: 0, safeMargin: 0, background: "transparent" },
            animations: {},
            slicing: {
              method: "freeform_rects",
              frames: [{ id: "f1", x: 0, y: 0, width: 32, height: 32 }],
            },
          },
          setMetaDoc: () => {},
          setTracks: () => {},
          setSelectedTrackName: () => {},
          setSelectedFrameIndex: () => {},
          setActiveInspectorTab: () => {},
          setErrorState: (err) => {
            capturedError = err;
          },
          gridRows: 4,
        })
      );

      await React.act(async () => {
        result.current.handleDeleteFreeformFrame("non_existent_id");
      });

      expect(capturedError).toBeNull();
    });
  });
});
