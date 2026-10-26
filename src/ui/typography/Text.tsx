import React from "react";
import { cn } from "@lib/utils";
import {
  textVariants,
  type TextFamily,
  type TextWeight,
  type TextSize,
  type TextVariant,
  type TextTransform,
  type TextTracking,
  type TextDecoration,
  type TextLeading,
  type TextAlign,
  type TextVariantProps,
} from "./typographyVariants";

export type TextAs = "span" | "div" | "strong" | "em" | "small";

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<
      TextVariantProps,
      | "family"
      | "weight"
      | "size"
      | "variant"
      | "transform"
      | "tracking"
      | "decoration"
      | "leading"
      | "align"
    > {
  /** Underlying HTML tag to render. Defaults to 'span'. */
  as?: TextAs;
  /** Typography font family */
  family?: TextFamily;
  /** Font weight */
  weight?: TextWeight;
  /** Font size */
  size?: TextSize;
  /** Visual presentation theme */
  variant?: TextVariant;
  /** Text transformation case */
  transform?: TextTransform;
  /** Letter spacing */
  tracking?: TextTracking;
  /** Text decoration (underline, line-through) */
  decoration?: TextDecoration;
  /** Line height */
  leading?: TextLeading;
  /** Text alignment */
  align?: TextAlign;
}

/**
 * Polymorphic Text atom for granular typographic control without ad-hoc utility classes.
 */
export const Text = React.memo(
  React.forwardRef<HTMLElement, TextProps>(function Text(
    {
      as = "span",
      family = "sans",
      weight = "normal",
      size,
      variant = "default",
      transform,
      tracking,
      decoration,
      leading,
      align,
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

    return React.createElement(
      Tag,
      {
        ref,
        "data-slot": "text",
        className: cn(
          textVariants({
            family,
            weight,
            size,
            variant,
            transform,
            tracking,
            decoration,
            leading,
            align,
            uppercase,
            italic,
            truncate,
          }),
          className
        ),
        ...props,
      },
      children
    );
  })
);

Text.displayName = "Text";

export default Text;
