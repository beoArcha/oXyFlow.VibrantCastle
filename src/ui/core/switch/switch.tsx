import React from "react";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cn } from "@lib/utils";
import {
  switchTrackVariants,
  switchThumbVariants,
  switchThumbTranslate,
  type SwitchTrackVariantProps,
} from "./switch-variants";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">,
    SwitchTrackVariantProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * Accessible toggle switch primitive conforming to WAI-ARIA switch pattern.
 * Supports smooth thumb translation, label/description layout, and sizes.
 */
const SwitchBase = React.memo(
  React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
    {
      checked,
      onCheckedChange,
      label,
      description,
      size = "md",
      disabled = false,
      className,
      id,
      ...props
    },
    ref
  ) {
    const activeSize = size ?? "md";

    const handleClick = () => {
      if (!disabled) {
        onCheckedChange?.(!checked);
      }
    };

    const switchElement = (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          switchTrackVariants({ size: activeSize }),
          checked
            ? "bg-gradient-to-r from-amber-600 to-amber-700 border-primary-400 shadow-md shadow-amber-950/60"
            : "bg-surface-darkest border-stone-700 hover:border-stone-600",
          disabled && "opacity-50 cursor-not-allowed hover:border-stone-700",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            switchThumbVariants({ size: activeSize }),
            checked
              ? cn(switchThumbTranslate[activeSize], "bg-amber-100")
              : "translate-x-0 bg-stone-300"
          )}
        />
      </button>
    );

    if (!label && !description) {
      return switchElement;
    }

    return (
      <div className="flex items-start justify-between gap-3 text-left select-none">
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={id}
              onClick={id ? undefined : handleClick}
              className={cn(
                "text-xs font-semibold text-stone-200 cursor-pointer",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <span className={cn("text-[11px] text-stone-400 leading-tight", disabled && "opacity-50")}>
              {description}
            </span>
          )}
        </div>
        {switchElement}
      </div>
    );
  })
);

SwitchBase.displayName = "Switch";

export const Switch = Object.assign(SwitchBase, {
  Root: BaseSwitch.Root,
  Thumb: BaseSwitch.Thumb,
});

export default Switch;
