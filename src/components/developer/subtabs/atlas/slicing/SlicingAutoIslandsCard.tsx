import React from "react";
import { Sparkles, Check, Save } from "lucide-react";
import { Button, Badge } from "@components/ui";
import { useI18n } from "@hooks/useI18n";
import { IAtlasSlicingConfig, ResolvedFrameRect } from "../types";

export interface SlicingAutoIslandsCardProps {
  slicingConfig?: IAtlasSlicingConfig;
  detectedIslands: ResolvedFrameRect[];
  bakeSuccess: boolean;
  onBakeAllIslands: () => void;
  onSlicingConfigChange: (config: IAtlasSlicingConfig) => void;
}

export const SlicingAutoIslandsCard: React.FC<SlicingAutoIslandsCardProps> = ({
  slicingConfig,
  detectedIslands,
  bakeSuccess,
  onBakeAllIslands,
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
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-stone-400 font-mono">
            {t("atlasStudioIslandMinPixels")}
          </label>
          <input
            type="number"
            min={2}
            max={500}
            value={autoConfig.minIslandPixels ?? 15}
            onChange={(e) => handleUpdateAutoParam("minIslandPixels", parseInt(e.target.value, 10) || 15)}
            className="bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs font-mono text-emerald-300 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-stone-400 font-mono">
            Cluster Y Tolerance (px)
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={autoConfig.clusterYTolerance ?? 10}
            onChange={(e) => handleUpdateAutoParam("clusterYTolerance", parseInt(e.target.value, 10) || 10)}
            className="bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs font-mono text-emerald-300 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Bake Island Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 gap-2 flex-wrap">
        <p className="text-[11px] text-stone-400">
          {t("atlasStudioBakeIslandsDesc")}
        </p>
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
      </div>
    </div>
  );
};

export default SlicingAutoIslandsCard;
