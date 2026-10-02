import React from "react";
import { Star, User, Skull, Building, Sparkles } from "lucide-react";
import { Button } from "@components/ui";
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

  const filterItems: { id: AssetFilterType; label: string; icon?: React.ReactNode }[] = [
    { id: "all", label: t("atlasStudioFilterAll") },
    {
      id: "popular",
      label: t("atlasStudioFilterPopular"),
      icon: <Star size={11} className="text-amber-300 fill-amber-300/60" />,
    },
    { id: "character", label: t("atlasStudioFilterCharacters"), icon: <User size={11} /> },
    { id: "enemy", label: t("atlasStudioFilterEnemies"), icon: <Skull size={11} /> },
    { id: "structure", label: t("atlasStudioFilterStructures"), icon: <Building size={11} /> },
    { id: "portrait", label: t("atlasStudioFilterPortraits"), icon: <Sparkles size={11} /> },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5 text-[11px]">
      {filterItems.map((item) => {
        const isSelected = activeFilter === item.id;
        return (
          <Button
            key={item.id}
            size="sm"
            variant={isSelected ? "primary" : "secondary"}
            onClick={() => onFilterChange(item.id)}
            leftIcon={item.icon}
            className={`h-7 px-2.5 text-[11px] font-bold shrink-0 ${
              !isSelected ? "bg-black/50 border-stone-800 text-stone-400 hover:text-stone-200" : ""
            }`}
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
};

export default AtlasPresetCategoryFilter;
