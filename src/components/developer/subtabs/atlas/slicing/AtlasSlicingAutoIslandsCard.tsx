import React from "react";
import { Sparkles, Check, Save } from "lucide-react";
import { Button, Badge, CompactNumberStepper, ActionBar } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { IAtlasSlicingConfig, ResolvedFrameRect } from "../types";

export interface AtlasSlicingAutoIslandsCardProps {
  slicingConfig?: IAtlasSlicingConfig;
  detectedIslands: ResolvedFrameRect[];
  bakeSuccess: boolean;
  onBakeAllIslands: () => void;
  onClusterRowsIntoTracks?: () => void;
  onSlicingConfigChange: (config: IAtlasSlicingConfig) => void;
}

export const AtlasSlicingAutoIslandsCard: React.FC<AtlasSlicingAutoIslandsCardProps> = ({
  slicingConfig,
  detectedIslands,
  bakeSuccess,
  onBakeAllIslands,
  onClusterRowsIntoTracks,
  onSlicingConfigChange,
}) => {
  const { t } = useI18n();

  const autoConfig = slicingConfig?.autoIslands || {};

  const handleUpdateAutoParam = (field: string, val: number) => {
    onSlicingConfigChange({
      ...slicingConfig,
      method: "auto_islands",
      autoIslands: {
        ...autoConfig,
        [field]: val,
      },
    });
  };

  return (
    <div className="p-3 bg-black/40 rounded-xl border border-stone-800/80 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
          <Sparkles size={13} className="text-yellow-400" />
          <span>{t("atlasStudioAutoIslandsTitle")}</span>
        </div>
        <Badge variant={detectedIslands.length > 0 ? "green" : "stone"}>
          {detectedIslands.length} {t("atlasStudioIslandsDetected")}
        </Badge>
      </div>

      {/* Island Parameters Grid */}
      <div className="grid grid-cols-2 gap-2">
        <CompactNumberStepper
          min={2}
          max={500}
          unit="px"
          value={autoConfig.minIslandPixels ?? 15}
          onChange={(v) => handleUpdateAutoParam("minIslandPixels", v)}
          label={t("atlasStudioIslandMinPixels")}
        />

        <CompactNumberStepper
          min={1}
          max={50}
          unit="px"
          value={autoConfig.clusterYTolerance ?? 10}
          onChange={(v) => handleUpdateAutoParam("clusterYTolerance", v)}
          label={t("atlasStudioClusterYTolerance")}
        />
      </div>

      {/* Bake Island Action Bar */}
      <ActionBar
        description={t("atlasStudioBakeIslandsDesc")}
        actions={
          <>
            {onClusterRowsIntoTracks && (
              <Button
                size="sm"
                variant="secondary"
                icon={<Sparkles size={13} className="text-yellow-400" />}
                onClick={onClusterRowsIntoTracks}
                disabled={detectedIslands.length === 0}
                className="text-xs"
              >
                {t("atlasStudioClusterRowsBtn")}
              </Button>
            )}

            <Button
              size="sm"
              variant={bakeSuccess ? "primary" : "secondary"}
              icon={bakeSuccess ? <Check size={13} className="text-emerald-400" /> : <Save size={13} />}
              onClick={onBakeAllIslands}
              disabled={detectedIslands.length === 0}
              className="text-xs"
            >
              {bakeSuccess ? t("atlasStudioBakeSuccess") : t("atlasStudioBakeIslandsBtn")}
            </Button>
          </>
        }
      />
    </div>
  );
};

export default AtlasSlicingAutoIslandsCard;
