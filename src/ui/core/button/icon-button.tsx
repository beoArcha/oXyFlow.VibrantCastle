import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@lib/utils";
import {
  iconButtonVariants,
  type ButtonVariant,
  type IconButtonSize,
} from "./button-variants";
import { Tooltip, type TooltipPosition } from "../../controls/Tooltip";

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

/**
 * Accessible Gothic IconButton primitive for micro-actions, toolbars, and controls.
 * Enforces square dimensions, zero-padding, centered icon alignment, and optional Tooltip integration.
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
        data-slot="icon-button"
        aria-label={ariaLabel}
        disabled={isEffectiveDisabled}
        aria-disabled={isEffectiveDisabled}
        aria-busy={isLoading}
        className={cn(
          iconButtonVariants({ variant, size }),
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
