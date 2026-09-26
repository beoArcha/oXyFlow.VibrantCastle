import React from "react";
import { Grid } from "lucide-react";
import { useI18n } from "../../../../../hooks/useI18n";
import { AtlasGridConfig, SlicingMethod } from "../types";

export interface SlicingGridConfigCardProps {
  gridConfig: AtlasGridConfig;
  method: SlicingMethod;
  onGridConfigChange: (grid: AtlasGridConfig) => void;
}

export const SlicingGridConfigCard: React.FC<SlicingGridConfigCardProps> = ({
  gridConfig,
  method,
  onGridConfigChange,
}) => {
  const { t } = useI18n();

  const handleFieldChange = (field: keyof AtlasGridConfig, value: number) => {
    const safeVal = Math.max(0, isNaN(value) ? 0 : value);
    onGridConfigChange({
      ...gridConfig,
      [field]: safeVal,
    });
  };

  return (
    <div className="p-3 bg-black/40 rounded-xl border border-stone-800/80 flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
        <Grid size={13} className="text-amber-400" />
        <span>{t("atlasStudioGridConfigTitle")}</span>
        <span className="text-[10px] text-stone-500 font-mono">({method})</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Columns */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-stone-400 font-mono uppercase">
            {t("atlasStudioGridCols")}
          </label>
          <input
            type="number"
            min={1}
            value={gridConfig.columns}
            onChange={(e) => handleFieldChange("columns", parseInt(e.target.value, 10))}
            className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs font-mono text-amber-200 outline-none focus:border-amber-500"
          />
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-stone-400 font-mono uppercase">
            {t("atlasStudioGridRows")}
          </label>
          <input
            type="number"
            min={1}
            value={gridConfig.rows}
            onChange={(e) => handleFieldChange("rows", parseInt(e.target.value, 10))}
            className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs font-mono text-amber-200 outline-none focus:border-amber-500"
          />
        </div>

        {/* Cell Width */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-stone-400 font-mono uppercase">
            {t("atlasStudioGridCellWidth")}
          </label>
          <input
            type="number"
            min={8}
            value={gridConfig.cellWidth}
            onChange={(e) => handleFieldChange("cellWidth", parseInt(e.target.value, 10))}
            className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs font-mono text-amber-200 outline-none focus:border-amber-500"
          />
        </div>

        {/* Cell Height */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-stone-400 font-mono uppercase">
            {t("atlasStudioGridCellHeight")}
          </label>
          <input
            type="number"
            min={8}
            value={gridConfig.cellHeight}
            onChange={(e) => handleFieldChange("cellHeight", parseInt(e.target.value, 10))}
            className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs font-mono text-amber-200 outline-none focus:border-amber-500"
          />
        </div>

        {/* Spacing */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-stone-400 font-mono uppercase">
            {t("atlasStudioGridSpacing")}
          </label>
          <input
            type="number"
            min={0}
            value={gridConfig.spacing}
            onChange={(e) => handleFieldChange("spacing", parseInt(e.target.value, 10))}
            className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs font-mono text-amber-200 outline-none focus:border-amber-500"
          />
        </div>

        {/* Safe Margin */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-stone-400 font-mono uppercase">
            {t("atlasStudioGridSafeMargin")}
          </label>
          <input
            type="number"
            min={0}
            value={gridConfig.safeMargin}
            onChange={(e) => handleFieldChange("safeMargin", parseInt(e.target.value, 10))}
            className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs font-mono text-amber-200 outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
};

export default SlicingGridConfigCard;
