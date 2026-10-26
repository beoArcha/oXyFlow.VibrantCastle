import React from "react";
import { cn } from "@lib/utils";
import {
  headingVariants,
  type HeadingVariant,
  type HeadingSize,
  type HeadingVariantProps,
} from "./typographyVariants";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    Omit<HeadingVariantProps, "variant" | "size"> {
  /** Semantic hierarchy heading level (1 to 6). Defaults to 2. */
  level?: HeadingLevel;
  /** Visual presentation theme */
  variant?: HeadingVariant;
  /** Size variant */
  size?: HeadingSize;
  /** Optional icon rendered before heading text */
  icon?: React.ReactNode;
}

/**
 * Semantic Heading primitive (h1..h6) with Gothic Castle typography styling and CVA variants.
 */
export const Heading = React.memo(
  React.forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
    {
      level = 2,
      variant = "default",
      size,
      dropShadow = false,
      truncate = false,
      icon,
      children,
      className,
      ...props
    },
    ref
  ) {
    // Dynamic tag selection from level 1..6
    const Tag = `h${level}` as const;

    return React.createElement(
      Tag,
      {
        ref,
        "data-slot": "heading",
        "data-level": level,
        className: cn(headingVariants({ variant, size, dropShadow, truncate }), className),
        ...props,
      },
      icon ? (
        <span className="flex items-center gap-2">
          <span className="shrink-0 flex items-center">{icon}</span>
          <span>{children}</span>
        </span>
      ) : (
        children
      )
    );
  })
);

Heading.displayName = "Heading";

export default Heading;
