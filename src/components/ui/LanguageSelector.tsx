import React, { useCallback } from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { LanguageCode } from "@i18n";
import { cn } from "@lib/utils";

export type LanguageSelectorVariant = "pills" | "select";

export interface LanguageSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  className?: string;
  showIcon?: boolean;
  variant?: LanguageSelectorVariant;
  onChange?: (lang: LanguageCode) => void;
}

/**
 * Gothic localization language selector primitive.
 * Supports toggle pills and dropdown select variants with WAI-ARIA group/option semantics.
 */
export const LanguageSelector = React.memo(
  React.forwardRef<HTMLDivElement, LanguageSelectorProps>(function LanguageSelector(
    {
      className = "",
      showIcon = true,
      variant = "pills",
      onChange,
      ...props
    },
    ref
  ) {
    const { language, setLanguage } = useI18n();

    const handleLanguageChange = useCallback(
      (newLang: LanguageCode) => {
        setLanguage(newLang);
        onChange?.(newLang);
      },
      [setLanguage, onChange]
    );

    if (variant === "select") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-1.5 p-1 bg-[#120502] border border-amber-500/30 rounded-xl select-none shadow-sm",
            className
          )}
          {...props}
        >
          {showIcon && <Languages className="w-3.5 h-3.5 text-amber-400 ml-1 shrink-0" />}
          <select
            aria-label="Select language"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
            className="bg-[#1c0c07] text-amber-200 text-xs font-bold border border-amber-700/60 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
          >
            <option value="pl">Polski (PL)</option>
            <option value="en">English (EN)</option>
          </select>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-1.5 p-1 bg-[#120502] border border-amber-500/30 rounded-xl select-none shadow-sm",
          className
        )}
        role="group"
        aria-label="Language selection"
        {...props}
      >
        {showIcon && <Languages className="w-3.5 h-3.5 text-amber-400 ml-1 shrink-0" />}
        <button
          type="button"
          onClick={() => handleLanguageChange("pl")}
          aria-pressed={language === "pl"}
          className={cn(
            "px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
            language === "pl"
              ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-400 shadow-xs"
              : "text-stone-400 hover:text-stone-200"
          )}
          title="Polski"
        >
          PL
        </button>
        <button
          type="button"
          onClick={() => handleLanguageChange("en")}
          aria-pressed={language === "en"}
          className={cn(
            "px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
            language === "en"
              ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-400 shadow-xs"
              : "text-stone-400 hover:text-stone-200"
          )}
          title="English"
        >
          EN
        </button>
      </div>
    );
  })
);

LanguageSelector.displayName = "LanguageSelector";

export default LanguageSelector;
