import React from "react";
import { cn } from "@lib/utils";
import {
  codeVariants,
  type CodeVariant,
  type CodeSize,
  type CodeVariantProps,
} from "./typographyVariants";

export type CodeAs = "code" | "span" | "pre";

export interface CodeProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<CodeVariantProps, "variant" | "size"> {
  /** Underlying tag to render. Defaults to 'code'. */
  as?: CodeAs;
  /** Visual presentation theme */
  variant?: CodeVariant;
  /** Size variant */
  size?: CodeSize;
}

/**
 * Technical monospace Code primitive for technical telemetry, keybindings, coordinates, and debug identifiers.
 */
export const Code = React.memo(
  React.forwardRef<HTMLElement, CodeProps>(function Code(
    { as = "code", variant = "default", size = "xs", children, className, ...props },
    ref
  ) {
    const Tag = as;

    return React.createElement(
      Tag,
      {
        ref,
        "data-slot": "code",
        className: cn(codeVariants({ variant, size }), className),
        ...props,
      },
      children
    );
  })
);

Code.displayName = "Code";

export default Code;
