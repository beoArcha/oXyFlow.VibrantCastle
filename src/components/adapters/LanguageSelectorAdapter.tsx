import React, { useCallback } from "react";
import { useI18n } from "@context/I18nContext";
import { LanguageCode } from "@i18n";
import {
  LanguageSelector as PureLanguageSelector,
  LanguageSelectorProps as PureLanguageSelectorProps,
} from "@ui";

export interface ConnectedLanguageSelectorProps
  extends Omit<PureLanguageSelectorProps<LanguageCode>, "value"> {
  onChange?: (lang: LanguageCode) => void;
}

/**
 * Connected LanguageSelector adapter bridging the application I18nContext
 * with the pure presentational LanguageSelector UI component.
 */
export const LanguageSelector: React.FC<ConnectedLanguageSelectorProps> = ({
  onChange,
  ...props
}) => {
  const { language, setLanguage } = useI18n();

  const handleLanguageChange = useCallback(
    (newLang: LanguageCode) => {
      setLanguage(newLang);
      onChange?.(newLang);
    },
    [setLanguage, onChange]
  );

  return (
    <PureLanguageSelector<LanguageCode>
      value={language}
      onChange={handleLanguageChange}
      {...props}
    />
  );
};

export default LanguageSelector;
