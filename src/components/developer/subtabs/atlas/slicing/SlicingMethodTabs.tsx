import React from "react";
import { Grid, Box, Sparkles, Layers } from "lucide-react";
import { useI18n } from "../../../../../hooks/useI18n";
import { SlicingMethod } from "../types";

export interface SlicingMethodTabsProps {
  currentMethod: SlicingMethod;
  onMethodChange: (method: SlicingMethod) => void;
}

export const SlicingMethodTabs: React.FC<SlicingMethodTabsProps> = ({
  currentMethod,
  onMethodChange,
}) => {
  const { t } = useI18n();

  const methods: { id: SlicingMethod; labelKey: string; icon: React.ReactNode }[] = [
    {
      id: "by_count",
      labelKey: "atlasStudioMethodByCount",
      icon: <Grid size={13} />,
    },
    {
      id: "by_cell_size",
      labelKey: "atlasStudioMethodByCellSize",
      icon: <Box size={13} />,
    },
    {
      id: "auto_islands",
      labelKey: "atlasStudioMethodAutoIslands",
      icon: <Sparkles size={13} className="text-yellow-400" />,
    },
    {
      id: "freeform_rects",
      labelKey: "atlasStudioMethodFreeform",
      icon: <Layers size={13} />,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
        <Layers size={13} className="text-amber-400" />
        <span>{t("atlasStudioSlicingStrategyLabel")}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {methods.map(({ id, labelKey, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onMethodChange(id)}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              currentMethod === id
                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-400 shadow-sm"
                : "bg-black/50 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700"
            }`}
          >
            {icon}
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SlicingMethodTabs;
