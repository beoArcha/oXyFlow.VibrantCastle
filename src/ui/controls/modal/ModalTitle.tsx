import React from "react";
import { cn } from "@lib/utils";
import { useModalContext } from "./ModalContext";

export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  icon?: React.ReactNode;
}

/**
 * Accessible title heading for modal dialogues adhering to WAI-ARIA aria-labelledby semantics.
 */
export const ModalTitle = React.memo(
  React.forwardRef<HTMLHeadingElement, ModalTitleProps>(function ModalTitle(
    { children, icon, className, id, ...props },
    ref
  ) {
    const { titleId } = useModalContext("Title");

    return (
      <h2
        ref={ref}
        id={id ?? titleId}
        className={cn(
          "text-lg md:text-xl font-serif font-black text-[#fbbf24] tracking-wide drop-shadow-md flex items-center gap-2 truncate",
          className
        )}
        {...props}
      >
        {icon && <span className="flex items-center shrink-0">{icon}</span>}
        <span>{children}</span>
      </h2>
    );
  })
);

ModalTitle.displayName = "ModalTitle";

export default ModalTitle;
