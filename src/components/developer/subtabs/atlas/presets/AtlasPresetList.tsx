import React from "react";
import { useI18n } from "@context/I18nContext";
import { IAtlasAssetManifestItem } from "@game/engine/meta/registry";
import { AtlasPresetItemRow } from "./AtlasPresetItemRow";

export interface AtlasPresetListProps {
  assets: IAtlasAssetManifestItem[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
}

export const AtlasPresetList: React.FC<AtlasPresetListProps> = ({
  assets,
  selectedPresetId,
  onSelectPreset,
}) => {
  const { t } = useI18n();

  if (assets.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-stone-500 font-medium">
        {t("atlasStudioNoAssetsFound")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto custom-scrollbar pr-0.5">
      {assets.map((asset) => (
        <AtlasPresetItemRow
          key={asset.id}
          asset={asset}
          isSelected={asset.id === selectedPresetId}
          onSelect={() => onSelectPreset(asset.id)}
        />
      ))}
    </div>
  );
};
