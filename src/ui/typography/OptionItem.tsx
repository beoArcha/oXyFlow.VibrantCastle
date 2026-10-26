import React from "react";
import { Check } from "lucide-react";
import { cn } from "@lib/utils";
import { Text } from "./Text";
import { type TextSize } from "./typographyVariants";

export interface OptionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary label content */
  label: React.ReactNode;
  /** Secondary helper or explanatory copy */
  description?: React.ReactNode;
  /** Leading icon */
  icon?: React.ReactNode;
  /** Trailing keyboard accelerator or badge (e.g. '⌘K' or 'Ctrl+S') */
  accelerator?: React.ReactNode;
  /** Indicates active selected state */
  selected?: boolean;
  /** Indicates disabled unselectable state */
  disabled?: boolean;
  /** Text size token */
  size?: TextSize;
}

/**
 * Standard option typography component for listboxes, custom dropdowns, and option menus.
 */
export const OptionItem = React.memo(
  React.forwardRef<HTMLDivElement, OptionItemProps>(function OptionItem(
    {
      label,
      description,
      icon,
      accelerator,
      selected = false,
      disabled = false,
      size = "xs",
      className,
      ...props
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        role="option"
        aria-selected={selected}
        aria-disabled={disabled}
        data-slot="option-item"
        className={cn(
          "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded transition-colors select-none",
          selected
            ? "bg-amber-950/40 text-amber-300 font-semibold"
            : "text-stone-300 hover:bg-stone-900/60 hover:text-stone-100",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none text-stone-600",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && (
            <span
              data-slot="option-item-icon"
              aria-hidden="true"
              className={cn("shrink-0", selected ? "text-amber-400" : "text-stone-500")}
            >
              {icon}
            </span>
          )}

          <div className="flex flex-col min-w-0">
            <Text
              as="span"
              size={size}
              weight={selected ? "semibold" : "medium"}
              className="truncate"
            >
              {label}
            </Text>
            {description && (
              <Text as="span" size="3xs" variant="muted" className="truncate">
                {description}
              </Text>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {accelerator && (
            <span
              data-slot="option-item-accelerator"
              className="text-[10px] font-mono text-stone-500 bg-stone-950/80 px-1 py-0.5 rounded border border-stone-800"
            >
              {accelerator}
            </span>
          )}
          {selected && (
            <Check
              size={14}
              data-slot="option-item-check"
              className="text-amber-400 shrink-0"
            />
          )}
        </div>
      </div>
    );
  })
);

OptionItem.displayName = "OptionItem";

export default OptionItem;
