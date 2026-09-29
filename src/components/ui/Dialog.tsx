import React from "react";
import { Modal } from "./Modal";
import {
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "./modal/index";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  maxWidthClass?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  closeKeys?: string[];
  usePortal?: boolean;
  portalContainer?: HTMLElement | null;
  className?: string;
  children: React.ReactNode;
}

interface DialogComponent extends React.FC<DialogProps> {
  Content: typeof ModalContent;
  Header: typeof ModalHeader;
  Title: typeof ModalTitle;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
  CloseButton: typeof ModalCloseButton;
}

/**
 * Compact gothic dialog primitive for alerts, prompts, confirmations, and focused interactions.
 * Composes Modal with a compact default width (max-w-md) and optional automatic title/description layout.
 *
 * @example Simple usage with title
 * ```tsx
 * <Dialog isOpen={isOpen} onClose={handleClose} title="Save Blueprint" description="Are you sure?">
 *   <p>Save progress will be overwritten.</p>
 * </Dialog>
 * ```
 *
 * @example Compound usage
 * ```tsx
 * <Dialog isOpen={isOpen} onClose={handleClose}>
 *   <Dialog.Header>
 *     <Dialog.Title>Gothic Mystery</Dialog.Title>
 *   </Dialog.Header>
 *   <Dialog.Body>Detailed description...</Dialog.Body>
 *   <Dialog.Footer>
 *     <Button onClick={handleClose}>Dismiss</Button>
 *   </Dialog.Footer>
 * </Dialog>
 * ```
 */
const DialogBase: React.FC<DialogProps> = React.memo(function Dialog({
  isOpen,
  onClose,
  title,
  description,
  icon,
  maxWidthClass = "max-w-md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  closeKeys,
  usePortal = true,
  portalContainer,
  className,
  children,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass={maxWidthClass}
      showCloseButton={false}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}
      closeKeys={closeKeys}
      usePortal={usePortal}
      portalContainer={portalContainer}
      className={className}
    >
      <ModalContent maxWidthClass={maxWidthClass}>
        {title ? (
          <>
            <ModalHeader
              title={title}
              subtitle={typeof description === "string" ? description : undefined}
              icon={icon}
              showCloseButton={showCloseButton}
            />
            <ModalBody className="py-4 text-stone-300 text-sm leading-relaxed">
              {children}
            </ModalBody>
          </>
        ) : (
          children
        )}
      </ModalContent>
    </Modal>
  );
});

DialogBase.displayName = "Dialog";

export const Dialog = DialogBase as DialogComponent;
Dialog.Content = ModalContent;
Dialog.Header = ModalHeader;
Dialog.Title = ModalTitle;
Dialog.Body = ModalBody;
Dialog.Footer = ModalFooter;
Dialog.CloseButton = ModalCloseButton;

export default Dialog;
