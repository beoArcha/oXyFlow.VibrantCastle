import React, { useState, useCallback } from "react";
import { Languages } from "lucide-react";
import { cn } from "@lib/utils";

export type LanguageOption<T extends string = string> = {
  value: T;
  label: string;
  shortLabel?: string;
};

export type LanguageSelectorVariant = "pills" | "select";

export interface LanguageSelectorProps<T extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: T;
  defaultValue?: T;
  options?: LanguageOption<T>[];
  className?: string;
  showIcon?: boolean;
  variant?: LanguageSelectorVariant;
  onChange?: (val: T) => void;
}

const defaultLanguageOptions: LanguageOption[] = [
  { value: "pl", label: "Polski (PL)", shortLabel: "PL" },
  { value: "en", label: "English (EN)", shortLabel: "EN" },
];

/**
 * Pure presentational language selector primitive.
 * Supports toggle pills and dropdown select variants with WAI-ARIA semantics.
 * Completely decoupled from game engine and application i18n context.
 */
export const LanguageSelector = React.memo(
  React.forwardRef(function LanguageSelector<T extends string = string>(
    {
      value: controlledValue,
      defaultValue,
      options = defaultLanguageOptions as LanguageOption<T>[],
      className = "",
      showIcon = true,
      variant = "pills",
      onChange,
      ...props
    }: LanguageSelectorProps<T>,
    ref: React.ForwardedRef<HTMLDivElement>
  ) {
    const [internalValue, setInternalValue] = useState<T>(
      defaultValue ?? (options[0]?.value as T)
    );

    const isControlled = controlledValue !== undefined;
    const currentLanguage = isControlled ? controlledValue : internalValue;

    const handleLanguageChange = useCallback(
      (newLang: T) => {
        if (!isControlled) {
          setInternalValue(newLang);
        }
        onChange?.(newLang);
      },
      [isControlled, onChange]
    );

    if (variant === "select") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-1.5 p-1 bg-surface-darkest border border-amber-primary/30 rounded-xl select-none shadow-sm",
            className
          )}
          {...props}
        >
          {showIcon && <Languages className="w-3.5 h-3.5 text-amber-primary ml-1 shrink-0" />}
          <select
            aria-label="Select language"
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as T)}
            className="bg-surface-darker text-amber-200 text-xs font-bold border border-amber-dark/60 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-light cursor-pointer"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-0.5 h-8 p-0.5 bg-surface-darkest/90 border border-amber-900/45 rounded-lg select-none whitespace-nowrap shrink-0",
          className
        )}
        role="group"
        aria-label="Language selection"
        {...props}
      >
        {showIcon && <Languages className="w-3.5 h-3.5 text-amber-primary ml-1.5 mr-0.5 shrink-0" />}
        {options.map((opt) => {
          const isSelected = currentLanguage === opt.value;
          const displayLabel = opt.shortLabel ?? opt.label;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleLanguageChange(opt.value)}
              aria-pressed={isSelected}
              className={cn(
                "h-6 px-2 rounded-md text-[11px] font-bold leading-none transition-colors cursor-pointer whitespace-nowrap",
                isSelected
                  ? "bg-amber-700/90 text-amber-50 border border-amber-500/60"
                  : "text-stone-400 hover:text-stone-200 border border-transparent"
              )}
              title={opt.label}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    );
  })
) as <T extends string = string>(
  props: LanguageSelectorProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

(LanguageSelector as React.FC).displayName = "LanguageSelector";
export default LanguageSelector;
