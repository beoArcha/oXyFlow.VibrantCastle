import React from "react";
import {
  LanguageSelector as UILanguageSelector,
  type LanguageSelectorProps as UILanguageSelectorProps,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import type { LanguageCode } from "@i18n";

export interface LanguageSelectorProps
  extends Omit<UILanguageSelectorProps<LanguageCode>, "value" | "onChange"> {
  readonly value?: LanguageCode;
  readonly onChange?: (lang: LanguageCode) => void;
}

/**
 * Connected language selector bound to the application I18n context.
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  ...rest
}) => {
  const { language, setLanguage } = useI18n();

  return (
    <UILanguageSelector<LanguageCode>
      value={value ?? language}
      onChange={onChange ?? setLanguage}
      {...rest}
    />
  );
};

LanguageSelector.displayName = "ConnectedLanguageSelector";
export default LanguageSelector;
