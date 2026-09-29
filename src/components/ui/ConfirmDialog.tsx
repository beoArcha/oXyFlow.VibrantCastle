import React from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog } from "./Dialog";
import { Button, ButtonVariant } from "./Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
  maxWidthClass?: string;
  usePortal?: boolean;
}

/**
 * Compact confirmation dialog for critical or destructive user actions.
 * Composes composite Dialog and Button primitives with accessibility and focus management.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = React.memo(
  function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    confirmVariant = "danger",
    isLoading = false,
    icon,
    maxWidthClass = "max-w-md",
    usePortal = true,
  }) {
    const defaultIcon =
      confirmVariant === "danger" ? (
        <AlertTriangle size={20} className="text-rose-400" />
      ) : (
        <AlertTriangle size={20} className="text-amber-400" />
      );

    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        maxWidthClass={maxWidthClass}
        showCloseButton={!isLoading}
        closeOnBackdropClick={!isLoading}
        closeOnEscape={!isLoading}
        usePortal={usePortal}
      >
        <Dialog.Header>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/60 border border-stone-800 shrink-0">
              {icon ?? defaultIcon}
            </div>
            <Dialog.Title>{title}</Dialog.Title>
          </div>
        </Dialog.Header>

        <Dialog.Body className="py-4 text-stone-300 text-sm leading-relaxed">
          {typeof message === "string" ? <p>{message}</p> : message}
        </Dialog.Body>

        <Dialog.Footer className="flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </Dialog.Footer>
      </Dialog>
    );
  }
);

ConfirmDialog.displayName = "ConfirmDialog";

export default ConfirmDialog;
