import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "@lib/utils";
import { tooltipVariants, type TooltipVariantProps } from "./tooltip-variants";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps extends TooltipVariantProps {
  readonly content?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly position?: TooltipPosition;
  readonly delayDuration?: number;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly usePortal?: boolean;
}

const TooltipRootComponent: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delayDuration = 150,
  variant,
  className,
  disabled = false,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  usePortal = true,
}) => {
  const generatedId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (disabled || !content) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (delayDuration > 0) {
      timeoutRef.current = setTimeout(() => {
        setInternalOpen(true);
        onOpenChange?.(true);
      }, delayDuration);
    } else {
      setInternalOpen(true);
      onOpenChange?.(true);
    }
  }, [disabled, content, delayDuration, onOpenChange]);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setInternalOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const child = React.isValidElement(children) ? children : <span>{children}</span>;
  const childProps = (child.props as Partial<{
    onMouseEnter: React.MouseEventHandler;
    onMouseLeave: React.MouseEventHandler;
    onFocus: React.FocusEventHandler;
    onBlur: React.FocusEventHandler;
  }>) ?? {};

  const trigger = React.cloneElement(child as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
    "aria-describedby": isOpen ? generatedId : undefined,
    onMouseEnter: (e: React.MouseEvent) => {
      childProps.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      childProps.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      childProps.onFocus?.(e);
      show();
    },
    onBlur: (e: React.FocusEvent) => {
      childProps.onBlur?.(e);
      hide();
    },
  });

  const popupMarkup = isOpen && !disabled && Boolean(content) && (
    <BaseTooltip.Popup
      id={generatedId}
      data-slot="tooltip-popup"
      role="tooltip"
      className={cn(tooltipVariants({ variant }), className)}
    >
      {content}
    </BaseTooltip.Popup>
  );

  return (
    <BaseTooltip.Provider delay={delayDuration}>
      <BaseTooltip.Root
        open={isOpen}
        onOpenChange={(next) => {
          setInternalOpen(next);
          onOpenChange?.(next);
        }}
      >
        <BaseTooltip.Trigger render={trigger} disabled={disabled} />
        {isOpen && !disabled && Boolean(content) && (
          usePortal ? (
            <BaseTooltip.Portal>
              <BaseTooltip.Positioner side={position} sideOffset={6}>
                {popupMarkup}
              </BaseTooltip.Positioner>
            </BaseTooltip.Portal>
          ) : (
            <div className="relative inline-block">
              {popupMarkup}
            </div>
          )
        )}
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
};

export const Tooltip = Object.assign(TooltipRootComponent, {
  Provider: BaseTooltip.Provider,
  Root: BaseTooltip.Root,
  Trigger: BaseTooltip.Trigger,
  Portal: BaseTooltip.Portal,
  Positioner: BaseTooltip.Positioner,
  Popup: BaseTooltip.Popup,
  Arrow: BaseTooltip.Arrow,
});

export default Tooltip;
