import React from "react";
import {
  Grid,
  Upload,
  FileJson,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Card, CardHeader, CardTitle, Badge, Button } from "@components/ui";
import { useI18n } from "@hooks/useI18n";
import { AtlasPresetSelector } from "./AtlasPresetSelector";

export interface AtlasHeaderToolbarProps {
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onJsonUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetDefaults: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
}

export const AtlasHeaderToolbar: React.FC<AtlasHeaderToolbarProps> = ({
  selectedPresetId,
  onSelectPreset,
  onImageUpload,
  onJsonUpload,
  onResetDefaults,
  isInspectorOpen,
  onToggleInspector,
}) => {
  const { t } = useI18n();

  return (
    <Card variant="default">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CardTitle icon={<Grid className="w-4 h-4 text-amber-400" />}>
              {t("subtabAtlasSlicer")}
            </CardTitle>
            <Badge variant="amber">Studio v3 Pro</Badge>
          </div>

          <AtlasPresetSelector
            selectedPresetId={selectedPresetId}
            onSelectPreset={onSelectPreset}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 hover:bg-[#1f0d06] text-stone-300 hover:text-amber-200 border border-stone-800 hover:border-amber-700 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
            <Upload size={12} />
            <span>{t("atlasStudioUploadImage")}</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={onImageUpload}
              className="hidden"
            />
          </label>

          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 hover:bg-[#1f0d06] text-stone-300 hover:text-amber-200 border border-stone-800 hover:border-amber-700 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
            <FileJson size={12} />
            <span>{t("atlasStudioLoadJsonFile")}</span>
            <input
              type="file"
              accept="application/json,.json"
              onChange={onJsonUpload}
              className="hidden"
            />
          </label>

          <Button
            size="sm"
            variant="ghost"
            onClick={onResetDefaults}
            title={t("atlasStudioResetDefaults")}
            className="h-8 px-2.5"
          >
            <RotateCcw size={13} />
          </Button>

          <Button
            size="sm"
            variant={isInspectorOpen ? "secondary" : "primary"}
            onClick={onToggleInspector}
            title={
              isInspectorOpen
                ? t("atlasStudioCollapseInspector")
                : t("atlasStudioExpandInspector")
            }
            className="h-8 px-2.5 flex items-center gap-1.5"
          >
            {isInspectorOpen ? (
              <PanelRightClose size={13} />
            ) : (
              <PanelRightOpen size={13} />
            )}
            <span className="hidden sm:inline text-xs font-semibold">
              {isInspectorOpen
                ? t("atlasStudioCollapseInspector")
                : t("atlasStudioExpandInspector")}
            </span>
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};

export default AtlasHeaderToolbar;
