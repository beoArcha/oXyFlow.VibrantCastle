import { useState, useMemo, useCallback } from "react";
import type { ResolvedFrameRect } from "@game/engine/meta/types";
import { ATLAS_PRESETS, type AtlasAssetPreset } from "../assetPresets";
import {
  buildEditableMetaFromPreset,
  resolveFramesForMeta,
  triggerJsonTextDownload,
  type EditableMetaDoc,
} from "../atlasSlicerHelpers";
import {
  filterAtlasPresets,
  parseEditableMetaJson,
  parseUploadedMetaJson,
  buildBakedAutoIslandsFrames,
} from "../atlasSequenceHelpers";
import type { CategoryFilter } from "../types";
import { useAtlasTextureAndChroma } from "./useAtlasTextureAndChroma";
import { useAtlasTrackActions } from "./useAtlasTrackActions";

export interface UseAtlasSlicerStateOptions {
  readonly onPresetSelected?: () => void;
}

/**
 * Coordinates Atlas Slicer preset selection, editable metadata, JSON sync, frame resolution, and sub-hooks.
 */
export function useAtlasSlicerState(options?: UseAtlasSlicerStateOptions) {
  const onPresetSelected = options?.onPresetSelected;

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [presetSearch, setPresetSearch] = useState("");
  const [activePresetId, setActivePresetId] = useState<string>(
    ATLAS_PRESETS[0]?.id ?? "valen"
  );
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [customImageName, setCustomImageName] = useState<string | null>(null);

  const activePreset = useMemo<AtlasAssetPreset | undefined>(
    () => ATLAS_PRESETS.find((p) => p.id === activePresetId) ?? ATLAS_PRESETS[0],
    [activePresetId]
  );

  const [meta, setMeta] = useState<EditableMetaDoc>(() =>
    buildEditableMetaFromPreset(ATLAS_PRESETS[0])
  );
  const [jsonDraft, setJsonDraft] = useState<string>(() =>
    JSON.stringify(buildEditableMetaFromPreset(ATLAS_PRESETS[0]), null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const flashStatus = useCallback((msg: string) => {
    setStatusNotice(msg);
    window.setTimeout(() => setStatusNotice(null), 2400);
  }, []);

  const updateMeta = useCallback((updater: (prev: EditableMetaDoc) => EditableMetaDoc) => {
    setMeta((prev) => {
      const next = updater(prev);
      setJsonDraft(JSON.stringify(next, null, 2));
      setJsonError(null);
      return next;
    });
  }, []);

  const effectiveImageSrc = customImageSrc ?? activePreset?.imageSrc ?? "";

  const textureAndChroma = useAtlasTextureAndChroma({
    effectiveImageSrc,
    customImageName,
    activePresetId: activePreset?.id,
    meta,
    updateMeta,
    flashStatus,
  });

  const resolvedFrames = useMemo<ResolvedFrameRect[]>(
    () =>
      resolveFramesForMeta(
        meta,
        textureAndChroma.textureW,
        textureAndChroma.textureH,
        textureAndChroma.pixelBuffer
      ),
    [meta, textureAndChroma.textureW, textureAndChroma.textureH, textureAndChroma.pixelBuffer]
  );

  const trackActions = useAtlasTrackActions({
    initialTrackName:
      Object.keys(buildEditableMetaFromPreset(ATLAS_PRESETS[0]).animations)[0] ?? "idle",
    meta,
    resolvedFrames,
    updateMeta,
  });

  const { setActiveTrackName } = trackActions;

  const handleSelectPreset = useCallback(
    (presetId: string) => {
      const preset = ATLAS_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      setActivePresetId(preset.id);
      setCustomImageSrc(null);
      setCustomImageName(null);
      const nextMeta = buildEditableMetaFromPreset(preset);
      setMeta(nextMeta);
      setJsonDraft(JSON.stringify(nextMeta, null, 2));
      setJsonError(null);
      setActiveTrackName(Object.keys(nextMeta.animations)[0] ?? "idle");
      onPresetSelected?.();
    },
    [onPresetSelected, setActiveTrackName]
  );

  const filteredPresets = useMemo(
    () => filterAtlasPresets(ATLAS_PRESETS, categoryFilter, presetSearch),
    [categoryFilter, presetSearch]
  );

  const handleUploadImage = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setCustomImageSrc(url);
      setCustomImageName(file.name);
      flashStatus(`Załadowano własną teksturę: ${file.name}`);
    },
    [flashStatus]
  );

  const handleUploadMeta = useCallback(
    (file: File) => {
      file.text().then((txt) => {
        const result = parseUploadedMetaJson(txt);
        if (!result.ok) {
          setJsonError(result.error);
          return;
        }
        setMeta(result.meta);
        setJsonDraft(JSON.stringify(result.meta, null, 2));
        setJsonError(null);
        flashStatus(`Załadowano meta.json: ${file.name}`);
      });
    },
    [flashStatus]
  );

  const handleJsonDraftChange = useCallback((nextTxt: string) => {
    setJsonDraft(nextTxt);
    const result = parseEditableMetaJson(nextTxt);
    if (result.ok) {
      setMeta(result.meta);
      setJsonError(null);
    } else {
      setJsonError(result.error);
    }
  }, []);

  const handleCopyJson = useCallback(() => {
    navigator.clipboard?.writeText(jsonDraft);
    flashStatus("Skopiowano meta.json do schowka.");
  }, [jsonDraft, flashStatus]);

  const handleDownloadJson = useCallback(() => {
    triggerJsonTextDownload(jsonDraft, `${activePreset?.id ?? "atlas"}_meta.json`);
  }, [jsonDraft, activePreset?.id]);

  const handleBakeAutoIslands = useCallback(() => {
    if (!textureAndChroma.pixelBuffer) {
      flashStatus("Brak bufora pikseli do wykrycia wysp.");
      return;
    }
    const { bakedRecord, count } = buildBakedAutoIslandsFrames(
      meta,
      textureAndChroma.textureW,
      textureAndChroma.textureH,
      textureAndChroma.pixelBuffer
    );
    updateMeta((prev) => ({
      ...prev,
      slicing: {
        ...prev.slicing,
        method: "freeform_rects",
        frames: bakedRecord,
      },
    }));
    flashStatus(`Wykryto i wypalono ${count} wysp do freeform_rects.`);
  }, [
    textureAndChroma.pixelBuffer,
    textureAndChroma.textureW,
    textureAndChroma.textureH,
    meta,
    updateMeta,
    flashStatus,
  ]);

  return {
    categoryFilter,
    setCategoryFilter,
    presetSearch,
    setPresetSearch,
    activePreset,
    filteredPresets,
    customImageSrc,
    meta,
    updateMeta,
    jsonDraft,
    jsonError,
    statusNotice,
    resolvedFrames,
    ...textureAndChroma,
    ...trackActions,
    handleSelectPreset,
    handleUploadImage,
    handleUploadMeta,
    handleJsonDraftChange,
    handleCopyJson,
    handleDownloadJson,
    handleBakeAutoIslands,
  };
}
