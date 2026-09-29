import React, { useId } from "react";
import { cn } from "@lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-stone-400 select-none"
          >
            {label}
          </label>
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
              "w-full px-3 py-2 bg-stone-950/90 border rounded-lg text-stone-200 placeholder:text-stone-600 text-sm font-sans transition-all",
              "focus:outline-none focus:ring-1",
              error
                ? "border-rose-600/80 focus:border-rose-500 focus:ring-rose-500/50 text-rose-100"
                : "border-stone-800 focus:border-amber-500 focus:ring-amber-500/50 hover:border-stone-700",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              disabled && "opacity-50 cursor-not-allowed bg-stone-900/60 border-stone-800 text-stone-500",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-2.5 flex items-center justify-center text-stone-500 pointer-events-none shrink-0">
              {rightIcon}
            </span>
          )}
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

Input.displayName = "Input";

export default Input;
