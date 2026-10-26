import React, { useId } from "react";
import { cn } from "@lib/utils";
import { textareaVariants, type TextareaVariantProps } from "./input-variants";
import { Label } from "../../typography/Label";
import { Paragraph } from "../../typography/Paragraph";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    TextareaVariantProps {
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
      family = "sans",
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
          <Label
            htmlFor={textareaId}
            size="xs"
            weight="semibold"
            uppercase
            variant="muted"
            className="select-none tracking-wider"
          >
            {label}
          </Label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={helperId}
          className={cn(
            textareaVariants({ hasError: Boolean(error), family }),
            disabled && "opacity-50 cursor-not-allowed bg-stone-900/60 border-stone-800 text-stone-500",
            className
          )}
          {...props}
        />

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

Textarea.displayName = "Textarea";

export default Textarea;
