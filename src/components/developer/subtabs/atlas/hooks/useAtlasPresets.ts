import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AtlasPresetItem,
  AtlasGridConfig,
  AtlasOriginDefinition,
  AtlasMetaDoc,
  AtlasAnimationTrackDefinition,
} from "../types";
import { ATLAS_PRESETS } from "../assetPresets";
import { LoggerManager } from "@lib/logger";
import { AssetError, ParserError, ErrorCode, GameBaseError } from "@lib/errors";

const fallbackMetaDoc: AtlasMetaDoc = {
  characterId: "default",
  entityType: "humanoid",
  version: "1.0",
  description: "Default Atlas",
  atlas: {
    columns: 12,
    rows: 8,
    spacing: 0,
    background: "transparent",
    safeMargin: 0,
    noOverflow: true,
    noOverlap: true,
  },
};

export interface UseAtlasPresetsOptions {
  onTracksParsed?: (tracks: AtlasAnimationTrackDefinition[], selectedTrackName: string) => void;
  parseTracksFromMeta: (doc: AtlasMetaDoc) => AtlasAnimationTrackDefinition[];
}

/**
 * Domain slice hook managing built-in presets, custom textures, JSON document parsing,
 * and memory cleanup of object URLs.
 */
export function useAtlasPresets({ onTracksParsed, parseTracksFromMeta }: UseAtlasPresetsOptions) {
  const studioLogger = useMemo(() => LoggerManager.getInstance().getLogger("AtlasStudio"), []);

  const [selectedPresetId, setSelectedPresetId] = useState<string>("valen");
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<GameBaseError | null>(null);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (customImageSrc) {
        URL.revokeObjectURL(customImageSrc);
      }
    };
  }, [customImageSrc]);

  const activePreset = useMemo(() => {
    return (
      ATLAS_PRESETS.find((p) => p.id === selectedPresetId) ||
      ATLAS_PRESETS[0] ||
      null
    );
  }, [selectedPresetId]);

  const [metaDoc, setMetaDoc] = useState<AtlasMetaDoc>(
    activePreset?.defaultMeta || fallbackMetaDoc
  );
  const [imageSrc, setImageSrc] = useState<string>(activePreset?.imageSrc || "");

  const [gridConfig, setGridConfig] = useState<AtlasGridConfig>({
    columns: activePreset?.defaultMeta?.atlas?.columns || 12,
    rows: activePreset?.defaultMeta?.atlas?.rows || 8,
    spacing: activePreset?.defaultMeta?.atlas?.spacing || 0,
    safeMargin: activePreset?.defaultMeta?.atlas?.safeMargin || 0,
    cellWidth:
      activePreset?.defaultMeta?.variants?.high?.cellWidth ||
      activePreset?.defaultMeta?.atlas?.cellWidth ||
      128,
    cellHeight:
      activePreset?.defaultMeta?.variants?.high?.cellHeight ||
      activePreset?.defaultMeta?.atlas?.cellHeight ||
      128,
  });

  const [origin, setOrigin] = useState<AtlasOriginDefinition>({
    type: "feet",
    normalized: { x: 0.5, y: 1.0 },
  });

  const applyPreset = useCallback(
    (preset: AtlasPresetItem) => {
      setSelectedPresetId(preset.id);
      setImageSrc(preset.imageSrc);
      setCustomImageSrc((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
      setMetaDoc(preset.defaultMeta);
      setErrorState(null);

      studioLogger.info(`Loaded atlas preset: ${preset.name} [${preset.id}]`, {
        presetId: preset.id,
        category: preset.category,
      });

      const parsedGrid: AtlasGridConfig = {
        columns: preset.defaultMeta.atlas?.columns || 12,
        rows: preset.defaultMeta.atlas?.rows || 8,
        spacing: preset.defaultMeta.atlas?.spacing || 0,
        safeMargin: preset.defaultMeta.atlas?.safeMargin || 0,
        cellWidth:
          preset.defaultMeta.variants?.high?.cellWidth ||
          preset.defaultMeta.atlas?.cellWidth ||
          128,
        cellHeight:
          preset.defaultMeta.variants?.high?.cellHeight ||
          preset.defaultMeta.atlas?.cellHeight ||
          128,
      };
      setGridConfig(parsedGrid);

      let parsedTracks = parseTracksFromMeta(preset.defaultMeta);
      if (parsedTracks.length === 0) {
        parsedTracks = [
          {
            name: "idle",
            row: 0,
            frames: Math.min(4, parsedGrid.columns),
            fps: 8,
            loop: true,
          },
        ];
      }

      onTracksParsed?.(parsedTracks, parsedTracks[0]?.name || "idle");

      const parsedOrigin: AtlasOriginDefinition = {
        type: preset.defaultMeta.layout?.origin?.type || "feet",
        normalized:
          preset.defaultMeta.layout?.origin?.normalized ||
          preset.defaultMeta.anchor || { x: 0.5, y: 1.0 },
      };
      setOrigin(parsedOrigin);
    },
    [onTracksParsed, parseTracksFromMeta, studioLogger]
  );

  // Initialize on mount
  useEffect(() => {
    if (activePreset) {
      applyPreset(activePreset);
    }
  }, []);

  const handleResetDefaults = useCallback(() => {
    if (activePreset) {
      applyPreset(activePreset);
    }
  }, [activePreset, applyPreset]);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          const err = new AssetError(
            `Invalid graphic file type: ${file.type || file.name}`,
            ErrorCode.ASSET_CORRUPTED,
            { details: { fileName: file.name, fileType: file.type } }
          );
          studioLogger.error(err.message, { code: err.code, details: err.details });
          setErrorState(err);
          return;
        }

        const url = URL.createObjectURL(file);
        setCustomImageSrc((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return url;
        });
        setImageSrc(url);
        setErrorState(null);
        studioLogger.info(
          `Loaded custom image texture: ${file.name} (${Math.round(file.size / 1024)} KB)`,
          { fileName: file.name, size: file.size }
        );
      }
    },
    [studioLogger]
  );

  const handleJsonUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            if (!content || !content.trim()) {
              throw new ParserError("JSON file is empty", ErrorCode.PARSER_EMPTY_DOCUMENT, {
                details: { fileName: file.name },
              });
            }
            const parsed = JSON.parse(content);
            if (!parsed || typeof parsed !== "object") {
              throw new ParserError("Invalid JSON document structure", ErrorCode.PARSER_STRUCTURE_INVALID, {
                details: { fileName: file.name },
              });
            }

            setMetaDoc(parsed);
            setErrorState(null);
            studioLogger.info(
              `Successfully parsed and loaded JSON configuration: ${file.name}`,
              { fileName: file.name, size: file.size }
            );

            if (parsed.atlas) {
              setGridConfig((prevGrid) => ({
                columns: parsed.atlas.columns ?? prevGrid.columns,
                rows: parsed.atlas.rows ?? prevGrid.rows,
                spacing: parsed.atlas.spacing ?? prevGrid.spacing,
                safeMargin: parsed.atlas.safeMargin ?? prevGrid.safeMargin,
                cellWidth:
                  parsed.variants?.high?.cellWidth ??
                  parsed.atlas?.cellWidth ??
                  prevGrid.cellWidth,
                cellHeight:
                  parsed.variants?.high?.cellHeight ??
                  parsed.atlas?.cellHeight ??
                  prevGrid.cellHeight,
              }));
            }
            let parsedTracks = parseTracksFromMeta(parsed);
            if (parsedTracks.length === 0) {
              parsedTracks = [
                {
                  name: "default",
                  row: 0,
                  frames: 4,
                  fps: 8,
                  loop: true,
                },
              ];
            }
            onTracksParsed?.(parsedTracks, parsedTracks[0]?.name || "default");
          } catch (err: unknown) {
            const parseError =
              err instanceof ParserError
                ? err
                : new ParserError(
                    `Failed to parse meta JSON file: ${err instanceof Error ? err.message : "Unknown error"}`,
                    ErrorCode.PARSER_INVALID_FORMAT,
                    { details: { fileName: file.name }, cause: err }
                  );
            studioLogger.error(parseError.message, {
              code: parseError.code,
              details: parseError.details,
            });
            setErrorState(parseError);
          }
        };
        reader.onerror = () => {
          const readError = new ParserError(
            `Failed to read file from disk: ${file.name}`,
            ErrorCode.PARSER_INVALID_FORMAT,
            { details: { fileName: file.name } }
          );
          studioLogger.error(readError.message, { code: readError.code });
          setErrorState(readError);
        };
        reader.readAsText(file);
      }
    },
    [onTracksParsed, parseTracksFromMeta, studioLogger]
  );

  return {
    selectedPresetId,
    activePreset,
    metaDoc,
    imageSrc,
    gridConfig,
    origin,
    errorState,
    setMetaDoc,
    setImageSrc,
    setGridConfig,
    setOrigin,
    setErrorState,
    applyPreset,
    handleResetDefaults,
    handleImageUpload,
    handleJsonUpload,
  };
}

export default useAtlasPresets;
