import React from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@lib/utils";
import { useModalContext } from "./ModalContext";
import { ModalTitle } from "./ModalTitle";
import { ModalCloseButton } from "./ModalCloseButton";

export interface ModalHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  showCloseButton?: boolean;
}

/**
 * Gothic header bar for modal dialogues with icon badge, title, subtitle,
 * optional maximize toggle, and accessible close button.
 */
export const ModalHeader = React.memo(
  React.forwardRef<HTMLDivElement, ModalHeaderProps>(function ModalHeader(
    {
      title,
      subtitle,
      icon,
      headerRight,
      showCloseButton = true,
      children,
      className,
      ...props
    },
    ref
  ) {
    const { isMaximized, toggleMaximize, allowMaximize } = useModalContext("Header");

    return (
      <div
        ref={ref}
        className={cn(
          "shrink-0 px-4 md:px-6 py-3 border-b border-amber-500/40 bg-surface-darkest/90 flex items-center justify-between gap-3 select-none",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            {icon ? (
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-amber-500/50 bg-black/70 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              {title && typeof title === "string" ? (
                <ModalTitle>{title}</ModalTitle>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-xs text-stone-300 font-sans mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {headerRight}

          {allowMaximize && toggleMaximize && (
            <button
              type="button"
              onClick={toggleMaximize}
              className="p-1.5 md:p-2 rounded-xl bg-stone-900/90 hover:bg-surface-card text-stone-300 hover:text-amber-300 border border-stone-800 hover:border-amber-500/60 transition-all cursor-pointer shadow-md active:translate-y-px"
              aria-label={isMaximized ? "Restore window" : "Maximize window"}
              title={isMaximized ? "Restore window" : "Maximize window"}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          )}

          {showCloseButton && <ModalCloseButton />}
        </div>
      </div>
    );
  })
);

ModalHeader.displayName = "ModalHeader";

export default ModalHeader;
