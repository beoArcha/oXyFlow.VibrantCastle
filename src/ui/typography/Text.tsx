import React from "react";
import { cn } from "@lib/utils";
import {
  textVariants,
  type TextFamily,
  type TextWeight,
  type TextSize,
  type TextVariant,
  type TextVariantProps,
} from "./typographyVariants";

export type TextAs = "span" | "div" | "strong" | "em" | "small";

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<TextVariantProps, "family" | "weight" | "size" | "variant"> {
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
