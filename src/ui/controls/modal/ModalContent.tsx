import React from "react";
import { cn } from "@lib/utils";
import { useModalContext } from "./ModalContext";

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidthClass?: string;
  children: React.ReactNode;
}

/**
 * Dialog panel frame managing WAI-ARIA role="dialog", focus containment,
 * responsive geometry (safe on mobile landscape), and maximized state transitions.
 */
export const ModalContent = React.memo(
  React.forwardRef<HTMLDivElement, ModalContentProps>(function ModalContent(
    { maxWidthClass = "max-w-4xl", children, className, ...props },
    ref
  ) {
    const { isMaximized, titleId } = useModalContext("Content");

    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "bg-surface-darker/95 border-2 border-primary-500/60 rounded-2xl shadow-2xl shadow-black/95 text-stone-100 flex flex-col relative animate-in zoom-in-95 duration-150 overflow-hidden transition-all duration-200 outline-none",
          isMaximized
            ? "w-full max-w-[98vw] h-[95dvh] max-h-[95dvh]"
            : cn("w-full max-h-[92dvh] h-auto md:h-[88vh] md:max-h-[780px]", maxWidthClass),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  })
);

ModalContent.displayName = "ModalContent";

export default ModalContent;
