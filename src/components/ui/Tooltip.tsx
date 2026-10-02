import React, { useState, useRef, useEffect, useId } from "react";
import { cn } from "@lib/utils";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  readonly content: React.ReactNode;
  readonly children: React.ReactElement;
  readonly position?: TooltipPosition;
  readonly delayDuration?: number;
  readonly className?: string;
  readonly disabled?: boolean;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

/**
 * Lightweight gothic tooltip displayed upon mouse hover or keyboard focus.
 * Includes configurable delay, automatic timeout cleanup, and WAI-ARIA role="tooltip".
 */
export const Tooltip: React.FC<TooltipProps> = React.memo(function Tooltip({
  content,
  children,
  position = "top",
  delayDuration = 150,
  className,
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const showTooltip = () => {
    if (disabled || !content) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (delayDuration > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delayDuration);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const child = React.Children.only(children);
  const childProps = React.isValidElement(child)
    ? (child.props as Partial<{
        onMouseEnter: React.MouseEventHandler;
        onMouseLeave: React.MouseEventHandler;
        onFocus: React.FocusEventHandler;
        onBlur: React.FocusEventHandler;
      }>)
    : {};

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {React.cloneElement<React.HTMLAttributes<HTMLElement>>(
        child as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
        {
          "aria-describedby": isVisible ? tooltipId : undefined,
        onMouseEnter: (e: React.MouseEvent) => {
          childProps.onMouseEnter?.(e);
          showTooltip();
        },
        onMouseLeave: (e: React.MouseEvent) => {
          childProps.onMouseLeave?.(e);
          hideTooltip();
        },
        onFocus: (e: React.FocusEvent) => {
          childProps.onFocus?.(e);
          showTooltip();
        },
        onBlur: (e: React.FocusEvent) => {
          childProps.onBlur?.(e);
          hideTooltip();
        },
      })}

      {isVisible && !disabled && Boolean(content) && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            "absolute z-50 px-2.5 py-1.5 text-xs font-medium text-stone-200 bg-[#140b08]/95 border border-amber-500/40 rounded-lg shadow-xl shadow-black/80 backdrop-blur-sm pointer-events-none whitespace-nowrap transition-opacity",
            positionClasses[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
});

Tooltip.displayName = "Tooltip";

export default Tooltip;
