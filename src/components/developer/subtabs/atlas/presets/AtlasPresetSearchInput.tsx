import React from "react";
import { SearchInput } from "@ui";
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
    <SearchInput
      ref={inputRef}
      value={value}
      onChange={onChange}
      placeholder={t("atlasStudioSearchPlaceholder")}
      clearAriaLabel={t("clear") || "Clear"}
    />
  );
};

export default AtlasPresetSearchInput;
