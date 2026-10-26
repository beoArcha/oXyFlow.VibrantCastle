import React from "react";
import { Keyboard } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { Button, Dialog, Heading, Paragraph, Text } from "@ui";
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
          <Text
            as="div"
            size="2xs"
            weight="bold"
            uppercase
            variant="primary"
            className="tracking-widest"
          >
            {t("rebindTitle")}
          </Text>
          <Heading
            level={3}
            id="rebind-dialog-title"
            size="xl"
            variant="gothic"
          >
            {target.label}
          </Heading>
          <div className="w-14 h-14 rounded-full border border-amber-400/50 bg-[#1c0c07] flex items-center justify-center text-2xl animate-pulse text-amber-400">
            <Keyboard size={28} />
          </div>
          <Paragraph size="xs" variant="amber" className="max-w-xs">
            {t("rebindPrompt")}
          </Paragraph>
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
