import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Grid,
  Sparkles,
  Upload,
  User,
  Skull,
  Building,
  FileJson,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "../../ui";
import { useI18n } from "../../../hooks/useI18n";
import {
  ATLAS_PRESETS,
  AtlasPresetItem,
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  AtlasMetaDoc,
  SelectedCellInfo,
  AtlasTextureViewer,
  AtlasAnimationPreview,
  AtlasMetaEditor,
} from "./atlas";

export const AtlasMetaSubTab: React.FC = () => {
  const { t } = useI18n();

  // Selected Preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>("valen");
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);

  // Active preset object
  const activePreset = useMemo(() => {
    return (
      ATLAS_PRESETS.find((p) => p.id === selectedPresetId) || ATLAS_PRESETS[0]
    );
  }, [selectedPresetId]);

  // Working state
  const [metaDoc, setMetaDoc] = useState<AtlasMetaDoc>(activePreset.defaultMeta);
  const [imageSrc, setImageSrc] = useState<string>(activePreset.imageSrc);

  const [gridConfig, setGridConfig] = useState<AtlasGridConfig>({
    columns: activePreset.defaultMeta.atlas?.columns || 12,
    rows: activePreset.defaultMeta.atlas?.rows || 8,
    spacing: activePreset.defaultMeta.atlas?.spacing || 0,
    safeMargin: activePreset.defaultMeta.atlas?.safeMargin || 0,
    cellWidth:
      activePreset.defaultMeta.variants?.high?.cellWidth ||
      activePreset.defaultMeta.atlas?.cellWidth ||
      128,
    cellHeight:
      activePreset.defaultMeta.variants?.high?.cellHeight ||
      activePreset.defaultMeta.atlas?.cellHeight ||
      128,
  });

  const [tracks, setTracks] = useState<AtlasAnimationTrackDefinition[]>([]);
  const [origin, setOrigin] = useState<AtlasOriginDefinition>({
    type: "feet",
    normalized: { x: 0.5, y: 1.0 },
  });

  const [selectedTrackName, setSelectedTrackName] = useState<string | null>(null);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(0);
  const [selectedCellInfo, setSelectedCellInfo] = useState<SelectedCellInfo | null>(
    null
  );

  // Helper to parse tracks from a metaDoc
  const parseTracksFromMeta = useCallback((doc: AtlasMetaDoc) => {
    const list: AtlasAnimationTrackDefinition[] = [];
    if (doc.animations) {
      Object.entries(doc.animations).forEach(([name, data]: [string, any]) => {
        // Character & Enemy format
        if (data.row !== undefined) {
          list.push({
            name,
            row: data.row ?? 0,
            frames: data.frames ?? 1,
            fps: data.fps ?? 8,
            loop: data.loop !== undefined ? data.loop : true,
            wide: data.wide,
            slotSpan: data.slotSpan,
            cells: data.cells,
            frameIndices: data.frameIndices,
          });
        }
      });
    }

    // Structure format (layout with rows)
    if (list.length === 0 && doc.layout) {
      Object.entries(doc.layout).forEach(([name, data]: [string, any]) => {
        if (typeof data === "object" && data.row !== undefined) {
          const animInfo = doc.animations?.[name] || {};
          list.push({
            name,
            row: data.row,
            frames: data.frames ?? 1,
            fps: animInfo.fps ?? 8,
            loop: animInfo.loop !== undefined ? animInfo.loop : true,
            slotSpan: data.widthCells ? Array(data.frames).fill(data.widthCells) : undefined,
          });
        }
      });
    }

    return list;
  }, []);

  // Sync state when switching presets
  const applyPreset = useCallback(
    (preset: AtlasPresetItem) => {
      setSelectedPresetId(preset.id);
      setImageSrc(preset.imageSrc);
      setMetaDoc(preset.defaultMeta);

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

      const parsedTracks = parseTracksFromMeta(preset.defaultMeta);
      setTracks(parsedTracks);
      setSelectedTrackName(parsedTracks[0]?.name || null);
      setSelectedFrameIndex(0);

      const parsedOrigin: AtlasOriginDefinition = {
        type: preset.defaultMeta.layout?.origin?.type || "feet",
        normalized: preset.defaultMeta.layout?.origin?.normalized ||
          preset.defaultMeta.anchor || { x: 0.5, y: 1.0 },
      };
      setOrigin(parsedOrigin);
    },
    [parseTracksFromMeta]
  );

  // Initialize on mount
  useEffect(() => {
    applyPreset(activePreset);
  }, []);

  // Reset current preset to original
  const handleResetDefaults = () => {
    applyPreset(activePreset);
  };

  // Custom texture file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomImageSrc(url);
      setImageSrc(url);
    }
  };

  // Custom JSON file upload
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setMetaDoc(parsed);
          if (parsed.atlas) {
            setGridConfig({
              columns: parsed.atlas.columns ?? gridConfig.columns,
              rows: parsed.atlas.rows ?? gridConfig.rows,
              spacing: parsed.atlas.spacing ?? gridConfig.spacing,
              safeMargin: parsed.atlas.safeMargin ?? gridConfig.safeMargin,
              cellWidth:
                parsed.variants?.high?.cellWidth ??
                parsed.atlas?.cellWidth ??
                gridConfig.cellWidth,
              cellHeight:
                parsed.variants?.high?.cellHeight ??
                parsed.atlas?.cellHeight ??
                gridConfig.cellHeight,
            });
          }
          const parsedTracks = parseTracksFromMeta(parsed);
          setTracks(parsedTracks);
          if (parsedTracks[0]) {
            setSelectedTrackName(parsedTracks[0].name);
            setSelectedFrameIndex(0);
          }
        } catch (err) {
          console.error("Failed to parse uploaded JSON file", err);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      id="subtab-content-atlas-slicer"
      className="flex flex-col gap-4 animate-in fade-in duration-150"
    >
      {/* 1. Header Toolbar: Preset Selector & File Buttons */}
      <Card variant="default">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle icon={<Grid className="w-4 h-4 text-amber-400" />}>
              {t("subtabAtlasSlicer")}
            </CardTitle>
            <Badge variant="amber">Studio v2</Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Presets Pills */}
            <div className="flex items-center gap-1 bg-[#120603] p-1 rounded-xl border border-stone-800 flex-wrap">
              {ATLAS_PRESETS.map((p) => {
                const isSelected = p.id === selectedPresetId;
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-400 shadow-md shadow-amber-950/60"
                        : "bg-black/40 text-stone-300 border-stone-800 hover:border-amber-700 hover:text-amber-200"
                    }`}
                  >
                    {p.category === "character" ? (
                      <User size={12} className="text-amber-300" />
                    ) : p.category === "enemy" ? (
                      <Skull size={12} className="text-rose-400" />
                    ) : (
                      <Building size={12} className="text-cyan-400" />
                    )}
                    {p.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>

            {/* Custom Texture Upload Button */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 hover:bg-[#1f0d06] text-stone-300 hover:text-amber-200 border border-stone-800 hover:border-amber-700 rounded-lg text-xs font-bold cursor-pointer transition-all">
              <Upload size={12} />
              <span>{t("atlasStudioUploadImage")}</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {/* Custom JSON Upload Button */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 hover:bg-[#1f0d06] text-stone-300 hover:text-amber-200 border border-stone-800 hover:border-amber-700 rounded-lg text-xs font-bold cursor-pointer transition-all">
              <FileJson size={12} />
              <span>{t("atlasStudioLoadJsonFile")}</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleJsonUpload}
                className="hidden"
              />
            </label>
          </div>
        </CardHeader>
      </Card>

      {/* 2. Main Workbench Grid: Left = Texture Grid Viewer, Right = Animation Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Texture & Grid Slicer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <AtlasTextureViewer
            imageSrc={imageSrc}
            gridConfig={gridConfig}
            tracks={tracks}
            selectedTrackName={selectedTrackName}
            selectedFrameIndex={selectedFrameIndex}
            onSelectCell={(info) => {
              setSelectedCellInfo(info);
              if (info.trackName) {
                setSelectedTrackName(info.trackName);
              }
              if (info.frameIndex !== undefined) {
                setSelectedFrameIndex(info.frameIndex);
              }
            }}
            onSelectTrack={(trackName) => {
              setSelectedTrackName(trackName);
              setSelectedFrameIndex(0);
            }}
            onSelectFrame={(frameIdx) => setSelectedFrameIndex(frameIdx)}
          />
        </div>

        {/* Right Column: Animation Preview & Scrubber (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <AtlasAnimationPreview
            imageSrc={imageSrc}
            gridConfig={gridConfig}
            tracks={tracks}
            selectedTrackName={selectedTrackName}
            selectedFrameIndex={selectedFrameIndex}
            origin={origin}
            onSelectTrack={(trackName) => {
              setSelectedTrackName(trackName);
              setSelectedFrameIndex(0);
            }}
            onSelectFrame={(frameIdx) => setSelectedFrameIndex(frameIdx)}
            onOriginChange={(newOrigin) => setOrigin(newOrigin)}
          />
        </div>
      </div>

      {/* 3. Bottom Row: Full *meta.json Inspector, Form & Validator */}
      <div className="flex flex-col">
        <AtlasMetaEditor
          metaDoc={metaDoc}
          gridConfig={gridConfig}
          tracks={tracks}
          origin={origin}
          assetId={activePreset.id}
          onGridConfigChange={(grid) => setGridConfig(grid)}
          onTracksChange={(newTracks) => setTracks(newTracks)}
          onOriginChange={(newOrigin) => setOrigin(newOrigin)}
          onMetaDocChange={(newDoc) => setMetaDoc(newDoc)}
          onResetDefaults={handleResetDefaults}
        />
      </div>
    </div>
  );
};

export default AtlasMetaSubTab;
