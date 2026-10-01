import React from "react";
import { Grid, Box, Sparkles, Layers } from "lucide-react";
import { SegmentedControl } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { SlicingMethod } from "../types";

export interface AtlasSlicingMethodTabsProps {
  currentMethod: SlicingMethod;
  onMethodChange: (method: SlicingMethod) => void;
}

export type SlicingMethodTabsProps = AtlasSlicingMethodTabsProps;

export const AtlasSlicingMethodTabs: React.FC<AtlasSlicingMethodTabsProps> = ({
  currentMethod,
  onMethodChange,
}) => {
  const { t } = useI18n();

  const options = [
    {
      value: "by_count" as const,
      label: t("atlasStudioMethodByCount"),
      icon: <Grid size={13} />,
    },
    {
      value: "by_cell_size" as const,
      label: t("atlasStudioMethodByCellSize"),
      icon: <Box size={13} />,
    },
    {
      value: "auto_islands" as const,
      label: t("atlasStudioMethodAutoIslands"),
      icon: <Sparkles size={13} className="text-yellow-400" />,
    },
    {
      value: "freeform_rects" as const,
      label: t("atlasStudioMethodFreeform"),
      icon: <Layers size={13} />,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
        <Layers size={13} className="text-amber-400" />
        <span>{t("atlasStudioSlicingStrategyLabel")}</span>
      </div>
      <SegmentedControl<SlicingMethod>
        options={options}
        value={currentMethod}
        onChange={onMethodChange}
        gridCols={4}
        fullWidth
        size="sm"
      />
    </div>
  );
};

export const SlicingMethodTabs = AtlasSlicingMethodTabs;
export default AtlasSlicingMethodTabs;
