import React from "react";
import { Grid, Pipette, FileJson } from "lucide-react";
import { Card, CardHeader, CardContent, SegmentedControl } from "@ui";
import { useI18n } from "@context/I18nContext";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  AtlasMetaDoc,
  IAtlasBackgroundConfig,
  IAtlasSlicingConfig,
  AtlasInspectorTabId,
  ResolvedFrameRect,
} from "./types";
import { AtlasSlicingInspector } from "./AtlasSlicingInspector";
import { AtlasBackgroundPanel } from "./AtlasBackgroundPanel";
import { AtlasJsonExportPanel } from "./AtlasJsonExportPanel";

import {
  AtlasTracksSlice,
  AtlasPresetSlice,
  AtlasTextureSlice,
  AtlasSlicingSlice,
  AtlasUiSlice,
} from "./hooks/useAtlasStudioState";

export interface AtlasInspectorDockSlicesProps {
  tracksSlice?: AtlasTracksSlice;
  presetSlice?: AtlasPresetSlice;
  slicingSlice?: AtlasSlicingSlice;
  textureSlice?: AtlasTextureSlice;
  uiSlice?: AtlasUiSlice;
}

export interface AtlasInspectorDockViewProps {
  activeTab?: AtlasInspectorTabId;
  onTabChange?: (tab: AtlasInspectorTabId) => void;
  onRequestEyedropper?: () => void;
  onResetDefaults?: () => void;
}

export interface AtlasInspectorSlicingProps {
  gridConfig?: AtlasGridConfig;
  slicingConfig?: IAtlasSlicingConfig;
  resolvedFrames?: ResolvedFrameRect[];
  onGridConfigChange?: (grid: AtlasGridConfig) => void;
  onSlicingConfigChange?: (config: IAtlasSlicingConfig) => void;
  onBakeIslands?: (islands?: ResolvedFrameRect[]) => void;
  onClusterRowsIntoTracks?: (detectedIslands?: ResolvedFrameRect[]) => void;
  onAddFreeformFrame?: (frame: {
    x: number;
    y: number;
    width: number;
    height: number;
    id?: string;
    trackName?: string;
    pivot?: { x: number; y: number };
  }) => void;
  onUpdateFreeformFrame?: (id: string, updates: Partial<ResolvedFrameRect>) => void;
  onDeleteFreeformFrame?: (id: string) => void;
  onAssignFramesToTrack?: (frameIds: string[], trackName: string) => void;
}

export interface AtlasInspectorTracksProps {
  tracks?: AtlasAnimationTrackDefinition[];
  selectedTrackName?: string | null;
  selectedFrameIndex?: number | null;
  onTracksChange?: (tracks: AtlasAnimationTrackDefinition[]) => void;
  onSelectTrack?: (trackName: string) => void;
  onSelectFrame?: (frameIdx: number) => void;
}

export interface AtlasInspectorBackgroundProps {
  backgroundConfig?: IAtlasBackgroundConfig;
  onBackgroundConfigChange?: (config: IAtlasBackgroundConfig) => void;
}

export interface AtlasInspectorDocumentProps {
  imageSrc?: string;
  image?: HTMLImageElement | null;
  assetId?: string;
  metaDoc?: AtlasMetaDoc;
  origin?: AtlasOriginDefinition;
  onOriginChange?: (origin: AtlasOriginDefinition) => void;
  onMetaDocChange?: (doc: AtlasMetaDoc) => void;
}

/**
 * Composite props for AtlasInspectorDock adhering to ISP (Interface Segregation Principle).
 */
export interface AtlasInspectorDockProps
  extends AtlasInspectorDockSlicesProps,
  AtlasInspectorDockViewProps,
  AtlasInspectorSlicingProps,
  AtlasInspectorTracksProps,
  AtlasInspectorBackgroundProps,
  AtlasInspectorDocumentProps { }

export const AtlasInspectorDock: React.FC<AtlasInspectorDockProps> = ({
  tracksSlice,
  presetSlice,
  slicingSlice,
  textureSlice,
  uiSlice,
  activeTab,
  onTabChange,
  imageSrc,
  image,
  assetId,
  metaDoc,
  gridConfig,
  tracks,
  selectedTrackName,
  selectedFrameIndex,
  origin,
  backgroundConfig,
  slicingConfig,
  resolvedFrames,
  onGridConfigChange,
  onTracksChange,
  onSelectTrack,
  onSelectFrame,
  onOriginChange,
  onBackgroundConfigChange,
  onSlicingConfigChange,
  onMetaDocChange,
  onResetDefaults,
  onRequestEyedropper,
  onBakeIslands,
  onClusterRowsIntoTracks,
  onAddFreeformFrame,
  onUpdateFreeformFrame,
  onDeleteFreeformFrame,
  onAssignFramesToTrack,
}) => {
  const { t } = useI18n();

  // Resolve values from slices or direct props
  const effTab = activeTab ?? uiSlice?.activeInspectorTab ?? "slicing";
  const effOnTabChange = onTabChange ?? uiSlice?.setActiveInspectorTab ?? (() => { });

  const effTracks = tracks ?? tracksSlice?.tracks ?? [];
  const effSelectedTrackName = selectedTrackName !== undefined ? selectedTrackName : (tracksSlice?.selectedTrackName ?? null);
  const effSelectedFrameIndex = selectedFrameIndex !== undefined ? selectedFrameIndex : (tracksSlice?.selectedFrameIndex ?? null);
  const effOnTracksChange = onTracksChange ?? tracksSlice?.setTracks ?? (() => { });
  const effOnSelectTrack = onSelectTrack ?? tracksSlice?.setSelectedTrackName ?? (() => { });
  const effOnSelectFrame = onSelectFrame ?? tracksSlice?.setSelectedFrameIndex ?? (() => { });

  const effAssetId = assetId ?? presetSlice?.activePreset?.id ?? "";
  const effMetaDoc: AtlasMetaDoc = metaDoc ?? presetSlice?.metaDoc ?? {
    characterId: effAssetId,
    entityType: "humanoid",
    version: "1.0",
    description: "",
    atlas: {
      columns: 1,
      rows: 1,
      cellWidth: 32,
      cellHeight: 32,
      spacing: 0,
      safeMargin: 0,
      background: "transparent",
    },
    animations: {},
  };
  const effOrigin: AtlasOriginDefinition = origin ?? presetSlice?.origin ?? {
    type: "center",
    normalized: { x: 0.5, y: 0.5 },
  };
  const effOnMetaDocChange = onMetaDocChange ?? presetSlice?.setMetaDoc ?? (() => { });
  const effOnResetDefaults = onResetDefaults ?? presetSlice?.handleResetDefaults ?? (() => { });

  const effImageSrc = imageSrc ?? presetSlice?.imageSrc ?? "";
  const effImage = image !== undefined ? image : (textureSlice?.image ?? null);

  const effGridConfig: AtlasGridConfig = gridConfig ?? slicingSlice?.gridConfig ?? {
    columns: 1,
    rows: 1,
    cellWidth: 32,
    cellHeight: 32,
    spacing: 0,
    safeMargin: 0,
  };
  const effSlicingConfig = slicingConfig ?? effMetaDoc.slicing;
  const effBackgroundConfig = backgroundConfig ?? effMetaDoc.backgroundConfig;
  const effResolvedFrames = resolvedFrames ?? slicingSlice?.resolvedFrames ?? [];
  const effOnGridConfigChange = onGridConfigChange ?? slicingSlice?.setGridConfig ?? (() => { });
  const effOnSlicingConfigChange = onSlicingConfigChange ?? slicingSlice?.handleSlicingConfigChange ?? (() => { });
  const effOnBackgroundConfigChange = onBackgroundConfigChange ?? slicingSlice?.handleBackgroundConfigChange ?? (() => { });
  const effOnBakeIslands = onBakeIslands ?? slicingSlice?.handleBakeIslands;
  const effOnClusterRowsIntoTracks = onClusterRowsIntoTracks ?? slicingSlice?.handleClusterIslandsIntoTracks;
  const effOnAddFreeformFrame = onAddFreeformFrame ?? slicingSlice?.handleAddFreeformFrame;
  const effOnDeleteFreeformFrame = onDeleteFreeformFrame ?? slicingSlice?.handleDeleteFreeformFrame;
  const effOnAssignFramesToTrack = onAssignFramesToTrack ?? slicingSlice?.handleAssignFramesToTrack;

  const tabs: { id: AtlasInspectorTabId; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    {
      id: "slicing",
      label: t("atlasStudioTabSlicing"),
      shortLabel: t("atlasStudioTabSlicing").split(" ")[0] || "Cięcie",
      icon: <Grid size={13} className="text-amber-400" />,
    },
    {
      id: "background",
      label: t("atlasStudioTabBackground"),
      shortLabel: t("atlasStudioTabBackground").split(" ")[0] || "Tło",
      icon: <Pipette size={13} className="text-rose-400" />,
    },
    {
      id: "json",
      label: t("atlasStudioTabExport"),
      shortLabel: t("atlasStudioTabExport").split(" ")[0] || "Eksport",
      icon: <FileJson size={13} className="text-emerald-400" />,
    },
  ];

  return (
    <Card variant="default" className="flex flex-col flex-1 h-full min-h-[480px]">
      {/* Dock Tabs Header */}
      <CardHeader className="p-2 border-b border-stone-800">
        <SegmentedControl<AtlasInspectorTabId>
          options={tabs.map((tab) => ({
            value: tab.id,
            label: tab.shortLabel,
            icon: tab.icon,
            title: tab.label,
          }))}
          value={effTab === "preview" ? "slicing" : effTab}
          onChange={(val) => effOnTabChange(val)}
          gridCols={3}
          fullWidth
          size="sm"
        />
      </CardHeader>

      {/* Dock Content Body */}
      <CardContent className="p-3 overflow-y-auto custom-scrollbar flex-1 max-h-[750px]">
        {(effTab === "slicing" || effTab === "preview") && (
          <AtlasSlicingInspector
            slicingConfig={effSlicingConfig}
            gridConfig={effGridConfig}
            tracks={effTracks}
            selectedTrackName={effSelectedTrackName}
            selectedFrameIndex={effSelectedFrameIndex}
            resolvedFrames={effResolvedFrames}
            onSlicingConfigChange={effOnSlicingConfigChange}
            onGridConfigChange={effOnGridConfigChange}
            onTracksChange={effOnTracksChange}
            onSelectTrack={effOnSelectTrack}
            onSelectFrame={effOnSelectFrame}
            onBakeIslands={effOnBakeIslands}
            onClusterRowsIntoTracks={effOnClusterRowsIntoTracks}
            onAddFreeformFrame={effOnAddFreeformFrame}
            onUpdateFreeformFrame={onUpdateFreeformFrame}
            onDeleteFreeformFrame={effOnDeleteFreeformFrame}
            onAssignFramesToTrack={effOnAssignFramesToTrack}
          />
        )}

        {effTab === "background" && (
          <AtlasBackgroundPanel
            imageSrc={effImageSrc}
            image={effImage}
            assetId={effAssetId}
            backgroundConfig={effBackgroundConfig}
            onBackgroundConfigChange={effOnBackgroundConfigChange}
            onRequestEyedropper={onRequestEyedropper ?? (() => { })}
          />
        )}

        {effTab === "json" && (
          <AtlasJsonExportPanel
            metaDoc={effMetaDoc}
            gridConfig={effGridConfig}
            tracks={effTracks}
            origin={effOrigin}
            assetId={effAssetId}
            slicingConfig={effSlicingConfig}
            backgroundConfig={effBackgroundConfig}
            onMetaDocChange={effOnMetaDocChange}
            onResetDefaults={effOnResetDefaults}
          />
        )}
      </CardContent>
    </Card>
  );
};
