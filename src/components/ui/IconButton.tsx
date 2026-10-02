import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@lib/utils";
import { ButtonVariant } from "./Button";
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

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#b45309] hover:bg-[#d97706] text-[#fef3c7] border border-[#f59e0b] shadow-md shadow-amber-950/40 active:translate-y-px",
  secondary:
    "bg-[#1c0c07] hover:bg-[#321509] text-[#fed7aa] border border-[#5c2d18] hover:border-[#8d4325] active:translate-y-px",
  danger:
    "bg-red-900/80 hover:bg-red-800 text-white border border-red-500/60 shadow-md shadow-red-950/40 active:translate-y-px",
  purple:
    "bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-600/60 shadow-md shadow-purple-950/40 active:translate-y-px",
  ghost:
    "bg-transparent hover:bg-white/10 text-[#fed7aa] hover:text-white border border-transparent active:translate-y-px",
  outline:
    "bg-transparent hover:bg-[#b45309]/20 text-[#fbbf24] border border-[#f59e0b]/60 active:translate-y-px",
  accent:
    "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#140602] font-bold border border-amber-300 shadow-md active:translate-y-px",
};

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
          variantStyles[variant],
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
