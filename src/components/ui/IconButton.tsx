import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@lib/utils";
import { ButtonVariant, buttonVariantStyles } from "./buttonVariants";
import { Tooltip, TooltipPosition } from "./Tooltip";

export type IconButtonSize = "xs" | "sm" | "md" | "lg";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Icon element to render inside the button */
  icon?: React.ReactNode;
  /** Children can be used as an alternative to the icon prop */
  children?: React.ReactNode;
  /** Mandatory accessible label for screen readers */
  "aria-label": string;
  /** Visual presentation variant conforming to Gothic theme */
  variant?: ButtonVariant;
  /** Square size variant */
  size?: IconButtonSize;
  /** Shows a loading spinner and disables interactions */
  isLoading?: boolean;
  /** Optional tooltip text or content to automatically wrap the button in Tooltip */
  tooltipContent?: React.ReactNode;
  /** Tooltip position if tooltipContent is provided */
  tooltipPosition?: TooltipPosition;
}

const sizeStyles: Record<IconButtonSize, string> = {
  xs: "w-5 h-5 min-w-[20px] min-h-[20px] p-0 text-[10px] rounded",
  sm: "w-6 h-6 min-w-[24px] min-h-[24px] p-0 text-xs rounded-md",
  md: "w-8 h-8 min-w-[32px] min-h-[32px] p-0 text-sm rounded-lg",
  lg: "w-10 h-10 min-w-[40px] min-h-[40px] p-0 text-base rounded-xl",
};

/**
 * Accessible Gothic IconButton primitive for micro-actions, toolbars, and controls.
 * Guarantees square dimensions, zero-padding, centered icon alignment, and optional Tooltip integration.
 */
export const IconButton = React.memo(
  React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    {
      icon,
      children,
      variant = "secondary",
      size = "sm",
      isLoading = false,
      tooltipContent,
      tooltipPosition = "top",
      disabled,
      className,
      type = "button",
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) {
    const isEffectiveDisabled = disabled || isLoading;
    const content = icon || children;

    const buttonElement = (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        disabled={isEffectiveDisabled}
        aria-disabled={isEffectiveDisabled}
        aria-busy={isLoading}
        className={cn(
          "inline-flex items-center justify-center font-sans transition-all cursor-pointer select-none shrink-0",
          buttonVariantStyles[variant],
          sizeStyles[size],
          isEffectiveDisabled && "opacity-50 cursor-not-allowed pointer-events-none shadow-none",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin text-current" />
        ) : (
          content
        )}
      </button>
    );

    if (tooltipContent && !isEffectiveDisabled) {
      return (
        <Tooltip content={tooltipContent} position={tooltipPosition}>
          {buttonElement}
        </Tooltip>
      );
    }

    return buttonElement;
  })
);

IconButton.displayName = "IconButton";

export default IconButton;
