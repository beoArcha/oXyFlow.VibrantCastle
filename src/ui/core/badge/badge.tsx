import React from "react";
import { cn } from "@lib/utils";
import {
  badgeVariants,
  type BadgeVariant,
  type BadgeSize,
  type BadgeVariantProps,
} from "./badge-variants";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    BadgeVariantProps {
  readonly variant?: BadgeVariant;
  readonly size?: BadgeSize;
  readonly icon?: React.ReactNode;
}

/**
 * Visual status tag and badge primitive with CVA variant styling.
 */
export const Badge = React.memo(
  React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
    { children, variant = "amber", size = "md", icon, className, ...props },
    ref
  ) {
    return (
      <span
        ref={ref}
        data-slot="badge"
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="flex items-center shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>
    );
  })
);

Badge.displayName = "Badge";

export default Badge;
