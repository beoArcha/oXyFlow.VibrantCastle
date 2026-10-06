import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@lib/utils";
import { ButtonVariant, buttonVariantStyles } from "./buttonVariants";

export type { ButtonVariant };
export { buttonVariantStyles };

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Primary icon positioned on the left side of text. Backward-compatible alias for leftIcon. */
  icon?: React.ReactNode;
  /** Explicit left-aligned icon */
  leftIcon?: React.ReactNode;
  /** Explicit right-aligned icon */
  rightIcon?: React.ReactNode;
  /** Shows a loading spinner and disables interactions */
  isLoading?: boolean;
  /** Expands the button to 100% of parent container width */
  fullWidth?: boolean;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 min-h-[32px] text-xs gap-1.5 rounded-md",
  md: "px-4 py-2 min-h-[38px] text-xs font-semibold gap-2 rounded-lg",
  lg: "px-6 py-3 min-h-[46px] text-sm font-bold gap-2.5 rounded-xl",
};

/**
 * Interactive button primitive with variant styling, size options, and loading states.
 */
export const Button = React.memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = false,
      className,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) {
    const isEffectiveDisabled = disabled || isLoading;
    const effectiveLeftIcon = isLoading ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin text-current shrink-0" />
    ) : (
      leftIcon || icon
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={isEffectiveDisabled}
        aria-disabled={isEffectiveDisabled}
        aria-busy={isLoading}
        className={cn(
          "inline-flex items-center justify-center font-sans transition-all cursor-pointer select-none",
          buttonVariantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          isEffectiveDisabled && "opacity-50 cursor-not-allowed pointer-events-none shadow-none",
          className
        )}
        {...props}
      >
        {effectiveLeftIcon && (
          <span className="shrink-0 flex items-center">{effectiveLeftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {rightIcon && !isLoading && (
          <span className="shrink-0 flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  })
);

Button.displayName = "Button";

export default Button;
