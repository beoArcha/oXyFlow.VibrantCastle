import React, { useId } from "react";
import { cn } from "@lib/utils";
import { inputVariants, type InputVariantProps } from "./input-variants";
import { Label } from "../../typography/Label";
import { Paragraph } from "../../typography/Paragraph";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    InputVariantProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

/**
 * Gothic Castle text input component with optional label, error message, helper text, and icon adornments.
 * Accessible with WAI-ARIA aria-invalid, aria-describedby, and forwardRef support.
 */
export const Input = React.memo(
  React.forwardRef<HTMLInputElement, InputProps>(function Input(
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      className,
      containerClassName,
      family = "sans",
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id || (label ? generatedId : undefined);
    const helperId = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;

    return (
      <div className={cn("relative w-full flex flex-col gap-1 text-left", containerClassName)}>
        {label && (
          <Label
            htmlFor={inputId}
            size="xs"
            weight="semibold"
            uppercase
            variant="muted"
            className="select-none tracking-wider"
          >
            {label}
          </Label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span className="absolute left-2.5 flex items-center justify-center text-stone-500 pointer-events-none shrink-0">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={helperId}
            className={cn(
              inputVariants({ hasError: Boolean(error), family }),
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              disabled && "opacity-50 cursor-not-allowed bg-stone-900/60 border-stone-800 text-stone-500",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-2.5 flex items-center justify-center text-stone-500 z-10 shrink-0">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <Paragraph id={helperId} role="alert" size="xs" variant="danger">
            {error}
          </Paragraph>
        )}

        {!error && helperText && (
          <Paragraph id={helperId} size="xs" variant="muted">
            {helperText}
          </Paragraph>
        )}
      </div>
    );
  })
);

Input.displayName = "Input";

export default Input;
