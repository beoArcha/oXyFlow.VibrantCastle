import React from "react";
import { cn } from "@lib/utils";

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Scrollable content container for modal dialog body with custom gothic scrollbar.
 */
export const ModalBody = React.memo(
  React.forwardRef<HTMLDivElement, ModalBodyProps>(function ModalBody(
    { children, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-5 flex flex-col gap-4 text-stone-100",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  })
);

ModalBody.displayName = "ModalBody";

export default ModalBody;
