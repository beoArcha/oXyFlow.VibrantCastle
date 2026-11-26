import React from "react";
import { Keyboard } from "lucide-react";
import { Dialog, Button, Text, Badge } from "@ui";
import { useI18n } from "@context/I18nContext";
import { PlayerId } from "@game/types";
import type { KeyRebindTarget } from "./useKeyRebind";

export interface KeyRebindDialogProps {
  readonly target: KeyRebindTarget | null;
  readonly onCancel: () => void;
}

/**
 * Interactive modal overlay prompting the user to press a key to bind an action.
 */
export const KeyRebindDialog: React.FC<KeyRebindDialogProps> = ({
  target,
  onCancel,
}) => {
  const { t } = useI18n();

  if (!target) return null;

  const playerLabel =
    target.player === PlayerId.Player2 ? t("p2Status") : t("p1Status");

  return (
    <Dialog
      isOpen={true}
      onClose={onCancel}
      title={target.label}
      icon={<Keyboard className="w-5 h-5 text-amber-400" />}
    >
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <Badge variant={target.player === PlayerId.Player2 ? "cyan" : "amber"}>
          {playerLabel}
        </Badge>
        <Text size="sm" className="text-amber-100">
          Press any key to assign to <span className="font-bold text-amber-400">{target.label}</span>
        </Text>
        <Text size="xs" variant="muted">
          [Esc] — {t("closeModal")}
        </Text>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          {t("closeModal")}
        </Button>
      </div>
    </Dialog>
  );
};

KeyRebindDialog.displayName = "KeyRebindDialog";
export default KeyRebindDialog;
