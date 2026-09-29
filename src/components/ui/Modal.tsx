import React, { useEffect, useState, useId, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@lib/utils";
import {
  ModalContext,
  ModalContextValue,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "./modal/index";

export interface ModalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback triggered when modal should close */
  onClose: () => void;
  /** Dialog title (when provided, activates automatic default header and body composition) */
  title?: string;
  /** Optional descriptive subtitle below the title */
  subtitle?: string;
  /** Leading icon badge */
  icon?: React.ReactNode;
  /** Auxiliary actions slot on the right side of header */
  headerRight?: React.ReactNode;
  /** Tailwind max-width class constraint (default: "max-w-4xl") */
  maxWidthClass?: string;
  /** Enables window maximize / restore toggle button */
  allowMaximize?: boolean;
  /** Controlled maximized state */
  isMaximized?: boolean;
  /** Callback fired when maximize state toggles */
  onToggleMaximize?: () => void;
  /** Initial maximized state in uncontrolled mode (default: false) */
  defaultMaximized?: boolean;
  /** Closes modal when clicking the dimmed backdrop (default: true) */
  closeOnBackdropClick?: boolean;
  /** Closes modal when pressing designated escape/cancel keys (default: true) */
  closeOnEscape?: boolean;
  /**
   * Configurable key names that trigger onClose.
   * Eliminates hardcoded game keys (like 'P') from the generic modal primitive.
   * Default: ["Escape"]
   */
  closeKeys?: string[];
  /** Controls visibility of the standard close 'X' button (default: true) */
  showCloseButton?: boolean;
  /** Whether to render via React Portal into document.body or custom container (default: true) */
  usePortal?: boolean;
  /** Custom DOM node target for portal rendering */
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

    // Lock body scrolling while open
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

    // Handle configured closeKeys (default: Escape) and restore focus on dismiss
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

export * from "./modal/index";
export default Modal;
