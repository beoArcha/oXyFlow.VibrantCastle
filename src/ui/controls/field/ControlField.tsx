import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lib/utils";
import { IconLabel } from "../../typography/IconText";
import { Text } from "../../typography/Text";
import { type TextSize } from "../../typography/typographyVariants";

export const controlFieldVariants = cva("min-w-0 transition-colors", {
  variants: {
    layout: {
      inline: "inline-flex items-center gap-1.5",
      stacked: "flex flex-col gap-1",
      spread: "flex items-center justify-between gap-3 w-full",
    },
  },
  defaultVariants: {
    layout: "inline",
  },
});

export type ControlFieldLayout = NonNullable<VariantProps<typeof controlFieldVariants>["layout"]>;

export interface ControlFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Leading icon rendered next to label */
  icon?: React.ReactNode;
  /** Primary label text or element */
  label: React.ReactNode;
  /** HTML for attribute linking label to control ID */
  htmlFor?: string;
  /** Layout presentation style: 'inline', 'stacked', or 'spread' (justify-between) */
  layout?: ControlFieldLayout;
  /** Gap between label and control */
  gap?: "1" | "1.5" | "2" | "3";
  /** Subtitle or explanatory text rendered below label */
  description?: React.ReactNode;
  /** Form error message */
  error?: React.ReactNode;
  /** Muted disabled presentation */
  disabled?: boolean;
  /** Required field indicator */
  required?: boolean;
  /** Label text size */
  size?: TextSize;
  /** Custom class name for label */
  labelClassName?: string;
}

/**
 * Standard Form Field Integration Primitive.
 * Combines an icon, label, optional description, error message, and interactive control
 * without ad-hoc flex wrapper duplication.
 */
export const ControlField = React.memo(
  React.forwardRef<HTMLDivElement, ControlFieldProps>(function ControlField(
    {
      icon,
      label,
      htmlFor,
      layout = "inline",
      gap,
      description,
      error,
      disabled = false,
      required = false,
      size = "xs",
      labelClassName,
      children,
      className,
      ...props
    },
    ref
  ) {
    // If htmlFor is not explicitly passed, attempt to extract id from child element props
    const childId =
      htmlFor ??
      (React.isValidElement<{ id?: string }>(children) ? children.props?.id : undefined);

    const gapClass = gap
      ? gap === "1"
        ? "gap-1"
        : gap === "1.5"
          ? "gap-1.5"
          : gap === "2"
            ? "gap-2"
            : "gap-3"
      : undefined;

    return (
      <div
        ref={ref}
        data-slot="control-field"
        data-layout={layout}
        className={cn(
          controlFieldVariants({ layout }),
          gapClass,
          disabled && "opacity-60 pointer-events-none select-none",
          className
        )}
        {...props}
      >
        <div
          data-slot="control-field-label-wrapper"
          className={cn(
            "flex flex-col min-w-0 select-none",
            layout === "inline" && "shrink-0",
            layout === "spread" && "flex-1 pr-2"
          )}
        >
          <IconLabel
            htmlFor={childId}
            icon={icon}
            size={size}
            weight="semibold"
            color="stone-300"
            className={cn("cursor-pointer leading-tight", labelClassName)}
          >
            {label}
            {required && (
              <span aria-hidden="true" className="text-red-400 ml-0.5 font-bold">
                *
              </span>
            )}
          </IconLabel>

          {description && (
            <Text
              as="span"
              size="3xs"
              variant="muted"
              className="leading-tight mt-0.5 truncate"
            >
              {description}
            </Text>
          )}
        </div>

        <div data-slot="control-field-control" className="min-w-0 flex items-center">
          {children}
        </div>

        {error && (
          <Text
            as="div"
            role="alert"
            size="2xs"
            variant="danger"
            className="w-full mt-1 font-medium"
          >
            {error}
          </Text>
        )}
      </div>
    );
  })
);

ControlField.displayName = "ControlField";

export default ControlField;
