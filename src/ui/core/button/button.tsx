import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@lib/utils";
import {
  buttonVariants,
  type ButtonVariant,
  type ButtonSize,
  type ButtonVariantProps,
} from "./button-variants";

export type { ButtonVariant, ButtonSize, ButtonVariantProps };

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<ButtonVariantProps, "fullWidth"> {
  /** Visual theme presentation variant */
  variant?: ButtonVariant;
  /** Size variant */
  size?: ButtonSize;
  /** Backward-compatible alias for leftIcon */
  icon?: React.ReactNode;
  /** Left-aligned adornment icon */
  leftIcon?: React.ReactNode;
  /** Right-aligned adornment icon */
  rightIcon?: React.ReactNode;
  /** Displays a loading spinner and disables user interaction */
  isLoading?: boolean;
  /** Stretches the button to full width of the parent container */
  fullWidth?: boolean;
}

/**
 * Interactive button atom with CVA variant styling, size scaling, and loading state.
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
        data-slot="button"
        disabled={isEffectiveDisabled}
        aria-disabled={isEffectiveDisabled}
        aria-busy={isLoading}
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
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
