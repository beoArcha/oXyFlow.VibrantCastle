import React from "react";
import { Search, X } from "lucide-react";
import { useI18n } from "@context/I18nContext";

export interface AtlasPresetSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const AtlasPresetSearchInput: React.FC<AtlasPresetSearchInputProps> = ({
  value,
  onChange,
  inputRef,
}) => {
  const { t } = useI18n();

  return (
    <div className="relative flex items-center">
      <Search size={14} className="absolute left-2.5 text-stone-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("atlasStudioSearchPlaceholder")}
        className="w-full pl-8 pr-7 py-1.5 bg-black/70 border border-stone-800 focus:border-amber-400 rounded-xl text-xs text-amber-100 placeholder:text-stone-500 focus:outline-none transition-all"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 text-stone-400 hover:text-stone-200 cursor-pointer"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};
