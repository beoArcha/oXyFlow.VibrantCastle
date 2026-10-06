import React from "react";
import { Plus } from "lucide-react";
import { Select, SelectOption, Button } from "@ui";
import { useI18n } from "@context/I18nContext";

export interface PresetSelectorHeaderProps {
  label?: string;
  selectedValue: string;
  onSelect: (value: string) => void;
  options: SelectOption[];
  onCreateNew?: () => void;
  createButtonLabel?: string;
  selectId?: string;
  className?: string;
}

export const PresetSelectorHeader: React.FC<PresetSelectorHeaderProps> = ({
  label,
  selectedValue,
  onSelect,
  options,
  onCreateNew,
  createButtonLabel,
  selectId = "preset-selector",
  className = "",
}) => {
  const { t } = useI18n();

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg ${className}`}
    >
      <div className="flex-1 min-w-[200px] max-w-md">
        <Select
          id={selectId}
          label={label ?? t("dataStudioSelectPreset")}
          value={selectedValue}
          onChange={(e) => onSelect(e.target.value)}
          options={options}
          variant="castle"
          size="sm"
        />
      </div>
      {onCreateNew && (
        <div className="shrink-0 flex items-center">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={onCreateNew}
            className="w-full sm:w-auto"
          >
            {createButtonLabel ?? t("dataStudioCreateNew")}
          </Button>
        </div>
      )}
    </div>
  );
};
