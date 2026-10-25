import React, { useEffect, useState, useId, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@lib/utils";
import {
  ModalContext,
  type ModalContextValue,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "../../controls/modal/index";

export interface ModalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  maxWidthClass?: string;
  allowMaximize?: boolean;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  defaultMaximized?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  closeKeys?: string[];
  showCloseButton?: boolean;
  usePortal?: boolean;
  portalContainer?: HTMLElement | null;
  children: React.ReactNode;
}

/**
 * Gothic Modal Dialogue composite orchestrator.
 * Renders via React Portal to prevent stacking context clipping,
 * manages body scroll lock, focus restoration, configurable closeKeys,
 * and WAI-ARIA role="dialog" compound composition.
 */
const ModalRoot = React.memo(
  React.forwardRef<HTMLDivElement, ModalProps>(function Modal(
    {
      isOpen,
      onClose,
      title,
      subtitle,
      icon,
      headerRight,
      maxWidthClass = "max-w-4xl",
      allowMaximize = false,
      isMaximized: controlledMaximized,
      onToggleMaximize,
      defaultMaximized = false,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      closeKeys = ["Escape"],
      showCloseButton = true,
      usePortal = true,
      portalContainer,
      children,
      className,
      ...props
    },
    ref
  ) {
    const generatedTitleId = useId();
    const [internalMaximized, setInternalMaximized] = useState<boolean>(defaultMaximized);
    const isMax = controlledMaximized !== undefined ? controlledMaximized : internalMaximized;

    const handleToggleMaximize = useCallback(() => {
      if (onToggleMaximize) {
        onToggleMaximize();
      } else {
        setInternalMaximized((prev) => !prev);
      }
    }, [onToggleMaximize]);

    useEffect(() => {
      if (!isOpen) return;
      const originalOverflow = document.body?.style?.overflow;
      if (document.body) {
        document.body.style.overflow = "hidden";
      }
      return () => {
        if (document.body) {
          document.body.style.overflow = originalOverflow ?? "";
        }
      };
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen || !closeOnEscape || closeKeys.length === 0) return;
      const previousActiveElement = document.activeElement as HTMLElement | null;

      const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
          return;
        }
        if (closeKeys.includes(e.key)) {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        previousActiveElement?.focus?.();
      };
    }, [isOpen, closeOnEscape, closeKeys, onClose]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && closeOnBackdropClick) {
        onClose();
      }
    };

    const contextValue = useMemo<ModalContextValue>(
      () => ({
        isOpen,
        onClose,
        isMaximized: isMax,
        toggleMaximize: handleToggleMaximize,
        allowMaximize,
        titleId: generatedTitleId,
      }),
      [isOpen, onClose, isMax, handleToggleMaximize, allowMaximize, generatedTitleId]
    );

    if (!isOpen) return null;

    const modalMarkup = (
      <ModalContext.Provider value={contextValue}>
        <div
          ref={ref}
          onClick={handleBackdropClick}
          className={cn(
            "fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150 select-none",
            className
          )}
          {...props}
        >
          {title ? (
            <ModalContent maxWidthClass={maxWidthClass}>
              <ModalHeader
                title={title}
                subtitle={subtitle}
                icon={icon}
                headerRight={headerRight}
                showCloseButton={showCloseButton}
              />
              <ModalBody>{children}</ModalBody>
            </ModalContent>
          ) : (
            children
          )}
        </div>
      </ModalContext.Provider>
    );

    if (usePortal && typeof document !== "undefined") {
      const target = portalContainer ?? document.body;
      if (target) {
        return createPortal(modalMarkup, target);
      }
    }

    return modalMarkup;
  })
);

ModalRoot.displayName = "Modal";

export interface ModalComponent
  extends React.MemoExoticComponent<
    React.ForwardRefExoticComponent<ModalProps & React.RefAttributes<HTMLDivElement>>
  > {
  Content: typeof ModalContent;
  Header: typeof ModalHeader;
  Title: typeof ModalTitle;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
  CloseButton: typeof ModalCloseButton;
}

export const Modal = ModalRoot as unknown as ModalComponent;
Modal.Content = ModalContent;
Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.CloseButton = ModalCloseButton;

export default Modal;
