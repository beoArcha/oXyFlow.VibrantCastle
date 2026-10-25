import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@lib/utils";
import {
  dialogBackdropVariants,
  dialogContentVariants,
  type DialogBackdropVariantProps,
  type DialogContentVariantProps,
} from "./dialog-variants";

export const DialogRoot = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export interface DialogBackdropProps
  extends DialogPrimitive.Backdrop.Props,
    DialogBackdropVariantProps {}

export const DialogBackdrop = React.forwardRef<HTMLDivElement, DialogBackdropProps>(
  function DialogBackdrop({ className, blur = "sm", ...props }, ref) {
    return (
      <DialogPrimitive.Backdrop
        ref={ref}
        data-slot="dialog-backdrop"
        className={cn(dialogBackdropVariants({ blur }), className)}
        {...props}
      />
    );
  }
);
DialogBackdrop.displayName = "DialogBackdrop";

export interface DialogContentProps
  extends DialogPrimitive.Popup.Props,
    DialogContentVariantProps {
  showCloseButton?: boolean;
  container?: HTMLElement | null;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    { className, children, size = "md", showCloseButton = true, container, ...props },
    ref
  ) {
    return (
      <DialogPortal container={container}>
        <DialogBackdrop />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Popup
            ref={ref}
            role="dialog"
            aria-modal="true"
            data-slot="dialog-content"
            className={cn(dialogContentVariants({ size }), className)}
            {...props}
          >
            {children}
            {showCloseButton && (
              <DialogPrimitive.Close
                data-slot="dialog-close"
                className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-800 hover:text-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-primary"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </DialogPrimitive.Popup>
        </div>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = "DialogContent";

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 text-left border-b border-border-medium pb-3", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base md:text-lg font-bold leading-none tracking-tight text-amber-lighter", className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-xs text-border-accent leading-relaxed", className)}
      {...props}
    />
  );
}

export function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("py-4 text-stone-300 text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex items-center justify-end gap-2.5 border-t border-border-medium pt-3 mt-2", className)}
      {...props}
    />
  );
}

export interface LegacyDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  maxWidthClass?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  closeKeys?: string[];
  usePortal?: boolean;
  portalContainer?: HTMLElement | null;
  className?: string;
  children: React.ReactNode;
  // Compound compatibility props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Gothic castle Dialog compound primitive based on @base-ui/react/dialog.
 * Supports both modern compound composition (<Dialog.Root>, <Dialog.Content>)
 * and backward-compatible simple props API (<Dialog isOpen={...} onClose={...}>).
 */
export function DialogRootOrLegacy({
  isOpen,
  onClose,
  title,
  description,
  icon,
  maxWidthClass,
  contentClassName,
  showCloseButton = true,
  usePortal = true,
  portalContainer,
  children,
  open,
  onOpenChange,
  ...props
}: LegacyDialogProps) {
  const [inlineAnchor, setInlineAnchor] = React.useState<HTMLDivElement | null>(null);

  // If controlled via legacy isOpen/onClose
  if (isOpen !== undefined) {
    const targetContainer = !usePortal ? inlineAnchor : (portalContainer ?? undefined);

    return (
      <>
        {!usePortal && <div ref={setInlineAnchor} data-slot="dialog-inline-container" />}
        {(usePortal || inlineAnchor) && (
          <DialogRoot
            open={isOpen}
            onOpenChange={(nextOpen) => {
              if (!nextOpen && onClose) onClose();
            }}
            {...props}
          >
            <DialogContent
              container={targetContainer}
              className={cn(maxWidthClass, contentClassName)}
              showCloseButton={showCloseButton}
            >
              {title ? (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2">
                      {icon && <span className="text-amber-primary shrink-0">{icon}</span>}
                      <DialogTitle>{title}</DialogTitle>
                    </div>
                    {description && <DialogDescription>{description}</DialogDescription>}
                  </DialogHeader>
                  <DialogBody>{children}</DialogBody>
                </>
              ) : (
                children
              )}
            </DialogContent>
          </DialogRoot>
        )}
      </>
    );
  }

  // Modern compound usage
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </DialogRoot>
  );
}

export interface DialogComponentType extends React.FC<LegacyDialogProps> {
  Root: typeof DialogRoot;
  Trigger: typeof DialogTrigger;
  Portal: typeof DialogPortal;
  Backdrop: typeof DialogBackdrop;
  Overlay: typeof DialogBackdrop;
  Content: typeof DialogContent;
  Header: typeof DialogHeader;
  Title: typeof DialogTitle;
  Description: typeof DialogDescription;
  Body: typeof DialogBody;
  Footer: typeof DialogFooter;
  Close: typeof DialogClose;
  CloseButton: typeof DialogClose;
}

export const Dialog = DialogRootOrLegacy as DialogComponentType;
Dialog.Root = DialogRoot;
Dialog.Trigger = DialogTrigger;
Dialog.Portal = DialogPortal;
Dialog.Backdrop = DialogBackdrop;
Dialog.Overlay = DialogBackdrop;
Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;
Dialog.Close = DialogClose;
Dialog.CloseButton = DialogClose;

export default Dialog;
