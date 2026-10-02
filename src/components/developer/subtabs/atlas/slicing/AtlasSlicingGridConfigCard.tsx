import React from "react";
import { Grid } from "lucide-react";
import { CompactNumberStepper, Card } from "@components/ui";
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
    onGridConfigChange({
      ...gridConfig,
      [field]: value,
    });
  };

  return (
    <Card variant="subtle" className="p-3 gap-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
        <Card.Title icon={<Grid size={13} className="text-amber-400" />} className="text-xs">
          {t("atlasStudioGridConfigTitle")}
        </Card.Title>
        <span className="text-[10px] text-stone-500 font-mono">({method})</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Columns */}
        <CompactNumberStepper
          min={1}
          value={gridConfig.columns}
          onChange={(v) => handleFieldChange("columns", v)}
          label={t("atlasStudioGridCols")}
        />

        {/* Rows */}
        <CompactNumberStepper
          min={1}
          value={gridConfig.rows}
          onChange={(v) => handleFieldChange("rows", v)}
          label={t("atlasStudioGridRows")}
        />

        {/* Cell Width */}
        <CompactNumberStepper
          min={8}
          unit="px"
          value={gridConfig.cellWidth}
          onChange={(v) => handleFieldChange("cellWidth", v)}
          label={t("atlasStudioGridCellWidth")}
        />

        {/* Cell Height */}
        <CompactNumberStepper
          min={8}
          unit="px"
          value={gridConfig.cellHeight}
          onChange={(v) => handleFieldChange("cellHeight", v)}
          label={t("atlasStudioGridCellHeight")}
        />

        {/* Spacing */}
        <CompactNumberStepper
          min={0}
          unit="px"
          value={gridConfig.spacing}
          onChange={(v) => handleFieldChange("spacing", v)}
          label={t("atlasStudioGridSpacing")}
        />

        {/* Safe Margin */}
        <CompactNumberStepper
          min={0}
          unit="px"
          value={gridConfig.safeMargin}
          onChange={(v) => handleFieldChange("safeMargin", v)}
          label={t("atlasStudioGridSafeMargin")}
        />
      </div>
    </Card>
  );
};

export default AtlasSlicingGridConfigCard;
