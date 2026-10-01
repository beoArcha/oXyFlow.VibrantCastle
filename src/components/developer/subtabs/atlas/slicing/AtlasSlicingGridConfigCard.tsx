import React from "react";
import { Grid } from "lucide-react";
import { Input } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { AtlasGridConfig, SlicingMethod } from "../types";

export interface AtlasSlicingGridConfigCardProps {
  gridConfig: AtlasGridConfig;
  method: SlicingMethod;
  onGridConfigChange: (grid: AtlasGridConfig) => void;
}

export const AtlasSlicingGridConfigCard: React.FC<AtlasSlicingGridConfigCardProps> = ({
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
        <Input
          type="number"
          min={1}
          value={gridConfig.columns}
          onChange={(e) => handleFieldChange("columns", parseInt(e.target.value, 10))}
          label={t("atlasStudioGridCols")}
          className="font-mono text-xs text-amber-200 py-1 px-2 h-7"
          containerClassName="gap-0.5"
        />

        {/* Rows */}
        <Input
          type="number"
          min={1}
          value={gridConfig.rows}
          onChange={(e) => handleFieldChange("rows", parseInt(e.target.value, 10))}
          label={t("atlasStudioGridRows")}
          className="font-mono text-xs text-amber-200 py-1 px-2 h-7"
          containerClassName="gap-0.5"
        />

        {/* Cell Width */}
        <Input
          type="number"
          min={8}
          value={gridConfig.cellWidth}
          onChange={(e) => handleFieldChange("cellWidth", parseInt(e.target.value, 10))}
          label={t("atlasStudioGridCellWidth")}
          className="font-mono text-xs text-amber-200 py-1 px-2 h-7"
          containerClassName="gap-0.5"
        />

        {/* Cell Height */}
        <Input
          type="number"
          min={8}
          value={gridConfig.cellHeight}
          onChange={(e) => handleFieldChange("cellHeight", parseInt(e.target.value, 10))}
          label={t("atlasStudioGridCellHeight")}
          className="font-mono text-xs text-amber-200 py-1 px-2 h-7"
          containerClassName="gap-0.5"
        />

        {/* Spacing */}
        <Input
          type="number"
          min={0}
          value={gridConfig.spacing}
          onChange={(e) => handleFieldChange("spacing", parseInt(e.target.value, 10))}
          label={t("atlasStudioGridSpacing")}
          className="font-mono text-xs text-amber-200 py-1 px-2 h-7"
          containerClassName="gap-0.5"
        />

        {/* Safe Margin */}
        <Input
          type="number"
          min={0}
          value={gridConfig.safeMargin}
          onChange={(e) => handleFieldChange("safeMargin", parseInt(e.target.value, 10))}
          label={t("atlasStudioGridSafeMargin")}
          className="font-mono text-xs text-amber-200 py-1 px-2 h-7"
          containerClassName="gap-0.5"
        />
      </div>
    </div>
  );
};

export default AtlasSlicingGridConfigCard;
