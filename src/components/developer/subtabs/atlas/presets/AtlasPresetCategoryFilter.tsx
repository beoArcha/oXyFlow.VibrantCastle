import React from "react";
import { Star, User, Skull, Building, Sparkles } from "lucide-react";
import { SegmentedControl, SegmentedControlOption } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { AssetFilterType } from "./types";

export interface AtlasPresetCategoryFilterProps {
  activeFilter: AssetFilterType;
  onFilterChange: (filter: AssetFilterType) => void;
}

export const AtlasPresetCategoryFilter: React.FC<AtlasPresetCategoryFilterProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const { t } = useI18n();

  const options: SegmentedControlOption<AssetFilterType>[] = [
    { value: "all", label: t("atlasStudioFilterAll") },
    {
      value: "popular",
      label: t("atlasStudioFilterPopular"),
      icon: <Star size={11} className="text-amber-300 fill-amber-300/60" />,
    },
    { value: "character", label: t("atlasStudioFilterCharacters"), icon: <User size={11} /> },
    { value: "enemy", label: t("atlasStudioFilterEnemies"), icon: <Skull size={11} /> },
    { value: "structure", label: t("atlasStudioFilterStructures"), icon: <Building size={11} /> },
    { value: "portrait", label: t("atlasStudioFilterPortraits"), icon: <Sparkles size={11} /> },
  ];

  return (
    <div className="overflow-x-auto custom-scrollbar py-0.5">
      <SegmentedControl<AssetFilterType>
        options={options}
        value={activeFilter}
        onChange={onFilterChange}
        size="sm"
      />
    </div>
  );
};

export default AtlasPresetCategoryFilter;
