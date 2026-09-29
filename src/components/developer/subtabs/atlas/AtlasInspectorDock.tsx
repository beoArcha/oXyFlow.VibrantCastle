import React from "react";
import { Sparkles, Grid, Pipette, FileJson } from "lucide-react";
import { Card, CardHeader, CardContent } from "@components/ui";
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
import { AtlasAnimationPreview } from "./AtlasAnimationPreview";
import { AtlasSlicingInspector } from "./AtlasSlicingInspector";
import { AtlasBackgroundPanel } from "./AtlasBackgroundPanel";
import { AtlasJsonExportPanel } from "./AtlasJsonExportPanel";

export interface AtlasInspectorDockProps {
  activeTab: AtlasInspectorTabId;
  onTabChange: (tab: AtlasInspectorTabId) => void;
  imageSrc: string;
  assetId: string;
  metaDoc: AtlasMetaDoc;
  gridConfig: AtlasGridConfig;
  tracks: AtlasAnimationTrackDefinition[];
  selectedTrackName: string | null;
  selectedFrameIndex: number | null;
  origin: AtlasOriginDefinition;
  backgroundConfig?: IAtlasBackgroundConfig;
  slicingConfig?: IAtlasSlicingConfig;
  resolvedFrames?: ResolvedFrameRect[];
  onGridConfigChange: (grid: AtlasGridConfig) => void;
  onTracksChange: (tracks: AtlasAnimationTrackDefinition[]) => void;
  onSelectTrack: (trackName: string) => void;
  onSelectFrame: (frameIdx: number) => void;
  onOriginChange: (origin: AtlasOriginDefinition) => void;
  onBackgroundConfigChange: (config: IAtlasBackgroundConfig) => void;
  onSlicingConfigChange: (config: IAtlasSlicingConfig) => void;
  onMetaDocChange: (doc: AtlasMetaDoc) => void;
  onResetDefaults: () => void;
  onRequestEyedropper: () => void;
  onBakeIslands?: (islands: ResolvedFrameRect[]) => void;
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

export const AtlasInspectorDock: React.FC<AtlasInspectorDockProps> = ({
  activeTab,
  onTabChange,
  imageSrc,
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
  onAddFreeformFrame,
  onUpdateFreeformFrame,
  onDeleteFreeformFrame,
  onAssignFramesToTrack,
}) => {
  const { t } = useI18n();

  const tabs: { id: AtlasInspectorTabId; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    {
      id: "preview",
      label: t("atlasStudioTabLivePreview"),
      shortLabel: t("atlasStudioTabLivePreview").split(" ")[0] || "Podgląd",
      icon: <Sparkles size={13} className="text-cyan-400" />,
    },
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
    <Card variant="default" className="flex flex-col flex-1 h-full min-h-[580px]">
      {/* Dock Tabs Header */}
      <CardHeader className="p-2 border-b border-stone-800">
        <div className="grid grid-cols-4 gap-1 w-full bg-black/60 p-1 rounded-xl border border-stone-800">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${isActive
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-400 shadow-md shadow-amber-950/50"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/50"
                  }`}
              >
                {tab.icon}
                <span className="truncate">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      {/* Dock Content Body */}
      <CardContent className="p-3 overflow-y-auto custom-scrollbar flex-1 max-h-[750px]">
        {activeTab === "preview" && (
          <AtlasAnimationPreview
            imageSrc={imageSrc}
            gridConfig={gridConfig}
            tracks={tracks}
            selectedTrackName={selectedTrackName}
            selectedFrameIndex={selectedFrameIndex}
            origin={origin}
            backgroundConfig={backgroundConfig}
            onSelectTrack={onSelectTrack}
            onSelectFrame={onSelectFrame}
            onOriginChange={onOriginChange}
          />
        )}

        {activeTab === "slicing" && (
          <AtlasSlicingInspector
            slicingConfig={slicingConfig}
            gridConfig={gridConfig}
            tracks={tracks}
            selectedTrackName={selectedTrackName}
            selectedFrameIndex={selectedFrameIndex}
            resolvedFrames={resolvedFrames}
            onSlicingConfigChange={onSlicingConfigChange}
            onGridConfigChange={onGridConfigChange}
            onTracksChange={onTracksChange}
            onSelectTrack={onSelectTrack}
            onSelectFrame={onSelectFrame}
            onBakeIslands={onBakeIslands}
            onAddFreeformFrame={onAddFreeformFrame}
            onUpdateFreeformFrame={onUpdateFreeformFrame}
            onDeleteFreeformFrame={onDeleteFreeformFrame}
            onAssignFramesToTrack={onAssignFramesToTrack}
          />
        )}

        {activeTab === "background" && (
          <AtlasBackgroundPanel
            imageSrc={imageSrc}
            assetId={assetId}
            backgroundConfig={backgroundConfig}
            onBackgroundConfigChange={onBackgroundConfigChange}
            onRequestEyedropper={onRequestEyedropper}
          />
        )}

        {activeTab === "json" && (
          <AtlasJsonExportPanel
            metaDoc={metaDoc}
            gridConfig={gridConfig}
            tracks={tracks}
            origin={origin}
            assetId={assetId}
            slicingConfig={slicingConfig}
            backgroundConfig={backgroundConfig}
            onMetaDocChange={onMetaDocChange}
            onResetDefaults={onResetDefaults}
          />
        )}
      </CardContent>
    </Card>
  );
};
