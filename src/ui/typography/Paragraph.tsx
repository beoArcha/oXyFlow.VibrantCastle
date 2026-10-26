import React from "react";
import { cn } from "@lib/utils";
import {
  paragraphVariants,
  type ParagraphVariant,
  type ParagraphSize,
  type ParagraphVariantProps,
} from "./typographyVariants";

export interface ParagraphProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    Omit<ParagraphVariantProps, "variant" | "size"> {
  /** Visual presentation theme */
  variant?: ParagraphVariant;
  /** Size variant */
  size?: ParagraphSize;
}

/**
 * Semantic Paragraph primitive for descriptions, dialogue, lore, and explanatory copy.
 */
export const Paragraph = React.memo(
  React.forwardRef<HTMLParagraphElement, ParagraphProps>(function Paragraph(
    { variant = "default", size, italic = false, children, className, ...props },
    ref
  ) {
    return (
      <p
        ref={ref}
        data-slot="paragraph"
        className={cn(paragraphVariants({ variant, size, italic }), className)}
        {...props}
      >
        {children}
      </p>
    );
  })
);

Paragraph.displayName = "Paragraph";

export default Paragraph;
