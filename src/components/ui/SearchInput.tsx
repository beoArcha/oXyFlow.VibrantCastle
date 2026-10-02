import React, { useId } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@lib/utils";
import { IconButton } from "./IconButton";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  clearAriaLabel?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
}

/**
 * Gothic Castle SearchInput component with built-in search icon, quick clear button,
 * and Escape key support.
 */
export const SearchInput = React.memo(
  React.forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
    {
      value,
      onChange,
      onClear,
      clearAriaLabel = "Clear search",
      leftIcon,
      placeholder = "Search...",
      id,
      disabled,
      className,
      containerClassName,
      onKeyDown,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id || generatedId;

    const handleClear = () => {
      onChange("");
      onClear?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && value) {
        e.stopPropagation();
        handleClear();
      }
      onKeyDown?.(e);
    };

    return (
      <div className={cn("relative flex items-center w-full", containerClassName)}>
        <span className="absolute left-2.5 flex items-center justify-center text-stone-500 pointer-events-none shrink-0 z-10">
          {leftIcon || <Search size={14} />}
        </span>

        <input
          ref={ref}
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full pl-8 pr-7 py-1.5 bg-black/70 border border-stone-800 rounded-xl text-xs text-amber-100 placeholder:text-stone-500 transition-all font-sans",
            "focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40",
            disabled && "opacity-50 cursor-not-allowed bg-stone-900/60 border-stone-800 text-stone-500",
            className
          )}
          {...props}
        />

        {value && !disabled && (
          <div className="absolute right-1.5 flex items-center">
            <IconButton
              size="xs"
              variant="ghost"
              aria-label={clearAriaLabel}
              onClick={handleClear}
              className="w-5 h-5 text-stone-400 hover:text-stone-200"
            >
              <X size={12} />
            </IconButton>
          </div>
        )}
      </div>
    );
  })
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
