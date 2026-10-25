import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@lib/utils";
import { Input, type InputProps } from "./input";
import { IconButton } from "../button/icon-button";

export interface SearchInputProps
  extends Omit<InputProps, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  clearAriaLabel?: string;
}

/**
 * Gothic Castle SearchInput component composing the base Input component
 * with built-in search icon, quick clear button, and Escape key handling.
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

    const clearButton =
      value && !disabled ? (
        <IconButton
          size="xs"
          variant="ghost"
          aria-label={clearAriaLabel}
          onClick={handleClear}
          className="w-5 h-5 text-stone-400 hover:text-stone-200"
        >
          <X size={12} />
        </IconButton>
      ) : null;

    return (
      <Input
        ref={ref}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        leftIcon={leftIcon || <Search size={14} />}
        rightIcon={clearButton}
        className={cn("text-xs text-amber-100 placeholder:text-stone-500 py-1.5", className)}
        containerClassName={containerClassName}
        {...props}
      />
    );
  })
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
