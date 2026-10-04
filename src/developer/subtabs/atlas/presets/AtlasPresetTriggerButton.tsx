import React from "react";
import { ChevronDown } from "lucide-react";
import { Button, Badge } from "@ui";
import { IAtlasAssetManifestItem } from "@game/engine/meta/registry";
import { getCategoryMeta } from "./categoryMeta";

export interface AtlasPresetTriggerButtonProps {
  activeAsset: IAtlasAssetManifestItem | undefined;
  isOpen: boolean;
  onClick: () => void;
}

export const AtlasPresetTriggerButton: React.FC<AtlasPresetTriggerButtonProps> = ({
  activeAsset,
  isOpen,
  onClick,
}) => {
  const activeMeta = activeAsset ? getCategoryMeta(activeAsset.category) : null;

  return (
    <Button
      variant="secondary"
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-1.5 bg-[#120603] hover:bg-[#1a0904] text-stone-200 border border-amber-800/60 hover:border-amber-500 rounded-xl transition-all shadow-md shadow-black/40 group cursor-pointer h-auto min-h-0"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      <div className="flex items-center gap-1.5">
        {activeMeta?.icon}
        <span className="font-bold text-xs text-amber-200 group-hover:text-amber-100 max-w-[160px] sm:max-w-[200px] truncate">
          {activeAsset?.name || "Select Atlas"}
        </span>
      </div>

      {activeAsset && activeMeta && (
        <Badge variant={activeMeta.variant} className="text-[10px] px-1.5 py-0 uppercase">
          {activeAsset.category}
        </Badge>
      )}

      <ChevronDown
        size={14}
        className={`text-amber-400/80 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
      />
    </Button>
  );
};
