import React from "react";
import { cn } from "@lib/utils";

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Bottom action and button footer for modal dialogues.
 */
export const ModalFooter = React.memo(
  React.forwardRef<HTMLDivElement, ModalFooterProps>(function ModalFooter(
    { children, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "shrink-0 px-4 md:px-6 py-3 border-t border-amber-500/30 bg-surface-darkest/95 flex items-center justify-end gap-3",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  })
);

ModalFooter.displayName = "ModalFooter";

export default ModalFooter;
