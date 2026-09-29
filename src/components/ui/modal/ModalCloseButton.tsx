import React from "react";
import { X } from "lucide-react";
import { cn } from "@lib/utils";
import { useI18n } from "@context/I18nContext";
import { useModalContext } from "./ModalContext";

export interface ModalCloseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * Standard accessible close button for modal dialogues.
 */
export const ModalCloseButton = React.memo(
  React.forwardRef<HTMLButtonElement, ModalCloseButtonProps>(
    function ModalCloseButton({ className, onClick, ...props }, ref) {
      const { onClose } = useModalContext("CloseButton");
      const { t } = useI18n();

      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          onClose();
        }
      };

      return (
        <button
          ref={ref}
          type="button"
          onClick={handleClick}
          className={cn(
            "p-1.5 md:p-2 rounded-xl bg-stone-900/90 hover:bg-[#2a130a] text-stone-300 hover:text-amber-300 border border-stone-800 hover:border-amber-500/60 transition-all cursor-pointer shadow-md active:translate-y-px",
            className
          )}
          aria-label={t("closeModal")}
          title={t("closeModalHint")}
          {...props}
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      );
    }
  )
);

ModalCloseButton.displayName = "ModalCloseButton";

export default ModalCloseButton;
