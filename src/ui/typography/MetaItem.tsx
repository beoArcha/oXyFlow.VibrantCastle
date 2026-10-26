import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lib/utils";
import { Text } from "./Text";
import { type TextSize } from "./typographyVariants";

export const metaItemVariants = cva("min-w-0 transition-colors", {
  variants: {
    layout: {
      stacked: "flex flex-col gap-0.5",
      inline: "inline-flex items-center gap-1.5",
      spread: "flex items-center justify-between gap-2",
    },
  },
  defaultVariants: {
    layout: "stacked",
  },
});

export type MetaItemLayout = NonNullable<VariantProps<typeof metaItemVariants>["layout"]>;

export interface MetaItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Metadata key/label */
  label: React.ReactNode;
  /** Metadata value (or pass as children) */
  value?: React.ReactNode;
  /** Layout disposition: 'stacked' (vertical), 'inline' (horizontal), 'spread' (justify-between) */
  layout?: MetaItemLayout;
  /** Optional icon rendered with the label */
  icon?: React.ReactNode;
  /** Renders the value in monospace font */
  mono?: boolean;
  /** Typography font size token */
  size?: TextSize;
  /** Custom class for the label text */
  labelClassName?: string;
  /** Custom class for the value text */
  valueClassName?: string;
  /** Truncates value text with ellipsis */
  truncate?: boolean;
}

/**
 * Standard semantic key-value metadata pairing component for inspectable telemetry,
 * RPG statistics, inventory item attributes, and bestiary parameters.
 */
export const MetaItem = React.memo(
  React.forwardRef<HTMLDivElement, MetaItemProps>(function MetaItem(
    {
      label,
      value,
      layout = "stacked",
      icon,
      mono = false,
      size = "2xs",
      labelClassName,
      valueClassName,
      truncate = false,
      children,
      className,
      ...props
    },
    ref
  ) {
    const effectiveValue = value ?? children;

    return (
      <div
        ref={ref}
        data-slot="meta-item"
        data-layout={layout}
        className={cn(metaItemVariants({ layout }), className)}
        {...props}
      >
        <div
          data-slot="meta-item-label"
          className={cn(
            "flex items-center gap-1 select-none text-stone-400 font-medium",
            labelClassName
          )}
        >
          {icon && (
            <span
              data-slot="meta-item-icon"
              aria-hidden="true"
              className="shrink-0 flex items-center text-amber-400/80"
            >
              {icon}
            </span>
          )}
          <Text size={size} variant="muted" as="span">
            {label}
            {layout === "inline" && ":"}
          </Text>
        </div>

        {effectiveValue !== undefined && effectiveValue !== null && (
          <Text
            as="span"
            size={size}
            family={mono ? "mono" : "sans"}
            weight="bold"
            variant="default"
            truncate={truncate}
            data-slot="meta-item-value"
            className={cn("text-stone-200 min-w-0", valueClassName)}
          >
            {effectiveValue}
          </Text>
        )}
      </div>
    );
  })
);

MetaItem.displayName = "MetaItem";

export default MetaItem;
