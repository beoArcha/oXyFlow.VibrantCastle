import React from "react";
import { cn } from "@lib/utils";
import { kbdVariants, type KbdKeyVariant, type KbdVariantProps } from "./kbd-variants";

export interface KbdKeyProps
  extends React.HTMLAttributes<HTMLElement>,
    KbdVariantProps {
  readonly children: React.ReactNode;
  readonly variant?: KbdKeyVariant;
}

/**
 * Keyboard shortcut key badge primitive (<kbd>) with CVA styling.
 */
export const KbdKey = React.memo(
  React.forwardRef<HTMLElement, KbdKeyProps>(function KbdKey(
    { children, variant = "stone", className, ...props },
    ref
  ) {
    return (
      <kbd
        ref={ref}
        data-slot="kbd"
        className={cn(kbdVariants({ variant }), className)}
        {...props}
      >
        {children}
      </kbd>
    );
  })
);

KbdKey.displayName = "KbdKey";

export default KbdKey;
