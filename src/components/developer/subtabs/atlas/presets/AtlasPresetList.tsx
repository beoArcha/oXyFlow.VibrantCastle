import React from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@components/ui";
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
      <EmptyState
        compact
        icon={<Search size={18} className="text-stone-600" />}
        title={t("atlasStudioNoAssetsFound")}
        className="py-6 border-dashed"
      />
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

export default AtlasPresetList;
