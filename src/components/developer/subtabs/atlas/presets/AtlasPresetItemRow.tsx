import React from "react";
import { Star, Check } from "lucide-react";
import { Badge } from "@components/ui";
import { IAtlasAssetManifestItem } from "@game/engine/meta/registry";
import { getCategoryMeta } from "./categoryMeta";

export interface AtlasPresetItemRowProps {
  asset: IAtlasAssetManifestItem;
  isSelected: boolean;
  onSelect: () => void;
}

export const AtlasPresetItemRow: React.FC<AtlasPresetItemRowProps> = ({
  asset,
  isSelected,
  onSelect,
}) => {
  const meta = getCategoryMeta(asset.category);

  return (
    <button
      onClick={onSelect}
      className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all group cursor-pointer ${
        isSelected
          ? "bg-gradient-to-r from-amber-950/60 to-amber-900/40 border-amber-500/80 shadow-sm"
          : "bg-black/40 border-stone-800/80 hover:bg-[#1a0c06] hover:border-amber-700/60"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-[#140804] border border-stone-800 flex items-center justify-center flex-shrink-0">
          {meta.icon}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-bold truncate ${
                isSelected ? "text-amber-200" : "text-stone-300 group-hover:text-amber-200"
              }`}
            >
              {asset.name}
            </span>
            {asset.isPopular && (
              <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-mono text-stone-500">{asset.id}</span>
            {asset.tags && asset.tags.length > 0 && (
              <span className="text-[9px] text-stone-400 truncate max-w-[140px]">
                • {asset.tags.slice(0, 3).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        <Badge variant={meta.variant} className="text-[9px] px-1.5 py-0 uppercase">
          {asset.category}
        </Badge>
        {isSelected && <Check size={14} className="text-amber-400" />}
      </div>
    </button>
  );
};
