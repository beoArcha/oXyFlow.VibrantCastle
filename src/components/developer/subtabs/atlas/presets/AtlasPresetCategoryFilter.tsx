import React from "react";
import { Star, User, Skull, Building, Sparkles } from "lucide-react";
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

  const getButtonClass = (isSelected: boolean) =>
    `flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all border cursor-pointer ${
      isSelected
        ? "bg-amber-600 text-white border-amber-400 shadow-sm"
        : "bg-black/40 text-stone-400 border-stone-800 hover:text-stone-200"
    }`;

  return (
    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5 text-[11px]">
      <button
        onClick={() => onFilterChange("all")}
        className={getButtonClass(activeFilter === "all")}
      >
        {t("atlasStudioFilterAll")}
      </button>

      <button
        onClick={() => onFilterChange("popular")}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all border cursor-pointer ${
          activeFilter === "popular"
            ? "bg-amber-600 text-white border-amber-400 shadow-sm"
            : "bg-black/40 text-amber-300/80 border-stone-800 hover:text-amber-200"
        }`}
      >
        <Star size={11} className="text-amber-300 fill-amber-300/60" />
        {t("atlasStudioFilterPopular")}
      </button>

      <button
        onClick={() => onFilterChange("character")}
        className={getButtonClass(activeFilter === "character")}
      >
        <User size={11} />
        {t("atlasStudioFilterCharacters")}
      </button>

      <button
        onClick={() => onFilterChange("enemy")}
        className={getButtonClass(activeFilter === "enemy")}
      >
        <Skull size={11} />
        {t("atlasStudioFilterEnemies")}
      </button>

      <button
        onClick={() => onFilterChange("structure")}
        className={getButtonClass(activeFilter === "structure")}
      >
        <Building size={11} />
        {t("atlasStudioFilterStructures")}
      </button>

      <button
        onClick={() => onFilterChange("portrait")}
        className={getButtonClass(activeFilter === "portrait")}
      >
        <Sparkles size={11} />
        {t("atlasStudioFilterPortraits")}
      </button>
    </div>
  );
};
