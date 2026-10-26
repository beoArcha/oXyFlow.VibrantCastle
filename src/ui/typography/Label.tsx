import React from "react";
import { cn } from "@lib/utils";
import {
  labelVariants,
  type LabelVariant,
  type LabelSize,
  type LabelVariantProps,
} from "./typographyVariants";

export type LabelAs = "label" | "span";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    Omit<LabelVariantProps, "variant" | "size" | "weight"> {
  /** Underlying tag to render. Defaults to 'label'. */
  as?: LabelAs;
  /** Visual presentation theme */
  variant?: LabelVariant;
  /** Size variant */
  size?: LabelSize;
  /** Font weight */
  weight?: NonNullable<LabelVariantProps["weight"]>;
  /** Indicates field is mandatory by appending an accessible asterisk */
  required?: boolean;
}

/**
 * Semantic Label primitive for form inputs, telemetry metrics, and inspectable properties.
 */
export const Label = React.memo(
  React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
    {
      as = "label",
      variant = "default",
      size = "xs",
      weight = "medium",
      uppercase = false,
      required = false,
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
        "data-slot": "label",
        className: cn(labelVariants({ variant, size, weight, uppercase }), className),
        ...props,
      },
      children,
      required && (
        <span aria-hidden="true" className="text-red-400 ml-1 font-bold">
          *
        </span>
      )
    );
  })
);

Label.displayName = "Label";

export default Label;
