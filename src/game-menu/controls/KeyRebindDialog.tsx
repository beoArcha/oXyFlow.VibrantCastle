import React from "react";
import { Keyboard } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { Button, Dialog } from "@ui";
import { KeyRebindDialogProps } from "./types";

export type { KeyRebindDialogProps };

/**
 * Gothic action keybinding capture dialog overlay.
 * Prompts user to strike any keyboard key to rebind an action with accessible dialog role.
 * Composes the generic Dialog primitive.
 *
 * @example
 * ```tsx
 * <KeyRebindDialog target={bindingTarget} onCancel={cancelRebind} />
 * ```
 */
export const KeyRebindDialog: React.FC<KeyRebindDialogProps> = React.memo(
  function KeyRebindDialog({ target, onCancel, className }) {
    const { t } = useI18n();

    if (!target) {
      return null;
    }

    return (
      <Dialog
        isOpen={target !== null}
        onClose={onCancel}
        maxWidthClass="max-w-sm"
        showCloseButton={false}
        closeOnBackdropClick={false}
        closeOnEscape={false}
        className={className}
      >
        <div className="flex flex-col items-center gap-4 text-center p-2">
          <div className="text-[10px] font-bold tracking-widest text-[#d97706] uppercase">
            {t("rebindTitle")}
          </div>
          <h3
            id="rebind-dialog-title"
            className="text-2xl font-black text-[#fbbf24] tracking-wide"
          >
            {target.label}
          </h3>
          <div className="w-14 h-14 rounded-full border border-[#fbbf24]/50 bg-[#1c0c07] flex items-center justify-center text-2xl animate-pulse text-[#fbbf24]">
            <Keyboard size={28} />
          </div>
          <p className="text-xs text-[#fed7aa] leading-relaxed max-w-xs">
            {t("rebindPrompt")}
          </p>
          <Button
            id="cancel-rebind-btn"
            type="button"
            variant="danger"
            size="sm"
            onClick={onCancel}
          >
            {t("cancel")}
          </Button>
        </div>
      </Dialog>
    );
  }
);

KeyRebindDialog.displayName = "KeyRebindDialog";

export default KeyRebindDialog;
