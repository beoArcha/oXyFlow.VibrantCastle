import React, { useId } from "react";
import { cn } from "@lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

/**
 * Gothic Castle multiline text area component with optional label, error message, helper text.
 * Accessible with WAI-ARIA aria-invalid, aria-describedby, and forwardRef support.
 */
export const Textarea = React.memo(
  React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    {
      label,
      error,
      helperText,
      id,
      disabled,
      className,
      containerClassName,
      rows = 4,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const textareaId = id || (label ? generatedId : undefined);
    const helperId = error
      ? `${textareaId}-error`
      : helperText
      ? `${textareaId}-helper`
      : undefined;

    return (
      <div className={cn("relative w-full flex flex-col gap-1 text-left", containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold uppercase tracking-wider text-stone-400 select-none"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={helperId}
          className={cn(
            "w-full px-3 py-2 bg-stone-950/90 border rounded-lg text-stone-200 placeholder:text-stone-600 text-sm font-sans transition-all",
            "focus:outline-none focus:ring-1",
            error
              ? "border-rose-600/80 focus:border-rose-500 focus:ring-rose-500/50 text-rose-100"
              : "border-stone-800 focus:border-amber-500 focus:ring-amber-500/50 hover:border-stone-700",
            disabled && "opacity-50 cursor-not-allowed bg-stone-900/60 border-stone-800 text-stone-500",
            className
          )}
          {...props}
        />

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

Textarea.displayName = "Textarea";

export default Textarea;
