import React from "react";
import { cn } from "@lib/utils";
import {
  textVariants,
  iconTextVariants,
  type TextFamily,
  type TextWeight,
  type TextSize,
  type TextVariant,
  type TextVariantProps,
  type IconTextGap,
  type IconTextAlign,
} from "./typographyVariants";

export type IconTextAs = "span" | "div" | "label" | "p";
export type IconPosition = "left" | "right";

export interface IconTextBaseProps {
  /** Primary icon node or Lucide React component */
  icon?: React.ReactNode;
  /** Position of the icon relative to the text. Defaults to 'left'. */
  iconPosition?: IconPosition;
  /** Custom CSS classes for the icon wrapper */
  iconClassName?: string;
  /** Spacing between icon and text. Defaults to '1.5' (gap-1.5). */
  gap?: IconTextGap;
  /** Alignment along cross-axis. Defaults to 'center' (items-center). */
  align?: IconTextAlign;
  /** Inline vs block display. Defaults to true when as="span", false otherwise. */
  inline?: boolean;
  /** Dedicated text label if not passing children */
  label?: React.ReactNode;
  /** Custom classes for text element */
  textClassName?: string;
  /** Typography font family */
  family?: TextFamily;
  /** Font weight */
  weight?: TextWeight;
  /** Font size */
  size?: TextSize;
  /** Visual presentation theme */
  variant?: TextVariant;
  /** Uppercase text transform with letter spacing */
  uppercase?: boolean;
  /** Italic font style */
  italic?: boolean;
  /** Truncate text with ellipsis */
  truncate?: boolean;
}

export interface IconTextProps
  extends React.HTMLAttributes<HTMLElement>,
    IconTextBaseProps {
  /** Underlying HTML tag to render. Defaults to 'span'. */
  as?: IconTextAs;
  /** HTML for attribute when rendered as label */
  htmlFor?: string;
}

export interface IconLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    IconTextBaseProps {
  /** Underlying tag to render. Defaults to 'label'. */
  as?: "label" | "span";
}

/**
 * Standard typography primitive pairing an icon with text or label content.
 * Prevents ad-hoc flex layout utility duplication across menus, HUD, and developer tools.
 */
export const IconText = React.memo(
  React.forwardRef<HTMLElement, IconTextProps>(function IconText(
    {
      as = "span",
      icon,
      iconPosition = "left",
      iconClassName,
      gap = "1.5",
      align = "center",
      inline,
      label,
      textClassName,
      family = "sans",
      weight = "normal",
      size,
      variant = "default",
      uppercase = false,
      italic = false,
      truncate = false,
      children,
      className,
      ...props
    },
    ref
  ) {
    const Tag = as;
    const isInline = inline ?? as === "span";
    const content = children ?? label;

    const iconElement = icon ? (
      <span
        data-slot="icon-text-icon"
        aria-hidden="true"
        className={cn("shrink-0 inline-flex items-center justify-center", iconClassName)}
      >
        {icon}
      </span>
    ) : null;

    const textElement = content !== undefined && content !== null ? (
      <span
        data-slot="icon-text-content"
        className={cn("min-w-0", truncate && "truncate", textClassName)}
      >
        {content}
      </span>
    ) : null;

    return React.createElement(
      Tag,
      {
        ref,
        "data-slot": "icon-text",
        className: cn(
          iconTextVariants({ inline: isInline, align, gap }),
          textVariants({
            family,
            weight,
            size,
            variant,
            uppercase,
            italic,
            truncate,
          }),
          className
        ),
        ...props,
      },
      iconPosition === "right" ? (
        <>
          {textElement}
          {iconElement}
        </>
      ) : (
        <>
          {iconElement}
          {textElement}
        </>
      )
    );
  })
);

IconText.displayName = "IconText";

/**
 * Semantic form label variant of IconText with default as="label".
 */
export const IconLabel = React.memo(
  React.forwardRef<HTMLLabelElement, IconLabelProps>(function IconLabel(
    { weight = "medium", size = "xs", ...props },
    ref
  ) {
    return (
      <IconText
        ref={ref}
        as="label"
        weight={weight}
        size={size}
        data-slot="icon-label"
        {...props}
      />
    );
  })
);

IconLabel.displayName = "IconLabel";

export default IconText;
