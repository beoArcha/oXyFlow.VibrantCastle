import React, { useId } from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
import { cn } from "@lib/utils";
import { selectVariants, type SelectVariantProps } from "./select-variants";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectSize = NonNullable<SelectVariantProps["size"]>;
export type SelectVariant = NonNullable<SelectVariantProps["variant"]>;

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">,
    SelectVariantProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
  children?: React.ReactNode;
}

const sizePaddingClasses: Record<SelectSize, { icon: string; leftPadding: string; rightPadding: string }> = {
  sm: {
    icon: "right-2 w-3.5 h-3.5",
    leftPadding: "pl-7",
    rightPadding: "pr-7",
  },
  md: {
    icon: "right-2.5 w-4 h-4",
    leftPadding: "pl-9",
    rightPadding: "pr-9",
  },
  lg: {
    icon: "right-3 w-5 h-5",
    leftPadding: "pl-11",
    rightPadding: "pr-10",
  },
};

/**
 * Gothic Castle dropdown select component with support for options, placeholder,
 * label, error messaging, icons, and WAI-ARIA accessibility.
 */
const SelectBase = React.memo(
  React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
    {
      label,
      error,
      helperText,
      leftIcon,
      options,
      placeholder,
      size = "md",
      variant = "default",
      id,
      disabled,
      className,
      containerClassName,
      children,
      value,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const selectId = id || (label ? generatedId : undefined);
    const helperId = error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined;

    const activeSize: SelectSize = size ?? "md";
    const sizeConfig = sizePaddingClasses[activeSize];

    return (
      <div className={cn("relative flex flex-col gap-1 text-left", containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold uppercase tracking-wider text-stone-400 select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span className="absolute left-2.5 flex items-center justify-center text-stone-500 pointer-events-none shrink-0 z-10">
              {leftIcon}
            </span>
          )}

          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            value={value}
            aria-invalid={Boolean(error)}
            aria-describedby={helperId}
            className={cn(
              selectVariants({ variant, size: activeSize }),
              sizeConfig.rightPadding,
              leftIcon && sizeConfig.leftPadding,
              error
                ? "border-rose-600/80 focus:border-rose-500 focus:ring-rose-500/50 text-rose-100"
                : undefined,
              disabled && "opacity-50 cursor-not-allowed bg-stone-900/60 border-stone-800 text-stone-500 pointer-events-none",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden={value !== "" && value !== undefined}>
                {placeholder}
              </option>
            )}

            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-stone-900 text-stone-200">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <span
            className={cn(
              "absolute flex items-center justify-center text-stone-400 pointer-events-none shrink-0",
              sizeConfig.icon,
              disabled && "text-stone-600"
            )}
          >
            <ChevronDown className="w-full h-full" />
          </span>
        </div>

        {error && (
          <p id={helperId} role="alert" className="text-xs text-rose-400 font-medium">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-xs text-stone-500">
            {helperText}
          </p>
        )}
      </div>
    );
  })
);

SelectBase.displayName = "Select";

export const Select = Object.assign(SelectBase, {
  Root: BaseSelect.Root,
  Trigger: BaseSelect.Trigger,
  Value: BaseSelect.Value,
  Portal: BaseSelect.Portal,
  Positioner: BaseSelect.Positioner,
  Popup: BaseSelect.Popup,
  Item: BaseSelect.Item,
  ItemText: BaseSelect.ItemText,
  ItemIndicator: BaseSelect.ItemIndicator,
  Group: BaseSelect.Group,
  GroupLabel: BaseSelect.GroupLabel,
  Separator: BaseSelect.Separator,
  Arrow: BaseSelect.Arrow,
});

export default Select;
